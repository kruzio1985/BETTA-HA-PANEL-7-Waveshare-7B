/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */

// ============================================================
// Xiaozhi AI Cloud Activation (pairing code flow)
// ============================================================
//
// Implements the official xiaozhi-esp32 OTA/activation flow used to bind a
// device to the Xiaozhi cloud (https://xiaozhi.me):
//
//   check-version -> POST <base> with a JSON system-info payload.  The server
//                    answers with activation{code,message,...} while the
//                    device is unbound, or with websocket{url,token,...} once
//                    it is bound.
//   activate      -> POST <base>activate with "{}" while a code is pending.
//                    202 = still waiting for the user on xiaozhi.me,
//                    200 = the device was just bound.
//
// Once bound, the discovered WebSocket endpoint/token are persisted into the
// runtime settings and pushed into the client with xz_xiaozhi_set_config().
// The Xiaozhi UI page is driven through the xz_ui_* setters.
//
// ============================================================

#include "xiaozhi_activate.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "freertos/task.h"

#include "esp_app_desc.h"
#include "esp_crt_bundle.h"
#include "esp_flash.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "esp_mac.h"
#include "esp_random.h"
#include "esp_system.h"
#include "nvs_flash.h"

#include "cJSON.h"

#include "app_config.h"
#include "settings/runtime_settings.h"
#include "xiaozhi_client.h"
#include "xiaozhi_ui.h"

#define TAG "XZ_ACT"

#define XZ_ACT_NVS_NS      "xz_act"
#define XZ_ACT_NVS_UUID    "uuid"

#define XZ_ACT_CODE_MAX       16
#define XZ_ACT_MESSAGE_MAX    256
#define XZ_ACT_URL_MAX        (APP_XIAOZHI_OTA_URL_MAX_LEN + 16)
#define XZ_ACT_BODY_MAX       1024
#define XZ_ACT_STACK          8192
#define XZ_ACT_HTTP_TIMEOUT_MS 20000

/* Retry pacing (mirrors the official ota.cc behaviour). */
#define XZ_ACT_CHECK_RETRY_MS  5000
#define XZ_ACT_POLL_MS         3000   /* While the activation code is pending. */
#define XZ_ACT_ERR_MS          10000  /* After a failed activate call.        */
#define XZ_ACT_POLLS_PER_CHECK 60     /* Re-run check-version after ~3 min.   */

/* ------------------------------------------------------------------ */
/* Shared state (guarded by s_lock).                                   */
/* ------------------------------------------------------------------ */
static SemaphoreHandle_t s_lock;
static TaskHandle_t s_task = NULL;
static bool s_pending = false;
static bool s_recheck_requested = false;
static char s_code[XZ_ACT_CODE_MAX];
static char s_message[XZ_ACT_MESSAGE_MAX];

/* ------------------------------------------------------------------ */
/* Identity (lowercase MAC + NVS-persisted UUID v4).                   */
/* ------------------------------------------------------------------ */
static void uuid_v4_generate(char out[37])
{
    uint8_t b[16];
    esp_fill_random(b, sizeof(b));
    b[6] = (uint8_t)((b[6] & 0x0F) | 0x40); /* version 4 */
    b[8] = (uint8_t)((b[8] & 0x3F) | 0x80); /* variant 10 */

    snprintf(out, 37,
             "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
             b[0], b[1], b[2], b[3],
             b[4], b[5],
             b[6], b[7],
             b[8], b[9],
             b[10], b[11], b[12], b[13], b[14], b[15]);
}

esp_err_t xz_ident_get_mac(char *out, size_t out_len)
{
    if (out == NULL || out_len < 18) {
        return ESP_ERR_INVALID_ARG;
    }

    uint8_t mac[6] = {0};
    if (esp_read_mac(mac, ESP_MAC_BASE) != ESP_OK) {
        snprintf(out, out_len, "esp32p4-panel");
        return ESP_OK;
    }

    snprintf(out, out_len, "%02x:%02x:%02x:%02x:%02x:%02x",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    return ESP_OK;
}

esp_err_t xz_ident_get_uuid(char *out, size_t out_len)
{
    if (out == NULL || out_len < 37) {
        return ESP_ERR_INVALID_ARG;
    }

    nvs_handle_t h;
    if (nvs_open(XZ_ACT_NVS_NS, NVS_READWRITE, &h) != ESP_OK) {
        return ESP_FAIL;
    }

    size_t needed = 0;
    esp_err_t err = nvs_get_str(h, XZ_ACT_NVS_UUID, NULL, &needed);
    if (err == ESP_OK && needed <= out_len) {
        err = nvs_get_str(h, XZ_ACT_NVS_UUID, out, &needed);
        nvs_close(h);
        if (err == ESP_OK && out[0] != '\0') {
            return ESP_OK;
        }
        return (err == ESP_OK) ? ESP_FAIL : err;
    }

    char tmp[37];
    uuid_v4_generate(tmp);

    err = nvs_set_str(h, XZ_ACT_NVS_UUID, tmp);
    if (err == ESP_OK) {
        err = nvs_commit(h);
    }
    nvs_close(h);

    if (err != ESP_OK) {
        return err;
    }

    snprintf(out, out_len, "%s", tmp);
    return ESP_OK;
}

/* ------------------------------------------------------------------ */
/* HTTP helper (accumulates the response body in the event handler).   */
/* ------------------------------------------------------------------ */
typedef struct {
    char *buf;
    size_t len;
    size_t cap;
} http_acc_t;

static esp_err_t http_event_handler(esp_http_client_event_t *evt)
{
    if (evt->event_id != HTTP_EVENT_ON_DATA) {
        return ESP_OK;
    }

    http_acc_t *acc = (http_acc_t *)evt->user_data;
    if (acc == NULL || evt->data_len <= 0) {
        return ESP_OK;
    }

    size_t need = acc->len + (size_t)evt->data_len + 1;
    if (need > acc->cap) {
        size_t new_cap = acc->cap ? acc->cap : 2048;
        while (new_cap < need) {
            new_cap *= 2;
        }
        char *nb = (char *)realloc(acc->buf, new_cap);
        if (nb == NULL) {
            return ESP_ERR_NO_MEM;
        }
        acc->buf = nb;
        acc->cap = new_cap;
    }

    memcpy(acc->buf + acc->len, evt->data, evt->data_len);
    acc->len += (size_t)evt->data_len;
    acc->buf[acc->len] = '\0';
    return ESP_OK;
}

/* POSTs `body` ("" = no payload) to `url`.  Returns the HTTP status in
 * *out_status and a heap-allocated response body (NUL-terminated, must be
 * free()d by the caller) in *out_body, which is NULL on failure. */
static esp_err_t xz_http_post(const char *url, const char *body,
                              const char *device_id, const char *client_id,
                              int *out_status, char **out_body)
{
    http_acc_t acc = {0};
    *out_status = 0;
    *out_body = NULL;

    esp_http_client_config_t cfg = {
        .url = url,
        .method = HTTP_METHOD_POST,
        .timeout_ms = XZ_ACT_HTTP_TIMEOUT_MS,
        .buffer_size = 4096,
        .buffer_size_tx = 2048,
        .keep_alive_enable = false,
        .event_handler = http_event_handler,
        .user_data = &acc,
    };
#if CONFIG_MBEDTLS_CERTIFICATE_BUNDLE
    cfg.crt_bundle_attach = esp_crt_bundle_attach;
#endif

    esp_http_client_handle_t client = esp_http_client_init(&cfg);
    if (client == NULL) {
        free(acc.buf);
        return ESP_ERR_NO_MEM;
    }

    esp_http_client_set_header(client, "Activation-Version", "1");
    esp_http_client_set_header(client, "Device-Id", device_id);
    esp_http_client_set_header(client, "Client-Id", client_id);
    esp_http_client_set_header(client, "Accept-Language", "en");
    esp_http_client_set_header(client, "Content-Type", "application/json");

    const esp_app_desc_t *app = esp_app_get_description();
    char user_agent[96];
    snprintf(user_agent, sizeof(user_agent), "%s/%s", APP_NAME, app->version);
    esp_http_client_set_header(client, "User-Agent", user_agent);

    if (body != NULL && body[0] != '\0') {
        esp_http_client_set_post_field(client, body, (int)strlen(body));
    }

    esp_err_t err = esp_http_client_perform(client);
    int status = esp_http_client_get_status_code(client);
    esp_http_client_cleanup(client);

    if (err != ESP_OK) {
        ESP_LOGW(TAG, "HTTP %s failed: %s (status %d)",
                 url, esp_err_to_name(err), status);
        free(acc.buf);
        *out_status = status;
        return err;
    }

    *out_status = status;
    *out_body = acc.buf; /* may be NULL/empty */
    return ESP_OK;
}

/* ------------------------------------------------------------------ */
/* System-info JSON (subset that the official server actually needs).  */
/* ------------------------------------------------------------------ */
static char *build_system_info_json(const char *device_id, const char *client_id)
{
    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        return NULL;
    }

    cJSON_AddNumberToObject(root, "version", 2);
    cJSON_AddStringToObject(root, "language", "en");

    uint32_t flash_size = 0;
    if (esp_flash_get_size(NULL, &flash_size) != ESP_OK) {
        flash_size = 0;
    }
    cJSON_AddNumberToObject(root, "flash_size", (double)flash_size);

    char heap[24];
    snprintf(heap, sizeof(heap), "%u", (unsigned)esp_get_minimum_free_heap_size());
    cJSON_AddStringToObject(root, "minimum_free_heap_size", heap);

    cJSON_AddStringToObject(root, "mac_address", device_id);
    cJSON_AddStringToObject(root, "uuid", client_id);
    cJSON_AddStringToObject(root, "chip_model_name", CONFIG_IDF_TARGET);

    const esp_app_desc_t *app = esp_app_get_description();
    cJSON *application = cJSON_CreateObject();
    if (application == NULL) {
        cJSON_Delete(root);
        return NULL;
    }
    cJSON_AddStringToObject(application, "name", app->project_name);
    cJSON_AddStringToObject(application, "version", app->version);

    char compiled[64];
    snprintf(compiled, sizeof(compiled), "%sT%sZ", app->date, app->time);
    cJSON_AddStringToObject(application, "compile_time", compiled);
    cJSON_AddStringToObject(application, "idf_version", esp_get_idf_version());
    cJSON_AddItemToObject(root, "application", application);

    char *json = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);
    return json;
}

/* ------------------------------------------------------------------ */
/* State helpers.                                                      */
/* ------------------------------------------------------------------ */
static void state_set_pending(bool pending)
{
    if (s_lock == NULL) {
        return;
    }
    xSemaphoreTake(s_lock, portMAX_DELAY);
    s_pending = pending;
    if (!pending) {
        s_code[0] = '\0';
        s_message[0] = '\0';
    }
    xSemaphoreGive(s_lock);
}

/* Stores a fresh code/message; returns true when it differs from what was
 * last shown (so the caller re-renders the code screen). */
static bool state_update_code(const char *code, const char *message)
{
    if (s_lock == NULL) {
        return true;
    }
    xSemaphoreTake(s_lock, portMAX_DELAY);
    bool changed = (strncmp(s_code, code != NULL ? code : "", sizeof(s_code)) != 0) ||
                   (strncmp(s_message, message != NULL ? message : "", sizeof(s_message)) != 0);
    strlcpy(s_code, code != NULL ? code : "", sizeof(s_code));
    strlcpy(s_message, message != NULL ? message : "", sizeof(s_message));
    s_pending = true;
    xSemaphoreGive(s_lock);
    return changed;
}

/* The cloud keeps handing back the literal token "test-token" even after the
 * device is bound — it authorizes each connection by the Device-Id header, so
 * the placeholder is still a perfectly usable credential. Only an empty token
 * means there is nothing usable yet. */
static bool xz_token_is_placeholder(const char *token)
{
    return token == NULL || token[0] == '\0';
}

/* Persists the bound WebSocket config into the runtime settings (public file
 * for the URL + NVS for the token) and pushes it into the running client. */
static void persist_and_apply(const char *ws_url, const char *ws_token)
{
    if (ws_url == NULL || ws_url[0] == '\0' || xz_token_is_placeholder(ws_token)) {
        ESP_LOGW(TAG, "refusing to persist invalid activation data (url=%s token=%s)",
                 ws_url != NULL ? ws_url : "(null)", ws_token != NULL ? ws_token : "(null)");
        return;
    }

    runtime_settings_t settings;
    esp_err_t err = runtime_settings_load(&settings);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "settings load failed (%s), using defaults", esp_err_to_name(err));
        runtime_settings_set_defaults(&settings);
    }

    if (ws_url != NULL && ws_url[0] != '\0') {
        strlcpy(settings.xiaozhi_server, ws_url, sizeof(settings.xiaozhi_server));
    }
    if (ws_token != NULL && ws_token[0] != '\0') {
        strlcpy(settings.xiaozhi_token, ws_token, sizeof(settings.xiaozhi_token));
    }
    settings.xiaozhi_enabled = true;

    if (runtime_settings_save(&settings) != ESP_OK) {
        ESP_LOGE(TAG, "failed to persist activation settings");
    }

    xiaozhi_config_t cfg = {
        .server = settings.xiaozhi_server,
        .device = settings.xiaozhi_device,
        .token = settings.xiaozhi_token,
        .enabled = true,
    };
    xz_xiaozhi_set_config(&cfg);

    ESP_LOGI(TAG, "Xiaozhi cloud activated, server configured");
}

/* Composes the body text shown under the big pairing code (the server
 * activation.message field duplicates the code, so we build our own hint
 * with the pairing URL and the device MAC). */
static void xz_act_compose_pairing_hint(char *out, size_t n, const char *device_id)
{
    if (device_id != NULL && device_id[0] != '\0') {
        snprintf(out, n,
                 "1. Otworz https://xiaozhi.me\n"
                 "2. Dodaj urzadzenie i wpisz kod ponizej\n"
                 "3. Panel polaczy sie automatycznie\n\n"
                 "Urzadzenie (MAC): %s",
                 device_id);
    } else {
        strlcpy(out,
                "1. Otworz https://xiaozhi.me\n"
                "2. Dodaj urzadzenie i wpisz kod ponizej\n"
                "3. Panel polaczy sie automatycznie",
                n);
    }
}

/* ------------------------------------------------------------------ */
/* Orchestrator task.                                                  */
/* ------------------------------------------------------------------ */
static void activate_task_fn(void *arg)
{
    char *ota_url = (char *)arg; /* heap-allocated by xz_activate_start */

    char device_id[32] = {0};
    char client_id[40] = {0};
    xz_ident_get_mac(device_id, sizeof(device_id));
    xz_ident_get_uuid(client_id, sizeof(client_id));
    ESP_LOGI(TAG, "starting activation (device=%s client=%s)", device_id, client_id);

    char check_url[XZ_ACT_URL_MAX];
    char activate_url[XZ_ACT_URL_MAX];
    strlcpy(check_url, ota_url, sizeof(check_url));
    if (strlen(ota_url) > 0 && ota_url[strlen(ota_url) - 1] == '/') {
        snprintf(activate_url, sizeof(activate_url), "%sactivate", ota_url);
    } else {
        snprintf(activate_url, sizeof(activate_url), "%s/activate", ota_url);
    }

    /* Body used for the periodic activate poll while a code is pending. */
    static const char activate_body[] = "{}";

    state_set_pending(true);
    xz_ui_show_overlay("Xiaozhi AI", "", "Laczenie z chmura Xiaozhi...");

    for (;;) {
        /* --- 1) check-version ------------------------------------- */
        char *info = build_system_info_json(device_id, client_id);
        if (info == NULL) {
            xz_ui_show_overlay("Xiaozhi AI", "", "Brak pamieci do aktywacji");
            vTaskDelay(pdMS_TO_TICKS(XZ_ACT_CHECK_RETRY_MS));
            continue;
        }

        int status = 0;
        char *resp = NULL;
        esp_err_t err = xz_http_post(check_url, info, device_id, client_id, &status, &resp);
        cJSON_free(info);
        info = NULL;

        if (err != ESP_OK || status != 200) {
            free(resp);
            xz_ui_show_overlay("Xiaozhi AI", "", "Brak polaczenia z chmura Xiaozhi");
            vTaskDelay(pdMS_TO_TICKS(XZ_ACT_CHECK_RETRY_MS));
            continue;
        }
        if (resp == NULL || resp[0] == '\0') {
            xz_ui_show_overlay("Xiaozhi AI", "", "Chmura Xiaozhi nie odpowiedziala");
            vTaskDelay(pdMS_TO_TICKS(XZ_ACT_CHECK_RETRY_MS));
            continue;
        }

        cJSON *root = cJSON_Parse(resp);
        free(resp);
        resp = NULL;
        if (root == NULL) {
            xz_ui_show_overlay("Xiaozhi AI", "", "Blad odpowiedzi z chmury Xiaozhi");
            vTaskDelay(pdMS_TO_TICKS(XZ_ACT_CHECK_RETRY_MS));
            continue;
        }

        char ws_url[APP_XIAOZHI_SERVER_MAX_LEN] = {0};
        char ws_token[APP_XIAOZHI_TOKEN_MAX_LEN] = {0};
        cJSON *websocket = cJSON_GetObjectItemCaseSensitive(root, "websocket");
        if (cJSON_IsObject(websocket)) {
            cJSON *u = cJSON_GetObjectItemCaseSensitive(websocket, "url");
            cJSON *t = cJSON_GetObjectItemCaseSensitive(websocket, "token");
            if (cJSON_IsString(u) && u->valuestring != NULL) {
                strlcpy(ws_url, u->valuestring, sizeof(ws_url));
            }
            if (cJSON_IsString(t) && t->valuestring != NULL) {
                strlcpy(ws_token, t->valuestring, sizeof(ws_token));
            }
        }

        char code[XZ_ACT_CODE_MAX] = {0};
        char message[XZ_ACT_MESSAGE_MAX] = {0};
        bool has_activation = false;
        cJSON *activation = cJSON_GetObjectItemCaseSensitive(root, "activation");
        if (cJSON_IsObject(activation)) {
            /* An "activation" section (with code and/or challenge) means the
             * device is NOT bound yet, even when a placeholder websocket url
             * (token "test-token") is present in the same reply. */
            has_activation = true;
            cJSON *c = cJSON_GetObjectItemCaseSensitive(activation, "code");
            cJSON *m = cJSON_GetObjectItemCaseSensitive(activation, "message");
            if (cJSON_IsString(c) && c->valuestring != NULL) {
                strlcpy(code, c->valuestring, sizeof(code));
            }
            if (cJSON_IsString(m) && m->valuestring != NULL) {
                strlcpy(message, m->valuestring, sizeof(message));
            }
        }
        cJSON_Delete(root);
        root = NULL;

        if (has_activation) {
            /* --- still unbound ------------------------------------- */
            if (state_update_code(code, message)) {
                if (code[0] != '\0') {
                    char hint[XZ_ACT_BODY_MAX];
                    xz_act_compose_pairing_hint(hint, sizeof(hint), device_id);
                    xz_ui_show_overlay("Parowanie Xiaozhi", code, hint);
                } else {
                    /* Challenge mode (no code yet): wait for the user to
                     * confirm the device on xiaozhi.me. */
                    xz_ui_show_overlay("Xiaozhi AI", "",
                                       "Czekam na potwierdzenie urzadzenia na xiaozhi.me...");
                }
            }

            bool re_poll = true;
            for (int i = 0; i < XZ_ACT_POLLS_PER_CHECK; i++) {
                if (s_recheck_requested) {
                    s_recheck_requested = false;
                    re_poll = false;
                    break;
                }

                int ast = 0;
                char *ar = NULL;
                esp_err_t aerr = xz_http_post(activate_url, activate_body,
                                              device_id, client_id, &ast, &ar);
                free(ar);
                ar = NULL;

                if (aerr == ESP_OK && ast == 200) {
                    re_poll = false; /* just bound -> re-check now */
                    break;
                }
                if (aerr == ESP_OK && ast == 202) {
                    vTaskDelay(pdMS_TO_TICKS(XZ_ACT_POLL_MS));
                } else {
                    vTaskDelay(pdMS_TO_TICKS(XZ_ACT_ERR_MS));
                }
            }
            if (!re_poll) {
                continue; /* back to check-version */
            }
        } else if (ws_url[0] != '\0' && !xz_token_is_placeholder(ws_token)) {
            /* --- bound (real websocket endpoint + token) ----------- */
            state_set_pending(false);
            persist_and_apply(ws_url, ws_token);
            xz_ui_show_ready();
            break;
        } else {
            /* No activation section and no real websocket: server hiccup,
             * retry later. */
            xz_ui_show_overlay("Xiaozhi AI", "",
                               "Chmura Xiaozhi nie zwrocila danych. Ponawiam...");
            vTaskDelay(pdMS_TO_TICKS(XZ_ACT_CHECK_RETRY_MS));
        }
    }

    xSemaphoreTake(s_lock, portMAX_DELAY);
    s_task = NULL;
    xSemaphoreGive(s_lock);
    state_set_pending(false);

    free(ota_url);
    vTaskDelete(NULL);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */
esp_err_t xz_activate_start(const char *ota_url)
{
    if (ota_url == NULL || ota_url[0] == '\0') {
        return ESP_ERR_INVALID_ARG;
    }

    if (s_lock == NULL) {
        s_lock = xSemaphoreCreateMutex();
        if (s_lock == NULL) {
            return ESP_ERR_NO_MEM;
        }
    }

    xSemaphoreTake(s_lock, portMAX_DELAY);
    bool already = (s_task != NULL);
    xSemaphoreGive(s_lock);
    if (already) {
        return ESP_OK; /* idempotent */
    }

    char *url_copy = (char *)malloc(strlen(ota_url) + 1);
    if (url_copy == NULL) {
        return ESP_ERR_NO_MEM;
    }
    strcpy(url_copy, ota_url);

    BaseType_t ok = xTaskCreate(activate_task_fn, "xz_activate",
                                XZ_ACT_STACK, url_copy, 5, &s_task);
    if (ok != pdPASS) {
        s_task = NULL;
        free(url_copy);
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "activation task started");
    return ESP_OK;
}

bool xz_activate_is_pending(void)
{
    if (s_lock == NULL) {
        return false;
    }
    xSemaphoreTake(s_lock, portMAX_DELAY);
    bool pending = s_pending;
    xSemaphoreGive(s_lock);
    return pending;
}

void xz_activate_request_recheck(void)
{
    s_recheck_requested = true;
}

bool xz_activate_get_code(char *code, size_t code_len, char *message, size_t message_len)
{
    bool got = false;
    if (s_lock == NULL) {
        return false;
    }

    xSemaphoreTake(s_lock, portMAX_DELAY);
    if (s_pending && s_code[0] != '\0') {
        got = true;
        if (code != NULL && code_len > 0) {
            strlcpy(code, s_code, code_len);
        }
        if (message != NULL && message_len > 0) {
            strlcpy(message, s_message, message_len);
        }
    } else {
        if (code != NULL && code_len > 0) {
            code[0] = '\0';
        }
        if (message != NULL && message_len > 0) {
            message[0] = '\0';
        }
    }
    xSemaphoreGive(s_lock);
    return got;
}
