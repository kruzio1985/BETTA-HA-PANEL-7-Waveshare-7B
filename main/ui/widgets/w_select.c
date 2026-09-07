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
    lv_obj_t *dropdown;
    char options_joined[1024];
    char current_option[128];
    bool unavailable;
} w_select_ctx_t;

static void w_select_send_option(w_select_ctx_t *ctx)
{
    if (ctx == NULL || ctx->unavailable || ctx->entity_id[0] == '\0' || ctx->dropdown == NULL) {
        return;
    }
    char buf[160] = {0};
    lv_dropdown_get_selected_str(ctx->dropdown, buf, sizeof(buf));
    if (buf[0] == '\0') {
        return;
    }
    if (ui_bindings_select_option(ctx->entity_id, buf) == ESP_OK) {
        snprintf(ctx->current_option, sizeof(ctx->current_option), "%.*s",
                 (int)sizeof(ctx->current_option) - 1, buf);
    }
}

static void w_select_dropdown_change_cb(lv_event_t *event)
{
    w_select_ctx_t *ctx = (w_select_ctx_t *)lv_event_get_user_data(event);
    if (ctx != NULL) {
        w_select_send_option(ctx);
    }
}

static void w_select_event_cb(lv_event_t *event)
{
    if (event == NULL) {
        return;
    }
    w_select_ctx_t *ctx = (w_select_ctx_t *)lv_event_get_user_data(event);
    if (ctx == NULL) {
        return;
    }
    if (lv_event_get_code(event) == LV_EVENT_DELETE) {
        free(ctx);
    }
}

static bool select_rebuild_options(w_select_ctx_t *ctx, const ha_state_t *state)
{
    if (ctx == NULL || state == NULL) {
        return false;
    }

    char joined[sizeof(ctx->options_joined)] = {0};
    const char *found_option = ctx->current_option;

    cJSON *attrs = cJSON_Parse(state->attributes_json);
    if (attrs == NULL) {
        return false;
    }

    cJSON *opt_attr = cJSON_GetObjectItemCaseSensitive(attrs, "option");
    if (cJSON_IsString(opt_attr) && opt_attr->valuestring != NULL) {
        found_option = opt_attr->valuestring;
    }

    cJSON *options = cJSON_GetObjectItemCaseSensitive(attrs, "options");
    bool need_rebuild = false;
    int selected_index = -1;

    if (cJSON_IsArray(options)) {
        size_t len = 0;
        int index = 0;
        cJSON *item = NULL;
        cJSON_ArrayForEach(item, options)
        {
            if (!cJSON_IsString(item) || item->valuestring == NULL) {
                index++;
                continue;
            }
            const size_t item_len = strlen(item->valuestring);
            if (found_option != NULL && strcmp(item->valuestring, found_option) == 0) {
                selected_index = index;
            }
            if (len + item_len + 1 < sizeof(joined)) {
                if (len > 0) {
                    joined[len++] = '\n';
                }
                memcpy(&joined[len], item->valuestring, item_len);
                len += item_len;
                joined[len] = '\0';
            } else {
                break;
            }
            index++;
        }
        if (selected_index >= 0) {
            snprintf(ctx->current_option, sizeof(ctx->current_option), "%s", found_option);
        }

        need_rebuild = strcmp(ctx->options_joined, joined) != 0;
        if (need_rebuild) {
            snprintf(ctx->options_joined, sizeof(ctx->options_joined), "%s", joined);
            lv_dropdown_set_options(ctx->dropdown, joined);
        }
    }

    cJSON_Delete(attrs);

    if (ctx->dropdown != NULL && selected_index >= 0) {
        const int cur = lv_dropdown_get_selected(ctx->dropdown);
        if (cur != selected_index) {
            lv_dropdown_set_selected(ctx->dropdown, selected_index);
        }
    }
    return need_rebuild;
}

esp_err_t w_select_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance)
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
    lv_obj_set_width(title, def->w - 24);
    lv_label_set_long_mode(title, LV_LABEL_LONG_DOT);
    lv_obj_set_style_text_font(title, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_set_style_text_color(title, theme_default_color_text_muted(), LV_PART_MAIN);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 0, 0);

    lv_obj_t *dropdown = lv_dropdown_create(card);
    theme_default_style_button(dropdown, false);
    lv_obj_set_style_radius(dropdown, 14, LV_PART_MAIN);
    lv_obj_set_style_pad_hor(dropdown, 14, LV_PART_MAIN);
    lv_obj_set_width(dropdown, def->w - 24);
    const lv_coord_t dd_h = def->h - 12 - 30 - 8;
    lv_obj_set_height(dropdown, dd_h > 40 ? dd_h : 40);
    lv_obj_align(dropdown, LV_ALIGN_TOP_LEFT, 0, 30);
    lv_obj_set_style_text_font(dropdown, APP_FONT_TEXT_18, LV_PART_MAIN);
    lv_obj_set_style_text_color(dropdown, theme_default_color_text_primary(), LV_PART_MAIN);
    lv_dropdown_set_dir(dropdown, LV_DIR_BOTTOM);

    lv_obj_t *dd_list = lv_dropdown_get_list(dropdown);
    if (dd_list != NULL) {
        lv_obj_set_style_text_font(dd_list, APP_FONT_TEXT_18, LV_PART_MAIN);
        lv_obj_set_style_text_font(dd_list, APP_FONT_TEXT_18, LV_PART_SELECTED);
        lv_obj_set_style_text_color(dd_list, theme_default_color_text_primary(), LV_PART_MAIN);
        lv_obj_set_style_text_color(dd_list, theme_default_color_text_primary(), LV_PART_SELECTED);
        lv_obj_set_style_bg_color(dd_list, lv_color_hex(APP_UI_COLOR_CARD_BG_OFF), LV_PART_MAIN);
        lv_obj_set_style_bg_color(dd_list, lv_color_hex(APP_UI_COLOR_NAV_TAB_ACTIVE), LV_PART_SELECTED);
        lv_obj_set_style_border_width(dd_list, 1, LV_PART_MAIN);
        lv_obj_set_style_border_color(dd_list, lv_color_hex(APP_UI_COLOR_CARD_BORDER), LV_PART_MAIN);
        lv_obj_set_style_radius(dd_list, 10, LV_PART_MAIN);
        lv_obj_set_style_pad_all(dd_list, 6, LV_PART_MAIN);
        lv_obj_set_style_pad_row(dd_list, 2, LV_PART_MAIN);
    }

    w_select_ctx_t *ctx = ui_calloc_prefer_psram(1, sizeof(w_select_ctx_t));
    if (ctx == NULL) {
        lv_obj_del(card);
        return ESP_ERR_NO_MEM;
    }
    snprintf(ctx->entity_id, sizeof(ctx->entity_id), "%s", def->entity_id);
    ctx->card = card;
    ctx->title_label = title;
    ctx->dropdown = dropdown;
    ctx->options_joined[0] = '\0';
    ctx->current_option[0] = '\0';
    ctx->unavailable = false;

    lv_dropdown_set_options(dropdown, "\n");
    lv_obj_add_event_cb(dropdown, w_select_dropdown_change_cb, LV_EVENT_VALUE_CHANGED, ctx);
    lv_obj_add_event_cb(card, w_select_event_cb, LV_EVENT_DELETE, ctx);

    out_instance->obj = card;
    out_instance->ctx = ctx;
    return ESP_OK;
}

void w_select_apply_state(ui_widget_instance_t *instance, const ha_state_t *state)
{
    if (instance == NULL || instance->obj == NULL || state == NULL) {
        return;
    }
    w_select_ctx_t *ctx = (w_select_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }

    if (w_state_is_unavailable(state->state)) {
        ctx->unavailable = true;
        if (ctx->dropdown != NULL) {
            lv_obj_set_style_text_color(ctx->dropdown, theme_default_color_text_muted(), LV_PART_MAIN);
        }
        return;
    }
    ctx->unavailable = false;
    if (ctx->dropdown != NULL) {
        lv_obj_set_style_text_color(ctx->dropdown, theme_default_color_text_primary(), LV_PART_MAIN);
    }

    select_rebuild_options(ctx, state);
}

void w_select_mark_unavailable(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }
    w_select_ctx_t *ctx = (w_select_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }
    ctx->unavailable = true;
    if (ctx->dropdown != NULL) {
        lv_obj_set_style_text_color(ctx->dropdown, theme_default_color_text_muted(), LV_PART_MAIN);
    }
}
