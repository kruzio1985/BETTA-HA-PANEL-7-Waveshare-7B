/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 *
 * Binary sensor tile. Shows the state of any binary_sensor entity
 * (doors/windows/motion/presence/lock/connectivity ...) with an optional
 * title, an ON/OFF state text and state dependent card/state colors.
 */
#include "ui/ui_widget_factory.h"
#include "ui/ui_i18n.h"
#include "ui/ui_memory.h"
#include "ui/fonts/app_text_fonts.h"
#include "ui/theme/theme_default.h"
#include "ha/ha_model.h"
#include "ha/ha_client.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "cJSON.h"

typedef struct {
    lv_obj_t *card;
    lv_obj_t *title;
    lv_obj_t *state;
    char state_text[96];
    bool text_valid;
    bool configured;
} w_binary_sensor_t;

static const char *binary_i18n(const char *key, const char *fallback)
{
    const char *s = ui_i18n_get(key, NULL);
    return (s != NULL) ? s : fallback;
}

/* Resolve the pair of (on_text, off_text) based on device_class first, then on
 * the user provided text_on/text_off overrides (already stored on instance). */
static void binary_default_texts(const char *device_class, const char **on_text, const char **off_text)
{
    *on_text = NULL;
    *off_text = NULL;

    if (device_class == NULL || device_class[0] == '\0') {
        return;
    }

    if (strcmp(device_class, "door") == 0 || strcmp(device_class, "garage_door") == 0 ||
        strcmp(device_class, "window") == 0 || strcmp(device_class, "window_open") == 0 ||
        strcmp(device_class, "opening") == 0) {
        *on_text = binary_i18n("lvgl.binary.open", "OPEN");
        *off_text = binary_i18n("lvgl.binary.closed", "CLOSED");
    } else if (strcmp(device_class, "lock") == 0) {
        *on_text = binary_i18n("lvgl.binary.unlocked", "UNLOCKED");
        *off_text = binary_i18n("lvgl.binary.locked", "LOCKED");
    } else if (strcmp(device_class, "connectivity") == 0) {
        *on_text = binary_i18n("lvgl.binary.connected", "CONNECTED");
        *off_text = binary_i18n("lvgl.binary.disconnected", "DISCONNECTED");
    } else if (strcmp(device_class, "motion") == 0 || strcmp(device_class, "occupancy") == 0 ||
               strcmp(device_class, "presence") == 0 || strcmp(device_class, "tamper") == 0 ||
               strcmp(device_class, "smoke") == 0 || strcmp(device_class, "gas") == 0 ||
               strcmp(device_class, "carbon_monoxide") == 0 || strcmp(device_class, "moisture") == 0 ||
               strcmp(device_class, "safety") == 0 || strcmp(device_class, "sound") == 0 ||
               strcmp(device_class, "vibration") == 0 || strcmp(device_class, "problem") == 0 ||
               strcmp(device_class, "running") == 0 || strcmp(device_class, "heat") == 0 ||
               strcmp(device_class, "cold") == 0 || strcmp(device_class, "power") == 0 ||
               strcmp(device_class, "light") == 0 || strcmp(device_class, "update") == 0 ||
               strcmp(device_class, "plug") == 0) {
        *on_text = binary_i18n("lvgl.binary.detected", "DETECTED");
        *off_text = binary_i18n("lvgl.binary.not_detected", "NOT DETECTED");
    } else if (strcmp(device_class, "home") == 0) {
        *on_text = binary_i18n("lvgl.binary.home", "HOME");
        *off_text = binary_i18n("lvgl.binary.not_home", "AWAY");
    }
}

static bool binary_state_is_on(const char *state)
{
    if (state == NULL) {
        return false;
    }
    if (strcmp(state, "on") == 0 || strcmp(state, "true") == 0 || strcmp(state, "open") == 0 ||
        strcmp(state, "unlocked") == 0 || strcmp(state, "detected") == 0 ||
        strcmp(state, "home") == 0 || strcmp(state, "connected") == 0 ||
        strcmp(state, "plugged") == 0 || strcmp(state, "on_low") == 0) {
        return true;
    }
    return false;
}

static bool binary_state_is_off(const char *state)
{
    if (state == NULL) {
        return false;
    }
    if (strcmp(state, "off") == 0 || strcmp(state, "false") == 0 || strcmp(state, "closed") == 0 ||
        strcmp(state, "locked") == 0 || strcmp(state, "not_detected") == 0 ||
        strcmp(state, "not_home") == 0 || strcmp(state, "disconnected") == 0 ||
        strcmp(state, "unplugged") == 0) {
        return true;
    }
    return false;
}

static bool binary_state_is_unavailable(const char *state)
{
    if (state == NULL) {
        return true;
    }
    return strcmp(state, "unavailable") == 0 || strcmp(state, "unknown") == 0;
}

/* Parse a hex color string ("#RRGGBB" or "0xRRGGBB"). Returns false when the
 * string is empty or malformed so the caller can fall back to a theme color. */
static bool binary_parse_hex_color(const char *text, lv_color_t *out)
{
    if (text == NULL || text[0] == '\0') {
        return false;
    }
    const char *p = text;
    if (p[0] == '#') {
        p++;
    } else if (p[0] == '0' && (p[1] == 'x' || p[1] == 'X')) {
        p += 2;
    } else {
        return false;
    }
    size_t len = strlen(p);
    if (len != 6) {
        return false;
    }
    for (size_t i = 0; i < len; i++) {
        if (!isxdigit((unsigned char)p[i])) {
            return false;
        }
    }
    char tmp[7];
    memcpy(tmp, p, 6);
    tmp[6] = '\0';
    unsigned int rgb = (unsigned int)strtoul(tmp, NULL, 16);
    *out = lv_color_hex(rgb);
    return true;
}

/* Pick the font for the requested pixel size. Uses the same APP_FONT_TEXT_*
 * macros as the rest of the UI so rendering stays consistent: Poppins overlay
 * when compiled in (Polish glyphs), otherwise the Montserrat fallback. */
static const lv_font_t *binary_font_px(int px)
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
static const lv_font_t *binary_fit_font(const char *text, int max_width, int max_height)
{
    const int sizes[] = {28, 24, 22, 20, 18, 16, 14, 12};
    const lv_font_t *result = binary_font_px(12);
    for (size_t i = 0; i < sizeof(sizes) / sizeof(sizes[0]); i++) {
        const lv_font_t *font = binary_font_px(sizes[i]);
        int font_h = lv_font_get_line_height(font);
        if (font_h > max_height) {
            continue;
        }
        lv_point_t size = {0, 0};
        /* No wrapping: measure the full single line width. */
        lv_text_get_size(&size, text, font, 0, 0, LV_COORD_MAX, LV_TEXT_FLAG_NONE);
        if (size.x <= max_width && size.y <= max_height) {
            result = font;
            break;
        }
    }
    return result;
}

static void binary_layout(w_binary_sensor_t *ctx)
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
            const lv_font_t *font = binary_fit_font(ctx->state_text, lv_obj_get_width(ctx->state), lv_obj_get_height(ctx->state));
            lv_obj_set_style_text_font(ctx->state, font, 0);
        }
        if (ctx->title != NULL && !lv_obj_has_flag(ctx->title, LV_OBJ_FLAG_HIDDEN)) {
            lv_obj_align(ctx->state, LV_ALIGN_CENTER, 0, 6);
        } else {
            lv_obj_align(ctx->state, LV_ALIGN_CENTER, 0, 0);
        }
    }
}

static void binary_event_cb(lv_event_t *e)
{
    lv_event_code_t code = lv_event_get_code(e);
    if (code == LV_EVENT_SIZE_CHANGED) {
        w_binary_sensor_t *ctx = (w_binary_sensor_t *)lv_event_get_user_data(e);
        if (ctx != NULL) {
            binary_layout(ctx);
        }
    } else if (code == LV_EVENT_DELETE) {
        w_binary_sensor_t *ctx = (w_binary_sensor_t *)lv_event_get_user_data(e);
        if (ctx != NULL) {
            free(ctx);
        }
    }
}

static void binary_apply_state_text(w_binary_sensor_t *ctx, const char *state_text, bool is_on,
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
        lv_obj_set_style_bg_color(card, lv_color_hex(is_on ? APP_UI_COLOR_CARD_BG_ON : APP_UI_COLOR_CARD_BG_OFF), 0);
        lv_obj_set_style_border_color(card, accent, 0);
    }

    const lv_font_t *font = binary_fit_font(state_text, lv_obj_get_width(state), lv_obj_get_height(state));
    lv_obj_set_style_text_font(state, font, 0);
    lv_label_set_text(state, state_text);
    lv_obj_update_layout(state);

    snprintf(ctx->state_text, sizeof(ctx->state_text), "%s", state_text != NULL ? state_text : "");
    ctx->text_valid = true;
}

esp_err_t w_binary_sensor_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance)
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
    /* Position and size must be applied AFTER remove_style_all/theming:
     * remove_style_all() drops the local styles written by set_pos/set_size,
     * which reset the card to (0,0) with the theme default size. */
    lv_obj_set_pos(card, def->x, def->y);
    lv_obj_set_size(card, def->w, def->h);

    w_binary_sensor_t *ctx = (w_binary_sensor_t *)ui_calloc_prefer_psram(1, sizeof(w_binary_sensor_t));
    if (ctx == NULL) {
        lv_obj_del(card);
        return ESP_ERR_NO_MEM;
    }
    ctx->card = card;
    ctx->configured = true;

    bool title_is_auto_id = (def->title[0] != '\0' && strcmp(def->title, def->id) == 0);
    if (def->binary_show_title && def->title[0] != '\0' && !title_is_auto_id) {
        lv_obj_t *title = lv_label_create(card);
        ctx->title = title;
        lv_obj_set_style_text_color(title, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), 0);
        lv_obj_set_style_text_font(title, binary_font_px(18), 0);
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
    lv_obj_set_style_text_font(state, binary_font_px(20), 0);
    lv_obj_set_style_text_letter_space(state, 1, 0);

    lv_obj_add_event_cb(card, binary_event_cb, LV_EVENT_SIZE_CHANGED, ctx);
    lv_obj_add_event_cb(card, binary_event_cb, LV_EVENT_DELETE, ctx);

    binary_apply_state_text(ctx, "", false, true, lv_color_hex(APP_UI_COLOR_TEXT_MUTED));
    binary_layout(ctx);

    out_instance->obj = card;
    out_instance->ctx = ctx;
    return ESP_OK;
}

void w_binary_sensor_apply_state(ui_widget_instance_t *instance, const ha_state_t *state)
{
    if (instance == NULL || instance->obj == NULL || state == NULL) {
        return;
    }

    w_binary_sensor_t *ctx = (w_binary_sensor_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }

    bool unavailable = binary_state_is_unavailable(state->state);

    if (unavailable) {
        binary_apply_state_text(ctx, binary_i18n("lvgl.common.unavailable", "unavailable"), false, true,
                                lv_color_hex(APP_UI_COLOR_TEXT_MUTED));
        return;
    }

    bool is_on = binary_state_is_on(state->state);
    if (!is_on && !binary_state_is_off(state->state)) {
        /* Some arbitrary state that we do not know how to map - show it as-is. */
        binary_apply_state_text(ctx, state->state, false, false, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY));
        return;
    }

    /* Device class lives in the attributes of the entity state. */
    const char *device_class = NULL;
    if (state->attributes_json[0] != '\0') {
        cJSON *root = cJSON_Parse(state->attributes_json);
        if (root != NULL) {
            cJSON *dc = cJSON_GetObjectItemCaseSensitive(root, "device_class");
            if (cJSON_IsString(dc) && dc->valuestring != NULL) {
                device_class = dc->valuestring;
            }
            cJSON_Delete(root);
        }
    }

    const char *on_text = NULL;
    const char *off_text = NULL;
    binary_default_texts(device_class, &on_text, &off_text);

    const char *text = NULL;
    lv_color_t accent;
    if (is_on) {
        text = (instance->binary_text_on[0] != '\0')
                   ? instance->binary_text_on
                   : (on_text != NULL ? on_text : binary_i18n("lvgl.binary.on", "ON"));
        if (!binary_parse_hex_color(instance->binary_color_on, &accent)) {
            accent = lv_color_hex(APP_UI_COLOR_STATE_ON);
        }
    } else {
        text = (instance->binary_text_off[0] != '\0')
                   ? instance->binary_text_off
                   : (off_text != NULL ? off_text : binary_i18n("lvgl.binary.off", "OFF"));
        if (!binary_parse_hex_color(instance->binary_color_off, &accent)) {
            accent = lv_color_hex(APP_UI_COLOR_STATE_OFF);
        }
    }
    if (text == NULL) {
        text = binary_i18n("lvgl.binary.off", "OFF");
    }

    binary_apply_state_text(ctx, text, is_on, false, accent);
}

void w_binary_sensor_mark_unavailable(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }

    w_binary_sensor_t *ctx = (w_binary_sensor_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }
    binary_apply_state_text(ctx, binary_i18n("lvgl.common.unavailable", "unavailable"), false, true,
                            lv_color_hex(APP_UI_COLOR_TEXT_MUTED));
}
