/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#pragma once

#include <stdbool.h>
#include <stdint.h>

#include "esp_err.h"

esp_err_t display_init(void);
bool display_is_ready(void);
bool display_lock(uint32_t timeout_ms);
void display_unlock(void);
esp_err_t display_set_brightness_percent(int percent);
int display_get_brightness_percent(void);

/* Dimming/auto-power policy.  UI settings edits these so that the active
 * (user-preferred) brightness is remembered instead of being reset to the
 * compile-time default every time the screen is touched. */
typedef struct {
    int active_brightness_percent; /* restored on touch/activity            */
    int dim_brightness_percent;    /* brightness applied after inactivity   */
    uint32_t dim_timeout_ms;       /* inactivity before dim; 0 = never dim  */
    uint32_t off_timeout_ms;       /* inactivity before full screen OFF; 0 = never off */
    bool night_mode_enabled;       /* during night window, OFF instead of DIM */
    int night_start_hour;          /* 0..23                                 */
    int night_end_hour;            /* 0..23 (may be < start to wrap midnight) */
} display_power_config_t;

void display_get_power_config(display_power_config_t *out);
void display_set_power_config(const display_power_config_t *cfg);
void display_note_activity(void);
