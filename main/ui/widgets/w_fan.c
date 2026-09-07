/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "ui/ui_widget_factory.h"

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "cJSON.h"

#include "ui/fonts/app_text_fonts.h"
#include "ui/theme/theme_default.h"
#include "ui/ui_bindings.h"
#include "ui/ui_i18n.h"
#include "ui/ui_memory.h"
#include "ui/widgets/w_widget_util.h"

typedef struct {
    char entity_id[APP_MAX_ENTITY_ID_LEN];
    lv_obj_t *card;
    lv_obj_t *title_label;
    lv_obj_t *state_label;
    lv_obj_t *value_label;
    lv_obj_t *btn_minus;
    lv_obj_t *btn_toggle;
    lv_obj_t *btn_plus;
    lv_obj_t *btn_toggle_label;
    lv_color_t accent_color;
    bool power_on;
    bool unavailable;
    int percentage;
} w_fan_ctx_t;

static bool fan_state_is_on(const char *state_text)
{
    if (state_text == NULL) {
        return false;
    }
    return strcmp(state_text, "on") == 0;
}

static void fan_step(w_fan_ctx_t *ctx, int delta)
{
    if (ctx == NULL || ctx->unavailable || ctx->entity_id[0] == '\0') {
        return;
    }
    int target = ctx->percentage;
    if (target < 0) {
        target = 100;
    }
    target += delta;
    if (target < 0) {
        target = 0;
    }
    if (target > 100) {
        target = 100;
    }
    if (ui_bindings_set_fan_percentage(ctx->entity_id, target) == ESP_OK) {
        ctx->percentage = target;
        ctx->power_on = target > 0;
        ctx->unavailable = false;
    }
}

static void fan_toggle(w_fan_ctx_t *ctx)
{
    if (ctx == NULL || ctx->unavailable || ctx->entity_id[0] == '\0') {
        return;
    }
    const bool want_on = !ctx->power_on;
    if (want_on) {
        /* turn_on preserves the previously requested speed in HA. */
        if (ui_bindings_set_fan_power(ctx->entity_id, true) == ESP_OK) {
            ctx->power_on = true;
        }
    } else {
        if (ui_bindings_set_fan_power(ctx->entity_id, false) == ESP_OK) {
            ctx->power_on = false;
        }
    }
}

static lv_obj_t *fan_create_action_button(lv_obj_t *parent, const char *text)
{
    lv_obj_t *btn = lv_btn_create(parent);
    lv_obj_clear_flag(btn, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_clear_flag(btn, LV_OBJ_FLAG_EVENT_BUBBLE);
    theme_default_style_button(btn, false);
    lv_obj_set_style_radius(btn, 14, LV_PART_MAIN);
    lv_obj_set_style_pad_all(btn, 0, LV_PART_MAIN);
    lv_obj_set_style_shadow_width(btn, 0, LV_PART_MAIN);

    lv_obj_t *label = lv_label_create(btn);
    lv_label_set_text(label, text);
    lv_obj_set_style_text_font(label, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_set_style_text_align(label, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN);
    lv_obj_center(label);
    return btn;
}

static void fan_apply_visual(w_fan_ctx_t *ctx)
{
    if (ctx == NULL || ctx->card == NULL) {
        return;
    }

    if (ctx->unavailable) {
        lv_label_set_text(ctx->value_label, "--");
        lv_obj_set_style_text_color(ctx->value_label, theme_default_color_text_muted(), LV_PART_MAIN);
        lv_label_set_text(ctx->state_label, ui_i18n_get("common.unavailable", "unavailable"));
        return;
    }

    lv_obj_set_style_bg_color(ctx->btn_toggle,
                              lv_color_hex(ctx->power_on ? APP_UI_COLOR_CARD_BG_ON : APP_UI_COLOR_CARD_BG_OFF),
                              LV_PART_MAIN);

    char value_text[16] = {0};
    if (ctx->power_on) {
        snprintf(value_text, sizeof(value_text), "%d %%", ctx->percentage >= 0 ? ctx->percentage : 100);
    } else {
        snprintf(value_text, sizeof(value_text), "%s", ui_i18n_get("widget.fan.off", "Off"));
    }
    lv_label_set_text(ctx->value_label, value_text);
    lv_obj_set_style_text_color(ctx->value_label,
                                ctx->power_on ? theme_default_color_text_primary()
                                              : theme_default_color_text_muted(),
                                LV_PART_MAIN);

    const char *toggle_text = ctx->power_on ? ui_i18n_get("widget.fan.on", "On")
                                            : ui_i18n_get("widget.fan.off_short", "Off");
    lv_label_set_text(ctx->btn_toggle_label, toggle_text);
    if (ctx->btn_toggle_label != NULL) {
        lv_obj_set_style_text_color(ctx->btn_toggle_label, theme_default_color_text_primary(), LV_PART_MAIN);
    }
}

static void w_fan_btn_minus_cb(lv_event_t *event)
{
    w_fan_ctx_t *ctx = (w_fan_ctx_t *)lv_event_get_user_data(event);
    if (ctx != NULL) {
        fan_step(ctx, -10);
    }
}

static void w_fan_btn_plus_cb(lv_event_t *event)
{
    w_fan_ctx_t *ctx = (w_fan_ctx_t *)lv_event_get_user_data(event);
    if (ctx != NULL) {
        fan_step(ctx, 10);
    }
}

static void w_fan_btn_toggle_cb(lv_event_t *event)
{
    w_fan_ctx_t *ctx = (w_fan_ctx_t *)lv_event_get_user_data(event);
    if (ctx != NULL) {
        fan_toggle(ctx);
    }
}

static void w_fan_event_cb(lv_event_t *event)
{
    if (event == NULL) {
        return;
    }
    w_fan_ctx_t *ctx = (w_fan_ctx_t *)lv_event_get_user_data(event);
    if (ctx == NULL) {
        return;
    }
    if (lv_event_get_code(event) == LV_EVENT_DELETE) {
        free(ctx);
    }
}

esp_err_t w_fan_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance)
{
    if (def == NULL || parent == NULL || out_instance == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    lv_obj_t *card = lv_obj_create(parent);
    lv_obj_set_pos(card, def->x, def->y);
    lv_obj_set_size(card, def->w, def->h);
    lv_obj_clear_flag(card, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_set_style_radius(card, APP_UI_CARD_RADIUS, LV_PART_MAIN);
    lv_obj_set_style_bg_color(card, lv_color_hex(APP_UI_COLOR_CARD_BG_OFF), LV_PART_MAIN);
#if APP_UI_REWORK_V2
    lv_obj_set_style_border_width(card, 1, LV_PART_MAIN);
    lv_obj_set_style_border_color(card, lv_color_hex(APP_UI_COLOR_CARD_BORDER), LV_PART_MAIN);
    lv_obj_set_style_border_opa(card, LV_OPA_70, LV_PART_MAIN);
#else
    lv_obj_set_style_border_width(card, 0, LV_PART_MAIN);
#endif
    lv_obj_set_style_pad_all(card, 12, LV_PART_MAIN);

    lv_obj_t *title = lv_label_create(card);
    lv_label_set_text(title, def->title[0] ? def->title : def->id);
    lv_obj_set_width(title, def->w - 160);
    lv_label_set_long_mode(title, LV_LABEL_LONG_DOT);
    lv_obj_set_style_text_font(title, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_set_style_text_color(title, theme_default_color_text_muted(), LV_PART_MAIN);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 0, 0);

    lv_obj_t *state = lv_label_create(card);
    lv_label_set_text(state, ui_i18n_get("widget.fan.off", "Off"));
    lv_obj_set_style_text_font(state, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_set_style_text_color(state, theme_default_color_text_muted(), LV_PART_MAIN);
    lv_obj_align(state, LV_ALIGN_TOP_RIGHT, 0, 0);

    lv_obj_t *value = lv_label_create(card);
    lv_label_set_text(value, "");
    lv_obj_set_style_text_font(value, APP_FONT_TEXT_28, LV_PART_MAIN);
    lv_obj_set_style_text_color(value, theme_default_color_text_primary(), LV_PART_MAIN);
    lv_obj_align(value, LV_ALIGN_CENTER, 0, -16);

    const lv_coord_t content_w = def->w - 24;
    const lv_coord_t btn_h = 46;
    const lv_coord_t btn_gap = 10;
    const lv_coord_t small_w = (content_w - 2 * btn_gap - 60) / 2;
    const lv_coord_t row_y = def->h - 12 - btn_h;

    lv_obj_t *btn_minus = fan_create_action_button(card, "-");
    lv_obj_set_size(btn_minus, small_w, btn_h);
    lv_obj_set_pos(btn_minus, 0, row_y);

    lv_obj_t *btn_toggle = fan_create_action_button(card, "");
    lv_obj_set_size(btn_toggle, 80, btn_h);
    lv_obj_set_pos(btn_toggle, small_w + btn_gap, row_y);

    lv_obj_t *btn_plus = fan_create_action_button(card, "+");
    lv_obj_set_size(btn_plus, small_w, btn_h);
    lv_obj_set_pos(btn_plus, small_w + 80 + 2 * btn_gap, row_y);

    w_fan_ctx_t *ctx = ui_calloc_prefer_psram(1, sizeof(w_fan_ctx_t));
    if (ctx == NULL) {
        lv_obj_del(card);
        return ESP_ERR_NO_MEM;
    }
    snprintf(ctx->entity_id, sizeof(ctx->entity_id), "%s", def->entity_id);
    ctx->card = card;
    ctx->title_label = title;
    ctx->state_label = state;
    ctx->value_label = value;
    ctx->btn_minus = btn_minus;
    ctx->btn_toggle = btn_toggle;
    ctx->btn_plus = btn_plus;
    ctx->accent_color = lv_color_hex(APP_UI_COLOR_NAV_TAB_ACTIVE);
    ctx->power_on = false;
    ctx->unavailable = false;
    ctx->percentage = -1;

    lv_color_t parsed_color;
    if (w_parse_hex_color(def->button_accent_color, &parsed_color)) {
        ctx->accent_color = parsed_color;
    }

    /* Bind button handlers to the real ctx. */
    lv_obj_add_event_cb(btn_minus, w_fan_btn_minus_cb, LV_EVENT_CLICKED, ctx);
    lv_obj_add_event_cb(btn_toggle, w_fan_btn_toggle_cb, LV_EVENT_CLICKED, ctx);
    lv_obj_add_event_cb(btn_plus, w_fan_btn_plus_cb, LV_EVENT_CLICKED, ctx);

    ctx->btn_toggle_label = lv_obj_get_child(btn_toggle, 0);

    lv_obj_add_event_cb(card, w_fan_event_cb, LV_EVENT_DELETE, ctx);

    fan_apply_visual(ctx);

    out_instance->obj = card;
    out_instance->ctx = ctx;
    return ESP_OK;
}

void w_fan_apply_state(ui_widget_instance_t *instance, const ha_state_t *state)
{
    if (instance == NULL || instance->obj == NULL || state == NULL) {
        return;
    }
    w_fan_ctx_t *ctx = (w_fan_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }

    if (w_state_is_unavailable(state->state)) {
        ctx->unavailable = true;
        fan_apply_visual(ctx);
        return;
    }

    ctx->unavailable = false;
    ctx->power_on = fan_state_is_on(state->state);
    ctx->percentage = -1;

    if (ctx->power_on) {
        cJSON *attrs = cJSON_Parse(state->attributes_json);
        if (attrs != NULL) {
            cJSON *pct = cJSON_GetObjectItemCaseSensitive(attrs, "percentage");
            if (cJSON_IsNumber(pct)) {
                int pct_val = (int)(pct->valuedouble + 0.5);
                if (pct_val < 0) {
                    pct_val = 0;
                }
                if (pct_val > 100) {
                    pct_val = 100;
                }
                ctx->percentage = pct_val;
            }
            cJSON_Delete(attrs);
        }
    }

    lv_label_set_text(ctx->state_label,
                      ctx->power_on ? ui_i18n_get("widget.fan.on", "On")
                                    : ui_i18n_get("widget.fan.off", "Off"));

    fan_apply_visual(ctx);
}

void w_fan_mark_unavailable(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }
    w_fan_ctx_t *ctx = (w_fan_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }
    ctx->unavailable = true;
    fan_apply_visual(ctx);
}
