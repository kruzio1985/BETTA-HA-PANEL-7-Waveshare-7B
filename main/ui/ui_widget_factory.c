/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "ui/ui_widget_factory.h"

#include <stdio.h>
#include <string.h>

#include "ui/ui_press_feedback.h"
#include "ui/ui_tile_style.h"

esp_err_t w_sensor_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_sensor_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_sensor_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_button_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_button_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_button_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_slider_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_slider_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_slider_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_graph_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_graph_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_graph_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_empty_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_empty_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_empty_tile_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_light_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_light_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_light_tile_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_heating_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_heating_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_heating_tile_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_weather_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_weather_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_weather_tile_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_todo_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_todo_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_todo_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_media_player_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_media_player_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_media_player_mark_unavailable(ui_widget_instance_t *instance);
void w_media_player_set_visible(ui_widget_instance_t *instance, bool visible);

esp_err_t w_roborock_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_roborock_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_roborock_mark_unavailable(ui_widget_instance_t *instance);
void w_roborock_set_visible(ui_widget_instance_t *instance, bool visible);

esp_err_t w_binary_sensor_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_binary_sensor_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_binary_sensor_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_presence_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_presence_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_presence_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_cover_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_cover_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_cover_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_lock_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_lock_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_lock_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_fan_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_fan_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_fan_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_select_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_select_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_select_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_number_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_number_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_number_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_binary_sensor_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_binary_sensor_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_binary_sensor_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_alarm_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_alarm_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_alarm_tile_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_clock_alarm_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_clock_alarm_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_clock_alarm_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_cover_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_cover_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_cover_tile_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_scene_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_scene_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_scene_tile_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_person_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_person_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_person_tile_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_timer_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_timer_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_timer_tile_mark_unavailable(ui_widget_instance_t *instance);

esp_err_t w_sensor_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void w_sensor_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void w_sensor_tile_mark_unavailable(ui_widget_instance_t *instance);

static void widget_tile_style_from_instance(const ui_widget_instance_t *instance, ui_tile_style_t *out)
{
    out->bg_color = instance->tile_bg_color;
    out->bg_grad_color = instance->tile_bg_grad_color;
    out->bg_grad_dir = instance->tile_bg_grad_dir;
    out->border_color = instance->tile_border_color;
    out->text_color = instance->tile_text_color;
    out->title_color = instance->tile_title_color;
    out->label_color = instance->tile_label_color;
    out->value_color = instance->tile_value_color;
    out->icon_color = instance->tile_icon_color;
    out->font_scale = instance->tile_font_scale;
    out->border_width = instance->tile_border_width;
    out->radius = instance->tile_radius;
    out->opacity = instance->tile_opacity;
    out->shadow = instance->tile_shadow;
}

/* Widgets that colour their main icon from the entity state (on/off, presence,
 * availability). For those the icon override is only applied at creation and on
 * theme reload, so the state colour always wins. */
static bool widget_icon_colour_follows_state(const ui_widget_instance_t *instance)
{
    static const char *const state_icon_types[] = {
        "light_tile",
        "button",
        "heating_tile",
        "cover_tile",
        "scene_tile",
        "person_tile",
    };

    if (instance == NULL) {
        return false;
    }
    for (size_t i = 0; i < sizeof(state_icon_types) / sizeof(state_icon_types[0]); i++) {
        if (strcmp(instance->type, state_icon_types[i]) == 0) {
            return true;
        }
    }
    return false;
}

/* Widgets repaint their labels with theme colours while applying a state, so the
 * per-role overrides have to be re-applied afterwards. Both calls are cheap and
 * idempotent (no font rescaling, which would compound). */
static void widget_refresh_tile_after_state(ui_widget_instance_t *instance)
{
    ui_tile_style_t style;
    widget_tile_style_from_instance(instance, &style);
    ui_tile_style_apply_bg(instance->obj, &style);
    if (widget_icon_colour_follows_state(instance)) {
        ui_tile_style_apply_state_text_colors(instance->obj, &style);
    } else {
        ui_tile_style_apply_text_colors(instance->obj, &style);
    }
}

void ui_widget_factory_apply_tile_style(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }
    ui_tile_style_t style;
    widget_tile_style_from_instance(instance, &style);
    ui_tile_style_apply(instance->obj, &style);
    /* The tile style rewrites the opacity, so the pressed state has to be
     * recomputed from the level that just landed on the tile. */
    ui_press_feedback_attach(instance->obj, instance->type);
}

esp_err_t ui_widget_factory_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance)
{
    if (def == NULL || parent == NULL || out_instance == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    esp_err_t err;
    memset(out_instance, 0, sizeof(*out_instance));
    snprintf(out_instance->id, sizeof(out_instance->id), "%s", def->id);
    snprintf(out_instance->type, sizeof(out_instance->type), "%s", def->type);
    snprintf(out_instance->title, sizeof(out_instance->title), "%s", def->title);
    snprintf(out_instance->entity_id, sizeof(out_instance->entity_id), "%s", def->entity_id);
    snprintf(out_instance->secondary_entity_id, sizeof(out_instance->secondary_entity_id), "%s", def->secondary_entity_id);
    snprintf(out_instance->slider_direction, sizeof(out_instance->slider_direction), "%s", def->slider_direction);
    snprintf(out_instance->slider_accent_color, sizeof(out_instance->slider_accent_color), "%s", def->slider_accent_color);
    snprintf(out_instance->button_accent_color, sizeof(out_instance->button_accent_color), "%s", def->button_accent_color);
    snprintf(out_instance->button_mode, sizeof(out_instance->button_mode), "%s", def->button_mode);
    snprintf(out_instance->graph_line_color, sizeof(out_instance->graph_line_color), "%s", def->graph_line_color);
    out_instance->graph_point_count = def->graph_point_count;
    out_instance->graph_time_window_min = def->graph_time_window_min;
    snprintf(out_instance->graph_display_mode, sizeof(out_instance->graph_display_mode), "%s", def->graph_display_mode);
    out_instance->graph_bar_bucket_min = def->graph_bar_bucket_min;
    snprintf(out_instance->style_variant, sizeof(out_instance->style_variant), "%s", def->style_variant);
    snprintf(out_instance->arc_opening, sizeof(out_instance->arc_opening), "%s", def->arc_opening);
    snprintf(out_instance->binary_color_on, sizeof(out_instance->binary_color_on), "%s", def->binary_color_on);
    snprintf(out_instance->binary_color_off, sizeof(out_instance->binary_color_off), "%s", def->binary_color_off);
    snprintf(out_instance->binary_text_on, sizeof(out_instance->binary_text_on), "%s", def->binary_text_on);
    snprintf(out_instance->binary_text_off, sizeof(out_instance->binary_text_off), "%s", def->binary_text_off);
    out_instance->binary_show_title = def->binary_show_title;
    snprintf(out_instance->binary_color_on, sizeof(out_instance->binary_color_on), "%s", def->binary_color_on);
    snprintf(out_instance->binary_color_off, sizeof(out_instance->binary_color_off), "%s", def->binary_color_off);
    snprintf(out_instance->binary_text_on, sizeof(out_instance->binary_text_on), "%s", def->binary_text_on);
    snprintf(out_instance->binary_text_off, sizeof(out_instance->binary_text_off), "%s", def->binary_text_off);
    out_instance->binary_show_title = def->binary_show_title;
    snprintf(out_instance->alarm_code, sizeof(out_instance->alarm_code), "%s", def->alarm_code);
    snprintf(out_instance->alarm_modes, sizeof(out_instance->alarm_modes), "%s", def->alarm_modes);
    out_instance->alarm_ask_code = def->alarm_ask_code;
    snprintf(out_instance->alarm_backend, sizeof(out_instance->alarm_backend), "%s", def->alarm_backend);
    snprintf(out_instance->alarm_zone_label, sizeof(out_instance->alarm_zone_label), "%s", def->alarm_zone_label);
    out_instance->alarm_show_sensors = def->alarm_show_sensors;
    out_instance->alarm_show_bypassed = def->alarm_show_bypassed;
    out_instance->alarm_force_arm = def->alarm_force_arm;
    out_instance->alarm_skip_delay = def->alarm_skip_delay;
    out_instance->clock_show_seconds = def->clock_show_seconds;
    out_instance->clock_show_date = def->clock_show_date;
    snprintf(out_instance->sensor_value_color, sizeof(out_instance->sensor_value_color), "%s", def->sensor_value_color);
    snprintf(out_instance->tile_bg_color, sizeof(out_instance->tile_bg_color), "%s", def->tile_bg_color);
    snprintf(out_instance->tile_bg_grad_color, sizeof(out_instance->tile_bg_grad_color), "%s", def->tile_bg_grad_color);
    snprintf(out_instance->tile_bg_grad_dir, sizeof(out_instance->tile_bg_grad_dir), "%s", def->tile_bg_grad_dir);
    snprintf(out_instance->tile_border_color, sizeof(out_instance->tile_border_color), "%s", def->tile_border_color);
    snprintf(out_instance->tile_text_color, sizeof(out_instance->tile_text_color), "%s", def->tile_text_color);
    snprintf(out_instance->tile_title_color, sizeof(out_instance->tile_title_color), "%s", def->tile_title_color);
    snprintf(out_instance->tile_label_color, sizeof(out_instance->tile_label_color), "%s", def->tile_label_color);
    snprintf(out_instance->tile_value_color, sizeof(out_instance->tile_value_color), "%s", def->tile_value_color);
    snprintf(out_instance->tile_icon_color, sizeof(out_instance->tile_icon_color), "%s", def->tile_icon_color);
    snprintf(out_instance->tile_font_scale, sizeof(out_instance->tile_font_scale), "%s", def->tile_font_scale);
    out_instance->tile_border_width = def->tile_border_width;
    out_instance->tile_radius = def->tile_radius;
    out_instance->tile_opacity = def->tile_opacity;
    out_instance->tile_shadow = def->tile_shadow;
    snprintf(out_instance->extra_entity_ids, sizeof(out_instance->extra_entity_ids), "%s", def->extra_entity_ids);
    out_instance->ctx = NULL;

    if (strcmp(def->type, "sensor") == 0) {
        err = w_sensor_create(def, parent, out_instance);
    } else if (strcmp(def->type, "button") == 0) {
        err = w_button_create(def, parent, out_instance);
    } else if (strcmp(def->type, "slider") == 0) {
        err = w_slider_create(def, parent, out_instance);
    } else if (strcmp(def->type, "graph") == 0) {
        err = w_graph_create(def, parent, out_instance);
    } else if (strcmp(def->type, "empty_tile") == 0) {
        err = w_empty_tile_create(def, parent, out_instance);
    } else if (strcmp(def->type, "light_tile") == 0) {
        err = w_light_tile_create(def, parent, out_instance);
    } else if (strcmp(def->type, "heating_tile") == 0) {
        err = w_heating_tile_create(def, parent, out_instance);
    } else if (strcmp(def->type, "weather_tile") == 0 || strcmp(def->type, "weather_3day") == 0) {
        err = w_weather_tile_create(def, parent, out_instance);
    } else if (strcmp(def->type, "todo_list") == 0) {
        err = w_todo_create(def, parent, out_instance);
    } else if (strcmp(def->type, "media_player") == 0) {
        err = w_media_player_create(def, parent, out_instance);
    } else if (strcmp(def->type, "roborock_tile") == 0) {
        err = w_roborock_create(def, parent, out_instance);
    } else if (strcmp(def->type, "binary_sensor") == 0) {
        err = w_binary_sensor_create(def, parent, out_instance);
    } else if (strcmp(def->type, "alarm_tile") == 0) {
        err = w_alarm_tile_create(def, parent, out_instance);
    } else if (strcmp(def->type, "clock_alarm") == 0) {
        err = w_clock_alarm_create(def, parent, out_instance);
    } else if (strcmp(def->type, "cover_tile") == 0) {
        err = w_cover_tile_create(def, parent, out_instance);
    } else if (strcmp(def->type, "scene_tile") == 0) {
        err = w_scene_tile_create(def, parent, out_instance);
    } else if (strcmp(def->type, "person_tile") == 0) {
        err = w_person_tile_create(def, parent, out_instance);
    } else if (strcmp(def->type, "timer_tile") == 0) {
        err = w_timer_tile_create(def, parent, out_instance);
    } else if (strcmp(def->type, "sensor_tile") == 0) {
        err = w_sensor_tile_create(def, parent, out_instance);
    } else {
        return ESP_ERR_NOT_SUPPORTED;
    }

    if (err == ESP_OK && out_instance->obj != NULL) {
        ui_widget_factory_apply_tile_style(out_instance);
    }
    if (strcmp(def->type, "binary_sensor") == 0) {
        return w_binary_sensor_create(def, parent, out_instance);
    }
    if (strcmp(def->type, "presence") == 0) {
        return w_presence_create(def, parent, out_instance);
    }
    if (strcmp(def->type, "cover") == 0) {
        return w_cover_create(def, parent, out_instance);
    }
    if (strcmp(def->type, "lock") == 0) {
        return w_lock_create(def, parent, out_instance);
    }
    if (strcmp(def->type, "fan") == 0) {
        return w_fan_create(def, parent, out_instance);
    }
    if (strcmp(def->type, "select") == 0) {
        return w_select_create(def, parent, out_instance);
    }
    if (strcmp(def->type, "number") == 0) {
        return w_number_create(def, parent, out_instance);
    }
    return err;
}

void ui_widget_factory_apply_state(ui_widget_instance_t *instance, const ha_state_t *state)
{
    if (instance == NULL || instance->obj == NULL || state == NULL) {
        return;
    }
    if (strcmp(instance->type, "sensor") == 0) {
        w_sensor_apply_state(instance, state);
    } else if (strcmp(instance->type, "button") == 0) {
        w_button_apply_state(instance, state);
    } else if (strcmp(instance->type, "slider") == 0) {
        w_slider_apply_state(instance, state);
    } else if (strcmp(instance->type, "graph") == 0) {
        w_graph_apply_state(instance, state);
    } else if (strcmp(instance->type, "empty_tile") == 0) {
        w_empty_tile_apply_state(instance, state);
    } else if (strcmp(instance->type, "light_tile") == 0) {
        w_light_tile_apply_state(instance, state);
    } else if (strcmp(instance->type, "heating_tile") == 0) {
        w_heating_tile_apply_state(instance, state);
    } else if (strcmp(instance->type, "weather_tile") == 0 || strcmp(instance->type, "weather_3day") == 0) {
        w_weather_tile_apply_state(instance, state);
    } else if (strcmp(instance->type, "todo_list") == 0) {
        w_todo_apply_state(instance, state);
    } else if (strcmp(instance->type, "media_player") == 0) {
        w_media_player_apply_state(instance, state);
    } else if (strcmp(instance->type, "roborock_tile") == 0) {
        w_roborock_apply_state(instance, state);
    } else if (strcmp(instance->type, "binary_sensor") == 0) {
        w_binary_sensor_apply_state(instance, state);
    } else if (strcmp(instance->type, "presence") == 0) {
        w_presence_apply_state(instance, state);
    } else if (strcmp(instance->type, "cover") == 0) {
        w_cover_apply_state(instance, state);
    } else if (strcmp(instance->type, "lock") == 0) {
        w_lock_apply_state(instance, state);
    } else if (strcmp(instance->type, "fan") == 0) {
        w_fan_apply_state(instance, state);
    } else if (strcmp(instance->type, "select") == 0) {
        w_select_apply_state(instance, state);
    } else if (strcmp(instance->type, "number") == 0) {
        w_number_apply_state(instance, state);
    } else if (strcmp(instance->type, "binary_sensor") == 0) {
        w_binary_sensor_apply_state(instance, state);
    } else if (strcmp(instance->type, "alarm_tile") == 0) {
        w_alarm_tile_apply_state(instance, state);
    } else if (strcmp(instance->type, "clock_alarm") == 0) {
        w_clock_alarm_apply_state(instance, state);
    } else if (strcmp(instance->type, "cover_tile") == 0) {
        w_cover_tile_apply_state(instance, state);
    } else if (strcmp(instance->type, "scene_tile") == 0) {
        w_scene_tile_apply_state(instance, state);
    } else if (strcmp(instance->type, "person_tile") == 0) {
        w_person_tile_apply_state(instance, state);
    } else if (strcmp(instance->type, "timer_tile") == 0) {
        w_timer_tile_apply_state(instance, state);
    } else if (strcmp(instance->type, "sensor_tile") == 0) {
        w_sensor_tile_apply_state(instance, state);
    }
    widget_refresh_tile_after_state(instance);
}

void ui_widget_factory_mark_unavailable(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }
    if (strcmp(instance->type, "sensor") == 0) {
        w_sensor_mark_unavailable(instance);
    } else if (strcmp(instance->type, "button") == 0) {
        w_button_mark_unavailable(instance);
    } else if (strcmp(instance->type, "slider") == 0) {
        w_slider_mark_unavailable(instance);
    } else if (strcmp(instance->type, "graph") == 0) {
        w_graph_mark_unavailable(instance);
    } else if (strcmp(instance->type, "empty_tile") == 0) {
        w_empty_tile_mark_unavailable(instance);
    } else if (strcmp(instance->type, "light_tile") == 0) {
        w_light_tile_mark_unavailable(instance);
    } else if (strcmp(instance->type, "heating_tile") == 0) {
        w_heating_tile_mark_unavailable(instance);
    } else if (strcmp(instance->type, "weather_tile") == 0 || strcmp(instance->type, "weather_3day") == 0) {
        w_weather_tile_mark_unavailable(instance);
    } else if (strcmp(instance->type, "todo_list") == 0) {
        w_todo_mark_unavailable(instance);
    } else if (strcmp(instance->type, "media_player") == 0) {
        w_media_player_mark_unavailable(instance);
    } else if (strcmp(instance->type, "roborock_tile") == 0) {
        w_roborock_mark_unavailable(instance);
    } else if (strcmp(instance->type, "binary_sensor") == 0) {
        w_binary_sensor_mark_unavailable(instance);
    } else if (strcmp(instance->type, "presence") == 0) {
        w_presence_mark_unavailable(instance);
    } else if (strcmp(instance->type, "cover") == 0) {
        w_cover_mark_unavailable(instance);
    } else if (strcmp(instance->type, "lock") == 0) {
        w_lock_mark_unavailable(instance);
    } else if (strcmp(instance->type, "fan") == 0) {
        w_fan_mark_unavailable(instance);
    } else if (strcmp(instance->type, "select") == 0) {
        w_select_mark_unavailable(instance);
    } else if (strcmp(instance->type, "number") == 0) {
        w_number_mark_unavailable(instance);
    } else if (strcmp(instance->type, "binary_sensor") == 0) {
        w_binary_sensor_mark_unavailable(instance);
    } else if (strcmp(instance->type, "alarm_tile") == 0) {
        w_alarm_tile_mark_unavailable(instance);
    } else if (strcmp(instance->type, "clock_alarm") == 0) {
        w_clock_alarm_mark_unavailable(instance);
    } else if (strcmp(instance->type, "cover_tile") == 0) {
        w_cover_tile_mark_unavailable(instance);
    } else if (strcmp(instance->type, "scene_tile") == 0) {
        w_scene_tile_mark_unavailable(instance);
    } else if (strcmp(instance->type, "person_tile") == 0) {
        w_person_tile_mark_unavailable(instance);
    } else if (strcmp(instance->type, "timer_tile") == 0) {
        w_timer_tile_mark_unavailable(instance);
    } else if (strcmp(instance->type, "sensor_tile") == 0) {
        w_sensor_tile_mark_unavailable(instance);
    }
    widget_refresh_tile_after_state(instance);
}

void ui_widget_factory_set_visible(ui_widget_instance_t *instance, bool visible)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }
    if (instance->visible == visible) {
        return;
    }
    instance->visible = visible;

    if (strcmp(instance->type, "media_player") == 0) {
        w_media_player_set_visible(instance, visible);
    } else if (strcmp(instance->type, "roborock_tile") == 0) {
        w_roborock_set_visible(instance, visible);
    }
}
