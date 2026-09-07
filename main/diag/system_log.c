/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 *
 * Persistent, bounded system log for the BETTA panel.
 *
 * Layers:
 *  1. An esp_log_set_vprintf() hook that captures every WARN/ERROR log line
 *     into a small PSRAM ring buffer (console output is forwarded untouched).
 *  2. A low-priority task that drains the ring into /littlefs/logs/system.log.
 *  3. File rotation: when system.log reaches APP_LOG_MAX_FILE_BYTES it is
 *     renamed to system.log.1 (up to APP_LOG_MAX_ROTATED generations); the
 *     oldest generation is deleted, so storage usage is strictly bounded.
 *  4. A boot header (app version + reset reason) and a periodic heartbeat with
 *     heap/PSRAM statistics. A hard freeze (task WDT / panic) reboots the
 *     device, and the next boot header records the reset reason — the
 *     heartbeat gaps then show how much runtime was lost.
 */

#include "diag/system_log.h"

#include <errno.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>

#include "esp_app_desc.h"
#include "esp_heap_caps.h"
#include "esp_log.h"
#include "esp_system.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "freertos/task.h"

#include "app_config.h"
#include "ui/ui_runtime.h"

#define TAG "syslog"

#define SYSTEM_LOG_TASK_STACK 4096
#define SYSTEM_LOG_TASK_PRIO 1
#define SYSTEM_LOG_TASK_PERIOD_MS 2000
#define SYSTEM_LOG_CHUNK_BYTES 512
#define SYSTEM_LOG_LINE_MAX 512
#define SYSTEM_LOG_TAG_MAX 40

/* ---- Capture ring ------------------------------------------------------ */

typedef struct {
    uint8_t *buf;
    size_t cap;
    size_t read;    /* monotonic byte counter: bytes consumed */
    size_t written; /* monotonic byte counter: bytes produced */
    SemaphoreHandle_t mutex;
} log_ring_t;

static log_ring_t s_ring;
static TaskHandle_t s_task;
static vprintf_like_t s_orig_vprintf;
static bool s_init;
static SemaphoreHandle_t s_capture_mutex;

/* UI watchdog state: last UI heartbeat value and when it last changed. */
static uint32_t s_ui_last_hb = 0;
static int64_t s_ui_last_hb_ms = 0;

/* vprintf line-reconstruction state. With ESP_LOG_VERSION == 2 the hook is
 * called three times per line (prefix, message body, newline) and those calls
 * are serialized by esp_log's stdout lock; with version 1 the whole line
 * arrives in one call and is serialized by s_capture_mutex instead. */
static bool s_line_open;
static char s_line_level;
static char s_line_tag[SYSTEM_LOG_TAG_MAX];
static char s_line[SYSTEM_LOG_LINE_MAX];
static size_t s_line_len;

static size_t ring_avail(const log_ring_t *r)
{
    return r->written - r->read;
}

static void ring_push(log_ring_t *r, const uint8_t *data, size_t len)
{
    if (r->buf == NULL || r->mutex == NULL || data == NULL || len == 0) {
        return;
    }

    xSemaphoreTake(r->mutex, portMAX_DELAY);
    while (len > 0) {
        size_t avail = ring_avail(r);
        if (avail >= r->cap) {
            /* Drop the oldest bytes so the newest diagnostics are kept. */
            r->read += (avail - r->cap) + 1U;
            continue;
        }
        size_t space = r->cap - avail;
        size_t n = len < space ? len : space;
        size_t off = r->written % r->cap;
        size_t first = r->cap - off;
        size_t c1 = n < first ? n : first;
        memcpy(r->buf + off, data, c1);
        if (n > c1) {
            memcpy(r->buf, data + c1, n - c1);
        }
        r->written += n;
        data += n;
        len -= n;
    }
    xSemaphoreGive(r->mutex);

    /* Wake the drain task immediately so W/E lines reach flash right away
     * instead of waiting up to SYSTEM_LOG_TASK_PERIOD_MS.  A panic/reboot can
     * strike between wakeups, so minimising the in-RAM window is what makes
     * the last lines before a crash survive. */
    if (s_task != NULL) {
        xTaskNotifyGive(s_task);
    }
}

static size_t ring_pop(log_ring_t *r, uint8_t *dst, size_t max)
{
    if (r->buf == NULL || r->mutex == NULL || dst == NULL || max == 0) {
        return 0;
    }

    size_t got = 0;
    xSemaphoreTake(r->mutex, portMAX_DELAY);
    size_t avail = ring_avail(r);
    if (avail > max) {
        avail = max;
    }
    size_t off = r->read % r->cap;
    size_t first = r->cap - off;
    size_t c1 = avail < first ? avail : first;
    memcpy(dst, r->buf + off, c1);
    if (avail > c1) {
        memcpy(dst + c1, r->buf, avail - c1);
    }
    r->read += avail;
    got = avail;
    xSemaphoreGive(r->mutex);
    return got;
}

/* ---- vprintf line reconstruction -------------------------------------- */

static void line_finalize(void)
{
    if (!s_line_open) {
        return;
    }
    s_line_open = false;

    if (s_line_len == 0) {
        return;
    }

    char out[SYSTEM_LOG_LINE_MAX + SYSTEM_LOG_TAG_MAX + 8];
    int n = snprintf(out, sizeof(out), "%c %s: %s\n", s_line_level, s_line_tag, s_line);
    if (n <= 0) {
        return;
    }
    size_t len = (size_t)n;
    if (len >= sizeof(out)) {
        len = sizeof(out) - 1U;
    }
    ring_push(&s_ring, (const uint8_t *)out, len);
    s_line_len = 0;
    s_line[0] = '\0';
}

static void prefix_parse(const char *fmt, va_list args)
{
    if (s_line_open) {
        /* Defensive: a previous line never got its newline. */
        line_finalize();
    }

    char buf[160];
    va_list cp;
    va_copy(cp, args);
    vsnprintf(buf, sizeof(buf), fmt, cp);
    va_end(cp);

    const char *p = buf;
    if (p[0] == '\x1b' && p[1] == '[') {
        const char *m = strchr(p, 'm');
        if (m != NULL) {
            p = m + 1;
        }
    }

    if (*p != 'E' && *p != 'W') {
        /* Only capture errors and warnings; keep the log compact. */
        s_line_open = false;
        return;
    }

    const char *tag_start = strstr(p, ") ");
    if (tag_start == NULL) {
        s_line_open = false;
        return;
    }
    tag_start += 2;
    const char *tag_end = strstr(tag_start, ": ");
    size_t tag_len = tag_end != NULL ? (size_t)(tag_end - tag_start) : strlen(tag_start);
    if (tag_len >= sizeof(s_line_tag)) {
        tag_len = sizeof(s_line_tag) - 1U;
    }

    s_line_level = *p;
    memcpy(s_line_tag, tag_start, tag_len);
    s_line_tag[tag_len] = '\0';
    s_line[0] = '\0';
    s_line_len = 0;
    s_line_open = true;
}

static bool is_newline_segment(const char *fmt, va_list args)
{
    if (strcmp(fmt, "%s") != 0) {
        return false;
    }

    char buf[16];
    va_list cp;
    va_copy(cp, args);
    int n = vsnprintf(buf, sizeof(buf), fmt, cp);
    va_end(cp);

    if (n <= 0 || n >= (int)sizeof(buf)) {
        return false;
    }
    if (buf[n - 1] != '\n') {
        return false;
    }

    /* Accept only whitespace + ANSI color-reset before the newline. */
    const char *s = buf;
    while (*s != '\0') {
        if (*s == '\n' || *s == '\r' || *s == ' ') {
            s++;
            continue;
        }
        if (*s == '\x1b') {
            const char *m = strchr(s, 'm');
            if (m == NULL) {
                return false;
            }
            s = m + 1;
            continue;
        }
        return false;
    }
    return true;
}

static void line_append(const char *fmt, va_list args)
{
    if (s_line_len >= sizeof(s_line) - 1U) {
        return;
    }

    va_list cp;
    va_copy(cp, args);
    int n = vsnprintf(s_line + s_line_len, sizeof(s_line) - s_line_len, fmt, cp);
    va_end(cp);

    if (n > 0) {
        size_t add = (size_t)n;
        size_t remain = sizeof(s_line) - 1U - s_line_len;
        if (add > remain) {
            add = remain;
        }
        s_line_len += add;
        s_line[s_line_len] = '\0';
    }
}

/* ESP_LOG_VERSION == 1 path: the vprintf hook receives each log line as a
 * single call whose format is the fully-composed line (LOG_FORMAT in
 * esp_log_format.h):
 *
 *   LOG_COLOR_x "x (%" PRIu32 ") %s: " user_format LOG_RESET_COLOR "\n"
 *
 * With colors disabled (this project) the format string starts directly with
 * the level letter; with colors enabled it starts with an ANSI escape. The
 * level is detected from the format string itself so I/D/V lines are rejected
 * without rendering. E/W lines are rendered, stripped of color sequences, and
 * re-emitted in the compact "<level> <tag>: <message>\n" form used by the
 * ring. */
static void capture_v1_line(const char *fmt, va_list args)
{
    const char *f = fmt;
    if (f[0] == '\x1b' && f[1] == '[') {
        const char *m = strchr(f, 'm');
        if (m != NULL) {
            f = m + 1;
        }
    }

    if (*f != 'E' && *f != 'W') {
        return;
    }
    if (f[1] != ' ' || f[2] != '(') {
        return;
    }

    static char buf[SYSTEM_LOG_LINE_MAX + 160];
    va_list cp;
    va_copy(cp, args);
    int n = vsnprintf(buf, sizeof(buf), fmt, cp);
    va_end(cp);
    if (n <= 0) {
        return;
    }

    size_t len = (size_t)n;
    if (len >= sizeof(buf)) {
        len = sizeof(buf) - 1U;
    }
    buf[len] = '\0';

    const char *p = buf;
    if (p[0] == '\x1b' && p[1] == '[') {
        const char *m = strchr(p, 'm');
        if (m != NULL) {
            p = m + 1;
        }
    }

    const char *tag_start = strstr(p, ") ");
    if (tag_start == NULL) {
        return;
    }
    tag_start += 2;

    const char *tag_end = strstr(tag_start, ": ");
    if (tag_end == NULL) {
        return;
    }
    const char *msg_start = tag_end + 2;

    /* Strip the trailing LOG_RESET_COLOR and newline from the message. */
    size_t msg_len = strlen(msg_start);
    while (msg_len > 0 && (msg_start[msg_len - 1] == '\n' || msg_start[msg_len - 1] == '\r')) {
        msg_len--;
    }
    static const char reset[] = "\x1b[0m";
    if (msg_len >= (sizeof(reset) - 1) &&
        memcmp(msg_start + msg_len - (sizeof(reset) - 1), reset, sizeof(reset) - 1) == 0) {
        msg_len -= sizeof(reset) - 1;
    }

    size_t tag_len = (size_t)(tag_end - tag_start);
    if (tag_len >= sizeof(s_line_tag)) {
        tag_len = sizeof(s_line_tag) - 1U;
    }
    memcpy(s_line_tag, tag_start, tag_len);
    s_line_tag[tag_len] = '\0';

    static char out[SYSTEM_LOG_LINE_MAX + SYSTEM_LOG_TAG_MAX + 8];
    int m = snprintf(out, sizeof(out), "%c %s: %.*s\n", *p, s_line_tag, (int)msg_len, msg_start);
    if (m <= 0) {
        return;
    }
    size_t out_len = (size_t)m;
    if (out_len >= sizeof(out)) {
        out_len = sizeof(out) - 1U;
    }
    ring_push(&s_ring, (const uint8_t *)out, out_len);
}

static int system_log_vprintf(const char *fmt, va_list args)
{
    int ret = 0;
    if (s_orig_vprintf != NULL) {
        va_list fwd;
        va_copy(fwd, args);
        ret = s_orig_vprintf(fmt, fwd);
        va_end(fwd);
    }

    if (fmt == NULL || !s_init) {
        return ret;
    }

    /* ESP_LOG_VERSION == 2: prefix call starts the line. */
    if (strncmp(fmt, "%s%c ", 5) == 0) {
        prefix_parse(fmt, args);
        return ret;
    }

    if (s_line_open) {
        if (is_newline_segment(fmt, args)) {
            line_finalize();
        } else {
            line_append(fmt, args);
        }
        return ret;
    }

    /* ESP_LOG_VERSION == 1: the entire line arrives as a single call. The
     * capture path renders into shared static buffers, so it is serialized by
     * s_capture_mutex (v1 has no stdout lock around the hook). */
    if (s_capture_mutex != NULL &&
        xSemaphoreTake(s_capture_mutex, portMAX_DELAY) == pdTRUE) {
        capture_v1_line(fmt, args);
        xSemaphoreGive(s_capture_mutex);
    }
    return ret;
}

/* ---- Storage ----------------------------------------------------------- */

static void system_log_rotate(void)
{
    char old_path[sizeof(APP_LOG_FILE) + 4];
    char new_path[sizeof(APP_LOG_FILE) + 4];

    /* Delete the oldest generation first. */
    snprintf(old_path, sizeof(old_path), "%s.%d", APP_LOG_FILE, APP_LOG_MAX_ROTATED);
    remove(old_path);

    for (int i = APP_LOG_MAX_ROTATED - 1; i >= 1; i--) {
        snprintf(old_path, sizeof(old_path), "%s.%d", APP_LOG_FILE, i);
        snprintf(new_path, sizeof(new_path), "%s.%d", APP_LOG_FILE, i + 1);
        rename(old_path, new_path);
    }

    snprintf(old_path, sizeof(old_path), "%s.1", APP_LOG_FILE);
    rename(APP_LOG_FILE, old_path);
}

static void system_log_file_append(const uint8_t *data, size_t len)
{
    if (data == NULL || len == 0) {
        return;
    }

    FILE *f = fopen(APP_LOG_FILE, "ab");
    if (f == NULL) {
        return;
    }

    if (fseek(f, 0, SEEK_END) != 0) {
        fclose(f);
        return;
    }
    long size = ftell(f);
    if (size < 0) {
        fclose(f);
        return;
    }
    if ((unsigned long)size + (unsigned long)len > (unsigned long)APP_LOG_MAX_FILE_BYTES) {
        fclose(f);
        system_log_rotate();
        f = fopen(APP_LOG_FILE, "ab");
        if (f == NULL) {
            return;
        }
    }

    fwrite(data, 1, len, f);
    fclose(f);
}

static void system_log_check_ui_watchdog(void)
{
    if (!ui_runtime_is_running()) {
        return;
    }

    uint32_t hb = ui_runtime_get_heartbeat();
    int64_t now_ms = esp_timer_get_time() / 1000;

    if (hb != s_ui_last_hb) {
        s_ui_last_hb = hb;
        s_ui_last_hb_ms = now_ms;
        return;
    }

    if (hb == 0) {
        /* UI task hasn't produced its first heartbeat yet. */
        return;
    }

    int64_t stalled_ms = now_ms - s_ui_last_hb_ms;
    if (stalled_ms <= APP_UI_WATCHDOG_TIMEOUT_MS) {
        return;
    }

    char line[160];
    int n = snprintf(line, sizeof(line),
                     "!!! WATCHDOG: UI task stalled (no heartbeat for %lld ms), restarting !!!\n",
                     (long long)stalled_ms);
    if (n > 0) {
        size_t len = (size_t)n;
        if (len >= sizeof(line)) {
            len = sizeof(line) - 1U;
        }
        system_log_file_append((const uint8_t *)line, len);
    }
    ESP_LOGE(TAG, "UI task watchdog triggered (no heartbeat for %lld ms); restarting",
             (long long)stalled_ms);
    esp_restart();
}

static void system_log_check_scheduled_restart(void)
{
    int64_t uptime_ms = esp_timer_get_time() / 1000;
    if (uptime_ms < APP_DAILY_RESTART_MS) {
        return;
    }

    char line[128];
    int n = snprintf(line, sizeof(line),
                     "!!! SCHEDULED: periodic 24h restart (uptime=%lld ms) !!!\n",
                     (long long)uptime_ms);
    if (n > 0) {
        size_t len = (size_t)n;
        if (len >= sizeof(line)) {
            len = sizeof(line) - 1U;
        }
        system_log_file_append((const uint8_t *)line, len);
    }
    ESP_LOGW(TAG, "Scheduled 24h restart (uptime=%lld ms)", (long long)uptime_ms);
    esp_restart();
}

static void system_log_heartbeat(void)
{
    system_log_check_ui_watchdog();
    system_log_check_scheduled_restart();

    uint32_t uptime_s = (uint32_t)(esp_timer_get_time() / 1000000ULL);
    size_t free_heap = esp_get_free_heap_size();
    size_t min_heap = esp_get_minimum_free_heap_size();
    size_t largest_8bit = heap_caps_get_largest_free_block(MALLOC_CAP_8BIT);
    size_t free_psram = heap_caps_get_free_size(MALLOC_CAP_SPIRAM);
    size_t largest_psram = heap_caps_get_largest_free_block(MALLOC_CAP_SPIRAM);

    char line[256];
    int n = snprintf(line, sizeof(line),
                     "I sys: uptime=%us heap_free=%u heap_min=%u heap_largest=%u "
                     "psram_free=%u psram_largest=%u\n",
                     (unsigned)uptime_s, (unsigned)free_heap, (unsigned)min_heap,
                     (unsigned)largest_8bit, (unsigned)free_psram, (unsigned)largest_psram);
    if (n <= 0) {
        return;
    }
    size_t len = (size_t)n;
    if (len >= sizeof(line)) {
        len = sizeof(line) - 1U;
    }
    system_log_file_append((const uint8_t *)line, len);
}

static void system_log_boot_header(void)
{
    const esp_app_desc_t *desc = esp_app_get_description();
    const char *ver = (desc != NULL && desc->version[0] != '\0') ? desc->version : "unknown";

    static const char *const reset_names[] = {
        "UNKNOWN", "POWERON", "EXT", "SW", "PANIC", "INT_WDT", "TASK_WDT",
        "WDT", "DEEPSLEEP", "BROWNOUT", "SDIO", "USB", "JTAG", "EFUSE",
        "PWR_GLITCH", "CPU_LOCKUP", "SUPER_WDT",
    };
    esp_reset_reason_t rr = esp_reset_reason();
    const char *reset_name =
        (rr >= 0 && rr < (esp_reset_reason_t)(sizeof(reset_names) / sizeof(reset_names[0])))
            ? reset_names[rr]
            : "INVALID";

    char line[256];
    int n = snprintf(line, sizeof(line),
                     "=== boot app=%s version=%s reset=%s(%d) ===\n",
                     APP_NAME, ver, reset_name, (int)rr);
    if (n > 0) {
        size_t len = (size_t)n;
        if (len >= sizeof(line)) {
            len = sizeof(line) - 1U;
        }
        system_log_file_append((const uint8_t *)line, len);
    }

    /* Make crashes impossible to miss when scrolling the web log viewer. */
    const bool crash_reset =
        rr == ESP_RST_PANIC || rr == ESP_RST_INT_WDT || rr == ESP_RST_TASK_WDT ||
        rr == ESP_RST_WDT || rr == ESP_RST_BROWNOUT || rr == ESP_RST_CPU_LOCKUP;
    if (crash_reset) {
        char crash_line[128];
        int cn = snprintf(crash_line, sizeof(crash_line),
                          "!!! CRASH: previous boot ended with reset=%s(%d) !!!\n",
                          reset_name, (int)rr);
        if (cn > 0) {
            size_t clen = (size_t)cn;
            if (clen >= sizeof(crash_line)) {
                clen = sizeof(crash_line) - 1U;
            }
            system_log_file_append((const uint8_t *)crash_line, clen);
        }
    }

    /* Immediate first snapshot so a crash very early in the boot is bounded. */
    system_log_heartbeat();
}

/* ---- Task -------------------------------------------------------------- */

static void system_log_task(void *arg)
{
    (void)arg;
    uint8_t chunk[SYSTEM_LOG_CHUNK_BYTES];
    uint32_t loops = 0;
    uint32_t heartbeat_loops =
        (APP_LOG_HEARTBEAT_MS + SYSTEM_LOG_TASK_PERIOD_MS - 1U) / SYSTEM_LOG_TASK_PERIOD_MS;

    for (;;) {
        for (;;) {
            size_t n = ring_pop(&s_ring, chunk, sizeof(chunk));
            if (n == 0) {
                break;
            }
            system_log_file_append(chunk, n);
        }

        loops++;
        if (heartbeat_loops > 0 && loops % heartbeat_loops == 0) {
            system_log_heartbeat();
        }

        ulTaskNotifyTake(pdTRUE, pdMS_TO_TICKS(SYSTEM_LOG_TASK_PERIOD_MS));
    }
}

/* ---- Public API -------------------------------------------------------- */

esp_err_t system_log_init(void)
{
    if (s_init) {
        return ESP_OK;
    }

    (void)mkdir(APP_LOG_DIR, 0755); /* ignore error: may already exist */

    s_ring.buf = (uint8_t *)heap_caps_malloc(APP_LOG_RING_BYTES,
                                             MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
    if (s_ring.buf == NULL) {
        s_ring.buf = (uint8_t *)heap_caps_malloc(APP_LOG_RING_BYTES, MALLOC_CAP_8BIT);
    }
    if (s_ring.buf == NULL) {
        ESP_LOGW(TAG, "log ring alloc failed");
        return ESP_ERR_NO_MEM;
    }
    s_ring.cap = APP_LOG_RING_BYTES;

    s_ring.mutex = xSemaphoreCreateMutex();
    if (s_ring.mutex == NULL) {
        heap_caps_free(s_ring.buf);
        s_ring.buf = NULL;
        return ESP_ERR_NO_MEM;
    }

    s_capture_mutex = xSemaphoreCreateMutex();
    if (s_capture_mutex == NULL) {
        vSemaphoreDelete(s_ring.mutex);
        s_ring.mutex = NULL;
        heap_caps_free(s_ring.buf);
        s_ring.buf = NULL;
        return ESP_ERR_NO_MEM;
    }

    s_init = true;
    s_orig_vprintf = esp_log_set_vprintf(system_log_vprintf);

    BaseType_t ok = xTaskCreatePinnedToCore(system_log_task, TAG, SYSTEM_LOG_TASK_STACK,
                                            NULL, SYSTEM_LOG_TASK_PRIO, &s_task, 0);
    if (ok != pdPASS) {
        s_task = NULL;
        ESP_LOGW(TAG, "log task create failed; ring will drop oldest lines");
    }

    system_log_boot_header();
    return ESP_OK;
}

esp_err_t system_log_flush(void)
{
    if (!s_init) {
        return ESP_ERR_INVALID_STATE;
    }

    if (s_task != NULL) {
        xTaskNotifyGive(s_task);
        /* Give the low-priority task a moment to drain and append. */
        vTaskDelay(pdMS_TO_TICKS(100));
    } else {
        uint8_t chunk[SYSTEM_LOG_CHUNK_BYTES];
        for (;;) {
            size_t n = ring_pop(&s_ring, chunk, sizeof(chunk));
            if (n == 0) {
                break;
            }
            system_log_file_append(chunk, n);
        }
    }
    return ESP_OK;
}

int system_log_read_tail(char *buf, size_t buf_len)
{
    if (buf == NULL || buf_len == 0) {
        return 0;
    }

    system_log_flush();

    FILE *f = fopen(APP_LOG_FILE, "rb");
    if (f == NULL) {
        buf[0] = '\0';
        return 0;
    }

    if (fseek(f, 0, SEEK_END) != 0) {
        fclose(f);
        buf[0] = '\0';
        return 0;
    }
    long size = ftell(f);
    size_t want = buf_len - 1U;
    if (size > (long)want) {
        if (fseek(f, size - (long)want, SEEK_SET) != 0) {
            fclose(f);
            buf[0] = '\0';
            return 0;
        }
    } else {
        rewind(f);
    }

    size_t got = fread(buf, 1, want, f);
    fclose(f);
    buf[got] = '\0';
    return (int)got;
}

esp_err_t system_log_clear(void)
{
    if (!s_init) {
        return ESP_ERR_INVALID_STATE;
    }

    /* Drain the capture ring first so a clear request can't race pending
     * lines back into the file after we truncate it. */
    system_log_flush();

    remove(APP_LOG_FILE);
    for (int i = 1; i <= APP_LOG_MAX_ROTATED; i++) {
        char path[sizeof(APP_LOG_FILE) + 4];
        snprintf(path, sizeof(path), "%s.%d", APP_LOG_FILE, i);
        remove(path);
    }

    /* Leave a fresh line so the viewer shows a start point, not "(no logs)". */
    system_log_heartbeat();
    return ESP_OK;
}

void system_log_write(const char *tag, const char *fmt, ...)
{
    if (fmt == NULL) {
        return;
    }

    char body[SYSTEM_LOG_LINE_MAX];
    va_list ap;
    va_start(ap, fmt);
    int n = vsnprintf(body, sizeof(body), fmt, ap);
    va_end(ap);
    if (n <= 0) {
        return;
    }

    char out[SYSTEM_LOG_LINE_MAX + SYSTEM_LOG_TAG_MAX + 8];
    int m = snprintf(out, sizeof(out), "E %s: %s\n",
                     (tag != NULL && tag[0] != '\0') ? tag : "sys", body);
    if (m <= 0) {
        return;
    }
    size_t len = (size_t)m;
    if (len >= sizeof(out)) {
        len = sizeof(out) - 1U;
    }
    ring_push(&s_ring, (const uint8_t *)out, len);
}
