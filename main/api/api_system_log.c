/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "api/api_routes.h"

#include <stdlib.h>
#include <string.h>

#include "app_config.h"
#include "diag/system_log.h"

#define LOG_TAIL_BYTES (APP_LOG_MAX_FILE_BYTES)

esp_err_t api_logs_get_handler(httpd_req_t *req)
{
    char *buf = malloc(LOG_TAIL_BYTES + 1U);
    if (buf == NULL) {
        return httpd_resp_send_500(req);
    }

    int got = system_log_read_tail(buf, LOG_TAIL_BYTES + 1U);
    if (got <= 0) {
        strcpy(buf, "(no logs yet)\n");
    }

    httpd_resp_set_type(req, "text/plain");
    httpd_resp_set_hdr(req, "Cache-Control", "no-store");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    esp_err_t err = httpd_resp_sendstr(req, buf);
    free(buf);
    return err;
}

esp_err_t api_logs_delete_handler(httpd_req_t *req)
{
    esp_err_t err = system_log_clear();
    if (err != ESP_OK && err != ESP_ERR_INVALID_STATE) {
        return httpd_resp_send_500(req);
    }

    httpd_resp_set_type(req, "text/plain");
    httpd_resp_set_hdr(req, "Cache-Control", "no-store");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    return httpd_resp_sendstr(req, "ok\n");
}
