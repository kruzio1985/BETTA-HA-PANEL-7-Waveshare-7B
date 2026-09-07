/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 *
 * Presence tile. Shows the state of a person or device_tracker entity:
 * "home" -> HOME, "not_home" -> AWAY, any other state (a zone name such as
 * "Praca") is shown as-is. Reuses the binary home/not_home translations so
 * every language already built into the firmware works out of the box.
 */
#include "ui/ui_widget_factory.h"
#include "ui/ui_i18n.h"
#include "ui/ui_memory.h"
#include "ui/fonts/app_text_fonts.h"
#include "ui/theme/theme_default.h"
#include "ha/ha_model.h"
#include "ha/ha_client.h"

#include <stdio.h>
#include <string.h>

typedef struct {
    lv_obj_t *card;
    lv_obj_t *title;
    lv_obj_t *state;
    char state_text[96];
    bool text_valid;
    bool configured;
} w_presence_t;

static const char *presence_i18n(const char *key, const char *fallback)
{
    const char *s = ui_i18n_get(key, NULL);
    return (s != NULL) ? s : fallback;
}

static bool presence_state_is_unavailable(const char *state)
{
    if (state == NULL) {
        return true;
    }
    return strcmp(state, "unavailable") == 0 || strcmp(state, "unknown") == 0;
}

/* Pick the font for the requested pixel size. Uses the same APP_FONT_TEXT_*
 * macros as the rest of the UI so rendering stays consistent: Poppins overlay
 * when compiled in (Polish glyphs), otherwise the Montserrat fallback. */
static const lv_font_t *presence_font_px(int px)
{
    if (px >= 28) {
        return APP_FONT_TEXT_28;
    }
    if (px >= 24) {
        return APP_FONT_TEXT_24;
    }
    if (px >= 22) {
        return APP_FONT_TEXT_22;
    }
    if (px >= 20) {
        return APP_FONT_TEXT_20;
    }
    if (px >= 18) {
        return APP_FONT_TEXT_18;
    }
    if (px >= 16) {
        return APP_FONT_TEXT_16;
    }
    return APP_FONT_TEXT_14;
}

/* Choose the largest font whose (single line) text still fits the available
 * width/height. The text is drawn on a CLIP label, so we only ever accept a
 * font that keeps the whole string on one line within max_width. */
static const lv_font_t *presence_fit_font(const char *text, int max_width, int max_height)
{
    const int sizes[] = {28, 24, 22, 20, 18, 16, 14, 12};
    const lv_font_t *result = presence_font_px(12);
    for (size_t i = 0; i < sizeof(sizes) / sizeof(sizes[0]); i++) {
        const lv_font_t *font = presence_font_px(sizes[i]);
        int font_h = lv_font_get_line_height(font);
        if (font_h > max_height) {
            continue;
        }
        lv_point_t size = {0, 0};
        lv_text_get_size(&size, text, font, 0, 0, LV_COORD_MAX, LV_TEXT_FLAG_NONE);
        if (size.x <= max_width && size.y <= max_height) {
            result = font;
            break;
        }
    }
    return result;
}

static void presence_layout(w_presence_t *ctx)
{
    if (!ctx->configured) {
        return;
    }
    int w = lv_obj_get_width(ctx->card);
    int h = lv_obj_get_height(ctx->card);
    if (w <= 0 || h <= 0) {
        return;
    }

    if (ctx->title != NULL) {
        lv_obj_set_width(ctx->title, w - 12);
        lv_obj_align(ctx->title, LV_ALIGN_TOP_MID, 0, 2);
    }

    if (ctx->state != NULL) {
        lv_obj_update_layout(ctx->state);
        if (ctx->text_valid) {
            const lv_font_t *font = presence_fit_font(ctx->state_text, lv_obj_get_width(ctx->state), lv_obj_get_height(ctx->state));
            lv_obj_set_style_text_font(ctx->state, font, 0);
        }
        if (ctx->title != NULL && !lv_obj_has_flag(ctx->title, LV_OBJ_FLAG_HIDDEN)) {
            lv_obj_align(ctx->state, LV_ALIGN_CENTER, 0, 6);
        } else {
            lv_obj_align(ctx->state, LV_ALIGN_CENTER, 0, 0);
        }
    }
}

static void presence_event_cb(lv_event_t *e)
{
    lv_event_code_t code = lv_event_get_code(e);
    if (code == LV_EVENT_SIZE_CHANGED) {
        w_presence_t *ctx = (w_presence_t *)lv_event_get_user_data(e);
        if (ctx != NULL) {
            presence_layout(ctx);
        }
    } else if (code == LV_EVENT_DELETE) {
        w_presence_t *ctx = (w_presence_t *)lv_event_get_user_data(e);
        if (ctx != NULL) {
            free(ctx);
        }
    }
}

static void presence_apply_state_text(w_presence_t *ctx, const char *state_text, bool is_home,
                                      bool unavailable, const lv_color_t accent)
{
    if (ctx->state == NULL) {
        return;
    }
    lv_obj_t *state = ctx->state;
    lv_obj_set_style_text_color(state, accent, 0);

    lv_obj_t *card = ctx->card;
    if (unavailable) {
        lv_obj_set_style_bg_color(card, lv_color_hex(APP_UI_COLOR_CARD_BG_OFF), 0);
        lv_obj_set_style_border_color(card, lv_color_hex(APP_UI_COLOR_CARD_BORDER), 0);
    } else {
        lv_obj_set_style_bg_color(card, lv_color_hex(is_home ? APP_UI_COLOR_CARD_BG_ON : APP_UI_COLOR_CARD_BG_OFF), 0);
        lv_obj_set_style_border_color(card, accent, 0);
    }

    const lv_font_t *font = presence_fit_font(state_text, lv_obj_get_width(state), lv_obj_get_height(state));
    lv_obj_set_style_text_font(state, font, 0);
    lv_label_set_text(state, state_text);
    lv_obj_update_layout(state);

    snprintf(ctx->state_text, sizeof(ctx->state_text), "%s", state_text != NULL ? state_text : "");
    ctx->text_valid = true;
}

esp_err_t w_presence_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance)
{
    if (def == NULL || parent == NULL || out_instance == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    lv_obj_t *card = lv_obj_create(parent);
    if (card == NULL) {
        return ESP_ERR_NO_MEM;
    }
    lv_obj_remove_style_all(card);
    theme_default_style_card(card);
    lv_obj_set_style_bg_color(card, lv_color_hex(APP_UI_COLOR_CARD_BG_OFF), 0);
    lv_obj_set_style_bg_opa(card, LV_OPA_COVER, 0);
    lv_obj_set_style_radius(card, 16, 0);
    lv_obj_set_style_border_width(card, 1, 0);
    lv_obj_set_style_pad_all(card, 8, 0);
    lv_obj_clear_flag(card, LV_OBJ_FLAG_SCROLLABLE);
    /* Position and size must be applied AFTER remove_style_all/theming. */
    lv_obj_set_pos(card, def->x, def->y);
    lv_obj_set_size(card, def->w, def->h);

    w_presence_t *ctx = (w_presence_t *)ui_calloc_prefer_psram(1, sizeof(w_presence_t));
    if (ctx == NULL) {
        lv_obj_del(card);
        return ESP_ERR_NO_MEM;
    }
    ctx->card = card;
    ctx->configured = true;

    bool title_is_auto_id = (def->title[0] != '\0' && strcmp(def->title, def->id) == 0);
    if (def->title[0] != '\0' && !title_is_auto_id) {
        lv_obj_t *title = lv_label_create(card);
        ctx->title = title;
        lv_obj_set_style_text_color(title, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), 0);
        lv_obj_set_style_text_font(title, presence_font_px(18), 0);
        lv_label_set_long_mode(title, LV_LABEL_LONG_WRAP);
        lv_obj_set_width(title, lv_pct(100));
        lv_label_set_text(title, def->title);
        lv_obj_align(title, LV_ALIGN_TOP_MID, 0, 2);
    }

    lv_obj_t *state = lv_label_create(card);
    ctx->state = state;
    lv_label_set_long_mode(state, LV_LABEL_LONG_CLIP);
    lv_obj_set_style_text_align(state, LV_TEXT_ALIGN_CENTER, 0);
    lv_obj_set_width(state, lv_pct(100));
    lv_obj_set_style_text_color(state, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), 0);
    lv_obj_set_style_text_font(state, presence_font_px(20), 0);
    lv_obj_set_style_text_letter_space(state, 1, 0);

    lv_obj_add_event_cb(card, presence_event_cb, LV_EVENT_SIZE_CHANGED, ctx);
    lv_obj_add_event_cb(card, presence_event_cb, LV_EVENT_DELETE, ctx);

    presence_apply_state_text(ctx, "", false, true, lv_color_hex(APP_UI_COLOR_TEXT_MUTED));
    presence_layout(ctx);

    out_instance->obj = card;
    out_instance->ctx = ctx;
    return ESP_OK;
}

void w_presence_apply_state(ui_widget_instance_t *instance, const ha_state_t *state)
{
    if (instance == NULL || instance->obj == NULL || state == NULL) {
        return;
    }

    w_presence_t *ctx = (w_presence_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }

    bool unavailable = presence_state_is_unavailable(state->state);
    if (unavailable) {
        presence_apply_state_text(ctx, presence_i18n("lvgl.common.unavailable", "unavailable"), false, true,
                                  lv_color_hex(APP_UI_COLOR_TEXT_MUTED));
        return;
    }

    if (strcmp(state->state, "home") == 0) {
        presence_apply_state_text(ctx, presence_i18n("lvgl.binary.home", "HOME"), true, false,
                                  lv_color_hex(APP_UI_COLOR_STATE_ON));
        return;
    }

    if (strcmp(state->state, "not_home") == 0) {
        presence_apply_state_text(ctx, presence_i18n("lvgl.binary.not_home", "AWAY"), false, false,
                                  lv_color_hex(APP_UI_COLOR_STATE_OFF));
        return;
    }

    /* Any other state is a zone name (e.g. "Praca", "Sklep") - show it as-is. */
    presence_apply_state_text(ctx, state->state, false, false, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY));
}

void w_presence_mark_unavailable(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }
    w_presence_t *ctx = (w_presence_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }
    presence_apply_state_text(ctx, presence_i18n("lvgl.common.unavailable", "unavailable"), false, true,
                              lv_color_hex(APP_UI_COLOR_TEXT_MUTED));
}
