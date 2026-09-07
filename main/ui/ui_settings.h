/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#pragma once

#include <stdbool.h>

/* Full-screen settings overlay, opened from the topbar gear button.
 * All UI work happens on the LVGL task (gear/close/category events), so the
 * exported functions may only be called from LVGL context.
 * Labels are intentionally pure ASCII (font glyph coverage). */
void ui_settings_init(void);
void ui_settings_toggle(void);
bool ui_settings_is_open(void);
