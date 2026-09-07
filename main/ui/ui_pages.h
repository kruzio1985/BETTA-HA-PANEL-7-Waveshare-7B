/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#pragma once

#include <stdbool.h>
#include <stdint.h>
#include <time.h>

#include "lvgl.h"

typedef void (*ui_pages_show_cb_t)(const char *page_id, uint16_t index);
/* Simple notification callback (no payload), e.g. topbar gear press or a
 * finished page rebuild. Runs on the LVGL UI task. */
typedef void (*ui_pages_action_cb_t)(void);

void ui_pages_init(void);
void ui_pages_reset(void);
lv_obj_t *ui_pages_add(const char *page_id, const char *title);
bool ui_pages_show(const char *page_id);
bool ui_pages_show_index(uint16_t index);
bool ui_pages_next(void);
const char *ui_pages_current_id(void);
/* Register a single callback that is invoked whenever the active page
 * changes (after the new page has been made visible).  Passing NULL
 * clears the callback.  The callback runs on the LVGL UI task. */
void ui_pages_set_show_callback(ui_pages_show_cb_t cb);
/* Invoked when the topbar gear/settings button is clicked. Passing NULL
 * disables the button action. Runs on the LVGL UI task. */
void ui_pages_set_gear_callback(ui_pages_action_cb_t cb);
/* Invoked right after the screen chrome (topbar/nav/content) has been rebuilt
 * by ui_pages_init(). Lets dependent overlays drop stale object handles that
 * were destroyed by the rebuild. Passing NULL disables the hook. */
void ui_pages_set_screen_built_callback(ui_pages_action_cb_t cb);
uint16_t ui_pages_count(void);
void ui_pages_set_topbar_status(
    bool wifi_connected, bool wifi_setup_ap_active, bool api_connected, bool api_initial_sync_done);
void ui_pages_set_topbar_datetime(const struct tm *timeinfo);
