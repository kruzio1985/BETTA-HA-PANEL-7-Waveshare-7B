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
#include "ui/ui_bindings.h"
#include "ui/ui_i18n.h"
#include "ui/ui_memory.h"
#include "ui/theme/theme_default.h"

static const char *TAG = "w_heating_tile";

#define HEATING_ACTUAL_FONT APP_FONT_DISPLAY_38

#if LV_FONT_MONTSERRAT_20
#define HEATING_TARGET_FONT APP_FONT_TEXT_16
#elif LV_FONT_MONTSERRAT_18
#define HEATING_TARGET_FONT APP_FONT_TEXT_16
#elif LV_FONT_MONTSERRAT_16
#define HEATING_TARGET_FONT APP_FONT_TEXT_16
#else
#define HEATING_TARGET_FONT APP_FONT_TEXT_16
#endif

/* Bounds for the climate capability arrays parsed from HA attributes.
 * These caps are generous for real-world climate integrations (TRVs and
 * A/C units) while keeping the tile ctx struct size predictable. */
#define HEATING_MAX_HVAC_MODES 9
#define HEATING_MAX_FAN_MODES 8
#define HEATING_MAX_SWING_MODES 4
#define HEATING_MAX_PRESET_MODES 10

typedef struct {
    char climate_entity_id[APP_MAX_ENTITY_ID_LEN];
    char sensor_entity_id[APP_MAX_ENTITY_ID_LEN];
    bool is_on;
    bool arc_semi;
    char arc_opening[APP_MAX_UI_OPTION_LEN];
    float target_temp;
    float current_temp;
    bool has_current_temp;
    char status_text[32];
    lv_obj_t *icon_label;
    lv_obj_t *title_label;
    lv_obj_t *arc;
    lv_obj_t *target_label;
    lv_obj_t *actual_label;
    lv_obj_t *status_label;
    lv_obj_t *minus_btn;
    lv_obj_t *plus_btn;
    lv_obj_t *min_label;
    lv_obj_t *max_label;

    /* Full climate capability/state, used by the tap-to-open popup and by
     * the mode-aware arc accent color. Populated from the climate entity's
     * attributes_json on every apply_state call. */
    char hvac_modes[HEATING_MAX_HVAC_MODES][16];
    int hvac_mode_count;
    char fan_modes[HEATING_MAX_FAN_MODES][16];
    int fan_mode_count;
    char swing_modes[HEATING_MAX_SWING_MODES][8];
    int swing_mode_count;
    char preset_modes[HEATING_MAX_PRESET_MODES][24];
    int preset_mode_count;

    char cur_hvac[16];
    char cur_fan[16];
    char cur_swing[8];
    char cur_preset[24];

    float min_temp;
    float max_temp;
    float target_temp_step;

    lv_obj_t *card;          /* same as the widget instance obj; cached for popup callbacks */
    lv_obj_t *popup_overlay; /* non-NULL while the full climate popup is open */
} w_heating_tile_ctx_t;

typedef struct {
    float target_temp;
    float current_temp;
    bool has_current_temp;
    char status_text[32];

    char hvac_modes[HEATING_MAX_HVAC_MODES][16];
    int hvac_mode_count;
    char fan_modes[HEATING_MAX_FAN_MODES][16];
    int fan_mode_count;
    char swing_modes[HEATING_MAX_SWING_MODES][8];
    int swing_mode_count;
    char preset_modes[HEATING_MAX_PRESET_MODES][24];
    int preset_mode_count;

    char cur_hvac[16];
    char cur_fan[16];
    char cur_swing[8];
    char cur_preset[24];

    float min_temp;
    float max_temp;
    float target_temp_step;
} heating_values_t;

#define HEATING_ICON_SYMBOL_CP 0xF011U
#define HEATING_ARC_SIZE_MIN 140
#define HEATING_ARC_SIZE_MAX 340

static bool heating_icon_symbol_available(void)
{
    static bool checked = false;
    static bool available = false;

    if (!checked) {
        checked = true;
        lv_font_glyph_dsc_t dsc = {0};
        available = lv_font_get_glyph_dsc(LV_FONT_DEFAULT, &dsc, HEATING_ICON_SYMBOL_CP, 0);
    }

    return available;
}

static const char *heating_icon_text(void)
{
    return heating_icon_symbol_available() ? LV_SYMBOL_POWER : "H";
}

static bool heating_parse_float_relaxed(const char *text, float *out_value)
{
    if (text == NULL || out_value == NULL || text[0] == '\0') {
        return false;
    }

    char buf[32] = {0};
    size_t n = strnlen(text, sizeof(buf) - 1U);
    for (size_t i = 0; i < n; i++) {
        buf[i] = (text[i] == ',') ? '.' : text[i];
    }
    buf[n] = '\0';

    char *end = NULL;
    float parsed = strtof(buf, &end);
    if (end == buf) {
        return false;
    }
    *out_value = parsed;
    return true;
}

static float clamp_temp(float value)
{
    if (value < 5.0f) {
        return 5.0f;
    }
    if (value > 30.0f) {
        return 30.0f;
    }
    return value;
}

/* Snap to nearest 0.5 degree step. */
static float snap_half_deg(float value)
{
    return (float)((int)(value * 2.0f + (value >= 0 ? 0.5f : -0.5f))) * 0.5f;
}

static void heating_copy_text(char *dst, size_t dst_size, const char *src)
{
    if (dst == NULL || dst_size == 0) {
        return;
    }
    if (src == NULL) {
        dst[0] = '\0';
        return;
    }
    snprintf(dst, dst_size, "%.*s", (int)(dst_size - 1U), src);
}

static bool heating_state_is_on(const char *state)
{
    if (state == NULL || state[0] == '\0') {
        return false;
    }
    if (strcmp(state, "off") == 0 || strcmp(state, "unavailable") == 0 || strcmp(state, "unknown") == 0) {
        return false;
    }
    return true;
}

/* Generic mode-color accent hex values (radiator "heat" mode keeps using the
 * existing theme-driven APP_UI_COLOR_HEAT_* palette). */
#define HEATING_ACCENT_COOL 0x42A5F5U
#define HEATING_ACCENT_DRY 0x9575CDU
#define HEATING_ACCENT_FAN_ONLY 0x4FC3F7U
#define HEATING_ACCENT_AUTO 0x66BB6AU

/* Mode-aware accent used for the arc indicator/knob when the device is on.
 * "heat" (or an empty/unset hvac_mode, i.e. plain radiators/TRVs) keeps the
 * existing theme heat colors; A/C-only modes get a distinct tint so cooling,
 * drying, fan-only and auto are visually distinguishable at a glance. */
static lv_color_t heating_mode_accent(bool on, const char *hvac_mode)
{
    if (!on) {
        return lv_color_hex(APP_UI_COLOR_HEAT_IND_OFF);
    }
    if (hvac_mode != NULL) {
        if (strcmp(hvac_mode, "cool") == 0) {
            return lv_color_hex(HEATING_ACCENT_COOL);
        }
        if (strcmp(hvac_mode, "dry") == 0) {
            return lv_color_hex(HEATING_ACCENT_DRY);
        }
        if (strcmp(hvac_mode, "fan_only") == 0) {
            return lv_color_hex(HEATING_ACCENT_FAN_ONLY);
        }
        if (strcmp(hvac_mode, "auto") == 0) {
            return lv_color_hex(HEATING_ACCENT_AUTO);
        }
    }
    /* "heat", empty or any other/unset mode: default heating accent. */
    return lv_color_hex(APP_UI_COLOR_HEAT_IND_ON);
}

/* Parses a cJSON string array attribute into a fixed-size table of bounded
 * C strings. out_base points at the first element of a char[cap][elem_stride]
 * array; addressing is done manually because the element width varies per
 * capability category (hvac/fan/swing/preset). Returns the number of entries
 * copied (capped at `cap`). Entities that omit the attribute or provide a
 * non-array value simply yield a count of 0 (defaults apply upstream). */
static int heating_parse_string_array(cJSON *attrs, const char *key, char *out_base, size_t elem_stride, int cap)
{
    if (attrs == NULL || out_base == NULL || elem_stride == 0 || cap <= 0) {
        return 0;
    }
    cJSON *arr = cJSON_GetObjectItemCaseSensitive(attrs, key);
    if (!cJSON_IsArray(arr)) {
        return 0;
    }

    int count = 0;
    cJSON *item = NULL;
    cJSON_ArrayForEach(item, arr)
    {
        if (count >= cap) {
            break;
        }
        if (cJSON_IsString(item) && item->valuestring != NULL) {
            char *dst = out_base + ((size_t)count * elem_stride);
            snprintf(dst, elem_stride, "%s", item->valuestring);
            count++;
        }
    }
    return count;
}

static void heating_extract_climate_values(const ha_state_t *state, heating_values_t *out)
{
    if (state == NULL || out == NULL) {
        return;
    }

    out->target_temp = 20.0f;
    out->current_temp = 20.0f;
    out->has_current_temp = false;
    out->status_text[0] = '\0';
    bool has_target_temp = false;

    /* Climate capability/state defaults, used when the entity omits an
     * attribute (plain radiator/TRV integrations typically don't expose
     * fan/swing/preset at all, and min/max/step are commonly absent too). */
    out->min_temp = 5.0f;
    out->max_temp = 30.0f;
    out->target_temp_step = 0.5f;
    out->hvac_mode_count = 0;
    out->fan_mode_count = 0;
    out->swing_mode_count = 0;
    out->preset_mode_count = 0;
    out->cur_hvac[0] = '\0';
    out->cur_fan[0] = '\0';
    out->cur_swing[0] = '\0';
    out->cur_preset[0] = '\0';

    /* The climate domain's canonical current hvac mode is the entity state
     * itself (e.g. "heat", "cool", "auto", "off"), not a separate attribute. */
    if (heating_state_is_on(state->state) || strcmp(state->state, "off") == 0) {
        heating_copy_text(out->cur_hvac, sizeof(out->cur_hvac), state->state);
    }

    cJSON *attrs = cJSON_Parse(state->attributes_json);
    if (attrs != NULL) {
        cJSON *temperature = cJSON_GetObjectItemCaseSensitive(attrs, "temperature");
        if (cJSON_IsNumber(temperature)) {
            out->target_temp = (float)temperature->valuedouble;
            has_target_temp = true;
        }

        cJSON *current_temperature = cJSON_GetObjectItemCaseSensitive(attrs, "current_temperature");
        if (cJSON_IsNumber(current_temperature)) {
            out->current_temp = (float)current_temperature->valuedouble;
            out->has_current_temp = true;
        }

        cJSON *hvac_action = cJSON_GetObjectItemCaseSensitive(attrs, "hvac_action");
        if (cJSON_IsString(hvac_action) && hvac_action->valuestring != NULL && hvac_action->valuestring[0] != '\0') {
            heating_copy_text(out->status_text, sizeof(out->status_text), hvac_action->valuestring);
        }

        cJSON *min_temp = cJSON_GetObjectItemCaseSensitive(attrs, "min_temp");
        if (cJSON_IsNumber(min_temp)) {
            out->min_temp = (float)min_temp->valuedouble;
        }
        cJSON *max_temp = cJSON_GetObjectItemCaseSensitive(attrs, "max_temp");
        if (cJSON_IsNumber(max_temp)) {
            out->max_temp = (float)max_temp->valuedouble;
        }
        cJSON *target_temp_step = cJSON_GetObjectItemCaseSensitive(attrs, "target_temp_step");
        if (cJSON_IsNumber(target_temp_step) && target_temp_step->valuedouble > 0.0) {
            out->target_temp_step = (float)target_temp_step->valuedouble;
        }
        if (out->max_temp <= out->min_temp) {
            out->max_temp = out->min_temp + 25.0f;
        }

        /* Fallback/override for the current hvac mode: some non-standard
         * integrations mirror it into an attribute as well as the state. */
        cJSON *hvac_mode = cJSON_GetObjectItemCaseSensitive(attrs, "hvac_mode");
        if (out->cur_hvac[0] == '\0' && cJSON_IsString(hvac_mode) && hvac_mode->valuestring != NULL) {
            heating_copy_text(out->cur_hvac, sizeof(out->cur_hvac), hvac_mode->valuestring);
        }

        cJSON *fan_mode = cJSON_GetObjectItemCaseSensitive(attrs, "fan_mode");
        if (cJSON_IsString(fan_mode) && fan_mode->valuestring != NULL) {
            heating_copy_text(out->cur_fan, sizeof(out->cur_fan), fan_mode->valuestring);
        }
        cJSON *swing_mode = cJSON_GetObjectItemCaseSensitive(attrs, "swing_mode");
        if (cJSON_IsString(swing_mode) && swing_mode->valuestring != NULL) {
            heating_copy_text(out->cur_swing, sizeof(out->cur_swing), swing_mode->valuestring);
        }
        cJSON *preset_mode = cJSON_GetObjectItemCaseSensitive(attrs, "preset_mode");
        if (cJSON_IsString(preset_mode) && preset_mode->valuestring != NULL) {
            heating_copy_text(out->cur_preset, sizeof(out->cur_preset), preset_mode->valuestring);
        }

        out->hvac_mode_count = heating_parse_string_array(
            attrs, "hvac_modes", (char *)out->hvac_modes, sizeof(out->hvac_modes[0]), HEATING_MAX_HVAC_MODES);
        out->fan_mode_count = heating_parse_string_array(
            attrs, "fan_modes", (char *)out->fan_modes, sizeof(out->fan_modes[0]), HEATING_MAX_FAN_MODES);
        out->swing_mode_count = heating_parse_string_array(
            attrs, "swing_modes", (char *)out->swing_modes, sizeof(out->swing_modes[0]), HEATING_MAX_SWING_MODES);
        out->preset_mode_count = heating_parse_string_array(
            attrs, "preset_modes", (char *)out->preset_modes, sizeof(out->preset_modes[0]), HEATING_MAX_PRESET_MODES);

        cJSON_Delete(attrs);
    }

    if (!has_target_temp) {
        char *end = NULL;
        float parsed = strtof(state->state, &end);
        if (end != state->state) {
            out->target_temp = parsed;
        }
    }

    out->target_temp = clamp_temp(out->target_temp);
    out->current_temp = clamp_temp(out->current_temp);

    if (out->status_text[0] == '\0' && state->state[0] != '\0') {
        heating_copy_text(out->status_text, sizeof(out->status_text), state->state);
    }
}

static bool heating_extract_sensor_temp(const ha_state_t *state, float *out_temp)
{
    if (state == NULL || out_temp == NULL) {
        return false;
    }

    float parsed = 0.0f;
    if (heating_parse_float_relaxed(state->state, &parsed)) {
        *out_temp = clamp_temp(parsed);
        return true;
    }

    cJSON *attrs = cJSON_Parse(state->attributes_json);
    if (attrs != NULL) {
        cJSON *value = cJSON_GetObjectItemCaseSensitive(attrs, "temperature");
        if (cJSON_IsNumber(value)) {
            *out_temp = clamp_temp((float)value->valuedouble);
            cJSON_Delete(attrs);
            return true;
        }
        cJSON_Delete(attrs);
    }

    return false;
}

static void heating_set_target_label(lv_obj_t *label, float value)
{
    if (label == NULL) {
        return;
    }
    char text[20] = {0};
    snprintf(text, sizeof(text), ui_i18n_get("heating.target_format", "Target %.1f C"), (double)clamp_temp(value));
    lv_label_set_text(label, text);
}

static void heating_set_actual_label(lv_obj_t *label, bool has_current_temp, float current_temp, const char *status_text)
{
    if (label == NULL) {
        return;
    }

    if (has_current_temp) {
        char text[20] = {0};
        snprintf(text, sizeof(text), "%.1f C", (double)clamp_temp(current_temp));
        lv_label_set_text(label, text);
        return;
    }
    if (status_text != NULL && status_text[0] != '\0') {
        lv_label_set_text(label, status_text);
    } else {
        lv_label_set_text(label, "--.- C");
    }
}

static void heating_set_status_label(lv_obj_t *label, bool is_on, const char *status_text)
{
    if (label == NULL) {
        return;
    }

    if (status_text != NULL && status_text[0] != '\0') {
        char text[40] = {0};
        size_t out = 0;
        for (size_t i = 0; status_text[i] != '\0' && out + 1 < sizeof(text); i++) {
            char c = status_text[i];
            if (c == '_') {
                c = ' ';
            }
            if (c >= 'A' && c <= 'Z') {
                c = (char)(c + ('a' - 'A'));
            }
            text[out++] = c;
        }
        text[out] = '\0';
        if (strcmp(text, "on") == 0) {
            lv_label_set_text(label, ui_i18n_get("common.on", "ON"));
        } else if (strcmp(text, "off") == 0) {
            lv_label_set_text(label, ui_i18n_get("common.off", "OFF"));
        } else if (strcmp(text, "unavailable") == 0) {
            lv_label_set_text(label, ui_i18n_get("common.unavailable", "unavailable"));
        } else if (strcmp(text, "heating") == 0) {
            lv_label_set_text(label, ui_i18n_get("heating.active", "heating active"));
        } else {
            lv_label_set_text(label, text);
        }
        return;
    }

    lv_label_set_text(
        label, is_on ? ui_i18n_get("heating.active", "heating active") : ui_i18n_get("common.off", "OFF"));
}

static void heating_apply_layout(lv_obj_t *card, w_heating_tile_ctx_t *ctx)
{
    if (card == NULL || ctx == NULL || ctx->arc == NULL || ctx->target_label == NULL ||
        ctx->actual_label == NULL || ctx->status_label == NULL) {
        return;
    }

    int card_w = lv_obj_get_width(card);
    int card_h = lv_obj_get_height(card);

    if (ctx->arc_semi) {
        /* Semi arc variant: big semicircle filling card with opening on one side. */
        int arc_size = (card_w < card_h ? card_w : card_h) - 24;
        if (arc_size < HEATING_ARC_SIZE_MIN) {
            arc_size = HEATING_ARC_SIZE_MIN;
        }
        lv_obj_set_size(ctx->arc, arc_size, arc_size);
        lv_obj_align(ctx->arc, LV_ALIGN_CENTER, 0, 0);

        /* Center labels: target above actual. */
        lv_obj_align(ctx->target_label, LV_ALIGN_CENTER, 0, -14);
        lv_obj_align(ctx->actual_label, LV_ALIGN_CENTER, 0, 22);
        lv_obj_align(ctx->status_label, LV_ALIGN_BOTTOM_MID, 0, -8);

        /* +/- buttons positioned opposite the opening. */
        int pad = 10;
        const char *op = ctx->arc_opening;
        if (ctx->minus_btn != NULL && ctx->plus_btn != NULL) {
            if (strcmp(op, "left") == 0) {
                lv_obj_align(ctx->minus_btn, LV_ALIGN_LEFT_MID, pad, 40);
                lv_obj_align(ctx->plus_btn, LV_ALIGN_LEFT_MID, pad, -40);
            } else if (strcmp(op, "right") == 0) {
                lv_obj_align(ctx->minus_btn, LV_ALIGN_RIGHT_MID, -pad, 40);
                lv_obj_align(ctx->plus_btn, LV_ALIGN_RIGHT_MID, -pad, -40);
            } else if (strcmp(op, "top") == 0) {
                lv_obj_align(ctx->minus_btn, LV_ALIGN_TOP_MID, -40, pad);
                lv_obj_align(ctx->plus_btn, LV_ALIGN_TOP_MID, 40, pad);
            } else { /* bottom */
                lv_obj_align(ctx->minus_btn, LV_ALIGN_BOTTOM_MID, -40, -pad);
                lv_obj_align(ctx->plus_btn, LV_ALIGN_BOTTOM_MID, 40, -pad);
            }
        }
        /* Min / max labels near arc ends (opposite opening). */
        if (ctx->min_label != NULL && ctx->max_label != NULL) {
            if (strcmp(op, "left") == 0) {
                lv_obj_align(ctx->min_label, LV_ALIGN_TOP_RIGHT, -14, 24);
                lv_obj_align(ctx->max_label, LV_ALIGN_BOTTOM_RIGHT, -14, -24);
            } else if (strcmp(op, "right") == 0) {
                lv_obj_align(ctx->min_label, LV_ALIGN_TOP_LEFT, 14, 24);
                lv_obj_align(ctx->max_label, LV_ALIGN_BOTTOM_LEFT, 14, -24);
            } else if (strcmp(op, "top") == 0) {
                lv_obj_align(ctx->min_label, LV_ALIGN_BOTTOM_LEFT, 24, -14);
                lv_obj_align(ctx->max_label, LV_ALIGN_BOTTOM_RIGHT, -24, -14);
            } else {
                lv_obj_align(ctx->min_label, LV_ALIGN_TOP_LEFT, 24, 14);
                lv_obj_align(ctx->max_label, LV_ALIGN_TOP_RIGHT, -24, 14);
            }
        }
        return;
    }

    /* Keep arc fully inside the card to avoid expensive clipping/mask paths on rounded tiles. */
    int arc_size = card_w - 38;
    int max_arc_h = card_h - 70;
    if (arc_size > max_arc_h) {
        arc_size = max_arc_h;
    }
    if (arc_size < HEATING_ARC_SIZE_MIN) {
        arc_size = HEATING_ARC_SIZE_MIN;
    }
    if (arc_size > HEATING_ARC_SIZE_MAX) {
        arc_size = HEATING_ARC_SIZE_MAX;
    }

    int arc_y = 16;
    if (card_h >= 320) {
        arc_y = 22;
    } else if (card_h >= 280) {
        arc_y = 18;
    }

    /* Clamp Y offset so the arc never spills out of the card. */
    int arc_y_max = (card_h / 2) - 8 - (arc_size / 2);
    if (arc_y > arc_y_max) {
        arc_y = arc_y_max;
    }
    if (arc_y < -arc_y_max) {
        arc_y = -arc_y_max;
    }

    lv_obj_set_size(ctx->arc, arc_size, arc_size);
    lv_obj_align(ctx->arc, LV_ALIGN_CENTER, 0, arc_y);

    int center_y = (card_h / 2) + arc_y;
    int target_y = center_y + ((card_h >= 300) ? 8 : 6);
    int actual_y = target_y + ((card_h >= 300) ? 46 : 40);
    int status_y = card_h - 34;

    if (actual_y > (status_y - 30)) {
        actual_y = status_y - 30;
    }
    if (target_y > (actual_y - 36)) {
        target_y = actual_y - 36;
    }
    if (target_y < 90) {
        target_y = 90;
    }

    lv_obj_align(ctx->target_label, LV_ALIGN_TOP_MID, 0, target_y);
    lv_obj_align(ctx->actual_label, LV_ALIGN_TOP_MID, 0, actual_y);
    lv_obj_align(ctx->status_label, LV_ALIGN_TOP_MID, 0, status_y);
}

static void heating_apply_visual(lv_obj_t *card, w_heating_tile_ctx_t *ctx, bool allow_status_fallback)
{
    if (card == NULL || ctx == NULL) {
        return;
    }
    lv_obj_t *icon = ctx->icon_label;
    lv_obj_t *title = ctx->title_label;
    lv_obj_t *arc = ctx->arc;
    lv_obj_t *target_label = ctx->target_label;
    lv_obj_t *actual_label = ctx->actual_label;
    lv_obj_t *status_label = ctx->status_label;
    if (icon == NULL || title == NULL || arc == NULL || target_label == NULL || actual_label == NULL || status_label == NULL) {
        return;
    }

    bool is_on = ctx->is_on;
    float target_temp = ctx->target_temp;
    bool has_current_temp = ctx->has_current_temp;
    float current_temp = ctx->current_temp;
    const char *status_text = ctx->status_text;

    lv_obj_set_style_bg_color(
        card, is_on ? lv_color_hex(APP_UI_COLOR_CARD_BG_ON) : lv_color_hex(APP_UI_COLOR_CARD_BG_OFF), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(card, LV_OPA_COVER, LV_PART_MAIN);
    lv_obj_set_style_text_color(
        icon, is_on ? lv_color_hex(APP_UI_COLOR_HEAT_ICON_ON) : lv_color_hex(APP_UI_COLOR_CARD_ICON_OFF), LV_PART_MAIN);
    lv_obj_set_style_text_color(title, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY), LV_PART_MAIN);
    lv_obj_set_style_text_color(target_label, lv_color_hex(APP_UI_COLOR_TEXT_SOFT), LV_PART_MAIN);
    lv_obj_set_style_text_color(actual_label, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY), LV_PART_MAIN);
    lv_obj_set_style_text_color(status_label, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), LV_PART_MAIN);

    lv_obj_set_style_arc_color(
        arc, is_on ? lv_color_hex(APP_UI_COLOR_HEAT_TRACK_ON) : lv_color_hex(APP_UI_COLOR_HEAT_TRACK_OFF), LV_PART_MAIN);
    lv_obj_set_style_arc_opa(arc, LV_OPA_COVER, LV_PART_MAIN);
    lv_obj_set_style_arc_width(arc, (lv_obj_get_width(card) >= 300) ? 16 : 15, LV_PART_MAIN);
    lv_obj_set_style_arc_rounded(arc, true, LV_PART_MAIN);

    lv_color_t mode_accent_color = heating_mode_accent(is_on, ctx->cur_hvac);

    lv_obj_set_style_arc_color(arc, mode_accent_color, LV_PART_INDICATOR);
    lv_obj_set_style_arc_opa(arc, LV_OPA_COVER, LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(arc, (lv_obj_get_width(card) >= 300) ? 16 : 15, LV_PART_INDICATOR);
    lv_obj_set_style_arc_rounded(arc, true, LV_PART_INDICATOR);

    lv_obj_set_style_bg_color(arc, mode_accent_color, LV_PART_KNOB);
    lv_obj_set_style_bg_opa(arc, LV_OPA_COVER, LV_PART_KNOB);

    if (ctx->arc_semi) {
        if (ctx->minus_btn != NULL) {
            lv_obj_set_style_bg_color(ctx->minus_btn, mode_accent_color, LV_PART_MAIN);
        }
        if (ctx->plus_btn != NULL) {
            lv_obj_set_style_bg_color(ctx->plus_btn, mode_accent_color, LV_PART_MAIN);
        }
        if (ctx->min_label != NULL) {
            lv_obj_set_style_text_color(ctx->min_label, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), LV_PART_MAIN);
        }
        if (ctx->max_label != NULL) {
            lv_obj_set_style_text_color(ctx->max_label, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), LV_PART_MAIN);
        }
    }

    int arc_value = (int)(clamp_temp(target_temp) * 2.0f + 0.5f);
    lv_arc_set_value(arc, arc_value);
    heating_set_target_label(target_label, target_temp);
    heating_set_actual_label(actual_label, has_current_temp, current_temp, allow_status_fallback ? status_text : "");
    heating_set_status_label(status_label, is_on, status_text);
    heating_apply_layout(card, ctx);
}

static void heating_apply_from_ctx(lv_obj_t *card, const w_heating_tile_ctx_t *ctx)
{
    if (ctx == NULL || card == NULL) {
        return;
    }
    bool allow_status_fallback = (ctx->sensor_entity_id[0] == '\0');
    heating_apply_visual(card, (w_heating_tile_ctx_t *)ctx, allow_status_fallback);
}

/* Shared power toggle, reused by the (now removed) card-click toggle and by
 * the popup's On/Off button for climate entities that don't expose
 * hvac_modes at all. */
static void heating_toggle_power(w_heating_tile_ctx_t *ctx, lv_obj_t *card)
{
    if (ctx == NULL) {
        return;
    }
    bool prev_is_on = ctx->is_on;
    char prev_status[sizeof(ctx->status_text)] = {0};
    heating_copy_text(prev_status, sizeof(prev_status), ctx->status_text);
    bool next_is_on = !ctx->is_on;

    esp_err_t err = ui_bindings_toggle_entity(ctx->climate_entity_id);
    if (err == ESP_OK) {
        ctx->is_on = next_is_on;
        heating_copy_text(ctx->status_text, sizeof(ctx->status_text), ctx->is_on ? "on" : "off");
    } else {
        ctx->is_on = prev_is_on;
        heating_copy_text(ctx->status_text, sizeof(ctx->status_text), prev_status);
    }
    if (card != NULL) {
        heating_apply_from_ctx(card, ctx);
    }
}

/* --- Human-readable mode labels (i18n with English fallback) ----------- */

static const char *heating_hvac_mode_label(const char *mode)
{
    if (mode == NULL) {
        return "";
    }
    if (strcmp(mode, "off") == 0) {
        return ui_i18n_get("climate.hvac.off", "Off");
    }
    if (strcmp(mode, "auto") == 0) {
        return ui_i18n_get("climate.hvac.auto", "Auto");
    }
    if (strcmp(mode, "heat") == 0) {
        return ui_i18n_get("climate.hvac.heat", "Heat");
    }
    if (strcmp(mode, "cool") == 0) {
        return ui_i18n_get("climate.hvac.cool", "Cool");
    }
    if (strcmp(mode, "dry") == 0) {
        return ui_i18n_get("climate.hvac.dry", "Dry");
    }
    if (strcmp(mode, "fan_only") == 0) {
        return ui_i18n_get("climate.hvac.fan_only", "Fan only");
    }
    return mode;
}

static const char *heating_fan_mode_label(const char *mode)
{
    if (mode == NULL) {
        return "";
    }
    if (strcmp(mode, "auto") == 0) {
        return ui_i18n_get("climate.fan.auto", "Auto");
    }
    if (strcmp(mode, "low") == 0) {
        return ui_i18n_get("climate.fan.low", "Low");
    }
    if (strcmp(mode, "medium") == 0) {
        return ui_i18n_get("climate.fan.medium", "Medium");
    }
    if (strcmp(mode, "high") == 0) {
        return ui_i18n_get("climate.fan.high", "High");
    }
    if (strcmp(mode, "on") == 0) {
        return ui_i18n_get("climate.fan.on", "On");
    }
    if (strcmp(mode, "off") == 0) {
        return ui_i18n_get("climate.fan.off", "Off");
    }
    return mode;
}

static const char *heating_swing_mode_label(const char *mode)
{
    if (mode == NULL) {
        return "";
    }
    if (strcmp(mode, "on") == 0) {
        return ui_i18n_get("climate.swing.on", "On");
    }
    if (strcmp(mode, "off") == 0) {
        return ui_i18n_get("climate.swing.off", "Off");
    }
    return mode;
}

/* Unknown preset values are capitalized (first letter only) into `buf` and
 * returned from there; known presets return a static i18n string directly. */
static const char *heating_preset_mode_label(const char *mode, char *buf, size_t buf_size)
{
    if (mode == NULL) {
        return "";
    }
    if (strcmp(mode, "none") == 0) {
        return ui_i18n_get("climate.preset.none", "None");
    }
    if (strcmp(mode, "comfort") == 0) {
        return ui_i18n_get("climate.preset.comfort", "Comfort");
    }
    if (strcmp(mode, "eco") == 0) {
        return ui_i18n_get("climate.preset.eco", "Eco");
    }
    if (strcmp(mode, "away") == 0) {
        return ui_i18n_get("climate.preset.away", "Away");
    }
    if (strcmp(mode, "boost") == 0) {
        return ui_i18n_get("climate.preset.boost", "Boost");
    }
    if (strcmp(mode, "sleep") == 0) {
        return ui_i18n_get("climate.preset.sleep", "Sleep");
    }
    if (strcmp(mode, "home") == 0) {
        return ui_i18n_get("climate.preset.home", "Home");
    }
    if (buf == NULL || buf_size == 0) {
        return mode;
    }
    snprintf(buf, buf_size, "%s", mode);
    if (buf[0] >= 'a' && buf[0] <= 'z') {
        buf[0] = (char)(buf[0] - ('a' - 'A'));
    }
    return buf;
}

/* --- Full climate popup -------------------------------------------------
 * Mirrors the fullscreen tap-to-set overlay pattern from w_number.c:
 * lv_layer_top() + centered card + a per-popup heap ctx freed on the
 * overlay's LV_EVENT_DELETE. The popup snapshots capability lists from the
 * tile ctx at open time and is not live-refreshed while open (same as
 * w_number's popup). */

typedef struct {
    w_heating_tile_ctx_t *tile;
    lv_obj_t *overlay;
    lv_obj_t *card;
    lv_obj_t *value_label;
    lv_obj_t *slider;
    float min;
    float max;
    float step;
    int step_count;

    lv_obj_t *power_toggle_btn;

    lv_obj_t *hvac_chips[HEATING_MAX_HVAC_MODES];
    char hvac_chip_values[HEATING_MAX_HVAC_MODES][16];
    int hvac_chip_count;

    lv_obj_t *fan_chips[HEATING_MAX_FAN_MODES];
    char fan_chip_values[HEATING_MAX_FAN_MODES][16];
    int fan_chip_count;

    lv_obj_t *swing_chips[HEATING_MAX_SWING_MODES];
    char swing_chip_values[HEATING_MAX_SWING_MODES][8];
    int swing_chip_count;

    lv_obj_t *preset_chips[HEATING_MAX_PRESET_MODES];
    char preset_chip_values[HEATING_MAX_PRESET_MODES][24];
    int preset_chip_count;
} w_heating_popup_ctx_t;

static int heating_popup_value_to_index(const w_heating_popup_ctx_t *popup, float value)
{
    if (popup == NULL || popup->step <= 0.0f) {
        return 0;
    }
    float idx = (value - popup->min) / popup->step;
    long idx_rounded = (idx >= 0.0f) ? (long)(idx + 0.5f) : (long)(idx - 0.5f);
    if (idx_rounded < 0) {
        idx_rounded = 0;
    }
    if (idx_rounded > popup->step_count) {
        idx_rounded = popup->step_count;
    }
    return (int)idx_rounded;
}

static float heating_popup_index_to_value(const w_heating_popup_ctx_t *popup, int index)
{
    if (popup == NULL) {
        return 0.0f;
    }
    float value = popup->min + ((float)index * popup->step);
    if (value < popup->min) {
        value = popup->min;
    }
    if (value > popup->max) {
        value = popup->max;
    }
    return value;
}

static void heating_popup_set_value_label(lv_obj_t *label, float value)
{
    if (label == NULL) {
        return;
    }
    char text[24] = {0};
    snprintf(text, sizeof(text), "%.1f C", (double)value);
    lv_label_set_text(label, text);
}

static void heating_popup_delete_event_cb(lv_event_t *event)
{
    if (lv_event_get_code(event) != LV_EVENT_DELETE) {
        return;
    }
    w_heating_popup_ctx_t *popup = (w_heating_popup_ctx_t *)lv_event_get_user_data(event);
    if (popup == NULL) {
        return;
    }
    if (popup->tile != NULL && popup->tile->popup_overlay == popup->overlay) {
        popup->tile->popup_overlay = NULL;
    }
    free(popup);
}

static void heating_popup_close_event_cb(lv_event_t *event)
{
    if (lv_event_get_code(event) != LV_EVENT_CLICKED) {
        return;
    }
    w_heating_popup_ctx_t *popup = (w_heating_popup_ctx_t *)lv_event_get_user_data(event);
    if (popup != NULL && popup->overlay != NULL) {
        lv_obj_del(popup->overlay);
    }
}

static void heating_popup_slider_event_cb(lv_event_t *event)
{
    lv_event_code_t code = lv_event_get_code(event);
    if (code != LV_EVENT_VALUE_CHANGED && code != LV_EVENT_RELEASED) {
        return;
    }
    w_heating_popup_ctx_t *popup = (w_heating_popup_ctx_t *)lv_event_get_user_data(event);
    lv_obj_t *slider = lv_event_get_target(event);
    if (popup == NULL || slider == NULL || popup->tile == NULL) {
        return;
    }
    int index = (int)lv_slider_get_value(slider);
    float value = heating_popup_index_to_value(popup, index);
    heating_popup_set_value_label(popup->value_label, value);

    if (code == LV_EVENT_RELEASED) {
        float prev_value = popup->tile->target_temp;
        esp_err_t rc = ui_bindings_set_climate_target_c(popup->tile->climate_entity_id, value);
        ESP_LOGI(TAG, "set target_c entity=%s idx=%d val=%.2f rc=%s", popup->tile->climate_entity_id, index,
                 (double)value, esp_err_to_name(rc));
        if (rc == ESP_OK) {
            popup->tile->target_temp = value;
            if (popup->tile->card != NULL) {
                heating_apply_from_ctx(popup->tile->card, popup->tile);
            }
        } else {
            int reset_index = heating_popup_value_to_index(popup, prev_value);
            lv_slider_set_value(slider, reset_index, LV_ANIM_OFF);
            heating_popup_set_value_label(popup->value_label, prev_value);
        }
    }
}

/* Restyles a single chip button: accent-filled + light text when active,
 * idle card-toned background + primary text otherwise. */
static void heating_popup_style_chip(lv_obj_t *chip, bool active, lv_color_t accent_color)
{
    if (chip == NULL) {
        return;
    }
    lv_obj_t *label = lv_obj_get_child(chip, 0);
    if (active) {
        lv_obj_set_style_bg_color(chip, accent_color, LV_PART_MAIN);
        lv_obj_set_style_bg_opa(chip, LV_OPA_COVER, LV_PART_MAIN);
        lv_obj_set_style_border_width(chip, 0, LV_PART_MAIN);
        if (label != NULL) {
            lv_obj_set_style_text_color(label, lv_color_white(), LV_PART_MAIN);
        }
    } else {
        lv_obj_set_style_bg_color(chip, lv_color_hex(APP_UI_COLOR_NAV_BTN_BG_IDLE), LV_PART_MAIN);
        lv_obj_set_style_bg_opa(chip, LV_OPA_COVER, LV_PART_MAIN);
        lv_obj_set_style_border_width(chip, 1, LV_PART_MAIN);
        lv_obj_set_style_border_color(chip, lv_color_hex(APP_UI_COLOR_CARD_BORDER), LV_PART_MAIN);
        if (label != NULL) {
            lv_obj_set_style_text_color(label, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY), LV_PART_MAIN);
        }
    }
}

/* HVAC chips get a per-value accent (so e.g. "cool" previews blue) even
 * before it becomes the active mode; other chip rows use a single neutral
 * "active" accent since there is no per-value color scheme for fan/swing/
 * preset options. */
static void heating_popup_restyle_hvac_chips(w_heating_popup_ctx_t *popup)
{
    if (popup == NULL || popup->tile == NULL) {
        return;
    }
    for (int i = 0; i < popup->hvac_chip_count; i++) {
        const char *value = popup->hvac_chip_values[i];
        bool active = (popup->tile->cur_hvac[0] != '\0') && (strcmp(value, popup->tile->cur_hvac) == 0);
        lv_color_t accent = heating_mode_accent(true, value);
        heating_popup_style_chip(popup->hvac_chips[i], active, accent);
    }
}

static void heating_popup_restyle_generic_chips(
    lv_obj_t **chips, const char *values_base, size_t elem_stride, int count, const char *current)
{
    lv_color_t accent = lv_color_hex(APP_UI_COLOR_NAV_TAB_ACTIVE);
    for (int i = 0; i < count; i++) {
        const char *value = values_base + ((size_t)i * elem_stride);
        bool active = (current != NULL && current[0] != '\0') && (strcmp(value, current) == 0);
        heating_popup_style_chip(chips[i], active, accent);
    }
}

/* category: 0=hvac, 1=fan, 2=swing, 3=preset. Encoded into the chip's LVGL
 * user-data as (category * 1000 + index) so a single click handler can be
 * shared across every chip in the popup (same pattern used elsewhere in
 * this codebase, e.g. w_roborock.c / w_todo.c row index encoding). */
static void heating_popup_chip_event_cb(lv_event_t *event)
{
    if (lv_event_get_code(event) != LV_EVENT_CLICKED) {
        return;
    }
    w_heating_popup_ctx_t *popup = (w_heating_popup_ctx_t *)lv_event_get_user_data(event);
    lv_obj_t *chip = lv_event_get_target(event);
    if (popup == NULL || chip == NULL || popup->tile == NULL) {
        return;
    }
    uintptr_t encoded = (uintptr_t)lv_obj_get_user_data(chip);
    int category = (int)(encoded / 1000U);
    int index = (int)(encoded % 1000U);
    w_heating_tile_ctx_t *tile = popup->tile;

    switch (category) {
    case 0: {
        if (index < 0 || index >= popup->hvac_chip_count) {
            return;
        }
        const char *value = popup->hvac_chip_values[index];
        esp_err_t rc = ui_bindings_set_climate_hvac_mode(tile->climate_entity_id, value);
        ESP_LOGI(TAG, "set hvac_mode entity=%s value=%s rc=%s", tile->climate_entity_id, value, esp_err_to_name(rc));
        if (rc == ESP_OK) {
            heating_copy_text(tile->cur_hvac, sizeof(tile->cur_hvac), value);
            tile->is_on = heating_state_is_on(value);
            heating_copy_text(tile->status_text, sizeof(tile->status_text), value);
            heating_popup_restyle_hvac_chips(popup);
            if (tile->card != NULL) {
                heating_apply_from_ctx(tile->card, tile);
            }
        }
        break;
    }
    case 1: {
        if (index < 0 || index >= popup->fan_chip_count) {
            return;
        }
        const char *value = popup->fan_chip_values[index];
        esp_err_t rc = ui_bindings_set_climate_fan_mode(tile->climate_entity_id, value);
        ESP_LOGI(TAG, "set fan_mode entity=%s value=%s rc=%s", tile->climate_entity_id, value, esp_err_to_name(rc));
        if (rc == ESP_OK) {
            heating_copy_text(tile->cur_fan, sizeof(tile->cur_fan), value);
            heating_popup_restyle_generic_chips(popup->fan_chips, (const char *)popup->fan_chip_values,
                                                 sizeof(popup->fan_chip_values[0]), popup->fan_chip_count,
                                                 tile->cur_fan);
        }
        break;
    }
    case 2: {
        if (index < 0 || index >= popup->swing_chip_count) {
            return;
        }
        const char *value = popup->swing_chip_values[index];
        esp_err_t rc = ui_bindings_set_climate_swing_mode(tile->climate_entity_id, value);
        ESP_LOGI(TAG, "set swing_mode entity=%s value=%s rc=%s", tile->climate_entity_id, value, esp_err_to_name(rc));
        if (rc == ESP_OK) {
            heating_copy_text(tile->cur_swing, sizeof(tile->cur_swing), value);
            heating_popup_restyle_generic_chips(popup->swing_chips, (const char *)popup->swing_chip_values,
                                                 sizeof(popup->swing_chip_values[0]), popup->swing_chip_count,
                                                 tile->cur_swing);
        }
        break;
    }
    case 3: {
        if (index < 0 || index >= popup->preset_chip_count) {
            return;
        }
        const char *value = popup->preset_chip_values[index];
        esp_err_t rc = ui_bindings_set_climate_preset_mode(tile->climate_entity_id, value);
        ESP_LOGI(
            TAG, "set preset_mode entity=%s value=%s rc=%s", tile->climate_entity_id, value, esp_err_to_name(rc));
        if (rc == ESP_OK) {
            heating_copy_text(tile->cur_preset, sizeof(tile->cur_preset), value);
            heating_popup_restyle_generic_chips(popup->preset_chips, (const char *)popup->preset_chip_values,
                                                 sizeof(popup->preset_chip_values[0]), popup->preset_chip_count,
                                                 tile->cur_preset);
        }
        break;
    }
    default:
        break;
    }
}

static void heating_popup_power_toggle_event_cb(lv_event_t *event)
{
    if (lv_event_get_code(event) != LV_EVENT_CLICKED) {
        return;
    }
    w_heating_popup_ctx_t *popup = (w_heating_popup_ctx_t *)lv_event_get_user_data(event);
    if (popup == NULL || popup->tile == NULL) {
        return;
    }
    heating_toggle_power(popup->tile, popup->tile->card);

    lv_obj_t *btn = lv_event_get_target(event);
    lv_obj_t *label = lv_obj_get_child(btn, 0);
    if (label != NULL) {
        lv_label_set_text(label, popup->tile->is_on ? ui_i18n_get("common.on", "On") : ui_i18n_get("common.off", "Off"));
    }
    lv_obj_set_style_bg_color(btn,
                               popup->tile->is_on ? heating_mode_accent(true, popup->tile->cur_hvac)
                                                   : lv_color_hex(APP_UI_COLOR_NAV_BTN_BG_IDLE),
                               LV_PART_MAIN);
}

/* Builds a non-scrollable flex-row-wrap container used to host one row of
 * mode chips; its natural height grows to fit wrapped rows and participates
 * in the popup body's own flex-column stacking. */
static lv_obj_t *heating_popup_make_chip_row(lv_obj_t *parent)
{
    lv_obj_t *row = lv_obj_create(parent);
    lv_obj_remove_style_all(row);
    lv_obj_set_width(row, LV_PCT(100));
    lv_obj_set_height(row, LV_SIZE_CONTENT);
    lv_obj_set_flex_flow(row, LV_FLEX_FLOW_ROW_WRAP);
    lv_obj_set_style_pad_row(row, 10, LV_PART_MAIN);
    lv_obj_set_style_pad_column(row, 10, LV_PART_MAIN);
    lv_obj_clear_flag(row, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_clear_flag(row, LV_OBJ_FLAG_EVENT_BUBBLE);
    return row;
}

static lv_obj_t *heating_popup_make_chip(lv_obj_t *row, const char *label_text, int category, int index)
{
    lv_obj_t *chip = lv_btn_create(row);
    lv_obj_set_height(chip, 44);
    lv_obj_set_style_min_width(chip, 76, LV_PART_MAIN);
    lv_obj_set_style_radius(chip, 10, LV_PART_MAIN);
    lv_obj_set_style_pad_left(chip, 14, LV_PART_MAIN);
    lv_obj_set_style_pad_right(chip, 14, LV_PART_MAIN);
    lv_obj_clear_flag(chip, LV_OBJ_FLAG_EVENT_BUBBLE);
    lv_obj_set_user_data(chip, (void *)(uintptr_t)(category * 1000 + index));

    lv_obj_t *label = lv_label_create(chip);
    lv_label_set_text(label, label_text);
    lv_obj_set_style_text_font(label, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_center(label);
    return chip;
}

static lv_obj_t *heating_popup_make_caption(lv_obj_t *parent, const char *text)
{
    lv_obj_t *caption = lv_label_create(parent);
    lv_label_set_text(caption, text);
    lv_obj_set_width(caption, LV_PCT(100));
    lv_obj_set_style_text_font(caption, APP_FONT_TEXT_16, LV_PART_MAIN);
    lv_obj_set_style_text_color(caption, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), LV_PART_MAIN);
    return caption;
}

static void heating_open_popup(w_heating_tile_ctx_t *ctx)
{
    if (ctx == NULL || ctx->climate_entity_id[0] == '\0' || ctx->popup_overlay != NULL) {
        return;
    }
    if (strcmp(ctx->status_text, "unavailable") == 0) {
        return;
    }

    w_heating_popup_ctx_t *popup = ui_calloc_prefer_psram(1, sizeof(*popup));
    if (popup == NULL) {
        return;
    }
    popup->tile = ctx;
    popup->min = (ctx->max_temp > ctx->min_temp) ? ctx->min_temp : 5.0f;
    popup->max = (ctx->max_temp > ctx->min_temp) ? ctx->max_temp : 30.0f;
    popup->step = (ctx->target_temp_step > 0.0f) ? ctx->target_temp_step : 0.5f;
    float span = popup->max - popup->min;
    int step_count = (span > 0.0f) ? (int)((span / popup->step) + 0.5f) : 1;
    if (step_count < 1) {
        step_count = 1;
    }
    if (step_count > 2000) {
        step_count = 2000;
    }
    popup->step_count = step_count;

    ESP_LOGI(TAG,
             "open climate popup entity=%s min=%.2f max=%.2f step=%.2f count=%d hvac=%d fan=%d swing=%d preset=%d "
             "cur_hvac=%s",
             ctx->climate_entity_id, (double)popup->min, (double)popup->max, (double)popup->step, step_count,
             ctx->hvac_mode_count, ctx->fan_mode_count, ctx->swing_mode_count, ctx->preset_mode_count,
             (ctx->cur_hvac[0] != '\0') ? ctx->cur_hvac : "-");

    lv_obj_t *screen = lv_scr_act();
    lv_obj_update_layout(screen);
    int screen_w = lv_obj_get_width(screen);
    int screen_h = lv_obj_get_height(screen);
    if (screen_w <= 0) {
        screen_w = 1024;
    }
    if (screen_h <= 0) {
        screen_h = 600;
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
    lv_obj_add_event_cb(popup->overlay, heating_popup_delete_event_cb, LV_EVENT_DELETE, popup);

    int card_w = screen_w - 64;
    if (card_w > 920) {
        card_w = 920;
    }
    if (card_w > screen_w - 16) {
        card_w = screen_w - 16;
    }
    if (card_w < 260) {
        card_w = 260;
    }
    int card_max_h = screen_h - 32;
    if (card_max_h < 120) {
        card_max_h = 120;
    }
    const int pad_all = 20;
    const int title_area_h = 44;

    lv_obj_t *card = lv_obj_create(popup->overlay);
    lv_obj_set_width(card, card_w);
    lv_obj_set_height(card, card_max_h);
    lv_obj_center(card);
    lv_obj_clear_flag(card, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_clear_flag(card, LV_OBJ_FLAG_EVENT_BUBBLE);
    lv_obj_set_style_radius(card, 12, LV_PART_MAIN);
    lv_obj_set_style_bg_color(card, lv_color_hex(APP_UI_COLOR_CONTENT_BG), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(card, LV_OPA_COVER, LV_PART_MAIN);
    lv_obj_set_style_border_width(card, 1, LV_PART_MAIN);
    lv_obj_set_style_border_color(card, lv_color_hex(APP_UI_COLOR_CONTENT_BORDER), LV_PART_MAIN);
    lv_obj_set_style_pad_all(card, pad_all, LV_PART_MAIN);
    popup->card = card;

    lv_obj_t *title = lv_label_create(card);
    lv_label_set_text(title, (ctx->title_label != NULL) ? lv_label_get_text(ctx->title_label) : ctx->climate_entity_id);
    lv_obj_set_width(title, card_w - (2 * pad_all) - 46);
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
    lv_obj_add_event_cb(close, heating_popup_close_event_cb, LV_EVENT_CLICKED, popup);
    lv_obj_t *close_label = lv_label_create(close);
    lv_label_set_text(close_label, "X");
    lv_obj_set_style_text_color(close_label, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY), LV_PART_MAIN);
    lv_obj_center(close_label);

    /* Scrollable body holding all sections, auto-stacked via flex column. */
    lv_obj_t *body = lv_obj_create(card);
    lv_obj_remove_style_all(body);
    lv_obj_set_width(body, LV_PCT(100));
    lv_obj_set_height(body, LV_SIZE_CONTENT);
    lv_obj_align(body, LV_ALIGN_TOP_LEFT, 0, title_area_h);
    lv_obj_set_flex_flow(body, LV_FLEX_FLOW_COLUMN);
    lv_obj_set_style_pad_row(body, 14, LV_PART_MAIN);
    lv_obj_clear_flag(body, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_clear_flag(body, LV_OBJ_FLAG_EVENT_BUBBLE);

    /* Section 1: status/summary line ("Now 21.0 C - heat"). */
    if (ctx->has_current_temp) {
        lv_obj_t *summary = lv_label_create(body);
        char buf[64] = {0};
        const char *hvac_label = (ctx->cur_hvac[0] != '\0') ? heating_hvac_mode_label(ctx->cur_hvac) : "";
        if (hvac_label[0] != '\0') {
            snprintf(buf, sizeof(buf), "%s %.1f C - %s", ui_i18n_get("climate.now", "Now"), (double)ctx->current_temp,
                     hvac_label);
        } else {
            snprintf(buf, sizeof(buf), "%s %.1f C", ui_i18n_get("climate.now", "Now"), (double)ctx->current_temp);
        }
        lv_label_set_text(summary, buf);
        lv_obj_set_width(summary, LV_PCT(100));
        lv_obj_set_style_text_font(summary, APP_FONT_TEXT_16, LV_PART_MAIN);
        lv_obj_set_style_text_color(summary, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), LV_PART_MAIN);
    }

    /* Section 2: target temperature (big value + slider). */
    heating_popup_make_caption(body, ui_i18n_get("climate.target", "Target"));

    lv_obj_t *value_label = lv_label_create(body);
    lv_obj_set_width(value_label, LV_PCT(100));
    lv_obj_set_style_text_font(value_label, APP_FONT_TEXT_34, LV_PART_MAIN);
    lv_obj_set_style_text_align(value_label, LV_TEXT_ALIGN_RIGHT, LV_PART_MAIN);
    lv_obj_set_style_text_color(value_label, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY), LV_PART_MAIN);
    popup->value_label = value_label;

    lv_obj_t *slider = lv_slider_create(body);
    lv_obj_set_width(slider, LV_PCT(100));
    lv_obj_set_height(slider, 18);
    lv_slider_set_range(slider, 0, popup->step_count);
    lv_obj_set_style_bg_color(slider, lv_color_hex(APP_UI_COLOR_CARD_BORDER), LV_PART_MAIN);
    lv_color_t target_accent = heating_mode_accent(ctx->is_on, ctx->cur_hvac);
    lv_obj_set_style_bg_color(slider, target_accent, LV_PART_INDICATOR);
    lv_obj_set_style_bg_color(slider, target_accent, LV_PART_KNOB);
    popup->slider = slider;

    float initial_value = ctx->target_temp;
    if (initial_value < popup->min) {
        initial_value = popup->min;
    }
    if (initial_value > popup->max) {
        initial_value = popup->max;
    }
    int initial_index = heating_popup_value_to_index(popup, initial_value);
    lv_slider_set_value(slider, initial_index, LV_ANIM_OFF);
    heating_popup_set_value_label(value_label, heating_popup_index_to_value(popup, initial_index));

    lv_obj_add_event_cb(slider, heating_popup_slider_event_cb, LV_EVENT_VALUE_CHANGED, popup);
    lv_obj_add_event_cb(slider, heating_popup_slider_event_cb, LV_EVENT_RELEASED, popup);

    /* Section 3: HVAC mode chips, or a plain On/Off toggle when the entity
     * exposes no hvac_modes list at all (some minimal climate entities). */
    if (ctx->hvac_mode_count > 0) {
        heating_popup_make_caption(body, ui_i18n_get("climate.mode", "Mode"));
        lv_obj_t *mode_row = heating_popup_make_chip_row(body);

        static const char *const hvac_order[] = {"auto", "heat", "cool", "dry", "fan_only"};
        int chip_idx = 0;
        for (size_t oi = 0; oi < (sizeof(hvac_order) / sizeof(hvac_order[0])); oi++) {
            for (int i = 0; i < ctx->hvac_mode_count && chip_idx < HEATING_MAX_HVAC_MODES; i++) {
                if (strcmp(ctx->hvac_modes[i], hvac_order[oi]) == 0) {
                    heating_copy_text(popup->hvac_chip_values[chip_idx], sizeof(popup->hvac_chip_values[chip_idx]),
                                       ctx->hvac_modes[i]);
                    lv_obj_t *chip =
                        heating_popup_make_chip(mode_row, heating_hvac_mode_label(ctx->hvac_modes[i]), 0, chip_idx);
                    popup->hvac_chips[chip_idx] = chip;
                    lv_obj_add_event_cb(chip, heating_popup_chip_event_cb, LV_EVENT_CLICKED, popup);
                    chip_idx++;
                    break;
                }
            }
        }
        /* Any remaining modes not in the known ordering (excluding "off"). */
        for (int i = 0; i < ctx->hvac_mode_count && chip_idx < HEATING_MAX_HVAC_MODES; i++) {
            bool known = (strcmp(ctx->hvac_modes[i], "off") == 0);
            for (size_t oi = 0; !known && oi < (sizeof(hvac_order) / sizeof(hvac_order[0])); oi++) {
                if (strcmp(ctx->hvac_modes[i], hvac_order[oi]) == 0) {
                    known = true;
                }
            }
            if (!known) {
                heating_copy_text(popup->hvac_chip_values[chip_idx], sizeof(popup->hvac_chip_values[chip_idx]),
                                   ctx->hvac_modes[i]);
                lv_obj_t *chip =
                    heating_popup_make_chip(mode_row, heating_hvac_mode_label(ctx->hvac_modes[i]), 0, chip_idx);
                popup->hvac_chips[chip_idx] = chip;
                lv_obj_add_event_cb(chip, heating_popup_chip_event_cb, LV_EVENT_CLICKED, popup);
                chip_idx++;
            }
        }
        /* "off" is always rendered last. */
        for (int i = 0; i < ctx->hvac_mode_count && chip_idx < HEATING_MAX_HVAC_MODES; i++) {
            if (strcmp(ctx->hvac_modes[i], "off") == 0) {
                heating_copy_text(popup->hvac_chip_values[chip_idx], sizeof(popup->hvac_chip_values[chip_idx]),
                                   "off");
                lv_obj_t *chip = heating_popup_make_chip(mode_row, heating_hvac_mode_label("off"), 0, chip_idx);
                popup->hvac_chips[chip_idx] = chip;
                lv_obj_add_event_cb(chip, heating_popup_chip_event_cb, LV_EVENT_CLICKED, popup);
                chip_idx++;
                break;
            }
        }
        popup->hvac_chip_count = chip_idx;
        heating_popup_restyle_hvac_chips(popup);
    } else {
        lv_obj_t *toggle = lv_btn_create(body);
        lv_obj_set_width(toggle, LV_PCT(100));
        lv_obj_set_height(toggle, 48);
        lv_obj_set_style_radius(toggle, 10, LV_PART_MAIN);
        lv_obj_set_style_bg_color(toggle,
                                   ctx->is_on ? heating_mode_accent(true, ctx->cur_hvac)
                                              : lv_color_hex(APP_UI_COLOR_NAV_BTN_BG_IDLE),
                                   LV_PART_MAIN);
        lv_obj_t *toggle_label = lv_label_create(toggle);
        lv_label_set_text(toggle_label, ctx->is_on ? ui_i18n_get("common.on", "On") : ui_i18n_get("common.off", "Off"));
        lv_obj_set_style_text_font(toggle_label, APP_FONT_TEXT_18, LV_PART_MAIN);
        lv_obj_set_style_text_color(toggle_label, lv_color_white(), LV_PART_MAIN);
        lv_obj_center(toggle_label);
        popup->power_toggle_btn = toggle;
        lv_obj_add_event_cb(toggle, heating_popup_power_toggle_event_cb, LV_EVENT_CLICKED, popup);
    }

    /* Section 4: fan mode chips (only if the entity supports fan modes). */
    if (ctx->fan_mode_count > 0) {
        heating_popup_make_caption(body, ui_i18n_get("climate.fan", "Fan"));
        lv_obj_t *fan_row = heating_popup_make_chip_row(body);
        int count = ctx->fan_mode_count;
        if (count > HEATING_MAX_FAN_MODES) {
            count = HEATING_MAX_FAN_MODES;
        }
        for (int i = 0; i < count; i++) {
            heating_copy_text(popup->fan_chip_values[i], sizeof(popup->fan_chip_values[i]), ctx->fan_modes[i]);
            lv_obj_t *chip = heating_popup_make_chip(fan_row, heating_fan_mode_label(ctx->fan_modes[i]), 1, i);
            popup->fan_chips[i] = chip;
            lv_obj_add_event_cb(chip, heating_popup_chip_event_cb, LV_EVENT_CLICKED, popup);
        }
        popup->fan_chip_count = count;
        heating_popup_restyle_generic_chips(popup->fan_chips, (const char *)popup->fan_chip_values,
                                             sizeof(popup->fan_chip_values[0]), count, ctx->cur_fan);
    }

    /* Section 5: swing chips (only if the entity supports swing modes). */
    if (ctx->swing_mode_count > 0) {
        heating_popup_make_caption(body, ui_i18n_get("climate.swing", "Swing"));
        lv_obj_t *swing_row = heating_popup_make_chip_row(body);
        int count = ctx->swing_mode_count;
        if (count > HEATING_MAX_SWING_MODES) {
            count = HEATING_MAX_SWING_MODES;
        }
        for (int i = 0; i < count; i++) {
            heating_copy_text(popup->swing_chip_values[i], sizeof(popup->swing_chip_values[i]), ctx->swing_modes[i]);
            lv_obj_t *chip = heating_popup_make_chip(swing_row, heating_swing_mode_label(ctx->swing_modes[i]), 2, i);
            popup->swing_chips[i] = chip;
            lv_obj_add_event_cb(chip, heating_popup_chip_event_cb, LV_EVENT_CLICKED, popup);
        }
        popup->swing_chip_count = count;
        heating_popup_restyle_generic_chips(popup->swing_chips, (const char *)popup->swing_chip_values,
                                             sizeof(popup->swing_chip_values[0]), count, ctx->cur_swing);
    }

    /* Section 6: preset chips (only if the entity supports preset modes). */
    if (ctx->preset_mode_count > 0) {
        heating_popup_make_caption(body, ui_i18n_get("climate.preset", "Preset"));
        lv_obj_t *preset_row = heating_popup_make_chip_row(body);
        int count = ctx->preset_mode_count;
        if (count > HEATING_MAX_PRESET_MODES) {
            count = HEATING_MAX_PRESET_MODES;
        }
        for (int i = 0; i < count; i++) {
            heating_copy_text(
                popup->preset_chip_values[i], sizeof(popup->preset_chip_values[i]), ctx->preset_modes[i]);
            char label_buf[24] = {0};
            const char *label_text = heating_preset_mode_label(ctx->preset_modes[i], label_buf, sizeof(label_buf));
            lv_obj_t *chip = heating_popup_make_chip(preset_row, label_text, 3, i);
            popup->preset_chips[i] = chip;
            lv_obj_add_event_cb(chip, heating_popup_chip_event_cb, LV_EVENT_CLICKED, popup);
        }
        popup->preset_chip_count = count;
        heating_popup_restyle_generic_chips(popup->preset_chips, (const char *)popup->preset_chip_values,
                                             sizeof(popup->preset_chip_values[0]), count, ctx->cur_preset);
    }

    /* Auto-size the card to fit its content, clamped to the screen; if the
     * content is still taller than the available space, clip the body and
     * let it scroll instead of overflowing past the card/screen edges. */
    lv_obj_update_layout(card);
    int body_h = lv_obj_get_height(body);
    int wanted_h = (2 * pad_all) + title_area_h + body_h;
    if (wanted_h > card_max_h) {
        int available_body_h = card_max_h - (2 * pad_all) - title_area_h;
        if (available_body_h < 40) {
            available_body_h = 40;
        }
        lv_obj_set_height(body, available_body_h);
        lv_obj_add_flag(body, LV_OBJ_FLAG_SCROLLABLE);
        lv_obj_set_scroll_dir(body, LV_DIR_VER);
        lv_obj_set_scrollbar_mode(body, LV_SCROLLBAR_MODE_AUTO);
        wanted_h = card_max_h;
    }
    lv_obj_set_height(card, wanted_h);
    lv_obj_center(card);
}

static void w_heating_tile_card_event_cb(lv_event_t *event)
{
    lv_event_code_t code = lv_event_get_code(event);
    w_heating_tile_ctx_t *ctx = (w_heating_tile_ctx_t *)lv_event_get_user_data(event);
    if (ctx == NULL) {
        return;
    }

    if (code == LV_EVENT_CLICKED) {
        heating_open_popup(ctx);
    } else if (code == LV_EVENT_DELETE) {
        free(ctx);
    }
}

static void w_heating_tile_arc_event_cb(lv_event_t *event)
{
    lv_event_code_t code = lv_event_get_code(event);
    if (code != LV_EVENT_VALUE_CHANGED && code != LV_EVENT_RELEASED) {
        return;
    }

    lv_obj_t *arc = lv_event_get_target(event);
    w_heating_tile_ctx_t *ctx = (w_heating_tile_ctx_t *)lv_event_get_user_data(event);
    int value = (arc != NULL) ? lv_arc_get_value(arc) : 40;
    float target_c = (float)value * 0.5f;

    heating_set_target_label((ctx != NULL) ? ctx->target_label : NULL, target_c);

    if (code == LV_EVENT_RELEASED) {
        if (ctx != NULL) {
            ctx->target_temp = target_c;
            ui_bindings_set_climate_target_c(ctx->climate_entity_id, target_c);
        }
    }
}

static void w_heating_tile_step_event_cb(lv_event_t *event)
{
    if (lv_event_get_code(event) != LV_EVENT_CLICKED) {
        return;
    }
    w_heating_tile_ctx_t *ctx = (w_heating_tile_ctx_t *)lv_event_get_user_data(event);
    if (ctx == NULL) {
        return;
    }
    lv_obj_t *btn = lv_event_get_target(event);
    int delta = (btn == ctx->plus_btn) ? 1 : -1;
    float next = snap_half_deg(clamp_temp(ctx->target_temp) + (float)delta * 0.5f);
    next = clamp_temp(next);
    ctx->target_temp = next;
    if (ctx->arc != NULL) {
        lv_arc_set_value(ctx->arc, (int)(next * 2.0f + 0.5f));
    }
    heating_set_target_label(ctx->target_label, next);
    ui_bindings_set_climate_target_c(ctx->climate_entity_id, next);
}

esp_err_t w_heating_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance)
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
    lv_obj_set_style_pad_all(card, 16, LV_PART_MAIN);

    lv_obj_t *icon = lv_label_create(card);
    lv_label_set_text(icon, heating_icon_text());
    lv_obj_set_style_text_font(icon, LV_FONT_DEFAULT, LV_PART_MAIN);
#if APP_UI_TILE_LAYOUT_TUNED
    lv_obj_align(icon, LV_ALIGN_TOP_LEFT, 0, 2);
#else
    lv_obj_align(icon, LV_ALIGN_TOP_LEFT, 0, 0);
#endif

    lv_obj_t *title = lv_label_create(card);
    lv_label_set_text(title, def->title[0] ? def->title : def->id);
    lv_obj_set_width(title, def->w - 32);
    lv_obj_set_style_text_font(title, APP_FONT_TEXT_16, LV_PART_MAIN);
    lv_obj_set_style_text_align(title, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN);
#if APP_UI_TILE_LAYOUT_TUNED
    lv_obj_align(title, LV_ALIGN_TOP_MID, 0, 2);
#else
    lv_obj_align(title, LV_ALIGN_TOP_MID, 0, 0);
#endif

    lv_obj_t *arc = lv_arc_create(card);
    lv_obj_set_size(arc, HEATING_ARC_SIZE_MIN, HEATING_ARC_SIZE_MIN);
    lv_arc_set_range(arc, 10, 60);
    lv_arc_set_value(arc, 40);
    lv_arc_set_bg_angles(arc, 160, 20);
#if APP_UI_TILE_LAYOUT_TUNED
    lv_obj_align(arc, LV_ALIGN_CENTER, 0, 30);
#else
    lv_obj_align(arc, LV_ALIGN_CENTER, 0, 20);
#endif
    lv_obj_clear_flag(arc, LV_OBJ_FLAG_EVENT_BUBBLE);

    lv_obj_t *target_label = lv_label_create(card);
    heating_set_target_label(target_label, 20.0f);
    lv_obj_set_style_text_font(target_label, HEATING_TARGET_FONT, LV_PART_MAIN);
#if APP_UI_TILE_LAYOUT_TUNED
    lv_obj_align(target_label, LV_ALIGN_CENTER, 0, 8);
#else
    lv_obj_align(target_label, LV_ALIGN_CENTER, 0, 4);
#endif

    lv_obj_t *actual_label = lv_label_create(card);
    lv_label_set_text(actual_label, "--.- C");
    lv_obj_set_style_text_font(actual_label, HEATING_ACTUAL_FONT, LV_PART_MAIN);
#if APP_UI_TILE_LAYOUT_TUNED
    lv_obj_align(actual_label, LV_ALIGN_CENTER, 0, 50);
#else
    lv_obj_align(actual_label, LV_ALIGN_CENTER, 0, 40);
#endif

    lv_obj_t *status_label = lv_label_create(card);
    lv_label_set_text(status_label, ui_i18n_get("common.off", "OFF"));
    lv_obj_set_style_text_font(status_label, APP_FONT_TEXT_14, LV_PART_MAIN);
    lv_obj_set_style_text_align(status_label, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN);
    lv_obj_align(status_label, LV_ALIGN_BOTTOM_MID, 0, -12);

    w_heating_tile_ctx_t *ctx = ui_calloc_prefer_psram(1, sizeof(w_heating_tile_ctx_t));
    if (ctx == NULL) {
        lv_obj_del(card);
        return ESP_ERR_NO_MEM;
    }
    snprintf(ctx->climate_entity_id, sizeof(ctx->climate_entity_id), "%s", def->entity_id);
    snprintf(ctx->sensor_entity_id, sizeof(ctx->sensor_entity_id), "%s", def->secondary_entity_id);
    ctx->is_on = false;
    ctx->target_temp = 20.0f;
    ctx->current_temp = 20.0f;
    ctx->has_current_temp = false;
    snprintf(ctx->status_text, sizeof(ctx->status_text), "OFF");
    ctx->icon_label = icon;
    ctx->title_label = title;
    ctx->arc = arc;
    ctx->target_label = target_label;
    ctx->actual_label = actual_label;
    ctx->status_label = status_label;

    ctx->card = card;
    ctx->popup_overlay = NULL;
    ctx->min_temp = 5.0f;
    ctx->max_temp = 30.0f;
    ctx->target_temp_step = 0.5f;

    ctx->arc_semi = (def->style_variant[0] != '\0' && strcmp(def->style_variant, "arc_semi") == 0);
    const char *opening = (def->arc_opening[0] != '\0') ? def->arc_opening : "left";
    snprintf(ctx->arc_opening, sizeof(ctx->arc_opening), "%s", opening);

    if (ctx->arc_semi) {
        uint16_t bg_start = 270, bg_end = 90;
        if (strcmp(ctx->arc_opening, "bottom") == 0) {
            bg_start = 180;
            bg_end = 360;
        } else if (strcmp(ctx->arc_opening, "top") == 0) {
            bg_start = 0;
            bg_end = 180;
        } else if (strcmp(ctx->arc_opening, "right") == 0) {
            bg_start = 90;
            bg_end = 270;
        } else { /* left (default) */
            bg_start = 270;
            bg_end = 90;
        }
        lv_arc_set_bg_angles(arc, bg_start, bg_end);
        lv_arc_set_rotation(arc, 0);

        /* Min/Max labels at arc ends. */
        ctx->min_label = lv_label_create(card);
        lv_label_set_text(ctx->min_label, "5");
        lv_obj_set_style_text_font(ctx->min_label, APP_FONT_TEXT_14, LV_PART_MAIN);
        lv_obj_set_style_text_color(ctx->min_label, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), LV_PART_MAIN);

        ctx->max_label = lv_label_create(card);
        lv_label_set_text(ctx->max_label, "30");
        lv_obj_set_style_text_font(ctx->max_label, APP_FONT_TEXT_14, LV_PART_MAIN);
        lv_obj_set_style_text_color(ctx->max_label, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), LV_PART_MAIN);

        /* +/- buttons. */
        ctx->minus_btn = lv_btn_create(card);
        lv_obj_set_size(ctx->minus_btn, 48, 48);
        lv_obj_set_style_radius(ctx->minus_btn, 24, LV_PART_MAIN);
        /* Prevent the step click from bubbling up to the card and opening the popup. */
        lv_obj_clear_flag(ctx->minus_btn, LV_OBJ_FLAG_EVENT_BUBBLE);
        lv_obj_t *minus_lbl = lv_label_create(ctx->minus_btn);
        lv_label_set_text(minus_lbl, "-");
        lv_obj_set_style_text_font(minus_lbl, HEATING_TARGET_FONT, LV_PART_MAIN);
        lv_obj_center(minus_lbl);
        lv_obj_add_event_cb(ctx->minus_btn, w_heating_tile_step_event_cb, LV_EVENT_CLICKED, ctx);

        ctx->plus_btn = lv_btn_create(card);
        lv_obj_set_size(ctx->plus_btn, 48, 48);
        lv_obj_set_style_radius(ctx->plus_btn, 24, LV_PART_MAIN);
        /* Prevent the step click from bubbling up to the card and opening the popup. */
        lv_obj_clear_flag(ctx->plus_btn, LV_OBJ_FLAG_EVENT_BUBBLE);
        lv_obj_t *plus_lbl = lv_label_create(ctx->plus_btn);
        lv_label_set_text(plus_lbl, "+");
        lv_obj_set_style_text_font(plus_lbl, HEATING_TARGET_FONT, LV_PART_MAIN);
        lv_obj_center(plus_lbl);
        lv_obj_add_event_cb(ctx->plus_btn, w_heating_tile_step_event_cb, LV_EVENT_CLICKED, ctx);
    }

    lv_obj_add_event_cb(card, w_heating_tile_card_event_cb, LV_EVENT_CLICKED, ctx);
    lv_obj_add_event_cb(card, w_heating_tile_card_event_cb, LV_EVENT_DELETE, ctx);
    lv_obj_add_event_cb(arc, w_heating_tile_arc_event_cb, LV_EVENT_VALUE_CHANGED, ctx);
    lv_obj_add_event_cb(arc, w_heating_tile_arc_event_cb, LV_EVENT_RELEASED, ctx);

    out_instance->ctx = ctx;
    out_instance->obj = card;
    heating_apply_from_ctx(card, ctx);
    return ESP_OK;
}

void w_heating_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state)
{
    if (instance == NULL || instance->obj == NULL || state == NULL) {
        return;
    }

    w_heating_tile_ctx_t *ctx = (w_heating_tile_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }

    if (strncmp(state->entity_id, ctx->climate_entity_id, APP_MAX_ENTITY_ID_LEN) == 0) {
        heating_values_t values = {0};
        heating_extract_climate_values(state, &values);
        ctx->is_on = heating_state_is_on(state->state);
        ctx->target_temp = values.target_temp;
        heating_copy_text(ctx->status_text, sizeof(ctx->status_text), values.status_text);
        if (ctx->sensor_entity_id[0] == '\0') {
            ctx->has_current_temp = values.has_current_temp;
            ctx->current_temp = values.current_temp;
        }

        /* Refresh full climate capability/state so the popup (opened later,
         * on demand) always reflects the latest attributes_json. */
        memcpy(ctx->hvac_modes, values.hvac_modes, sizeof(ctx->hvac_modes));
        ctx->hvac_mode_count = values.hvac_mode_count;
        memcpy(ctx->fan_modes, values.fan_modes, sizeof(ctx->fan_modes));
        ctx->fan_mode_count = values.fan_mode_count;
        memcpy(ctx->swing_modes, values.swing_modes, sizeof(ctx->swing_modes));
        ctx->swing_mode_count = values.swing_mode_count;
        memcpy(ctx->preset_modes, values.preset_modes, sizeof(ctx->preset_modes));
        ctx->preset_mode_count = values.preset_mode_count;
        heating_copy_text(ctx->cur_hvac, sizeof(ctx->cur_hvac), values.cur_hvac);
        heating_copy_text(ctx->cur_fan, sizeof(ctx->cur_fan), values.cur_fan);
        heating_copy_text(ctx->cur_swing, sizeof(ctx->cur_swing), values.cur_swing);
        heating_copy_text(ctx->cur_preset, sizeof(ctx->cur_preset), values.cur_preset);
        ctx->min_temp = values.min_temp;
        ctx->max_temp = values.max_temp;
        ctx->target_temp_step = values.target_temp_step;
    } else if (ctx->sensor_entity_id[0] != '\0' &&
               strncmp(state->entity_id, ctx->sensor_entity_id, APP_MAX_ENTITY_ID_LEN) == 0) {
        float sensor_temp = 0.0f;
        bool ok = heating_extract_sensor_temp(state, &sensor_temp);
        ctx->has_current_temp = ok;
        if (ok) {
            ctx->current_temp = sensor_temp;
        }
    } else {
        return;
    }

    heating_apply_from_ctx(instance->obj, ctx);
}

void w_heating_tile_mark_unavailable(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }

    w_heating_tile_ctx_t *ctx = (w_heating_tile_ctx_t *)instance->ctx;
    if (ctx != NULL) {
        ctx->is_on = false;
        ctx->has_current_temp = false;
        heating_copy_text(ctx->status_text, sizeof(ctx->status_text), "unavailable");
        heating_apply_from_ctx(instance->obj, ctx);
        return;
    }

    w_heating_tile_ctx_t fallback = {0};
    fallback.is_on = false;
    fallback.target_temp = 20.0f;
    fallback.current_temp = 20.0f;
    fallback.has_current_temp = false;
    snprintf(fallback.status_text, sizeof(fallback.status_text), "unavailable");
    fallback.icon_label = lv_obj_get_child(instance->obj, 0);
    fallback.title_label = lv_obj_get_child(instance->obj, 1);
    fallback.arc = lv_obj_get_child(instance->obj, 2);
    fallback.target_label = lv_obj_get_child(instance->obj, 3);
    fallback.actual_label = lv_obj_get_child(instance->obj, 4);
    fallback.status_label = lv_obj_get_child(instance->obj, 5);
    heating_apply_visual(instance->obj, &fallback, true);
}
