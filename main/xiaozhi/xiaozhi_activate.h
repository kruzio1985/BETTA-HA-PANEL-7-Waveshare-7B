/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#pragma once

#include <stdbool.h>
#include <stddef.h>

#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

// Start the Xiaozhi cloud activation orchestrator.  It POSTs the board
// system info to the Xiaozhi OTA endpoint, shows the 6-digit activation
// code on the Xiaozhi page while the device is not bound, and persists the
// WebSocket url/token returned by the server back into the runtime settings
// (and the running client) once activation succeeds.
//
// `ota_url` is the base activation endpoint (e.g. the official
// "https://api.tenclass.net/xiaozhi/ota/").  It is copied internally and can
// be freed after this call returns.
esp_err_t xz_activate_start(const char *ota_url);

// True while the orchestrator is talking to the server / showing a code.
bool xz_activate_is_pending(void);

// Ask the orchestrator to re-poll the server immediately (used e.g. when the
// user binds the device and wants the panel to pick it up without a reboot).
void xz_activate_request_recheck(void);

// Last activation code / message received (used by the UI to restore the
// code screen when the page is rebuilt).  Returns false when no code is
// currently shown.
bool xz_activate_get_code(char *code, size_t code_len, char *message, size_t message_len);

// Device identity helpers shared with the WebSocket client so that the
// Device-Id / Client-Id headers match the ones used during activation.
esp_err_t xz_ident_get_mac(char *out, size_t out_len);
esp_err_t xz_ident_get_uuid(char *out, size_t out_len);

#ifdef __cplusplus
}
#endif
