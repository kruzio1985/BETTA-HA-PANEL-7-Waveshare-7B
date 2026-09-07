/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#pragma once

#include <stdbool.h>
#include <stdint.h>

#include "esp_err.h"

typedef enum {
    UI_BINDINGS_MEDIA_ACTION_PLAY_PAUSE = 0,
    UI_BINDINGS_MEDIA_ACTION_STOP,
    UI_BINDINGS_MEDIA_ACTION_NEXT,
    UI_BINDINGS_MEDIA_ACTION_PREVIOUS,
} ui_bindings_media_action_t;

esp_err_t ui_bindings_toggle_entity(const char *entity_id);
esp_err_t ui_bindings_set_entity_power(const char *entity_id, bool on);
esp_err_t ui_bindings_set_slider_value(const char *entity_id, int value);
esp_err_t ui_bindings_set_climate_target_c(const char *entity_id, float celsius);
esp_err_t ui_bindings_set_climate_hvac_mode(const char *entity_id, const char *hvac_mode);
esp_err_t ui_bindings_set_climate_fan_mode(const char *entity_id, const char *fan_mode);
esp_err_t ui_bindings_set_climate_swing_mode(const char *entity_id, const char *swing_mode);
esp_err_t ui_bindings_set_climate_preset_mode(const char *entity_id, const char *preset_mode);
esp_err_t ui_bindings_set_light_color_temp_kelvin(const char *entity_id, int kelvin);
esp_err_t ui_bindings_set_light_rgb_color(const char *entity_id, uint8_t r, uint8_t g, uint8_t b);
esp_err_t ui_bindings_set_light_effect(const char *entity_id, const char *effect);
esp_err_t ui_bindings_media_player_action(const char *entity_id, ui_bindings_media_action_t action);

/* Trigger entities: button domain = momentary press, scene/script = run. */
esp_err_t ui_bindings_press_entity(const char *entity_id);

/* Lock domain (e.g. intercom / domofon). locked=true sends lock, false sends unlock. */
esp_err_t ui_bindings_set_lock(const char *entity_id, bool locked);

/* Cover domain: command is "open", "close" or "stop". position is 0..100 percent. */
esp_err_t ui_bindings_cover_command(const char *entity_id, const char *command);
esp_err_t ui_bindings_cover_set_position(const char *entity_id, int position_pct);

/* Fan domain. */
esp_err_t ui_bindings_set_fan_power(const char *entity_id, bool on);
esp_err_t ui_bindings_set_fan_percentage(const char *entity_id, int percent);

/* Number domain: set_value with a float value. */
esp_err_t ui_bindings_number_set_value(const char *entity_id, double value);

/* Select domain: choose an option from the entity's option list. */
esp_err_t ui_bindings_select_option(const char *entity_id, const char *option);
