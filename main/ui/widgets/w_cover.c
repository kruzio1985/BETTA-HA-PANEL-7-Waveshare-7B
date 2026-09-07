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
    lv_obj_t *btn_open;
    lv_obj_t *btn_stop;
    lv_obj_t *btn_close;
    lv_color_t accent_color;
    bool unavailable;
    int position_pct;
} w_cover_ctx_t;

static const char *cover_state_display(const char *state_text)
{
    if (state_text == NULL || state_text[0] == '\0') {
        return ui_i18n_get("common.unknown", "Unknown");
    }
    if (strcmp(state_text, "open") == 0) {
        return ui_i18n_get("widget.cover.open", "Open");
    }
    if (strcmp(state_text, "closed") == 0) {
        return ui_i18n_get("widget.cover.closed", "Closed");
    }
    if (strcmp(state_text, "opening") == 0) {
        return ui_i18n_get("widget.cover.opening", "Opening…");
    }
    if (strcmp(state_text, "closing") == 0) {
        return ui_i18n_get("widget.cover.closing", "Closing…");
    }
    if (strcmp(state_text, "stopped") == 0) {
        return ui_i18n_get("widget.cover.stopped", "Stopped");
    }
    return state_text;
}

static bool cover_state_is_on(const char *state_text)
{
    if (state_text == NULL) {
        return false;
    }
    return strcmp(state_text, "open") == 0 || strcmp(state_text, "opening") == 0;
}

static lv_obj_t *cover_create_action_button(lv_obj_t *parent, const char *text)
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

static void cover_apply_visual(w_cover_ctx_t *ctx)
{
    if (ctx == NULL || ctx->card == NULL) {
        return;
    }

    if (ctx->unavailable) {
        lv_label_set_text(ctx->state_label, ui_i18n_get("common.unavailable", "unavailable"));
        lv_label_set_text(ctx->value_label, "--");
        lv_obj_set_style_text_color(ctx->value_label, theme_default_color_text_muted(), LV_PART_MAIN);
        return;
    }

    char value_text[32] = {0};
    if (ctx->position_pct >= 0) {
        snprintf(value_text, sizeof(value_text), "%d %%", ctx->position_pct);
    }
    lv_label_set_text(ctx->value_label, ctx->position_pct >= 0 ? value_text : "");
    lv_obj_set_style_text_color(ctx->value_label,
                                ctx->position_pct > 0 ? theme_default_color_text_primary()
                                                       : theme_default_color_text_muted(),
                                LV_PART_MAIN);
}

static void cover_send_command(w_cover_ctx_t *ctx, const char *command)
{
    if (ctx == NULL || ctx->unavailable || ctx->entity_id[0] == '\0') {
        return;
    }
    ui_bindings_cover_command(ctx->entity_id, command);
}

static void w_cover_btn_open_cb(lv_event_t *event)
{
    w_cover_ctx_t *ctx = (w_cover_ctx_t *)lv_event_get_user_data(event);
    if (ctx != NULL) {
        cover_send_command(ctx, "open");
    }
}

static void w_cover_btn_stop_cb(lv_event_t *event)
{
    w_cover_ctx_t *ctx = (w_cover_ctx_t *)lv_event_get_user_data(event);
    if (ctx != NULL) {
        cover_send_command(ctx, "stop");
    }
}

static void w_cover_btn_close_cb(lv_event_t *event)
{
    w_cover_ctx_t *ctx = (w_cover_ctx_t *)lv_event_get_user_data(event);
    if (ctx != NULL) {
        cover_send_command(ctx, "close");
    }
}

static void w_cover_event_cb(lv_event_t *event)
{
    if (event == NULL) {
        return;
    }
    w_cover_ctx_t *ctx = (w_cover_ctx_t *)lv_event_get_user_data(event);
    if (ctx == NULL) {
        return;
    }
    if (lv_event_get_code(event) == LV_EVENT_DELETE) {
        free(ctx);
    }
}

esp_err_t w_cover_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance)
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
    lv_obj_set_style_pad_all(card, 12, LV_PART_MAIN);

    lv_obj_t *title = lv_label_create(card);
    lv_label_set_text(title, def->title[0] ? def->title : def->id);
    lv_obj_set_width(title, def->w - 160);
    lv_label_set_long_mode(title, LV_LABEL_LONG_DOT);
    lv_obj_set_style_text_font(title, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_set_style_text_color(title, theme_default_color_text_muted(), LV_PART_MAIN);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 0, 0);

    lv_obj_t *state = lv_label_create(card);
    lv_label_set_text(state, ui_i18n_get("widget.cover.closed", "Closed"));
    lv_obj_set_style_text_font(state, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_set_style_text_color(state, theme_default_color_text_muted(), LV_PART_MAIN);
    lv_obj_align(state, LV_ALIGN_TOP_RIGHT, 0, 0);

    lv_obj_t *value = lv_label_create(card);
    lv_label_set_text(value, "");
    lv_obj_set_style_text_font(value, APP_FONT_TEXT_28, LV_PART_MAIN);
    lv_obj_set_style_text_color(value, theme_default_color_text_primary(), LV_PART_MAIN);
    lv_obj_align(value, LV_ALIGN_CENTER, 0, -14);

    const lv_coord_t content_w = def->w - 24;
    const lv_coord_t btn_h = 46;
    const lv_coord_t btn_gap = 10;
    const lv_coord_t btn_w = (content_w - 2 * btn_gap) / 3;
    const lv_coord_t row_y = def->h - 12 - btn_h;

    lv_obj_t *btn_open =
        cover_create_action_button(card, ui_i18n_get("widget.cover.open_short", "Open"));
    lv_obj_set_size(btn_open, btn_w, btn_h);
    lv_obj_set_pos(btn_open, 0, row_y);

    lv_obj_t *btn_stop =
        cover_create_action_button(card, ui_i18n_get("widget.cover.stop_short", "Stop"));
    lv_obj_set_size(btn_stop, btn_w, btn_h);
    lv_obj_set_pos(btn_stop, btn_w + btn_gap, row_y);

    lv_obj_t *btn_close =
        cover_create_action_button(card, ui_i18n_get("widget.cover.close_short", "Close"));
    lv_obj_set_size(btn_close, btn_w, btn_h);
    lv_obj_set_pos(btn_close, 2 * (btn_w + btn_gap), row_y);

    w_cover_ctx_t *ctx = ui_calloc_prefer_psram(1, sizeof(w_cover_ctx_t));
    if (ctx == NULL) {
        lv_obj_del(card);
        return ESP_ERR_NO_MEM;
    }
    snprintf(ctx->entity_id, sizeof(ctx->entity_id), "%s", def->entity_id);
    ctx->card = card;
    ctx->title_label = title;
    ctx->state_label = state;
    ctx->value_label = value;
    ctx->btn_open = btn_open;
    ctx->btn_stop = btn_stop;
    ctx->btn_close = btn_close;
    ctx->accent_color = lv_color_hex(APP_UI_COLOR_NAV_TAB_ACTIVE);
    ctx->unavailable = false;
    ctx->position_pct = -1;

    lv_color_t parsed_color;
    if (w_parse_hex_color(def->button_accent_color, &parsed_color)) {
        ctx->accent_color = parsed_color;
    }

    /* Re-bind button event user data to the ctx (created before ctx). */
    lv_obj_add_event_cb(btn_open, w_cover_btn_open_cb, LV_EVENT_CLICKED, ctx);
    lv_obj_add_event_cb(btn_stop, w_cover_btn_stop_cb, LV_EVENT_CLICKED, ctx);
    lv_obj_add_event_cb(btn_close, w_cover_btn_close_cb, LV_EVENT_CLICKED, ctx);

    lv_obj_add_event_cb(card, w_cover_event_cb, LV_EVENT_DELETE, ctx);

    cover_apply_visual(ctx);

    out_instance->obj = card;
    out_instance->ctx = ctx;
    return ESP_OK;
}

void w_cover_apply_state(ui_widget_instance_t *instance, const ha_state_t *state)
{
    if (instance == NULL || instance->obj == NULL || state == NULL) {
        return;
    }
    w_cover_ctx_t *ctx = (w_cover_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }

    if (w_state_is_unavailable(state->state)) {
        ctx->unavailable = true;
        lv_label_set_text(ctx->state_label, ui_i18n_get("common.unavailable", "unavailable"));
        cover_apply_visual(ctx);
        return;
    }

    ctx->unavailable = false;
    ctx->position_pct = -1;

    lv_label_set_text(ctx->state_label, cover_state_display(state->state));
    lv_obj_set_style_text_color(ctx->state_label,
                                cover_state_is_on(state->state) ? lv_color_hex(APP_UI_COLOR_STATE_ON)
                                                                : theme_default_color_text_muted(),
                                LV_PART_MAIN);

    cJSON *attrs = cJSON_Parse(state->attributes_json);
    if (attrs != NULL) {
        cJSON *pos = cJSON_GetObjectItemCaseSensitive(attrs, "current_position");
        if (cJSON_IsNumber(pos)) {
            int pct = (int)(pos->valuedouble + 0.5);
            if (pct < 0) {
                pct = 0;
            }
            if (pct > 100) {
                pct = 100;
            }
            ctx->position_pct = pct;
        }
        cJSON_Delete(attrs);
    }

    if (ctx->position_pct < 0) {
        if (strcmp(state->state, "open") == 0) {
            ctx->position_pct = 100;
        } else if (strcmp(state->state, "closed") == 0) {
            ctx->position_pct = 0;
        }
    }

    cover_apply_visual(ctx);
}

void w_cover_mark_unavailable(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }
    w_cover_ctx_t *ctx = (w_cover_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }
    ctx->unavailable = true;
    lv_label_set_text(ctx->state_label, ui_i18n_get("common.unavailable", "unavailable"));
    cover_apply_visual(ctx);
}
