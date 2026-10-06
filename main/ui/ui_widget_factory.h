/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#pragma once

#include <stdbool.h>

#include "esp_err.h"
#include "lvgl.h"

#include "app_config.h"
#include "ha/ha_model.h"

typedef struct {
    char id[APP_MAX_WIDGET_ID_LEN];
    char type[16];
    char title[APP_MAX_NAME_LEN];
    char entity_id[APP_MAX_ENTITY_ID_LEN];
    char secondary_entity_id[APP_MAX_ENTITY_ID_LEN];
    char slider_direction[APP_MAX_UI_OPTION_LEN];
    char slider_accent_color[APP_MAX_COLOR_STR_LEN];
    char button_accent_color[APP_MAX_COLOR_STR_LEN];
    char button_mode[APP_MAX_UI_OPTION_LEN];
    char graph_line_color[APP_MAX_COLOR_STR_LEN];
    int graph_point_count;
    int graph_time_window_min;
    char graph_display_mode[APP_MAX_UI_OPTION_LEN];
    int graph_bar_bucket_min;
    char style_variant[APP_MAX_UI_OPTION_LEN];
    char arc_opening[APP_MAX_UI_OPTION_LEN];
    char binary_color_on[APP_MAX_COLOR_STR_LEN];
    char binary_color_off[APP_MAX_COLOR_STR_LEN];
    char binary_text_on[APP_MAX_UI_OPTION_LEN];
    char binary_text_off[APP_MAX_UI_OPTION_LEN];
    bool binary_show_title;
    char alarm_code[APP_MAX_ALARM_CODE_LEN];
    char alarm_modes[APP_MAX_ALARM_MODES_LEN];
    bool alarm_ask_code;
    char alarm_backend[APP_MAX_UI_OPTION_LEN];
    char alarm_zone_label[APP_MAX_NAME_LEN];
    bool alarm_show_sensors;
    bool alarm_show_bypassed;
    bool alarm_force_arm;
    bool alarm_skip_delay;
    bool clock_show_seconds;
    bool clock_show_date;
    char sensor_value_color[APP_MAX_COLOR_STR_LEN];
    char tile_bg_color[APP_MAX_COLOR_STR_LEN];
    char tile_bg_grad_color[APP_MAX_COLOR_STR_LEN];
    char tile_bg_grad_dir[APP_MAX_UI_OPTION_LEN];
    char tile_border_color[APP_MAX_COLOR_STR_LEN];
    char tile_text_color[APP_MAX_COLOR_STR_LEN];
    char tile_title_color[APP_MAX_COLOR_STR_LEN];
    char tile_label_color[APP_MAX_COLOR_STR_LEN];
    char tile_value_color[APP_MAX_COLOR_STR_LEN];
    char tile_icon_color[APP_MAX_COLOR_STR_LEN];
    char tile_font_scale[APP_MAX_UI_OPTION_LEN];
    int tile_border_width;
    int tile_radius;
    int tile_opacity;
    bool tile_shadow;
    int sensor_tile_title_font_px;
    int sensor_tile_row_font_px;
    int sensor_tile_ip_font_px;
    int sensor_tile_power_font_px;
    int sensor_tile_ports_font_px;
    int x;
    int y;
    int w;
    int h;
    char extra_entity_ids[APP_MAX_EXTRA_ENTITY_IDS_LEN];
} ui_widget_def_t;

typedef struct {
    char id[APP_MAX_WIDGET_ID_LEN];
    char page_id[APP_MAX_PAGE_ID_LEN];
    char type[16];
    char title[APP_MAX_NAME_LEN];
    char entity_id[APP_MAX_ENTITY_ID_LEN];
    char secondary_entity_id[APP_MAX_ENTITY_ID_LEN];
    char slider_direction[APP_MAX_UI_OPTION_LEN];
    char slider_accent_color[APP_MAX_COLOR_STR_LEN];
    char button_accent_color[APP_MAX_COLOR_STR_LEN];
    char button_mode[APP_MAX_UI_OPTION_LEN];
    char graph_line_color[APP_MAX_COLOR_STR_LEN];
    int graph_point_count;
    int graph_time_window_min;
    char graph_display_mode[APP_MAX_UI_OPTION_LEN];
    int graph_bar_bucket_min;
    char style_variant[APP_MAX_UI_OPTION_LEN];
    char arc_opening[APP_MAX_UI_OPTION_LEN];
    char binary_color_on[APP_MAX_COLOR_STR_LEN];
    char binary_color_off[APP_MAX_COLOR_STR_LEN];
    char binary_text_on[APP_MAX_UI_OPTION_LEN];
    char binary_text_off[APP_MAX_UI_OPTION_LEN];
    bool binary_show_title;
    char alarm_code[APP_MAX_ALARM_CODE_LEN];
    char alarm_modes[APP_MAX_ALARM_MODES_LEN];
    bool alarm_ask_code;
    char alarm_backend[APP_MAX_UI_OPTION_LEN];
    char alarm_zone_label[APP_MAX_NAME_LEN];
    bool alarm_show_sensors;
    bool alarm_show_bypassed;
    bool alarm_force_arm;
    bool alarm_skip_delay;
    bool clock_show_seconds;
    bool clock_show_date;
    char sensor_value_color[APP_MAX_COLOR_STR_LEN];
    char tile_bg_color[APP_MAX_COLOR_STR_LEN];
    char tile_bg_grad_color[APP_MAX_COLOR_STR_LEN];
    char tile_bg_grad_dir[APP_MAX_UI_OPTION_LEN];
    char tile_border_color[APP_MAX_COLOR_STR_LEN];
    char tile_text_color[APP_MAX_COLOR_STR_LEN];
    char tile_title_color[APP_MAX_COLOR_STR_LEN];
    char tile_label_color[APP_MAX_COLOR_STR_LEN];
    char tile_value_color[APP_MAX_COLOR_STR_LEN];
    char tile_icon_color[APP_MAX_COLOR_STR_LEN];
    char tile_font_scale[APP_MAX_UI_OPTION_LEN];
    int tile_border_width;
    int tile_radius;
    int tile_opacity;
    bool tile_shadow;
    char extra_entity_ids[APP_MAX_EXTRA_ENTITY_IDS_LEN];
    bool visible;
    /* Signature of the HA data that was last pushed into this widget, plus the
     * bookkeeping needed to skip re-applying it.  A layout page holds dozens of
     * tiles and the runtime used to re-apply every one of them whenever any
     * entity changed; LVGL invalidates on every style write regardless of the
     * value (lv_obj_set_local_style_prop -> lv_obj_refresh_style), so that
     * repainted the whole content area for nothing. */
    uint32_t applied_state_sig;
    bool applied_state_sig_valid;
    bool applied_state_missing_marked;
    void *ctx;
    lv_obj_t *obj;
} ui_widget_instance_t;

esp_err_t ui_widget_factory_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance);
void ui_widget_factory_apply_state(ui_widget_instance_t *instance, const ha_state_t *state);
void ui_widget_factory_mark_unavailable(ui_widget_instance_t *instance);
void ui_widget_factory_set_visible(ui_widget_instance_t *instance, bool visible);
/* Re-applies the per-tile visual overrides ("tile_*" layout fields) on the widget root. */
void ui_widget_factory_apply_tile_style(ui_widget_instance_t *instance);
