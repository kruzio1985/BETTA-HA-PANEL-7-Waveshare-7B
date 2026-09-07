/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#pragma once

#include <stdbool.h>
#include <stdint.h>

#include "esp_err.h"

esp_err_t ui_runtime_init(void);
esp_err_t ui_runtime_load_layout(const char *layout_json);
esp_err_t ui_runtime_reload_layout(void);
esp_err_t ui_runtime_start(void);

/* Watchdog support: the system log task uses these to detect a UI task that is
 * stuck (e.g. blocked while holding the LVGL display lock) and restart the
 * panel instead of letting it hang forever. */
bool ui_runtime_is_running(void);
uint32_t ui_runtime_get_heartbeat(void);
