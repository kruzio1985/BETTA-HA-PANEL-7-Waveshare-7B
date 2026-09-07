/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 *
 * Cameras page: renders the manually configured HTTP JPEG snapshot cameras as
 * a grid of live-updating tiles.  Snapshot fetches reuse the HA cover fetcher
 * (HW JPEG decode on ESP32-P4) through its independent/basic-auth API.
 */
#pragma once

#include <stdbool.h>

#include "esp_err.h"
#include "lvgl.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Build the cameras page content inside `parent` (a page container). */
esp_err_t ui_cameras_page_build(lv_obj_t *parent, const char *page_id);

/* Cancel in-flight fetches and release decoded buffers for the given page.
 * Safe to call from the LVGL task before the page container is destroyed. */
void ui_cameras_page_deinit(void);

/* Called when the page becomes visible; forces an immediate snapshot refresh. */
void ui_cameras_page_on_shown(const char *page_id);

#ifdef __cplusplus
}
#endif
