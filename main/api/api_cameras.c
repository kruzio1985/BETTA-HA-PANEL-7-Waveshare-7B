/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "api/api_routes.h"

#include <stdlib.h>
#include <string.h>

#include "esp_log.h"

#include "app_config.h"
#include "app_events.h"
#include "camera/camera_store.h"
#include "util/log_tags.h"

#define TAG TAG_CAMERA

static void set_json_headers(httpd_req_t *req)
{
    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Cache-Control", "no-store");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
}

esp_err_t api_cameras_get_handler(httpd_req_t *req)
{
    char *json = NULL;
    esp_err_t err = camera_store_load_json(&json);
    if (err != ESP_OK || json == NULL) {
        json = strdup("[]");
        if (json == NULL) {
            return httpd_resp_send_500(req);
        }
    }

    set_json_headers(req);
    esp_err_t send_err = httpd_resp_sendstr(req, json);
    free(json);
    return send_err;
}

esp_err_t api_cameras_put_handler(httpd_req_t *req)
{
    if (req->content_len <= 0 || req->content_len > APP_CAMERAS_MAX_JSON_LEN) {
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid payload size");
    }

    char *buf = calloc((size_t)req->content_len + 1U, sizeof(char));
    if (buf == NULL) {
        return httpd_resp_send_500(req);
    }

    int received = 0;
    while (received < req->content_len) {
        int r = httpd_req_recv(req, buf + received, req->content_len - received);
        if (r <= 0) {
            free(buf);
            return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Failed to read body");
        }
        received += r;
    }

    esp_err_t err = camera_store_save_json(buf);
    free(buf);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "camera save rejected: %s", esp_err_to_name(err));
        return httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid cameras payload");
    }

    app_event_t event = {.type = EV_LAYOUT_UPDATED};
    app_events_publish(&event, pdMS_TO_TICKS(20));

    const char ok[] = "{\"ok\":true}";
    set_json_headers(req);
    return httpd_resp_sendstr(req, ok);
}
