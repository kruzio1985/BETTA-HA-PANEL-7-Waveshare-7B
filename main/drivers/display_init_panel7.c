/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "drivers/display_init.h"

#include <inttypes.h>
#include <stdbool.h>
#include <time.h>

#include "bsp/display.h"
#include "bsp/esp32_p4_wifi6_touch_lcd_7b.h"
#include "esp_err.h"
#include "esp_lcd_panel_ops.h"
#include "esp_log.h"
#include "esp_lvgl_port.h"
#include "esp_timer.h"
#include "lvgl.h"
#include "nvs.h"

#include "app_config.h"
#include "util/log_tags.h"

#define DISPLAY_FULL_BUFFER_PIXELS ((APP_SCREEN_WIDTH * APP_SCREEN_HEIGHT))
#define DISPLAY_POWER_EVAL_PERIOD_US (2000ULL * 1000ULL)

#define DISPLAY_NVS_NAMESPACE "display"
#define DISPLAY_NVS_KEY_POWER "power"
#define DISPLAY_NVS_MAGIC 0x44535057U /* "DSPW" */
#define DISPLAY_NVS_VERSION 1U

typedef struct {
    uint32_t magic;
    uint32_t version;
    int32_t active_percent;
    int32_t dim_percent;
    uint32_t dim_timeout_ms;
    uint32_t off_timeout_ms;
    uint32_t night_enabled;
    int32_t night_start_hour;
    int32_t night_end_hour;
} display_power_nvs_t;

static bool s_display_ready = false;
static lv_display_t *s_lv_display = NULL;
static esp_timer_handle_t s_power_timer = NULL;
static int s_display_brightness = -1;
static int s_active_brightness = APP_DISPLAY_ACTIVE_BRIGHTNESS_PERCENT;
static int s_dim_brightness = APP_DISPLAY_DIM_BRIGHTNESS_PERCENT;
static uint32_t s_dim_timeout_ms = APP_DISPLAY_DIM_TIMEOUT_MS;
static uint32_t s_off_timeout_ms = APP_DISPLAY_OFF_TIMEOUT_MS;
static bool s_night_mode_enabled = APP_DISPLAY_NIGHT_MODE_ENABLED;
static int s_night_start_hour = APP_DISPLAY_NIGHT_START_HOUR;
static int s_night_end_hour = APP_DISPLAY_NIGHT_END_HOUR;
static int64_t s_last_activity_us = 0;

static void display_power_config_load(void);
static void display_power_config_save(void);

static lvgl_port_cfg_t display_port_cfg(void)
{
    lvgl_port_cfg_t cfg = ESP_LVGL_PORT_INIT_CONFIG();
    cfg.task_priority = 20;
    cfg.task_stack = APP_LVGL_TASK_STACK;
    cfg.task_affinity = 1;
    cfg.task_max_sleep_ms = 100;
    return cfg;
}

static int display_clamp_brightness(int percent)
{
    if (percent < 0) {
        return 0;
    }
    if (percent > 100) {
        return 100;
    }
    return percent;
}

esp_err_t display_set_brightness_percent(int percent)
{
    const int next = display_clamp_brightness(percent);
    if (s_display_brightness == next) {
        return ESP_OK;
    }

    esp_err_t err = bsp_display_brightness_set(next);
    if (err == ESP_OK) {
        s_display_brightness = next;
    } else {
        ESP_LOGW(TAG_DISPLAY, "Could not set backlight to %d%%: %s", next, esp_err_to_name(err));
    }
    return err;
}

int display_get_brightness_percent(void)
{
    return s_display_brightness;
}

static int display_clamp_hour(int hour)
{
    if (hour < 0) {
        return 0;
    }
    if (hour > 23) {
        return 23;
    }
    return hour;
}

void display_get_power_config(display_power_config_t *out)
{
    if (out == NULL) {
        return;
    }
    out->active_brightness_percent = s_active_brightness;
    out->dim_brightness_percent = s_dim_brightness;
    out->dim_timeout_ms = s_dim_timeout_ms;
    out->off_timeout_ms = s_off_timeout_ms;
    out->night_mode_enabled = s_night_mode_enabled;
    out->night_start_hour = s_night_start_hour;
    out->night_end_hour = s_night_end_hour;
}

void display_set_power_config(const display_power_config_t *cfg)
{
    if (cfg == NULL) {
        return;
    }
    s_active_brightness = display_clamp_brightness(cfg->active_brightness_percent);
    s_dim_brightness = display_clamp_brightness(cfg->dim_brightness_percent);
    s_dim_timeout_ms = cfg->dim_timeout_ms;
    s_off_timeout_ms = cfg->off_timeout_ms;
    s_night_mode_enabled = cfg->night_mode_enabled;
    s_night_start_hour = display_clamp_hour(cfg->night_start_hour);
    s_night_end_hour = display_clamp_hour(cfg->night_end_hour);
    display_power_config_save();
    if (!s_display_ready) {
        return;
    }
    /* Treat a config change as user activity: apply the active brightness and
     * re-arm the inactivity timer with the new timeouts. */
    display_note_activity();
}

/* ------------------------------------------------------------------ */
/* NVS persistence (self-contained in the display driver)              */
/* ------------------------------------------------------------------ */
static void display_power_config_load(void)
{
    nvs_handle_t handle;
    if (nvs_open(DISPLAY_NVS_NAMESPACE, NVS_READONLY, &handle) != ESP_OK) {
        return;
    }

    display_power_nvs_t stored = {0};
    size_t len = sizeof(stored);
    esp_err_t err = nvs_get_blob(handle, DISPLAY_NVS_KEY_POWER, &stored, &len);
    nvs_close(handle);

    if (err != ESP_OK || len != sizeof(stored) || stored.magic != DISPLAY_NVS_MAGIC ||
        stored.version != DISPLAY_NVS_VERSION) {
        return; /* first boot or incompatible layout: keep compile-time defaults */
    }

    s_active_brightness = display_clamp_brightness((int)stored.active_percent);
    s_dim_brightness = display_clamp_brightness((int)stored.dim_percent);
    s_dim_timeout_ms = stored.dim_timeout_ms;
    s_off_timeout_ms = stored.off_timeout_ms;
    s_night_mode_enabled = stored.night_enabled != 0U;
    s_night_start_hour = display_clamp_hour((int)stored.night_start_hour);
    s_night_end_hour = display_clamp_hour((int)stored.night_end_hour);
}

static void display_power_config_save(void)
{
    nvs_handle_t handle;
    if (nvs_open(DISPLAY_NVS_NAMESPACE, NVS_READWRITE, &handle) != ESP_OK) {
        return;
    }

    display_power_nvs_t stored = {
        .magic = DISPLAY_NVS_MAGIC,
        .version = DISPLAY_NVS_VERSION,
        .active_percent = s_active_brightness,
        .dim_percent = s_dim_brightness,
        .dim_timeout_ms = s_dim_timeout_ms,
        .off_timeout_ms = s_off_timeout_ms,
        .night_enabled = s_night_mode_enabled ? 1U : 0U,
        .night_start_hour = s_night_start_hour,
        .night_end_hour = s_night_end_hour,
    };
    if (nvs_set_blob(handle, DISPLAY_NVS_KEY_POWER, &stored, sizeof(stored)) == ESP_OK) {
        (void)nvs_commit(handle);
    }
    nvs_close(handle);
}

/* ------------------------------------------------------------------ */
/* Inactivity state machine (periodic evaluator)                       */
/* ------------------------------------------------------------------ */
static bool display_night_window_active(void)
{
    if (!s_night_mode_enabled) {
        return false;
    }
    time_t now = 0;
    struct tm info = {0};
    time(&now);
    localtime_r(&now, &info);
    if (info.tm_year < (2016 - 1900)) {
        return false; /* clock not synced yet: never force the screen off */
    }

    const int hour = info.tm_hour;
    if (s_night_start_hour == s_night_end_hour) {
        return false;
    }
    if (s_night_start_hour < s_night_end_hour) {
        return hour >= s_night_start_hour && hour < s_night_end_hour;
    }
    return hour >= s_night_start_hour || hour < s_night_end_hour;
}

static int display_power_target_brightness(void)
{
    if (s_last_activity_us == 0) {
        return s_active_brightness;
    }
    const uint32_t elapsed_ms = (uint32_t)((esp_timer_get_time() - s_last_activity_us) / 1000LL);

    if (s_dim_timeout_ms != 0U && elapsed_ms < s_dim_timeout_ms) {
        return s_active_brightness;
    }

    /* Inactive: go OFF during the night window, otherwise dim first. */
    if (display_night_window_active()) {
        return 0;
    }
    if (s_off_timeout_ms != 0U && elapsed_ms >= s_off_timeout_ms) {
        return 0;
    }
    return s_dim_brightness;
}

static void display_power_timer_cb(void *arg)
{
    (void)arg;
    if (!s_display_ready) {
        return;
    }
    (void)display_set_brightness_percent(display_power_target_brightness());
}

static esp_err_t display_power_timer_init(void)
{
    if (s_power_timer != NULL) {
        return ESP_OK;
    }

    const esp_timer_create_args_t timer_args = {
        .callback = display_power_timer_cb,
        .arg = NULL,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "display_power",
        .skip_unhandled_events = true,
    };
    esp_err_t err = esp_timer_create(&timer_args, &s_power_timer);
    if (err != ESP_OK) {
        return err;
    }
    return esp_timer_start_periodic(s_power_timer, DISPLAY_POWER_EVAL_PERIOD_US);
}

void display_note_activity(void)
{
    if (!s_display_ready) {
        return;
    }
    s_last_activity_us = esp_timer_get_time();
    (void)display_set_brightness_percent(s_active_brightness);
}

esp_err_t display_init(void)
{
    if (s_display_ready) {
        return ESP_OK;
    }

    lvgl_port_cfg_t lvgl_cfg = display_port_cfg();
    esp_err_t err = lvgl_port_init(&lvgl_cfg);
    if (err != ESP_OK) {
        ESP_LOGE(TAG_DISPLAY, "lvgl_port_init failed: %s", esp_err_to_name(err));
        return err;
    }

    bsp_lcd_handles_t lcd = {0};
    err = bsp_display_new_with_handles(NULL, &lcd);
    if (err != ESP_OK || lcd.panel == NULL) {
        ESP_LOGE(TAG_DISPLAY, "bsp_display_new_with_handles failed: %s", esp_err_to_name(err));
        return (err == ESP_OK) ? ESP_FAIL : err;
    }

    err = esp_lcd_panel_disp_on_off(lcd.panel, true);
    if (err != ESP_OK) {
        ESP_LOGW(TAG_DISPLAY, "Could not enable LCD panel output: %s", esp_err_to_name(err));
    }

    display_power_config_load();
    ESP_LOGI(TAG_DISPLAY,
        "Power config: active=%d%% dim=%d%% dim_after=%" PRIu32 "ms off_after=%" PRIu32 "ms night=%s (%d:00-%d:00)",
        s_active_brightness, s_dim_brightness, s_dim_timeout_ms, s_off_timeout_ms,
        s_night_mode_enabled ? "on" : "off", s_night_start_hour, s_night_end_hour);

    err = display_set_brightness_percent(s_active_brightness);
    if (err != ESP_OK) {
        ESP_LOGW(TAG_DISPLAY, "Could not enable backlight: %s", esp_err_to_name(err));
    }

    err = display_power_timer_init();
    if (err != ESP_OK) {
        ESP_LOGW(TAG_DISPLAY, "Could not create display power timer: %s", esp_err_to_name(err));
    }

    lvgl_port_display_cfg_t disp_cfg = {
        .io_handle = lcd.io,
        .panel_handle = lcd.panel,
        .control_handle = lcd.control,
        .buffer_size = DISPLAY_FULL_BUFFER_PIXELS / 5U,
        .double_buffer = true,
        .hres = APP_SCREEN_WIDTH,
        .vres = APP_SCREEN_HEIGHT,
        .monochrome = false,
        .rotation = {
            .swap_xy = false,
            .mirror_x = true,
            .mirror_y = true,
        },
#if LV_VERSION_MAJOR >= 9
        .color_format = LV_COLOR_FORMAT_RGB565,
#endif
        .flags = {
            .buff_dma = true,
            .buff_spiram = true,
            .sw_rotate = true,
#if LV_VERSION_MAJOR >= 9
            .swap_bytes = (BSP_LCD_BIGENDIAN ? true : false),
#endif
            .full_refresh = false,
            .direct_mode = false,
        },
    };

    const lvgl_port_display_dsi_cfg_t dsi_cfg = {
        .flags = {
            .avoid_tearing = false,
        },
    };

    static const uint8_t draw_buf_divisors[] = {5U, 8U, 10U, 12U};
    uint8_t used_divisor = 0U;
    uint32_t used_buffer_pixels = 0U;
    for (size_t i = 0; i < (sizeof(draw_buf_divisors) / sizeof(draw_buf_divisors[0])); i++) {
        uint8_t divisor = draw_buf_divisors[i];
        if (divisor == 0U) {
            continue;
        }
        disp_cfg.buffer_size = DISPLAY_FULL_BUFFER_PIXELS / divisor;
        s_lv_display = lvgl_port_add_disp_dsi(&disp_cfg, &dsi_cfg);
        if (s_lv_display != NULL) {
            used_divisor = divisor;
            used_buffer_pixels = disp_cfg.buffer_size;
            break;
        }
        ESP_LOGW(TAG_DISPLAY, "lvgl_port_add_disp_dsi failed with draw_buf=1/%u (%u px), trying smaller buffer",
            (unsigned)divisor, (unsigned)disp_cfg.buffer_size);
    }

    if (s_lv_display == NULL) {
        ESP_LOGE(TAG_DISPLAY, "lvgl_port_add_disp_dsi failed");
        return ESP_FAIL;
    }

    if (lvgl_port_lock(2000)) {
        lv_display_set_antialiasing(s_lv_display, APP_LVGL_ANTIALIASING != 0);
        /* Panel 7B is mounted upside-down; EK79007 MADCTL mirror has no effect
         * in DSI video mode, so rotate 180 in software (matches GT911 mirror). */
        lv_display_set_rotation(s_lv_display, LV_DISPLAY_ROTATION_180);
        lvgl_port_unlock();
    } else {
        ESP_LOGW(TAG_DISPLAY, "Could not lock LVGL for rotation setup");
        lv_display_set_antialiasing(s_lv_display, APP_LVGL_ANTIALIASING != 0);
    }
    ESP_LOGI(TAG_DISPLAY, "LVGL antialiasing: %s", (APP_LVGL_ANTIALIASING != 0) ? "on" : "off");

    s_display_ready = true;
    ESP_LOGI(TAG_DISPLAY,
        "Display initialized (esp_lvgl_port + DSI, avoid_tearing=0, direct_mode=0, double_buffer=1, draw_buf=1/%u, %u px)",
        (unsigned)used_divisor, (unsigned)used_buffer_pixels);
    display_note_activity();
    return ESP_OK;
}

bool display_is_ready(void)
{
    return s_display_ready;
}

bool display_lock(uint32_t timeout_ms)
{
    return lvgl_port_lock(timeout_ms);
}

void display_unlock(void)
{
    lvgl_port_unlock();
}
