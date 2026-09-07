/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "ui/ui_cameras_page.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "esp_heap_caps.h"
#include "esp_log.h"

#include "app_config.h"
#include "camera/camera_store.h"
#include "ha/ha_cover_fetcher.h"
#include "ui/fonts/app_text_fonts.h"
#include "ui/theme/theme_default.h"
#include "ui/ui_i18n.h"
#include "util/log_tags.h"

#define TAG TAG_CAMERA

#define CAM_GRID_MARGIN 16
#define CAM_GRID_GAP 12
#define CAM_CHIP_RADIUS 8
#define CAM_CHIP_PAD 6

#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
#define CAM_NAME_FONT APP_FONT_TEXT_14
#define CAM_STATUS_FONT APP_FONT_TEXT_12
#define CAM_EMPTY_FONT APP_FONT_TEXT_16
#else
#define CAM_NAME_FONT APP_FONT_TEXT_18
#define CAM_STATUS_FONT APP_FONT_TEXT_16
#define CAM_EMPTY_FONT APP_FONT_TEXT_18
#endif

typedef struct {
    bool active;
    char page_id[APP_MAX_PAGE_ID_LEN];
    camera_entry_t cfg;
    lv_obj_t *card;
    lv_obj_t *image;
    lv_obj_t *status_label;
    lv_timer_t *timer;
    lv_image_dsc_t image_dsc;    /* persistent copy of the decoded image dsc */
    const uint8_t *owned_buf;    /* decoded pixels owned by this instance */
    bool fetching;
    bool using_substream;        /* current fetch settled on the HA substream entity */
    char active_entity[APP_CAMERA_ENTITY_MAX_LEN]; /* entity actually used for /api/camera_proxy */
    uint32_t fail_count;
} ui_camera_instance_t;

static ui_camera_instance_t s_instances[APP_MAX_CAMERAS];

/* HA camera integrations that expose several streams do so as separate
 * entities, e.g. camera.balkon_mainstream (2K) and camera.balkon_substream
 * (low-res). The panel tile is tiny, so always prefer the low-res substream
 * whenever the configured entity looks like a main stream. Returns true and
 * writes the derived substream entity into `out` when applicable. */
static bool camera_ha_substream_entity(const char *entity_id, char *out, size_t out_len)
{
    static const char *const mains[] = { "_mainstream", "_main" };
    static const char *const subs[]  = { "_substream", "_sub" };

    if (entity_id == NULL || out == NULL || out_len == 0) {
        return false;
    }

    for (size_t i = 0; i < (sizeof(mains) / sizeof(mains[0])); i++) {
        size_t mlen = strlen(mains[i]);
        size_t elen = strlen(entity_id);
        if (elen > mlen && strcmp(entity_id + elen - mlen, mains[i]) == 0) {
            size_t prefix = elen - mlen;
            const char *sub = subs[i];
            size_t need = prefix + strlen(sub) + 1U;
            if (need > out_len) {
                return false;
            }
            memcpy(out, entity_id, prefix);
            strcpy(out + prefix, sub);
            return true;
        }
    }
    return false;
}

static void cam_set_status(ui_camera_instance_t *inst, const char *text)
{
    if (inst == NULL || inst->status_label == NULL || text == NULL) {
        return;
    }
    lv_label_set_text(inst->status_label, text);
}

/* After repeated failures, slow the refresh down so a flaky source (e.g. a
 * doorbell intercom that throttles rapid snapshot requests) can recover
 * instead of being hammered every refresh interval. */
static void cam_update_timer_period(ui_camera_instance_t *inst)
{
    if (inst == NULL || inst->timer == NULL) {
        return;
    }

    uint32_t base = inst->cfg.refresh_ms;
    if (base < 500) {
        base = 500;
    }

    uint32_t period = base;
    if (inst->fail_count >= 3) {
        period = base * 5;
        if (period < 10000) {
            period = 10000;
        }
        if (period > 60000) {
            period = 60000;
        }
    }
    lv_timer_set_period(inst->timer, period);
}

static void cam_cover_cb(void *user, const ha_cover_result_t *result)
{
    ui_camera_instance_t *inst = (ui_camera_instance_t *)user;
    if (inst == NULL || !inst->active) {
        if (result != NULL && result->valid && result->image.data != NULL) {
            heap_caps_free((void *)result->image.data);
        }
        return;
    }

    inst->fetching = false;

    if (result == NULL || !result->valid || result->image.data == NULL) {
        if (result == NULL) {
            ESP_LOGW(TAG, "cam cb: result NULL");
        } else if (!result->valid) {
            ESP_LOGW(TAG, "cam cb: result invalid");
        } else {
            ESP_LOGW(TAG, "cam cb: image data NULL");
        }
        inst->fail_count++;
        if (inst->using_substream) {
            /* The derived substream entity did not resolve (missing or the
             * integration only exposes the main stream): fall back to the
             * configured entity for the next refresh. */
            inst->using_substream = false;
            snprintf(inst->active_entity, sizeof(inst->active_entity), "%s", inst->cfg.entity_id);
            ESP_LOGW(TAG, "camera %s: substream unavailable, falling back to %s",
                     inst->cfg.id, inst->cfg.entity_id);
        }
        if (inst->owned_buf != NULL) {
            /* We still have the last good frame on screen; don't scare the
             * user with a hard error, just note that refresh is behind. */
            cam_set_status(inst, ui_i18n_get("cameras.stale", "Błąd — stary obraz"));
        } else {
            cam_set_status(inst, ui_i18n_get("cameras.fetch_failed", "Błąd pobierania"));
        }
        cam_update_timer_period(inst);
        return;
    }

    /* Take ownership of the decoded buffer and swap it in. */
    if (inst->owned_buf != NULL) {
        heap_caps_free((void *)inst->owned_buf);
        inst->owned_buf = NULL;
    }
    inst->image_dsc = result->image;
    inst->owned_buf = result->image.data;
    inst->fail_count = 0;
    cam_update_timer_period(inst);

    if (inst->image != NULL) {
        lv_image_set_src(inst->image, &inst->image_dsc);
        lv_image_set_inner_align(inst->image, LV_IMAGE_ALIGN_STRETCH);
    }

    char status[48];
    snprintf(status, sizeof(status), "%ux%u", (unsigned)result->source_w, (unsigned)result->source_h);
    cam_set_status(inst, status);
}

static void cam_timer_cb(lv_timer_t *timer)
{
    ui_camera_instance_t *inst = (ui_camera_instance_t *)lv_timer_get_user_data(timer);
    if (inst == NULL || !inst->active) {
        return;
    }
    if (inst->fetching) {
        return; /* in flight; next tick retries */
    }

    lv_coord_t w = inst->image != NULL ? lv_obj_get_width(inst->image) : 320;
    lv_coord_t h = inst->image != NULL ? lv_obj_get_height(inst->image) : 240;
    if (w < 32) w = 32;
    if (h < 32) h = 32;

    inst->fetching = true;
    esp_err_t err;
    if (strcmp(inst->cfg.source, "ha") == 0) {
        char url[APP_CAMERA_URL_MAX_LEN];
        if (!inst->using_substream) {
            char sub_entity[APP_CAMERA_ENTITY_MAX_LEN];
            if (camera_ha_substream_entity(inst->cfg.entity_id, sub_entity, sizeof(sub_entity))) {
                snprintf(inst->active_entity, sizeof(inst->active_entity), "%s", sub_entity);
                inst->using_substream = true;
            }
        }
        snprintf(url, sizeof(url), "/api/camera_proxy/%s", inst->active_entity);
        err = ha_cover_fetcher_request(url, (int)w, (int)h, cam_cover_cb, inst);
    } else {
        err = ha_cover_fetcher_request_auth(inst->cfg.snapshot_url,
                                            inst->cfg.username,
                                            inst->cfg.password,
                                            (int)w,
                                            (int)h,
                                            cam_cover_cb,
                                            inst);
    }
    if (err != ESP_OK) {
        inst->fetching = false;
        cam_set_status(inst, ui_i18n_get("cameras.queue_full", "Kolejka pełna"));
    }
}

static void cam_style_chip(lv_obj_t *label)
{
    lv_obj_set_style_bg_color(label, lv_color_hex(0x10131A), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(label, LV_OPA_70, LV_PART_MAIN);
    lv_obj_set_style_radius(label, CAM_CHIP_RADIUS, LV_PART_MAIN);
    lv_obj_set_style_pad_all(label, CAM_CHIP_PAD, LV_PART_MAIN);
    lv_obj_set_style_text_color(label, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY), LV_PART_MAIN);
}

static void cam_build_tile(ui_camera_instance_t *inst,
                           lv_obj_t *parent,
                           lv_coord_t x,
                           lv_coord_t y,
                           lv_coord_t w,
                           lv_coord_t h)
{
    lv_obj_t *card = lv_obj_create(parent);
    lv_obj_remove_style_all(card);
    lv_obj_set_pos(card, x, y);
    lv_obj_set_size(card, w, h);
    lv_obj_clear_flag(card, LV_OBJ_FLAG_SCROLLABLE);
    theme_default_style_card(card);

    lv_obj_t *image = lv_image_create(card);
    lv_obj_set_pos(image, 0, 0);
    lv_obj_set_size(image, w, h);
    lv_image_set_inner_align(image, LV_IMAGE_ALIGN_STRETCH);
    lv_obj_set_style_bg_color(image, lv_color_hex(APP_UI_COLOR_CARD_BG_OFF), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(image, LV_OPA_COVER, LV_PART_MAIN);

    lv_obj_t *name = lv_label_create(card);
    lv_label_set_long_mode(name, LV_LABEL_LONG_MODE_DOTS);
    lv_obj_set_width(name, w - 2 * CAM_GRID_GAP);
    lv_label_set_text(name, inst->cfg.name);
    lv_obj_set_style_text_font(name, CAM_NAME_FONT, LV_PART_MAIN);
    cam_style_chip(name);
    lv_obj_set_pos(name, CAM_GRID_GAP, CAM_GRID_GAP);

    lv_obj_t *status = lv_label_create(card);
    lv_label_set_long_mode(status, LV_LABEL_LONG_MODE_DOTS);
    lv_obj_set_width(status, w - 2 * CAM_GRID_GAP);
    lv_label_set_text(status, ui_i18n_get("cameras.connecting", "Łączenie…"));
    lv_obj_set_style_text_font(status, CAM_STATUS_FONT, LV_PART_MAIN);
    cam_style_chip(status);
    lv_obj_align(status, LV_ALIGN_BOTTOM_LEFT, CAM_GRID_GAP, -CAM_GRID_GAP);

    inst->card = card;
    inst->image = image;
    inst->status_label = status;

    inst->timer = lv_timer_create(cam_timer_cb, inst->cfg.refresh_ms, inst);
    if (inst->timer == NULL) {
        ESP_LOGW(TAG, "failed to create refresh timer for camera %s", inst->cfg.id);
        return;
    }
    /* Kick the first fetch immediately. */
    cam_timer_cb(inst->timer);
}

static void cam_build_empty(lv_obj_t *parent)
{
    lv_obj_t *label = lv_label_create(parent);
    lv_label_set_text(label, ui_i18n_get("cameras.empty", "Brak kamer — dodaj je w edytorze WWW"));
    lv_obj_set_style_text_font(label, CAM_EMPTY_FONT, LV_PART_MAIN);
    lv_obj_set_style_text_color(label, lv_color_hex(APP_UI_COLOR_TEXT_MUTED), LV_PART_MAIN);
    lv_obj_center(label);
}

esp_err_t ui_cameras_page_build(lv_obj_t *parent, const char *page_id)
{
    if (parent == NULL || page_id == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    /* Always reset module state before rebuilding (defensive; deinit is also
     * called from ui_runtime_load_layout before ui_pages_reset). */
    ui_cameras_page_deinit();

    camera_entry_t *entries = (camera_entry_t *)calloc(APP_MAX_CAMERAS, sizeof(camera_entry_t));
    if (entries == NULL) {
        ESP_LOGW(TAG, "camera entries alloc failed");
        cam_build_empty(parent);
        return ESP_ERR_NO_MEM;
    }

    size_t total = 0;
    esp_err_t err = camera_store_load(entries, &total);
    if (err != ESP_OK && err != ESP_ERR_NOT_FOUND) {
        ESP_LOGW(TAG, "camera store load failed: %s", esp_err_to_name(err));
        free(entries);
        cam_build_empty(parent);
        return err;
    }

    size_t count = 0;
    for (size_t i = 0; i < total; i++) {
        if (entries[i].enabled) {
            count++;
        }
    }

    if (count == 0) {
        free(entries);
        cam_build_empty(parent);
        return ESP_OK;
    }

    lv_coord_t cols = 2;
    lv_coord_t rows = 2;
    if (count == 1) {
        cols = 1;
        rows = 1;
    } else if (count == 2) {
        cols = 2;
        rows = 1;
    }

    lv_coord_t tile_w = (APP_CONTENT_BOX_WIDTH - 2 * CAM_GRID_MARGIN - (cols - 1) * CAM_GRID_GAP) / cols;
    lv_coord_t tile_h = (APP_CONTENT_BOX_HEIGHT - 2 * CAM_GRID_MARGIN - (rows - 1) * CAM_GRID_GAP) / rows;
    if (tile_w < 32) tile_w = 32;
    if (tile_h < 32) tile_h = 32;

    size_t built = 0;
    for (size_t i = 0; i < total && built < count; i++) {
        if (!entries[i].enabled) {
            continue;
        }
        if (built >= APP_MAX_CAMERAS) {
            break;
        }

        ui_camera_instance_t *inst = &s_instances[built];
        memset(inst, 0, sizeof(*inst));
        inst->active = true;
        snprintf(inst->page_id, sizeof(inst->page_id), "%s", page_id);
        inst->cfg = entries[i];
        snprintf(inst->active_entity, sizeof(inst->active_entity), "%s", entries[i].entity_id);

        lv_coord_t col = (lv_coord_t)(built % (size_t)cols);
        lv_coord_t row = (lv_coord_t)(built / (size_t)cols);
        lv_coord_t x = CAM_GRID_MARGIN + col * (tile_w + CAM_GRID_GAP);
        lv_coord_t y = CAM_GRID_MARGIN + row * (tile_h + CAM_GRID_GAP);

        cam_build_tile(inst, parent, x, y, tile_w, tile_h);
        built++;
    }

    free(entries);
    return ESP_OK;
}

void ui_cameras_page_deinit(void)
{
    for (size_t i = 0; i < APP_MAX_CAMERAS; i++) {
        ui_camera_instance_t *inst = &s_instances[i];
        if (!inst->active) {
            continue;
        }
        if (inst->timer != NULL) {
            lv_timer_del(inst->timer);
            inst->timer = NULL;
        }
        ha_cover_fetcher_cancel(inst);
        if (inst->owned_buf != NULL) {
            heap_caps_free((void *)inst->owned_buf);
            inst->owned_buf = NULL;
        }
        memset(&inst->image_dsc, 0, sizeof(inst->image_dsc));
        inst->image = NULL;
        inst->card = NULL;
        inst->status_label = NULL;
        inst->fetching = false;
        inst->active = false;
    }
}

void ui_cameras_page_on_shown(const char *page_id)
{
    if (page_id == NULL) {
        return;
    }
    for (size_t i = 0; i < APP_MAX_CAMERAS; i++) {
        ui_camera_instance_t *inst = &s_instances[i];
        if (!inst->active) {
            continue;
        }
        if (strncmp(inst->page_id, page_id, APP_MAX_PAGE_ID_LEN) == 0) {
            /* Force an immediate refresh of the visible page. */
            inst->fail_count = 0;
            inst->fetching = false;
            if (inst->timer != NULL) {
                cam_timer_cb(inst->timer);
            }
        }
    }
}
