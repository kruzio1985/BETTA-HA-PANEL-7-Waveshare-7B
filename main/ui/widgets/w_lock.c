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
    lv_obj_t *big_label;
    lv_obj_t *hint_label;
    lv_color_t accent_color;
    bool locked;
    bool unavailable;
} w_lock_ctx_t;

static bool lock_state_is_locked(const char *state_text)
{
    if (state_text == NULL) {
        return true;
    }
    return strcmp(state_text, "locked") == 0 || strcmp(state_text, "locking") == 0;
}

static const char *lock_state_text(bool locked)
{
    return ui_i18n_get(locked ? "widget.lock.locked" : "widget.lock.unlocked",
                       locked ? "Locked" : "Unlocked");
}

static const char *lock_action_text(bool locked)
{
    return ui_i18n_get(locked ? "widget.lock.unlock_action" : "widget.lock.lock_action",
                       locked ? "Unlock / open" : "Lock");
}

static void lock_apply_visual(w_lock_ctx_t *ctx)
{
    if (ctx == NULL || ctx->card == NULL) {
        return;
    }

    lv_obj_t *card = ctx->card;
    const bool on = !ctx->locked && !ctx->unavailable;

    /* Whole card acts as the tap target; tint the background by state. */
    lv_obj_set_style_bg_color(card, lv_color_hex(on ? APP_UI_COLOR_CARD_BG_ON : APP_UI_COLOR_CARD_BG_OFF),
                              LV_PART_MAIN);
    lv_obj_set_style_bg_opa(card, LV_OPA_COVER, LV_PART_MAIN);
    lv_obj_set_style_text_color(card, theme_default_color_text_primary(), LV_PART_MAIN);

    lv_obj_set_style_text_color(ctx->state_label,
                                lv_color_hex(on ? APP_UI_COLOR_STATE_ON : APP_UI_COLOR_TEXT_MUTED),
                                LV_PART_MAIN);
    lv_obj_set_style_text_color(ctx->big_label,
                                lv_color_hex(on ? APP_UI_COLOR_STATE_ON : APP_UI_COLOR_TEXT_PRIMARY),
                                LV_PART_MAIN);

    lv_label_set_text(ctx->state_label,
                      ctx->unavailable ? ui_i18n_get("common.unavailable", "unavailable")
                                       : lock_state_text(ctx->locked));
    lv_label_set_text(ctx->big_label,
                      ctx->unavailable ? ui_i18n_get("common.unavailable", "unavailable")
                                       : lock_action_text(ctx->locked));
    lv_label_set_text(ctx->hint_label,
                      ui_i18n_get("widget.lock.tap_hint", "Tap to toggle"));
}

static void lock_toggle_entity(w_lock_ctx_t *ctx)
{
    if (ctx == NULL || ctx->unavailable || ctx->entity_id[0] == '\0') {
        return;
    }
    const bool want_locked = !ctx->locked;
    if (ui_bindings_set_lock(ctx->entity_id, want_locked) == ESP_OK) {
        ctx->locked = want_locked;
        lock_apply_visual(ctx);
    }
}

static void w_lock_event_cb(lv_event_t *event)
{
    if (event == NULL) {
        return;
    }
    w_lock_ctx_t *ctx = (w_lock_ctx_t *)lv_event_get_user_data(event);
    if (ctx == NULL) {
        return;
    }
    lv_event_code_t code = lv_event_get_code(event);
    if (code == LV_EVENT_DELETE) {
        free(ctx);
    } else if (code == LV_EVENT_CLICKED) {
        lock_toggle_entity(ctx);
    }
}

esp_err_t w_lock_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance)
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
    lv_obj_set_width(title, def->w - 160);
    lv_label_set_long_mode(title, LV_LABEL_LONG_DOT);
    lv_obj_set_style_text_font(title, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_set_style_text_color(title, theme_default_color_text_muted(), LV_PART_MAIN);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 0, 0);

    lv_obj_t *state = lv_label_create(card);
    lv_label_set_text(state, lock_state_text(false));
    lv_obj_set_style_text_font(state, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_align(state, LV_ALIGN_TOP_RIGHT, 0, 0);

    lv_obj_t *big = lv_label_create(card);
    lv_label_set_text(big, lock_action_text(false));
    lv_obj_set_width(big, def->w - 28);
    lv_label_set_long_mode(big, LV_LABEL_LONG_DOT);
    lv_obj_set_style_text_font(big, APP_FONT_TEXT_28, LV_PART_MAIN);
    lv_obj_set_style_text_align(big, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN);
    lv_obj_align(big, LV_ALIGN_CENTER, 0, -12);

    lv_obj_t *hint = lv_label_create(card);
    lv_label_set_text(hint, ui_i18n_get("widget.lock.tap_hint", "Tap to toggle"));
    lv_obj_set_style_text_font(hint, APP_FONT_TEXT_16, LV_PART_MAIN);
    lv_obj_set_style_text_color(hint, theme_default_color_text_muted(), LV_PART_MAIN);
    lv_obj_set_style_text_align(hint, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN);
    lv_obj_align(hint, LV_ALIGN_BOTTOM_MID, 0, -2);

    w_lock_ctx_t *ctx = ui_calloc_prefer_psram(1, sizeof(w_lock_ctx_t));
    if (ctx == NULL) {
        lv_obj_del(card);
        return ESP_ERR_NO_MEM;
    }
    snprintf(ctx->entity_id, sizeof(ctx->entity_id), "%s", def->entity_id);
    ctx->card = card;
    ctx->title_label = title;
    ctx->state_label = state;
    ctx->big_label = big;
    ctx->hint_label = hint;
    ctx->accent_color = lv_color_hex(APP_UI_COLOR_NAV_TAB_ACTIVE);
    ctx->locked = false;
    ctx->unavailable = false;

    lv_color_t parsed_color;
    if (w_parse_hex_color(def->button_accent_color, &parsed_color)) {
        ctx->accent_color = parsed_color;
    }

    lv_obj_add_event_cb(card, w_lock_event_cb, LV_EVENT_CLICKED, ctx);
    lv_obj_add_event_cb(card, w_lock_event_cb, LV_EVENT_DELETE, ctx);

    lock_apply_visual(ctx);

    out_instance->obj = card;
    out_instance->ctx = ctx;
    return ESP_OK;
}

void w_lock_apply_state(ui_widget_instance_t *instance, const ha_state_t *state)
{
    if (instance == NULL || instance->obj == NULL || state == NULL) {
        return;
    }
    w_lock_ctx_t *ctx = (w_lock_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }
    if (w_state_is_unavailable(state->state)) {
        ctx->unavailable = true;
    } else {
        ctx->unavailable = false;
        ctx->locked = lock_state_is_locked(state->state);
    }
    lock_apply_visual(ctx);
}

void w_lock_mark_unavailable(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }
    w_lock_ctx_t *ctx = (w_lock_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }
    ctx->unavailable = true;
    lock_apply_visual(ctx);
}
