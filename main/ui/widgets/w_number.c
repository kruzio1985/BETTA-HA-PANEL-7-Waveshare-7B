/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "ui/ui_widget_factory.h"

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "cJSON.h"

#include "esp_log.h"

#include "ui/fonts/app_text_fonts.h"
#include "ui/theme/theme_default.h"
#include "ui/ui_bindings.h"
#include "ui/ui_i18n.h"
#include "ui/ui_memory.h"
#include "ui/widgets/w_widget_util.h"

static const char *TAG = "w_number";

typedef struct {
    char entity_id[APP_MAX_ENTITY_ID_LEN];
    lv_obj_t *card;
    lv_obj_t *title_label;
    lv_obj_t *value_label;
    lv_obj_t *hint_label;
    lv_obj_t *popup_overlay;
    lv_color_t accent_color;
    double value;
    double min;
    double max;
    double step;
    char unit[APP_MAX_UNIT_LEN];
    bool has_value;
    bool unavailable;
} w_number_ctx_t;

/* Popup state for the tap-to-set overlay. Mirrors the fullscreen overlay
 * pattern used by w_light_tile.c's color popup (lv_layer_top() + centered
 * card + a per-popup heap ctx freed on LV_EVENT_DELETE). */
typedef struct {
    w_number_ctx_t *tile;
    lv_obj_t *overlay;
    lv_obj_t *value_label;
    lv_obj_t *slider;
    double min;
    double max;
    double step;
    int step_count;
    char unit[APP_MAX_UNIT_LEN];
} w_number_popup_ctx_t;

/* Formats a value trimming insignificant trailing zeros, e.g. 21.50 -> "21.5",
 * 22.00 -> "22". Mirrors the rounding approach used by w_slider.c. */
static void number_format_value(char *buf, size_t buf_size, double value, const char *unit)
{
    if (buf == NULL || buf_size == 0) {
        return;
    }
    double abs_val = value < 0.0 ? -value : value;
    if (abs_val >= 1000.0) {
        snprintf(buf, buf_size, "%.0f", value);
    } else {
        double nearest = value * 100.0;
        long nearest_i = (nearest >= 0.0) ? (long)(nearest + 0.5) : (long)(nearest - 0.5);
        double rounded = ((double)nearest_i) / 100.0;
        double rounded10 = rounded * 10.0;
        long rounded10_i = (rounded10 >= 0.0) ? (long)(rounded10 + 0.5) : (long)(rounded10 - 0.5);
        if (rounded10_i % 10 == 0) {
            snprintf(buf, buf_size, "%.0f", rounded);
        } else {
            snprintf(buf, buf_size, "%.1f", rounded);
        }
    }
    if (unit != NULL && unit[0] != '\0') {
        size_t used = strlen(buf);
        if (used + 2 < buf_size) {
            snprintf(&buf[used], buf_size - used, " %s", unit);
        }
    }
}

static void number_apply_visual(w_number_ctx_t *ctx)
{
    if (ctx == NULL || ctx->card == NULL) {
        return;
    }

    if (ctx->unavailable) {
        lv_label_set_text(ctx->value_label, ui_i18n_get("common.unavailable", "unavailable"));
        lv_obj_set_style_text_color(ctx->value_label, theme_default_color_text_muted(), LV_PART_MAIN);
    } else {
        char text[64] = {0};
        number_format_value(text, sizeof(text), ctx->value, ctx->unit);
        lv_label_set_text(ctx->value_label, ctx->has_value ? text : "--");
        lv_obj_set_style_text_color(ctx->value_label, theme_default_color_text_primary(), LV_PART_MAIN);
    }
    lv_label_set_text(ctx->hint_label, ui_i18n_get("widget.number.tap_hint", "Tap to set"));
}

/* --- Set-value popup --------------------------------------------------- */

static int number_popup_value_to_index(const w_number_popup_ctx_t *popup, double value)
{
    if (popup == NULL || popup->step <= 0.0) {
        return 0;
    }
    double idx = (value - popup->min) / popup->step;
    long idx_rounded = (idx >= 0.0) ? (long)(idx + 0.5) : (long)(idx - 0.5);
    if (idx_rounded < 0) {
        idx_rounded = 0;
    }
    if (idx_rounded > popup->step_count) {
        idx_rounded = popup->step_count;
    }
    return (int)idx_rounded;
}

static double number_popup_index_to_value(const w_number_popup_ctx_t *popup, int index)
{
    if (popup == NULL) {
        return 0.0;
    }
    double value = popup->min + ((double)index * popup->step);
    if (value < popup->min) {
        value = popup->min;
    }
    if (value > popup->max) {
        value = popup->max;
    }
    return value;
}

static void number_popup_update_label(w_number_popup_ctx_t *popup, double value)
{
    if (popup == NULL || popup->value_label == NULL) {
        return;
    }
    char text[64] = {0};
    number_format_value(text, sizeof(text), value, popup->unit);
    lv_label_set_text(popup->value_label, text);
}

static void number_popup_delete_event_cb(lv_event_t *event)
{
    if (lv_event_get_code(event) != LV_EVENT_DELETE) {
        return;
    }
    w_number_popup_ctx_t *popup = (w_number_popup_ctx_t *)lv_event_get_user_data(event);
    if (popup == NULL) {
        return;
    }
    if (popup->tile != NULL && popup->tile->popup_overlay == popup->overlay) {
        popup->tile->popup_overlay = NULL;
    }
    free(popup);
}

static void number_popup_close_event_cb(lv_event_t *event)
{
    if (lv_event_get_code(event) != LV_EVENT_CLICKED) {
        return;
    }
    w_number_popup_ctx_t *popup = (w_number_popup_ctx_t *)lv_event_get_user_data(event);
    if (popup != NULL && popup->overlay != NULL) {
        lv_obj_del(popup->overlay);
    }
}

static void number_popup_slider_event_cb(lv_event_t *event)
{
    lv_event_code_t code = lv_event_get_code(event);
    if (code != LV_EVENT_VALUE_CHANGED && code != LV_EVENT_RELEASED) {
        return;
    }
    w_number_popup_ctx_t *popup = (w_number_popup_ctx_t *)lv_event_get_user_data(event);
    lv_obj_t *slider = lv_event_get_target(event);
    if (popup == NULL || slider == NULL) {
        return;
    }
    int index = (int)lv_slider_get_value(slider);
    double value = number_popup_index_to_value(popup, index);
    number_popup_update_label(popup, value);

    if (code == LV_EVENT_RELEASED && popup->tile != NULL && popup->tile->entity_id[0] != '\0') {
        double prev_value = popup->tile->value;
        bool prev_has_value = popup->tile->has_value;
        esp_err_t set_rc = ui_bindings_number_set_value(popup->tile->entity_id, value);
        ESP_LOGI(TAG, "set %s idx=%d val=%.6g rc=%s", popup->tile->entity_id, index, value,
                 esp_err_to_name(set_rc));
        if (set_rc == ESP_OK) {
            popup->tile->value = value;
            popup->tile->has_value = true;
            popup->tile->unavailable = false;
            number_apply_visual(popup->tile);
        } else {
            popup->tile->value = prev_value;
            popup->tile->has_value = prev_has_value;
            /* Reflect the last confirmed value back into the slider/label. */
            int reset_index = number_popup_value_to_index(popup, prev_value);
            lv_slider_set_value(slider, reset_index, LV_ANIM_OFF);
            number_popup_update_label(popup, prev_value);
        }
    }
}

static void number_open_popup(w_number_ctx_t *ctx)
{
    if (ctx == NULL || ctx->unavailable || ctx->entity_id[0] == '\0' || ctx->popup_overlay != NULL) {
        return;
    }

    w_number_popup_ctx_t *popup = ui_calloc_prefer_psram(1, sizeof(*popup));
    if (popup == NULL) {
        return;
    }
    popup->tile = ctx;
    popup->min = ctx->min;
    popup->max = ctx->max;
    popup->step = (ctx->step > 0.0) ? ctx->step : 1.0;
    double span = popup->max - popup->min;
    int step_count = (span > 0.0) ? (int)((span / popup->step) + 0.5) : 1;
    if (step_count < 1) {
        step_count = 1;
    }
    if (step_count > 10000) {
        step_count = 10000;
    }
    popup->step_count = step_count;
    snprintf(popup->unit, sizeof(popup->unit), "%s", ctx->unit);
    ESP_LOGI(TAG, "open popup %s min=%.4g max=%.4g step=%.4g count=%d unit=%s cur=%.4g",
             ctx->entity_id, popup->min, popup->max, popup->step, step_count,
             (popup->unit[0] != '\0') ? popup->unit : "-", ctx->value);

    lv_obj_t *screen = lv_scr_act();
    lv_obj_update_layout(screen);
    int screen_w = lv_obj_get_width(screen);
    int screen_h = lv_obj_get_height(screen);
    if (screen_w <= 0) {
        screen_w = 720;
    }
    if (screen_h <= 0) {
        screen_h = 720;
    }

    popup->overlay = lv_obj_create(lv_layer_top());
    ctx->popup_overlay = popup->overlay;
    lv_obj_set_size(popup->overlay, screen_w, screen_h);
    lv_obj_align(popup->overlay, LV_ALIGN_CENTER, 0, 0);
    lv_obj_clear_flag(popup->overlay, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_set_style_bg_color(popup->overlay, lv_color_hex(0x000000), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(popup->overlay, LV_OPA_60, LV_PART_MAIN);
    lv_obj_set_style_border_width(popup->overlay, 0, LV_PART_MAIN);
    lv_obj_set_style_pad_all(popup->overlay, 0, LV_PART_MAIN);
    lv_obj_add_event_cb(popup->overlay, number_popup_delete_event_cb, LV_EVENT_DELETE, popup);

    int card_w = screen_w - 48;
    if (card_w > 420) {
        card_w = 420;
    }
    if (card_w < 260) {
        card_w = 260;
    }
    if (card_w > screen_w - 16) {
        card_w = screen_w - 16;
    }
    int card_h = 220;
    if (card_h > screen_h - 16) {
        card_h = screen_h - 16;
    }

    lv_obj_t *card = lv_obj_create(popup->overlay);
    lv_obj_set_size(card, card_w, card_h);
    lv_obj_center(card);
    lv_obj_clear_flag(card, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_clear_flag(card, LV_OBJ_FLAG_EVENT_BUBBLE);
    lv_obj_set_style_radius(card, 12, LV_PART_MAIN);
    lv_obj_set_style_bg_color(card, lv_color_hex(APP_UI_COLOR_CONTENT_BG), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(card, LV_OPA_COVER, LV_PART_MAIN);
    lv_obj_set_style_border_width(card, 1, LV_PART_MAIN);
    lv_obj_set_style_border_color(card, lv_color_hex(APP_UI_COLOR_CONTENT_BORDER), LV_PART_MAIN);
    lv_obj_set_style_pad_all(card, 18, LV_PART_MAIN);

    lv_obj_t *title = lv_label_create(card);
    lv_label_set_text(title, ctx->title_label != NULL ? lv_label_get_text(ctx->title_label) : ctx->entity_id);
    lv_obj_set_width(title, card_w - 60);
    lv_label_set_long_mode(title, LV_LABEL_LONG_DOT);
    lv_obj_set_style_text_font(title, APP_FONT_TEXT_20, LV_PART_MAIN);
    lv_obj_set_style_text_color(title, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY), LV_PART_MAIN);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 0, 0);

    lv_obj_t *close = lv_btn_create(card);
    lv_obj_set_size(close, 38, 38);
    lv_obj_set_style_radius(close, LV_RADIUS_CIRCLE, LV_PART_MAIN);
    lv_obj_set_style_bg_color(close, lv_color_hex(APP_UI_COLOR_NAV_BTN_BG_IDLE), LV_PART_MAIN);
    lv_obj_set_style_border_width(close, 0, LV_PART_MAIN);
    lv_obj_align(close, LV_ALIGN_TOP_RIGHT, 0, -3);
    lv_obj_add_event_cb(close, number_popup_close_event_cb, LV_EVENT_CLICKED, popup);
    lv_obj_t *close_label = lv_label_create(close);
    lv_label_set_text(close_label, "X");
    lv_obj_set_style_text_color(close_label, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY), LV_PART_MAIN);
    lv_obj_center(close_label);

    lv_obj_t *value_label = lv_label_create(card);
    lv_obj_set_width(value_label, card_w - 36);
    lv_obj_set_style_text_font(value_label, APP_FONT_TEXT_34, LV_PART_MAIN);
    lv_obj_set_style_text_align(value_label, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN);
    lv_obj_set_style_text_color(value_label, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY), LV_PART_MAIN);
    lv_obj_align(value_label, LV_ALIGN_TOP_MID, 0, 56);
    popup->value_label = value_label;

    lv_obj_t *slider = lv_slider_create(card);
    lv_obj_set_width(slider, card_w - 40);
    lv_obj_set_height(slider, 18);
    lv_obj_align(slider, LV_ALIGN_BOTTOM_MID, 0, -10);
    lv_slider_set_range(slider, 0, popup->step_count);
    lv_obj_set_style_bg_color(slider, lv_color_hex(APP_UI_COLOR_CARD_BORDER), LV_PART_MAIN);
    lv_obj_set_style_bg_color(slider, ctx->accent_color, LV_PART_INDICATOR);
    lv_obj_set_style_bg_color(slider, ctx->accent_color, LV_PART_KNOB);
    popup->slider = slider;

    double initial_value = ctx->has_value ? ctx->value : popup->min;
    int initial_index = number_popup_value_to_index(popup, initial_value);
    lv_slider_set_value(slider, initial_index, LV_ANIM_OFF);
    number_popup_update_label(popup, number_popup_index_to_value(popup, initial_index));

    lv_obj_add_event_cb(slider, number_popup_slider_event_cb, LV_EVENT_VALUE_CHANGED, popup);
    lv_obj_add_event_cb(slider, number_popup_slider_event_cb, LV_EVENT_RELEASED, popup);
}

static void w_number_event_cb(lv_event_t *event)
{
    if (event == NULL) {
        return;
    }
    w_number_ctx_t *ctx = (w_number_ctx_t *)lv_event_get_user_data(event);
    if (ctx == NULL) {
        return;
    }
    lv_event_code_t code = lv_event_get_code(event);
    if (code == LV_EVENT_DELETE) {
        free(ctx);
    } else if (code == LV_EVENT_CLICKED) {
        number_open_popup(ctx);
    }
}

esp_err_t w_number_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance)
{
    if (def == NULL || parent == NULL || out_instance == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    lv_obj_t *card = lv_obj_create(parent);
    lv_obj_set_pos(card, def->x, def->y);
    lv_obj_set_size(card, def->w, def->h);
    lv_obj_clear_flag(card, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_set_style_radius(card, APP_UI_CARD_RADIUS, LV_PART_MAIN);
#if APP_UI_REWORK_V2
    lv_obj_set_style_border_width(card, 1, LV_PART_MAIN);
    lv_obj_set_style_border_color(card, lv_color_hex(APP_UI_COLOR_CARD_BORDER), LV_PART_MAIN);
    lv_obj_set_style_border_opa(card, LV_OPA_70, LV_PART_MAIN);
#else
    lv_obj_set_style_border_width(card, 0, LV_PART_MAIN);
#endif
    lv_obj_set_style_pad_all(card, 14, LV_PART_MAIN);

    lv_obj_t *title = lv_label_create(card);
    lv_label_set_text(title, def->title[0] ? def->title : def->id);
    lv_obj_set_width(title, def->w - 28);
    lv_label_set_long_mode(title, LV_LABEL_LONG_DOT);
    lv_obj_set_style_text_font(title, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_set_style_text_color(title, theme_default_color_text_muted(), LV_PART_MAIN);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 0, 0);

    lv_obj_t *value = lv_label_create(card);
    lv_label_set_text(value, "--");
    lv_obj_set_width(value, def->w - 28);
    lv_label_set_long_mode(value, LV_LABEL_LONG_DOT);
    lv_obj_set_style_text_font(value, APP_FONT_TEXT_28, LV_PART_MAIN);
    lv_obj_set_style_text_align(value, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN);
    lv_obj_align(value, LV_ALIGN_CENTER, 0, -6);

    lv_obj_t *hint = lv_label_create(card);
    lv_label_set_text(hint, ui_i18n_get("widget.number.tap_hint", "Tap to set"));
    lv_obj_set_style_text_font(hint, APP_FONT_TEXT_16, LV_PART_MAIN);
    lv_obj_set_style_text_color(hint, theme_default_color_text_muted(), LV_PART_MAIN);
    lv_obj_set_style_text_align(hint, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN);
    lv_obj_align(hint, LV_ALIGN_BOTTOM_MID, 0, -2);

    w_number_ctx_t *ctx = ui_calloc_prefer_psram(1, sizeof(w_number_ctx_t));
    if (ctx == NULL) {
        lv_obj_del(card);
        return ESP_ERR_NO_MEM;
    }
    snprintf(ctx->entity_id, sizeof(ctx->entity_id), "%s", def->entity_id);
    ctx->card = card;
    ctx->title_label = title;
    ctx->value_label = value;
    ctx->hint_label = hint;
    ctx->popup_overlay = NULL;
    ctx->accent_color = lv_color_hex(APP_UI_COLOR_NAV_TAB_ACTIVE);
    ctx->value = 0.0;
    ctx->min = 0.0;
    ctx->max = 100.0;
    ctx->step = 1.0;
    ctx->unit[0] = '\0';
    ctx->has_value = false;
    ctx->unavailable = false;

    lv_color_t parsed_color;
    if (w_parse_hex_color(def->button_accent_color, &parsed_color)) {
        ctx->accent_color = parsed_color;
    }

    lv_obj_add_event_cb(card, w_number_event_cb, LV_EVENT_CLICKED, ctx);
    lv_obj_add_event_cb(card, w_number_event_cb, LV_EVENT_DELETE, ctx);

    number_apply_visual(ctx);

    out_instance->obj = card;
    out_instance->ctx = ctx;
    return ESP_OK;
}

void w_number_apply_state(ui_widget_instance_t *instance, const ha_state_t *state)
{
    if (instance == NULL || instance->obj == NULL || state == NULL) {
        return;
    }
    w_number_ctx_t *ctx = (w_number_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }

    if (w_state_is_unavailable(state->state)) {
        ctx->unavailable = true;
        ctx->has_value = false;
        number_apply_visual(ctx);
        return;
    }

    double min = 0.0;
    double max = 100.0;
    double step = 1.0;
    char unit[APP_MAX_UNIT_LEN] = {0};

    cJSON *attrs = cJSON_Parse(state->attributes_json);
    if (attrs != NULL) {
        cJSON *min_a = cJSON_GetObjectItemCaseSensitive(attrs, "min");
        cJSON *max_a = cJSON_GetObjectItemCaseSensitive(attrs, "max");
        cJSON *step_a = cJSON_GetObjectItemCaseSensitive(attrs, "step");
        cJSON *unit_a = cJSON_GetObjectItemCaseSensitive(attrs, "unit_of_measurement");
        if (cJSON_IsNumber(min_a)) {
            min = min_a->valuedouble;
        }
        if (cJSON_IsNumber(max_a)) {
            max = max_a->valuedouble;
        }
        if (cJSON_IsNumber(step_a) && step_a->valuedouble > 0.0) {
            step = step_a->valuedouble;
        }
        if (cJSON_IsString(unit_a) && unit_a->valuestring != NULL) {
            snprintf(unit, sizeof(unit), "%s", unit_a->valuestring);
        }
        cJSON_Delete(attrs);
    }
    if (max <= min) {
        max = min + 100.0;
    }

    char *end = NULL;
    double value = strtod(state->state, &end);
    bool has_value = (end != state->state);

    ctx->unavailable = false;
    ctx->min = min;
    ctx->max = max;
    ctx->step = step;
    snprintf(ctx->unit, sizeof(ctx->unit), "%s", unit);
    ctx->has_value = has_value;
    if (has_value) {
        if (value < min) {
            value = min;
        }
        if (value > max) {
            value = max;
        }
        ctx->value = value;
    }

    number_apply_visual(ctx);
}

void w_number_mark_unavailable(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }
    w_number_ctx_t *ctx = (w_number_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }
    ctx->unavailable = true;
    ctx->has_value = false;
    number_apply_visual(ctx);
}
