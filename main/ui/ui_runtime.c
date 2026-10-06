/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "ui/ui_runtime.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "cJSON.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "app_config.h"
#include "app_events.h"
#include "app_task.h"
#include "diag/system_log.h"
#include "drivers/display_init.h"
#include "ha/ha_client.h"
#include "ha/ha_model.h"
#include "layout/layout_store.h"
#include "net/wifi_mgr.h"
#include "ui/fonts/mdi_font_registry.h"
#include "ui/ui_cameras_page.h"
#include "ui/ui_energy_page.h"
#include "ui/ui_i18n.h"
#include "ui/ui_memory.h"
#include "ui/ui_music_page.h"
#include "ui/ui_pages.h"
#include "ui/ui_radio_page.h"
#include "ui/ui_settings.h"
#include "ui/ui_page_style.h"
#include "ui/ui_page_transition.h"
#include "ui/ui_press_feedback.h"
#include "ui/ui_theme_router.h"
#include "ui/ui_value_anim.h"
#include "ui/ui_screen_saver.h"
#include "ui/ui_widget_factory.h"
#include "ui/theme/theme_default.h"
#include "util/log_tags.h"
#include "xiaozhi/xiaozhi_ui.h"

#define UI_MODEL_RECONCILE_INTERVAL_MS 1000

static ui_widget_instance_t *s_widgets = NULL;
static size_t s_widget_count = 0;
static ui_energy_page_instance_t *s_energy_pages = NULL;
static size_t s_energy_page_count = 0;
static ui_music_page_instance_t *s_music_pages = NULL;
static size_t s_music_page_count = 0;
static ui_radio_page_instance_t *s_radio_pages = NULL;
static size_t s_radio_page_count = 0;

/* Scratch config for the radio page.  It holds the station table (~7 KB), which
 * is too much for the UI task stack, and every caller runs with the display lock
 * held, so one shared instance is safe. */
static ui_radio_page_config_t s_radio_config_scratch;

static void ui_runtime_update_widget_visibility(const char *page_id, bool refresh_visible_widgets);

#if APP_UI_RECT_DIAG
static void ui_runtime_diag_dump_rects(void);
#endif

/* Invoked by ui_pages whenever the active page changes.
 * If the newly shown page is an energy dashboard, ask the HA client to
 * refresh the statistics immediately so the user sees fresh kWh values
 * instead of waiting for the next HA_ENERGY_SYNC_INTERVAL_MS tick. */
static void ui_runtime_on_page_shown(const char *page_id, uint16_t index)
{
    (void)index;
    if (page_id == NULL || page_id[0] == '\0') {
        return;
    }
    for (size_t i = 0; i < s_energy_page_count; i++) {
        if (strncmp(s_energy_pages[i].page_id, page_id, APP_MAX_PAGE_ID_LEN) == 0) {
            (void)ha_client_request_energy_refresh();
            (void)ui_energy_page_apply_all_states(&s_energy_pages[i]);
            break;
        }
    }
    ui_cameras_page_set_visible_page(page_id);
    ui_cameras_page_on_shown(page_id);
    ui_radio_page_on_shown(page_id);
    for (size_t i = 0; i < s_music_page_count; i++) {
        if (strncmp(s_music_pages[i].page_id, page_id, APP_MAX_PAGE_ID_LEN) == 0) {
            (void)ui_music_page_apply_all_states(&s_music_pages[i]);
            break;
        }
    }
    ui_runtime_update_widget_visibility(page_id, true);
#if APP_UI_RECT_DIAG
    ui_runtime_diag_dump_rects();
#endif
    /* A page may carry its own theme ("page_theme"); switching it is deferred to
     * the UI loop so the pages are never rebuilt from inside this callback. */
    ui_theme_router_notify_page_shown(page_id);
}
static TaskHandle_t s_ui_task = NULL;
/* Incremented at the top of the UI task loop. The system log watchdog restarts
 * the panel if this value stops advancing (UI task stuck holding the LVGL lock). */
static volatile uint32_t s_heartbeat = 0;
static ha_state_t s_state_scratch;
static bool s_initialized = false;
static int64_t s_last_topbar_refresh_ms = 0;
static int64_t s_last_model_reconcile_ms = 0;
static uint32_t s_last_model_revision = 0;
static bool s_model_reconcile_pending = false;
static bool s_pending_state_reconcile = false;
static bool s_pending_topbar_refresh = false;
static uint32_t s_deferred_event_count = 0;
static int64_t s_deferred_event_log_ms = 0;

/* Widget-apply gating bookkeeping (see the gating block further down): how many
 * widgets a sweep actually repainted vs skipped, and how long it took. */
static uint32_t s_apply_painted_count = 0;
static uint32_t s_apply_skipped_count = 0;
static uint32_t s_sweep_count = 0;
static uint32_t s_sweep_last_ms = 0;
static uint32_t s_sweep_max_ms = 0;
static uint32_t s_sweep_last_painted = 0;
static int64_t s_sweep_start_us = 0;
static uint32_t s_sweep_start_painted = 0;

/* A sweep that paints only the widgets whose data changed costs well under a
 * millisecond; anything above this means the gating regressed and the whole
 * page is being repainted again. */
#define UI_RUNTIME_SWEEP_WARN_MS 60

static uint32_t ui_runtime_begin_sweep(void)
{
    s_sweep_start_us = esp_timer_get_time();
    s_sweep_start_painted = s_apply_painted_count;
    return s_apply_painted_count;
}

static void ui_runtime_end_sweep(uint32_t painted_before, const char *kind)
{
    uint32_t ms = (uint32_t)((esp_timer_get_time() - s_sweep_start_us) / 1000);
    uint32_t painted = s_apply_painted_count - painted_before;
    s_sweep_count++;
    s_sweep_last_ms = ms;
    s_sweep_last_painted = painted;
    if (ms > s_sweep_max_ms) {
        s_sweep_max_ms = ms;
    }
    if (ms >= UI_RUNTIME_SWEEP_WARN_MS) {
        ESP_LOGW(TAG_UI, "state sweep(%s) took %ums: painted=%u skipped=%u widgets=%u",
                 kind, (unsigned)ms, (unsigned)painted,
                 (unsigned)(s_apply_skipped_count), (unsigned)s_widget_count);
    }
}

static esp_err_t ui_runtime_alloc_buffers(void)
{
    if (s_widgets == NULL) {
        s_widgets = ui_calloc_prefer_psram(APP_MAX_WIDGETS_TOTAL, sizeof(*s_widgets));
        if (s_widgets == NULL) {
            ESP_LOGE(TAG_UI, "Failed to allocate widget runtime buffer (%u slots)",
                     (unsigned)APP_MAX_WIDGETS_TOTAL);
            return ESP_ERR_NO_MEM;
        }
    }

    if (s_energy_pages == NULL) {
        s_energy_pages = ui_calloc_prefer_psram(APP_MAX_PAGES, sizeof(*s_energy_pages));
        if (s_energy_pages == NULL) {
            ESP_LOGE(TAG_UI, "Failed to allocate energy page runtime buffer (%u pages)", (unsigned)APP_MAX_PAGES);
            return ESP_ERR_NO_MEM;
        }
    }

    if (s_music_pages == NULL) {
        s_music_pages = ui_calloc_prefer_psram(APP_MAX_PAGES, sizeof(*s_music_pages));
        if (s_music_pages == NULL) {
            ESP_LOGE(TAG_UI, "Failed to allocate music page runtime buffer (%u pages)", (unsigned)APP_MAX_PAGES);
            return ESP_ERR_NO_MEM;
        }
    }

    if (s_radio_pages == NULL) {
        s_radio_pages = ui_calloc_prefer_psram(APP_MAX_PAGES, sizeof(*s_radio_pages));
        if (s_radio_pages == NULL) {
            ESP_LOGE(TAG_UI, "Failed to allocate radio page runtime buffer (%u pages)", (unsigned)APP_MAX_PAGES);
            return ESP_ERR_NO_MEM;
        }
    }

    return ESP_OK;
}

typedef struct {
    bool valid;
    int minute;
    int hour;
    int day;
    int month;
    int year;
    bool wifi_connected;
    bool wifi_setup_ap_active;
    bool ha_connected;
    bool ha_initial_sync_done;
} ui_topbar_cache_t;
static ui_topbar_cache_t s_topbar_cache = {0};
/* Set when a layout reload could not take the display lock; the UI task loop
 * retries so a saved layout is never silently dropped. */
static bool s_layout_reload_pending = false;
static int64_t s_layout_reload_retry_ms = 0;
/* Page the next rebuild should show: set by request_layout_reload_on_page() so
 * a theme change does not throw the user back to the first page. */
static char s_restore_page_id[APP_MAX_PAGE_ID_LEN];
static bool s_restore_page_id_valid = false;

/* How long a layout rebuild waits for the display lock. The render task only
 * holds it for one frame, so this is generous. */
#define UI_LAYOUT_LOCK_TIMEOUT_MS 2000
#define UI_LAYOUT_RETRY_INTERVAL_MS 250
#define UI_LAYOUT_PUBLISH_TIMEOUT_MS 200
/* Event handling must never park the UI task on the display lock; on timeout the
 * event is deferred to the next reconcile pass instead. */
#define UI_EVENT_LOCK_TIMEOUT_MS 1000

static esp_err_t ui_runtime_apply_layout_locked(const char *layout_json);

#if APP_UI_TEST_WEATHER_ICON_OVERLAY
static lv_obj_t *s_weather_icon_overlay = NULL;
#endif

typedef struct {
    int min_w;
    int min_h;
    int max_w;
    int max_h;
} ui_widget_size_limits_t;

static ui_widget_size_limits_t ui_runtime_widget_size_limits(const char *type)
{
    ui_widget_size_limits_t limits = {
        .min_w = 60,
        .min_h = 60,
        .max_w = APP_CONTENT_BOX_WIDTH,
        .max_h = APP_CONTENT_BOX_HEIGHT,
    };

    if (type == NULL) {
        return limits;
    }

    if (strcmp(type, "sensor") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 90;
        limits.min_h = 60;
#else
        limits.min_w = 120;
        limits.min_h = 80;
#endif
    } else if (strcmp(type, "binary_sensor") == 0 || strcmp(type, "presence") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 90;
        limits.min_h = 60;
#else
        limits.min_w = 120;
        limits.min_h = 80;
#endif
    } else if (strcmp(type, "binary_sensor") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 90;
        limits.min_h = 60;
#else
        limits.min_w = 120;
        limits.min_h = 80;
#endif
    } else if (strcmp(type, "alarm_tile") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 150;
        limits.min_h = 110;
#else
        limits.min_w = 200;
        limits.min_h = 140;
#endif
    } else if (strcmp(type, "clock_alarm") == 0) {
        /* Must fit the clock plus the optional date row; the date row is
         * dropped automatically on small tiles. */
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 110;
        limits.min_h = 80;
#else
        limits.min_w = 150;
        limits.min_h = 110;
#endif
    } else if (strcmp(type, "button") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 82;
        limits.min_h = 82;
        limits.max_w = 320;
        limits.max_h = 260;
#else
        limits.min_w = 100;
        limits.min_h = 100;
        limits.max_w = 480;
        limits.max_h = 320;
#endif
    } else if (strcmp(type, "slider") == 0) {
        limits.min_w = 100;
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_h = 80;
#else
        limits.min_h = 100;
#endif
    } else if (strcmp(type, "graph") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 150;
        limits.min_h = 100;
#else
        limits.min_w = 220;
        limits.min_h = 140;
#endif
    } else if (strcmp(type, "empty_tile") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 100;
        limits.min_h = 70;
#else
        limits.min_w = 120;
        limits.min_h = 80;
#endif
    } else if (strcmp(type, "light_tile") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 140;
        limits.min_h = 140;
#else
        limits.min_w = 150;
        limits.min_h = 150;
#endif
        limits.max_w = 480;
        limits.max_h = 480;
    } else if (strcmp(type, "heating_tile") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 150;
        limits.min_h = 150;
#else
        limits.min_w = 220;
        limits.min_h = 200;
#endif
        limits.max_w = 480;
        limits.max_h = 480;
    } else if (strcmp(type, "weather_tile") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 160;
        limits.min_h = 150;
#else
        limits.min_w = 220;
        limits.min_h = 200;
#endif
        limits.max_w = 480;
        limits.max_h = 480;
    } else if (strcmp(type, "weather_3day") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 300;
        limits.min_h = 190;
#else
        limits.min_w = 260;
        limits.min_h = 220;
#endif
        limits.max_w = 640;
        limits.max_h = 480;
    } else if (strcmp(type, "todo_list") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 180;
        limits.min_h = 160;
#else
        limits.min_w = 220;
        limits.min_h = 200;
#endif
        limits.max_w = 640;
        limits.max_h = 640;
    } else if (strcmp(type, "media_player") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 200;
        limits.min_h = 170;
#else
        limits.min_w = 260;
        limits.min_h = 220;
#endif
        limits.max_w = APP_CONTENT_BOX_WIDTH;
        limits.max_h = APP_CONTENT_BOX_HEIGHT;
    } else if (strcmp(type, "roborock_tile") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 220;
        limits.min_h = 190;
#else
        limits.min_w = 240;
        limits.min_h = 220;
#endif
        limits.max_w = APP_CONTENT_BOX_WIDTH;
        limits.max_h = APP_CONTENT_BOX_HEIGHT;
    } else if (strcmp(type, "lock") == 0 || strcmp(type, "fan") == 0 || strcmp(type, "cover") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 100;
        limits.min_h = 90;
#else
        limits.min_w = 140;
        limits.min_h = 120;
#endif
        limits.max_w = 480;
        limits.max_h = 480;
    } else if (strcmp(type, "select") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 140;
        limits.min_h = 80;
#else
        limits.min_w = 180;
        limits.min_h = 100;
#endif
        limits.max_w = 480;
        limits.max_h = 300;
    } else if (strcmp(type, "number") == 0) {
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 100;
        limits.min_h = 90;
#else
        limits.min_w = 140;
        limits.min_h = 120;
#endif
        limits.max_w = 480;
        limits.max_h = 480;
    }

    if (limits.max_w > APP_CONTENT_BOX_WIDTH) {
        limits.max_w = APP_CONTENT_BOX_WIDTH;
    }
    if (limits.max_h > APP_CONTENT_BOX_USABLE_HEIGHT) {
        limits.max_h = APP_CONTENT_BOX_USABLE_HEIGHT;
    }
    return limits;
}

static void ui_runtime_clamp_widget_rect(ui_widget_def_t *def)
{
    if (def == NULL) {
        return;
    }

#if APP_UI_RECT_DIAG
    const int diag_x0 = def->x;
    const int diag_y0 = def->y;
    const int diag_w0 = def->w;
    const int diag_h0 = def->h;
#endif

    ui_widget_size_limits_t limits = ui_runtime_widget_size_limits(def->type);

    if (def->w < limits.min_w) {
        def->w = limits.min_w;
    }
    if (def->h < limits.min_h) {
        def->h = limits.min_h;
    }
    if (def->w > limits.max_w) {
        def->w = limits.max_w;
    }
    if (def->h > limits.max_h) {
        def->h = limits.max_h;
    }

    if (def->x < 0) {
        def->x = 0;
    }
    if (def->y < 0) {
        def->y = 0;
    }

    if (def->x + def->w > APP_CONTENT_BOX_WIDTH) {
        def->x = APP_CONTENT_BOX_WIDTH - def->w;
    }
    /* Everything below the content box is the navigation bar, so a widget that
     * still reaches the old bottom edge gets its own rectangle trimmed instead
     * of being pushed up: shrinking the height keeps the widget where the user
     * placed it (moving y would make it overlap the tile above it) and leaves
     * the grid gap in front of the menu. If the widget already sits so low that
     * the trim would go under its minimum height, the minimum wins and the
     * widget is nudged up by the remaining few pixels. */
    if (def->y + def->h > APP_CONTENT_BOX_USABLE_HEIGHT) {
        int available = APP_CONTENT_BOX_USABLE_HEIGHT - def->y;
        if (available >= limits.min_h) {
            def->h = available;
        } else {
            def->h = limits.min_h;
            def->y = APP_CONTENT_BOX_USABLE_HEIGHT - def->h;
            if (def->y < 0) {
                def->y = 0;
                def->h = APP_CONTENT_BOX_USABLE_HEIGHT;
            }
        }
    }

    if (def->x < 0) {
        def->x = 0;
    }
    if (def->y < 0) {
        def->y = 0;
    }

#if APP_UI_RECT_DIAG
    if (diag_x0 != def->x || diag_y0 != def->y || diag_w0 != def->w || diag_h0 != def->h) {
        ESP_LOGI(TAG_UI, "RECTDIAG clamp %s/%s (%d,%d %dx%d) -> (%d,%d %dx%d)",
                 def->type, def->id, diag_x0, diag_y0, diag_w0, diag_h0,
                 def->x, def->y, def->w, def->h);
    }
#endif
}

#if APP_UI_RECT_DIAG
static void ui_runtime_diag_log_obj(const char *role, const ui_widget_instance_t *widget, const lv_obj_t *obj, int depth)
{
    lv_area_t coords = {0};
    lv_obj_get_coords((lv_obj_t *)obj, &coords);
    const lv_obj_t *parent = lv_obj_get_parent(obj);

    ESP_LOGI(TAG_UI,
             "RECTDIAG %s d%d %s/%s obj=(%d,%d %dx%d) rel=(%d,%d) scr=(%d,%d)-(%d,%d) parent=%p tw=%d th=%d",
             role, depth, widget != NULL ? widget->type : "-", widget != NULL ? widget->id : "-",
             (int)lv_obj_get_x(obj), (int)lv_obj_get_y(obj),
             (int)lv_obj_get_width(obj), (int)lv_obj_get_height(obj),
             (int)lv_obj_get_x(obj), (int)lv_obj_get_y(obj),
             (int)coords.x1, (int)coords.y1, (int)coords.x2, (int)coords.y2,
             (const void *)parent,
             (int)lv_obj_get_style_translate_x(obj, LV_PART_MAIN),
             (int)lv_obj_get_style_translate_y(obj, LV_PART_MAIN));
}

static void ui_runtime_diag_dump_rects(void)
{
    lv_obj_update_layout(lv_scr_act());

    const char *page_id = ui_pages_current_id();
    const lv_obj_t *scr = lv_scr_act();
    lv_area_t scr_coords = {0};
    lv_obj_get_coords((lv_obj_t *)scr, &scr_coords);
    ESP_LOGI(TAG_UI, "RECTDIAG screen (%d,%d)-(%d,%d) page=%s content_box_y=%d usable_h=%d gutter=%d",
             (int)scr_coords.x1, (int)scr_coords.y1, (int)scr_coords.x2, (int)scr_coords.y2,
             page_id != NULL ? page_id : "-",
             APP_CONTENT_BOX_Y, APP_CONTENT_BOX_USABLE_HEIGHT, APP_CONTENT_BOX_BOTTOM_GUTTER);

    size_t dumped = 0;
    for (size_t i = 0; i < s_widget_count; i++) {
        const ui_widget_instance_t *widget = &s_widgets[i];
        if (widget->obj == NULL || page_id == NULL || strcmp(widget->page_id, page_id) != 0) {
            continue;
        }

        ui_runtime_diag_log_obj("root", widget, widget->obj, 0);
        const lv_obj_t *parent = lv_obj_get_parent(widget->obj);
        if (parent != NULL) {
            ui_runtime_diag_log_obj("page", widget, parent, -1);
        }

        const uint32_t child_count = lv_obj_get_child_count(widget->obj);
        const uint32_t limit = child_count < 4 ? child_count : 4;
        for (uint32_t c = 0; c < limit; c++) {
            const lv_obj_t *child = lv_obj_get_child(widget->obj, (int32_t)c);
            if (child == NULL) {
                continue;
            }
            ui_runtime_diag_log_obj("child", widget, child, (int)(c + 1));
        }

        if (++dumped >= 6) {
            break;
        }
    }
    ESP_LOGI(TAG_UI, "RECTDIAG done page=%s widgets=%u dumped=%u",
             page_id != NULL ? page_id : "-", (unsigned)s_widget_count, (unsigned)dumped);
}
#endif

static void ui_runtime_refresh_topbar(void)
{
    time_t now = time(NULL);
    struct tm info = {0};
    localtime_r(&now, &info);

    bool wifi_connected = wifi_mgr_is_connected();
    bool wifi_setup_ap_active = wifi_mgr_is_setup_ap_active();
    bool ha_connected = ha_client_is_connected();
    bool ha_initial_sync_done = ha_client_is_initial_sync_done();

    bool datetime_changed = !s_topbar_cache.valid || info.tm_min != s_topbar_cache.minute ||
                            info.tm_hour != s_topbar_cache.hour || info.tm_mday != s_topbar_cache.day ||
                            info.tm_mon != s_topbar_cache.month || info.tm_year != s_topbar_cache.year;
    bool status_changed = !s_topbar_cache.valid || wifi_connected != s_topbar_cache.wifi_connected ||
                          wifi_setup_ap_active != s_topbar_cache.wifi_setup_ap_active ||
                          ha_connected != s_topbar_cache.ha_connected ||
                          ha_initial_sync_done != s_topbar_cache.ha_initial_sync_done;

    if (datetime_changed) {
        ui_pages_set_topbar_datetime(&info);
    }
    if (status_changed) {
        ui_pages_set_topbar_status(wifi_connected, wifi_setup_ap_active, ha_connected, ha_initial_sync_done);
    }

    s_topbar_cache.valid = true;
    s_topbar_cache.minute = info.tm_min;
    s_topbar_cache.hour = info.tm_hour;
    s_topbar_cache.day = info.tm_mday;
    s_topbar_cache.month = info.tm_mon;
    s_topbar_cache.year = info.tm_year;
    s_topbar_cache.wifi_connected = wifi_connected;
    s_topbar_cache.wifi_setup_ap_active = wifi_setup_ap_active;
    s_topbar_cache.ha_connected = ha_connected;
    s_topbar_cache.ha_initial_sync_done = ha_initial_sync_done;
}

static void ui_runtime_show_weather_icon_overlay(void)
{
#if APP_UI_TEST_WEATHER_ICON_OVERLAY
    if (s_weather_icon_overlay != NULL) {
        lv_obj_move_foreground(s_weather_icon_overlay);
        return;
    }

    const lv_font_t *font = mdi_font_weather();
    if (font == NULL) {
        font = mdi_font_large();
    }

    s_weather_icon_overlay = lv_label_create(lv_layer_top());
    lv_obj_add_flag(s_weather_icon_overlay, LV_OBJ_FLAG_IGNORE_LAYOUT);
    lv_obj_set_style_text_color(s_weather_icon_overlay, lv_color_hex(0x2FE3E3), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(s_weather_icon_overlay, LV_OPA_TRANSP, LV_PART_MAIN);
    if (font != NULL) {
        lv_obj_set_style_text_font(s_weather_icon_overlay, font, LV_PART_MAIN);
    }

    /* Rainy icon U+F0597 rendered directly from weather font on top layer. */
    lv_label_set_text(s_weather_icon_overlay, "\xF3\xB0\x96\x97");
    lv_obj_align(s_weather_icon_overlay, LV_ALIGN_CENTER, 0, -20);
    lv_obj_move_foreground(s_weather_icon_overlay);

    ESP_LOGI(TAG_UI, "Weather icon overlay test enabled (font=%s)",
        (mdi_font_weather() != NULL) ? "72/56" : "none");
#endif
}

/* ---------------------------------------------------------------------------
 * State gating
 *
 * The HA model bumps its revision whenever any entity changes, which on this
 * panel happens every few seconds (sensors).  The runtime answered every
 * revision with a full sweep over all widgets, and every widget apply ends in
 * unconditional style writes (widget_refresh_tile_after_state()).  LVGL has no
 * value comparison in lv_obj_set_local_style_prop() -> lv_obj_refresh_style()
 * -> lv_obj_invalidate(), so re-applying identical data still invalidated the
 * complete content area, which cost ~0.8 s per sweep (4 partial renders with
 * sw_rotate) and produced the visible tearing/"light blue flash".
 *
 * Each widget now remembers a signature of the data it was painted with, so
 * widgets whose primary/secondary state did not change are skipped entirely.
 * Nothing depends on being re-applied with unchanged data: widgets that animate
 * on their own (clock, media, cover, sensor age, alarm, timer, todo) run their
 * own lv_timer.
 * ------------------------------------------------------------------------- */
static uint32_t ui_runtime_hash_bytes(uint32_t h, const void *data, size_t len)
{
    const uint8_t *bytes = (const uint8_t *)data;
    for (size_t i = 0; i < len; i++) {
        h ^= bytes[i];
        h *= 16777619u;
    }
    return h;
}

static uint32_t ui_runtime_hash_state(uint32_t h, const ha_state_t *state)
{
    h = ui_runtime_hash_bytes(h, state->state, strlen(state->state));
    h = ui_runtime_hash_bytes(h, state->attributes_json, strlen(state->attributes_json));
    h = ui_runtime_hash_bytes(h, &state->last_changed_unix_ms, sizeof(state->last_changed_unix_ms));
    return h;
}

/* Extract the entity id from a list token. Tokens may be a plain entity id
 * ("sensor.cpu_temp") or a labeled pair ("GPU=sensor.gpu_temp"). A trailing
 * per-row style suffix (":bar", ":dot", ":status", ":chart", ":ports",
 * ":ip", ":power[:color]", ":aqi", ":pm", ":pm10", ":co2", ":tvoc", ":ch2o",
 * ":co", ":level") is stripped. Returns false when the token has no usable
 * entity part (including legend tokens like ":legend:pm"). */
static bool ui_runtime_token_entity(const char *start, const char *end, char *out, size_t out_len)
{
    if (start == NULL || end == NULL || out == NULL || out_len == 0) {
        return false;
    }
    while (start < end && (*start == ' ' || *start == '\t' || *start == '\n' || *start == '\r')) {
        start++;
    }
    while (end > start && (end[-1] == ' ' || end[-1] == '\t' || end[-1] == '\n' || end[-1] == '\r')) {
        end--;
    }

    const char *eq = start;
    while (eq < end && *eq != '=') {
        eq++;
    }
    if (eq < end) {
        start = eq + 1;
        while (start < end && (*start == ' ' || *start == '\t' || *start == '\n' || *start == '\r')) {
            start++;
        }
        while (end > start && (end[-1] == ' ' || end[-1] == '\t' || end[-1] == '\n' || end[-1] == '\r')) {
            end--;
        }
    }

    size_t elen = (size_t)(end - start);
    if (elen >= 4 && strncmp(end - 4, ":bar", 4) == 0) {
        end -= 4;
    } else if (elen >= 4 && strncmp(end - 4, ":dot", 4) == 0) {
        end -= 4;
    } else if (elen >= 7 && strncmp(end - 7, ":status", 7) == 0) {
        end -= 7;
    } else if (elen >= 6 && strncmp(end - 6, ":chart", 6) == 0) {
        end -= 6;
    } else if (elen >= 6 && strncmp(end - 6, ":ports", 6) == 0) {
        end -= 6;
    } else if (elen >= 3 && strncmp(end - 3, ":ip", 3) == 0) {
        end -= 3;
    } else {
        const char *p = start;
        while (p + 6 <= end) {
            if (strncmp(p, ":power", 6) == 0 &&
                (p + 6 == end || p[6] == ':' || p[6] == '#')) {
                end = p;
                break;
            }
            p++;
        }
    }

    /* Air-quality scale suffixes (":aqi", ":pm", ":pm10", ":co2", ":tvoc",
     * ":ch2o", ":co", ":level"). Kept in sync with w_sensor_tile.c. */
    elen = (size_t)(end - start);
    if (elen >= 5 && strncmp(end - 5, ":pm10", 5) == 0) {
        end -= 5;
    } else if (elen >= 5 && strncmp(end - 5, ":tvoc", 5) == 0) {
        end -= 5;
    } else if (elen >= 5 && strncmp(end - 5, ":ch2o", 5) == 0) {
        end -= 5;
    } else if (elen >= 6 && strncmp(end - 6, ":level", 6) == 0) {
        end -= 6;
    } else if (elen >= 4 && strncmp(end - 4, ":aqi", 4) == 0) {
        end -= 4;
    } else if (elen >= 4 && strncmp(end - 4, ":co2", 4) == 0) {
        end -= 4;
    } else if (elen >= 3 && strncmp(end - 3, ":pm", 3) == 0) {
        end -= 3;
    } else if (elen >= 3 && strncmp(end - 3, ":co", 3) == 0) {
        end -= 3;
    }

    size_t len = (size_t)(end - start);
    if (len == 0 || len >= out_len) {
        return false;
    }
    /* Entity ids always carry a "domain.name" dot; anything without one is a
     * legend token (":legend:pm") or garbage, not an entity. */
    if (memchr(start, '.', len) == NULL) {
        return false;
    }
    memcpy(out, start, len);
    out[len] = '\0';
    return true;
}

static bool ui_runtime_entity_in_list(const char *list, const char *entity_id)
{
    if (list == NULL || list[0] == '\0' || entity_id == NULL || entity_id[0] == '\0') {
        return false;
    }
    const char *cursor = list;
    while (*cursor != '\0') {
        while (*cursor == ' ' || *cursor == ',' || *cursor == '\t' || *cursor == '\n' || *cursor == '\r') {
            cursor++;
        }
        if (*cursor == '\0') {
            break;
        }
        const char *start = cursor;
        while (*cursor != '\0' && *cursor != ',') {
            cursor++;
        }
        char token_entity[APP_MAX_ENTITY_ID_LEN];
        if (ui_runtime_token_entity(start, cursor, token_entity, sizeof(token_entity)) &&
            strcmp(entity_id, token_entity) == 0) {
            return true;
        }
    }
    return false;
}

static uint32_t ui_runtime_widget_state_signature(ui_widget_instance_t *widget,
                                                  bool *primary_found, bool *secondary_found)
{
    uint32_t h = 2166136261u;
    bool primary = false;
    bool secondary = false;

    if (widget->entity_id[0] != '\0') {
        memset(&s_state_scratch, 0, sizeof(s_state_scratch));
        if (ha_model_get_state(widget->entity_id, &s_state_scratch)) {
            primary = true;
            h = ui_runtime_hash_state(h, &s_state_scratch);
        }
    }
    if (!primary) {
        h ^= 0x2545F491u;
        h *= 16777619u;
    }

    if (widget->secondary_entity_id[0] != '\0' &&
        strncmp(widget->secondary_entity_id, widget->entity_id, APP_MAX_ENTITY_ID_LEN) != 0) {
        memset(&s_state_scratch, 0, sizeof(s_state_scratch));
        if (ha_model_get_state(widget->secondary_entity_id, &s_state_scratch)) {
            secondary = true;
            h = ui_runtime_hash_state(h, &s_state_scratch);
        } else {
            h ^= 0x7F4A7C15u;
            h *= 16777619u;
        }
    } else {
        h ^= 0x9E3779B9u;
        h *= 16777619u;
    }

    if (widget->extra_entity_ids[0] != '\0') {
        const char *cursor = widget->extra_entity_ids;
        while (*cursor != '\0') {
            while (*cursor == ' ' || *cursor == ',' || *cursor == '\t' || *cursor == '\n' || *cursor == '\r') {
                cursor++;
            }
            if (*cursor == '\0') {
                break;
            }
            char entity_id[APP_MAX_ENTITY_ID_LEN];
            const char *start = cursor;
            while (*cursor != '\0' && *cursor != ',') {
                cursor++;
            }
            if (!ui_runtime_token_entity(start, cursor, entity_id, sizeof(entity_id))) {
                continue;
            }
            memset(&s_state_scratch, 0, sizeof(s_state_scratch));
            if (ha_model_get_state(entity_id, &s_state_scratch)) {
                h = ui_runtime_hash_state(h, &s_state_scratch);
            } else {
                h ^= 0x5AB2E3EDu;
                h *= 16777619u;
            }
        }
    }

    if (primary_found != NULL) {
        *primary_found = primary;
    }
    if (secondary_found != NULL) {
        *secondary_found = secondary;
    }
    return h;
}

/* Paint one widget from the model, skipping it when its data is unchanged.
 * Returns true when the widget was touched. */
static bool ui_runtime_sync_widget_state(ui_widget_instance_t *widget, bool allow_mark_unavailable)
{
    if (widget == NULL) {
        return false;
    }

    bool primary_found = false;
    bool secondary_found = false;
    uint32_t sig = ui_runtime_widget_state_signature(widget, &primary_found, &secondary_found);

    /* A widget already showing "unavailable" does not need to be marked again;
     * only the first marking changes pixels. */
    bool needs_mark = (!primary_found && allow_mark_unavailable && !widget->applied_state_missing_marked);
    if (widget->applied_state_sig_valid && sig == widget->applied_state_sig && !needs_mark) {
        s_apply_skipped_count++;
        return false;
    }
    widget->applied_state_sig = sig;
    widget->applied_state_sig_valid = true;
    widget->applied_state_missing_marked = (!primary_found && allow_mark_unavailable);

    if (widget->entity_id[0] != '\0') {
        memset(&s_state_scratch, 0, sizeof(s_state_scratch));
        if (ha_model_get_state(widget->entity_id, &s_state_scratch)) {
            ui_widget_factory_apply_state(widget, &s_state_scratch);
        } else if (allow_mark_unavailable) {
            ui_widget_factory_mark_unavailable(widget);
        }
    }

    if (secondary_found) {
        memset(&s_state_scratch, 0, sizeof(s_state_scratch));
        if (ha_model_get_state(widget->secondary_entity_id, &s_state_scratch)) {
            ui_widget_factory_apply_state(widget, &s_state_scratch);
        }
    }

    if (widget->extra_entity_ids[0] != '\0') {
        const char *cursor = widget->extra_entity_ids;
        while (*cursor != '\0') {
            while (*cursor == ' ' || *cursor == ',' || *cursor == '\t' || *cursor == '\n' || *cursor == '\r') {
                cursor++;
            }
            if (*cursor == '\0') {
                break;
            }
            char entity_id[APP_MAX_ENTITY_ID_LEN];
            const char *start = cursor;
            while (*cursor != '\0' && *cursor != ',') {
                cursor++;
            }
            if (!ui_runtime_token_entity(start, cursor, entity_id, sizeof(entity_id))) {
                continue;
            }
            memset(&s_state_scratch, 0, sizeof(s_state_scratch));
            if (ha_model_get_state(entity_id, &s_state_scratch)) {
                ui_widget_factory_apply_state(widget, &s_state_scratch);
            } else {
                memset(&s_state_scratch, 0, sizeof(s_state_scratch));
                snprintf(s_state_scratch.entity_id, sizeof(s_state_scratch.entity_id), "%s", entity_id);
                snprintf(s_state_scratch.state, sizeof(s_state_scratch.state), "%s", "unavailable");
                ui_widget_factory_apply_state(widget, &s_state_scratch);
            }
        }
    }

    s_apply_painted_count++;
    return true;
}

/* A state arrived for one entity (EV_HA_STATE_CHANGED): repaint only the
 * widgets that actually show it, and only when their data changed. */
static void ui_runtime_apply_entity_state(const char *entity_id)
{
    if (entity_id == NULL || entity_id[0] == '\0') {
        return;
    }

    memset(&s_state_scratch, 0, sizeof(s_state_scratch));
    bool found = ha_model_get_state(entity_id, &s_state_scratch);
    for (size_t i = 0; i < s_widget_count; i++) {
        bool is_primary = (strncmp(entity_id, s_widgets[i].entity_id, APP_MAX_ENTITY_ID_LEN) == 0);
        bool is_secondary = (s_widgets[i].secondary_entity_id[0] != '\0') &&
                            (strncmp(entity_id, s_widgets[i].secondary_entity_id, APP_MAX_ENTITY_ID_LEN) == 0);
        bool is_extra = ui_runtime_entity_in_list(s_widgets[i].extra_entity_ids, entity_id);
        if (!is_primary && !is_secondary && !is_extra) {
            continue;
        }
        (void)ui_runtime_sync_widget_state(&s_widgets[i], is_primary);
    }

    if (found) {
        for (size_t i = 0; i < s_energy_page_count; i++) {
            (void)ui_energy_page_apply_state(&s_energy_pages[i], &s_state_scratch);
        }
        for (size_t i = 0; i < s_music_page_count; i++) {
            if (ui_music_page_apply_state_detect_play_start(&s_music_pages[i], &s_state_scratch)) {
                /* Playback just started: wake the panel (dismiss the
                 * screensaver and restore full brightness) and jump straight
                 * to the music tab. */
                display_note_activity_from("music-play");
                (void)ui_pages_show(s_music_pages[i].page_id);
            }
        }
        for (size_t i = 0; i < s_radio_page_count; i++) {
            ui_radio_page_apply_state(&s_radio_pages[i], &s_state_scratch);
        }
    }
}

static void ui_runtime_apply_widget_current_state(ui_widget_instance_t *widget, bool mark_unavailable_if_missing)
{
    if (widget == NULL) {
        return;
    }

    /* Page became visible (or the layout reloaded): force one repaint and
     * refresh the stored signature so the next sweep can skip it again. */
    widget->applied_state_sig_valid = false;
    (void)ui_runtime_sync_widget_state(widget, mark_unavailable_if_missing);
}

static void ui_runtime_update_widget_visibility(const char *page_id, bool refresh_visible_widgets)
{
    if (page_id == NULL || page_id[0] == '\0') {
        return;
    }

    for (size_t i = 0; i < s_widget_count; i++) {
        bool visible = (strncmp(s_widgets[i].page_id, page_id, APP_MAX_PAGE_ID_LEN) == 0);
        ui_widget_factory_set_visible(&s_widgets[i], visible);
        if (visible && refresh_visible_widgets) {
            ui_runtime_apply_widget_current_state(&s_widgets[i], false);
        }
    }
}

static void ui_runtime_apply_all_states(void)
{
    uint32_t painted = ui_runtime_begin_sweep();
    for (size_t i = 0; i < s_widget_count; i++) {
        (void)ui_runtime_sync_widget_state(&s_widgets[i], true);
    }
    for (size_t i = 0; i < s_energy_page_count; i++) {
        ui_energy_page_apply_all_states(&s_energy_pages[i]);
    }
    for (size_t i = 0; i < s_music_page_count; i++) {
        ui_music_page_apply_all_states(&s_music_pages[i]);
    }
    for (size_t i = 0; i < s_radio_page_count; i++) {
        ui_radio_page_apply_all_states(&s_radio_pages[i]);
    }
    ui_runtime_end_sweep(painted, "all");
}

static void ui_runtime_apply_all_states_preserve_missing(void)
{
    uint32_t painted = ui_runtime_begin_sweep();
    for (size_t i = 0; i < s_widget_count; i++) {
        (void)ui_runtime_sync_widget_state(&s_widgets[i], false);
    }
    for (size_t i = 0; i < s_energy_page_count; i++) {
        ui_energy_page_apply_all_states(&s_energy_pages[i]);
    }
    for (size_t i = 0; i < s_music_page_count; i++) {
        ui_music_page_apply_all_states(&s_music_pages[i]);
    }
    for (size_t i = 0; i < s_radio_page_count; i++) {
        ui_radio_page_apply_all_states(&s_radio_pages[i]);
    }
    ui_runtime_end_sweep(painted, "preserve");
}

static void ui_runtime_copy_json_string(cJSON *obj, const char *key, char *dst, size_t dst_size);

static bool ui_runtime_widget_from_json(cJSON *widget_json, ui_widget_def_t *out)
{
    cJSON *id = cJSON_GetObjectItemCaseSensitive(widget_json, "id");
    cJSON *type = cJSON_GetObjectItemCaseSensitive(widget_json, "type");
    cJSON *title = cJSON_GetObjectItemCaseSensitive(widget_json, "title");
    cJSON *entity_id = cJSON_GetObjectItemCaseSensitive(widget_json, "entity_id");
    cJSON *secondary_entity_id = cJSON_GetObjectItemCaseSensitive(widget_json, "secondary_entity_id");
    cJSON *slider_direction = cJSON_GetObjectItemCaseSensitive(widget_json, "slider_direction");
    cJSON *slider_accent_color = cJSON_GetObjectItemCaseSensitive(widget_json, "slider_accent_color");
    cJSON *button_accent_color = cJSON_GetObjectItemCaseSensitive(widget_json, "button_accent_color");
    cJSON *button_mode = cJSON_GetObjectItemCaseSensitive(widget_json, "button_mode");
    cJSON *graph_line_color = cJSON_GetObjectItemCaseSensitive(widget_json, "graph_line_color");
    cJSON *graph_point_count = cJSON_GetObjectItemCaseSensitive(widget_json, "graph_point_count");
    cJSON *graph_time_window_min = cJSON_GetObjectItemCaseSensitive(widget_json, "graph_time_window_min");
    cJSON *graph_display_mode = cJSON_GetObjectItemCaseSensitive(widget_json, "graph_display_mode");
    cJSON *graph_bar_bucket_min = cJSON_GetObjectItemCaseSensitive(widget_json, "graph_bar_bucket_min");
    cJSON *style_variant = cJSON_GetObjectItemCaseSensitive(widget_json, "style_variant");
    cJSON *arc_opening = cJSON_GetObjectItemCaseSensitive(widget_json, "arc_opening");
    cJSON *binary_color_on = cJSON_GetObjectItemCaseSensitive(widget_json, "binary_color_on");
    cJSON *binary_color_off = cJSON_GetObjectItemCaseSensitive(widget_json, "binary_color_off");
    cJSON *binary_text_on = cJSON_GetObjectItemCaseSensitive(widget_json, "binary_text_on");
    cJSON *binary_text_off = cJSON_GetObjectItemCaseSensitive(widget_json, "binary_text_off");
    cJSON *binary_show_title = cJSON_GetObjectItemCaseSensitive(widget_json, "binary_show_title");
    cJSON *alarm_code = cJSON_GetObjectItemCaseSensitive(widget_json, "alarm_code");
    cJSON *alarm_modes = cJSON_GetObjectItemCaseSensitive(widget_json, "alarm_modes");
    cJSON *alarm_ask_code = cJSON_GetObjectItemCaseSensitive(widget_json, "alarm_ask_code");
    cJSON *alarm_show_sensors = cJSON_GetObjectItemCaseSensitive(widget_json, "alarm_show_sensors");
    cJSON *alarm_show_bypassed = cJSON_GetObjectItemCaseSensitive(widget_json, "alarm_show_bypassed");
    cJSON *alarm_force_arm = cJSON_GetObjectItemCaseSensitive(widget_json, "alarm_force_arm");
    cJSON *alarm_skip_delay = cJSON_GetObjectItemCaseSensitive(widget_json, "alarm_skip_delay");
    cJSON *clock_show_seconds = cJSON_GetObjectItemCaseSensitive(widget_json, "clock_show_seconds");
    cJSON *clock_show_date = cJSON_GetObjectItemCaseSensitive(widget_json, "clock_show_date");
    cJSON *sensor_value_color = cJSON_GetObjectItemCaseSensitive(widget_json, "sensor_value_color");
    cJSON *sensor_tile_title_font_px = cJSON_GetObjectItemCaseSensitive(widget_json, "sensor_tile_title_font_px");
    cJSON *sensor_tile_row_font_px = cJSON_GetObjectItemCaseSensitive(widget_json, "sensor_tile_row_font_px");
    cJSON *sensor_tile_ip_font_px = cJSON_GetObjectItemCaseSensitive(widget_json, "sensor_tile_ip_font_px");
    cJSON *sensor_tile_power_font_px = cJSON_GetObjectItemCaseSensitive(widget_json, "sensor_tile_power_font_px");
    cJSON *sensor_tile_ports_font_px = cJSON_GetObjectItemCaseSensitive(widget_json, "sensor_tile_ports_font_px");
    cJSON *extra_entity_ids = cJSON_GetObjectItemCaseSensitive(widget_json, "extra_entity_ids");
    cJSON *sub_entity_ids = cJSON_GetObjectItemCaseSensitive(widget_json, "sub_entity_ids");
    cJSON *list_entity_ids = cJSON_GetObjectItemCaseSensitive(widget_json, "entity_ids");
    cJSON *tile_border_width = cJSON_GetObjectItemCaseSensitive(widget_json, "tile_border_width");
    cJSON *tile_radius = cJSON_GetObjectItemCaseSensitive(widget_json, "tile_radius");
    cJSON *tile_opacity = cJSON_GetObjectItemCaseSensitive(widget_json, "tile_opacity");
    cJSON *tile_shadow = cJSON_GetObjectItemCaseSensitive(widget_json, "tile_shadow");
    cJSON *rect = cJSON_GetObjectItemCaseSensitive(widget_json, "rect");
    if (!cJSON_IsString(id) || !cJSON_IsString(type) || !cJSON_IsObject(rect)) {
        return false;
    }

    const bool requires_entity = (strcmp(type->valuestring, "empty_tile") != 0) &&
                                 (strcmp(type->valuestring, "clock_alarm") != 0) &&
                                 (strcmp(type->valuestring, "sensor_tile") != 0);
    if (requires_entity && !cJSON_IsString(entity_id)) {
        return false;
    }

    cJSON *x = cJSON_GetObjectItemCaseSensitive(rect, "x");
    cJSON *y = cJSON_GetObjectItemCaseSensitive(rect, "y");
    cJSON *w = cJSON_GetObjectItemCaseSensitive(rect, "w");
    cJSON *h = cJSON_GetObjectItemCaseSensitive(rect, "h");
    if (!cJSON_IsNumber(x) || !cJSON_IsNumber(y) || !cJSON_IsNumber(w) || !cJSON_IsNumber(h)) {
        return false;
    }

    memset(out, 0, sizeof(*out));
    snprintf(out->id, sizeof(out->id), "%s", id->valuestring);
    snprintf(out->type, sizeof(out->type), "%s", type->valuestring);
    snprintf(out->title, sizeof(out->title), "%s", cJSON_IsString(title) ? title->valuestring : id->valuestring);
    if (cJSON_IsString(entity_id) && entity_id->valuestring != NULL) {
        snprintf(out->entity_id, sizeof(out->entity_id), "%s", entity_id->valuestring);
    }
    if (cJSON_IsString(secondary_entity_id) && secondary_entity_id->valuestring != NULL) {
        snprintf(out->secondary_entity_id, sizeof(out->secondary_entity_id), "%s", secondary_entity_id->valuestring);
    }
    if (cJSON_IsString(slider_direction) && slider_direction->valuestring != NULL) {
        snprintf(out->slider_direction, sizeof(out->slider_direction), "%s", slider_direction->valuestring);
    }
    if (cJSON_IsString(slider_accent_color) && slider_accent_color->valuestring != NULL) {
        snprintf(out->slider_accent_color, sizeof(out->slider_accent_color), "%s", slider_accent_color->valuestring);
    }
    if (cJSON_IsString(button_accent_color) && button_accent_color->valuestring != NULL) {
        snprintf(out->button_accent_color, sizeof(out->button_accent_color), "%s", button_accent_color->valuestring);
    }
    if (cJSON_IsString(button_mode) && button_mode->valuestring != NULL) {
        snprintf(out->button_mode, sizeof(out->button_mode), "%s", button_mode->valuestring);
    }
    if (cJSON_IsString(graph_line_color) && graph_line_color->valuestring != NULL) {
        snprintf(out->graph_line_color, sizeof(out->graph_line_color), "%s", graph_line_color->valuestring);
    }
    if (cJSON_IsNumber(graph_point_count)) {
        out->graph_point_count = graph_point_count->valueint;
    }
    if (cJSON_IsNumber(graph_time_window_min)) {
        out->graph_time_window_min = graph_time_window_min->valueint;
    }
    if (cJSON_IsString(graph_display_mode) && graph_display_mode->valuestring != NULL) {
        snprintf(out->graph_display_mode, sizeof(out->graph_display_mode), "%s", graph_display_mode->valuestring);
    }
    if (cJSON_IsNumber(graph_bar_bucket_min)) {
        out->graph_bar_bucket_min = graph_bar_bucket_min->valueint;
    }
    if (cJSON_IsString(style_variant) && style_variant->valuestring != NULL) {
        snprintf(out->style_variant, sizeof(out->style_variant), "%s", style_variant->valuestring);
    }
    if (cJSON_IsString(arc_opening) && arc_opening->valuestring != NULL) {
        snprintf(out->arc_opening, sizeof(out->arc_opening), "%s", arc_opening->valuestring);
    }
    if (cJSON_IsString(binary_color_on) && binary_color_on->valuestring != NULL) {
        snprintf(out->binary_color_on, sizeof(out->binary_color_on), "%s", binary_color_on->valuestring);
    }
    if (cJSON_IsString(binary_color_off) && binary_color_off->valuestring != NULL) {
        snprintf(out->binary_color_off, sizeof(out->binary_color_off), "%s", binary_color_off->valuestring);
    }
    if (cJSON_IsString(binary_text_on) && binary_text_on->valuestring != NULL) {
        snprintf(out->binary_text_on, sizeof(out->binary_text_on), "%s", binary_text_on->valuestring);
    }
    if (cJSON_IsString(binary_text_off) && binary_text_off->valuestring != NULL) {
        snprintf(out->binary_text_off, sizeof(out->binary_text_off), "%s", binary_text_off->valuestring);
    }
    out->binary_show_title = true;
    if (cJSON_IsBool(binary_show_title)) {
        out->binary_show_title = cJSON_IsTrue(binary_show_title);
    }
    if (cJSON_IsString(binary_color_on) && binary_color_on->valuestring != NULL) {
        snprintf(out->binary_color_on, sizeof(out->binary_color_on), "%s", binary_color_on->valuestring);
    }
    if (cJSON_IsString(binary_color_off) && binary_color_off->valuestring != NULL) {
        snprintf(out->binary_color_off, sizeof(out->binary_color_off), "%s", binary_color_off->valuestring);
    }
    if (cJSON_IsString(binary_text_on) && binary_text_on->valuestring != NULL) {
        snprintf(out->binary_text_on, sizeof(out->binary_text_on), "%s", binary_text_on->valuestring);
    }
    if (cJSON_IsString(binary_text_off) && binary_text_off->valuestring != NULL) {
        snprintf(out->binary_text_off, sizeof(out->binary_text_off), "%s", binary_text_off->valuestring);
    }
    out->binary_show_title = true;
    if (cJSON_IsBool(binary_show_title)) {
        out->binary_show_title = cJSON_IsTrue(binary_show_title);
    }
    if (cJSON_IsString(alarm_code) && alarm_code->valuestring != NULL) {
        snprintf(out->alarm_code, sizeof(out->alarm_code), "%s", alarm_code->valuestring);
    }
    if (cJSON_IsString(alarm_modes) && alarm_modes->valuestring != NULL) {
        snprintf(out->alarm_modes, sizeof(out->alarm_modes), "%s", alarm_modes->valuestring);
    }
    if (cJSON_IsBool(alarm_ask_code)) {
        out->alarm_ask_code = cJSON_IsTrue(alarm_ask_code);
    }
    ui_runtime_copy_json_string(widget_json, "alarm_backend", out->alarm_backend, sizeof(out->alarm_backend));
    ui_runtime_copy_json_string(widget_json, "alarm_zone_label", out->alarm_zone_label,
        sizeof(out->alarm_zone_label));
    out->alarm_show_sensors = true;
    if (cJSON_IsBool(alarm_show_sensors)) {
        out->alarm_show_sensors = cJSON_IsTrue(alarm_show_sensors);
    }
    out->alarm_show_bypassed = true;
    if (cJSON_IsBool(alarm_show_bypassed)) {
        out->alarm_show_bypassed = cJSON_IsTrue(alarm_show_bypassed);
    }
    out->alarm_force_arm = true;
    if (cJSON_IsBool(alarm_force_arm)) {
        out->alarm_force_arm = cJSON_IsTrue(alarm_force_arm);
    }
    if (cJSON_IsBool(alarm_skip_delay)) {
        out->alarm_skip_delay = cJSON_IsTrue(alarm_skip_delay);
    }
    if (cJSON_IsBool(clock_show_seconds)) {
        out->clock_show_seconds = cJSON_IsTrue(clock_show_seconds);
    }
    if (cJSON_IsBool(clock_show_date)) {
        out->clock_show_date = cJSON_IsTrue(clock_show_date);
    }
    if (cJSON_IsString(sensor_value_color) && sensor_value_color->valuestring != NULL) {
        snprintf(out->sensor_value_color, sizeof(out->sensor_value_color), "%s", sensor_value_color->valuestring);
    }
    if (cJSON_IsNumber(sensor_tile_title_font_px)) {
        out->sensor_tile_title_font_px = sensor_tile_title_font_px->valueint;
    }
    if (cJSON_IsNumber(sensor_tile_row_font_px)) {
        out->sensor_tile_row_font_px = sensor_tile_row_font_px->valueint;
    }
    if (cJSON_IsNumber(sensor_tile_ip_font_px)) {
        out->sensor_tile_ip_font_px = sensor_tile_ip_font_px->valueint;
    }
    if (cJSON_IsNumber(sensor_tile_power_font_px)) {
        out->sensor_tile_power_font_px = sensor_tile_power_font_px->valueint;
    }
    if (cJSON_IsNumber(sensor_tile_ports_font_px)) {
        out->sensor_tile_ports_font_px = sensor_tile_ports_font_px->valueint;
    }
    {
        const cJSON *extra_src = NULL;
        if (cJSON_IsString(extra_entity_ids) && extra_entity_ids->valuestring != NULL &&
            extra_entity_ids->valuestring[0] != '\0') {
            extra_src = extra_entity_ids;
        } else if (cJSON_IsString(sub_entity_ids) && sub_entity_ids->valuestring != NULL &&
                   sub_entity_ids->valuestring[0] != '\0') {
            extra_src = sub_entity_ids;
        } else if (cJSON_IsString(list_entity_ids) && list_entity_ids->valuestring != NULL &&
                   list_entity_ids->valuestring[0] != '\0') {
            extra_src = list_entity_ids;
        }
        if (extra_src != NULL) {
            snprintf(out->extra_entity_ids, sizeof(out->extra_entity_ids), "%s", extra_src->valuestring);
        }
    }
    ui_runtime_copy_json_string(widget_json, "tile_bg_color", out->tile_bg_color, sizeof(out->tile_bg_color));
    ui_runtime_copy_json_string(widget_json, "tile_bg_grad_color", out->tile_bg_grad_color,
        sizeof(out->tile_bg_grad_color));
    ui_runtime_copy_json_string(widget_json, "tile_bg_grad_dir", out->tile_bg_grad_dir, sizeof(out->tile_bg_grad_dir));
    ui_runtime_copy_json_string(widget_json, "tile_border_color", out->tile_border_color,
        sizeof(out->tile_border_color));
    ui_runtime_copy_json_string(widget_json, "tile_text_color", out->tile_text_color, sizeof(out->tile_text_color));
    ui_runtime_copy_json_string(widget_json, "tile_title_color", out->tile_title_color,
        sizeof(out->tile_title_color));
    ui_runtime_copy_json_string(widget_json, "tile_label_color", out->tile_label_color,
        sizeof(out->tile_label_color));
    ui_runtime_copy_json_string(widget_json, "tile_value_color", out->tile_value_color,
        sizeof(out->tile_value_color));
    ui_runtime_copy_json_string(widget_json, "tile_icon_color", out->tile_icon_color, sizeof(out->tile_icon_color));
    ui_runtime_copy_json_string(widget_json, "tile_font_scale", out->tile_font_scale, sizeof(out->tile_font_scale));
    if (out->tile_bg_grad_dir[0] == '\0') {
        snprintf(out->tile_bg_grad_dir, sizeof(out->tile_bg_grad_dir), "%s", "none");
    }
    if (out->tile_font_scale[0] == '\0') {
        snprintf(out->tile_font_scale, sizeof(out->tile_font_scale), "%s", "auto");
    }
    if (out->alarm_backend[0] == '\0') {
        snprintf(out->alarm_backend, sizeof(out->alarm_backend), "%s", "auto");
    }
    out->tile_border_width = -1;
    if (cJSON_IsNumber(tile_border_width)) {
        out->tile_border_width = tile_border_width->valueint;
    }
    out->tile_radius = -1;
    if (cJSON_IsNumber(tile_radius)) {
        out->tile_radius = tile_radius->valueint;
    }
    out->tile_opacity = -1;
    if (cJSON_IsNumber(tile_opacity)) {
        out->tile_opacity = tile_opacity->valueint;
    }
    out->tile_shadow = false;
    if (cJSON_IsBool(tile_shadow)) {
        out->tile_shadow = cJSON_IsTrue(tile_shadow);
    }
    out->x = x->valueint;
    out->y = y->valueint;
    out->w = w->valueint;
    out->h = h->valueint;
    ui_runtime_clamp_widget_rect(out);
    return true;
}

static void ui_runtime_copy_json_string(cJSON *obj, const char *key, char *dst, size_t dst_size)
{
    if (dst == NULL || dst_size == 0) {
        return;
    }
    dst[0] = '\0';
    cJSON *item = (obj != NULL) ? cJSON_GetObjectItemCaseSensitive(obj, key) : NULL;
    if (cJSON_IsString(item) && item->valuestring != NULL) {
        snprintf(dst, dst_size, "%s", item->valuestring);
    }
}

static void ui_runtime_energy_config_from_json(cJSON *page_json, const char *page_id, const char *page_title,
    ui_energy_page_config_t *out)
{
    if (out == NULL) {
        return;
    }

    memset(out, 0, sizeof(*out));
    snprintf(out->page_id, sizeof(out->page_id), "%s", page_id != NULL ? page_id : "");
    snprintf(out->title, sizeof(out->title), "%s", (page_title != NULL && page_title[0] != '\0') ? page_title : "Energy");
    snprintf(out->source, sizeof(out->source), "%s", "ha_energy");

    cJSON *energy = (page_json != NULL) ? cJSON_GetObjectItemCaseSensitive(page_json, "energy") : NULL;
    if (!cJSON_IsObject(energy)) {
        return;
    }

    cJSON *source_item = cJSON_GetObjectItemCaseSensitive(energy, "source");
    bool source_was_configured =
        cJSON_IsString(source_item) && source_item->valuestring != NULL && source_item->valuestring[0] != '\0';
    ui_runtime_copy_json_string(energy, "source", out->source, sizeof(out->source));
    if (strcmp(out->source, "manual_live") != 0 && strcmp(out->source, "ha_energy") != 0) {
        snprintf(out->source, sizeof(out->source), "%s", "ha_energy");
    }

    ui_runtime_copy_json_string(
        energy, "home_power_entity_id", out->home_power_entity_id, sizeof(out->home_power_entity_id));
    ui_runtime_copy_json_string(
        energy, "solar_power_entity_id", out->solar_power_entity_id, sizeof(out->solar_power_entity_id));
    ui_runtime_copy_json_string(
        energy, "grid_power_entity_id", out->grid_power_entity_id, sizeof(out->grid_power_entity_id));
    ui_runtime_copy_json_string(
        energy, "grid_import_power_entity_id", out->grid_import_power_entity_id, sizeof(out->grid_import_power_entity_id));
    ui_runtime_copy_json_string(
        energy, "grid_export_power_entity_id", out->grid_export_power_entity_id, sizeof(out->grid_export_power_entity_id));
    ui_runtime_copy_json_string(
        energy, "battery_power_entity_id", out->battery_power_entity_id, sizeof(out->battery_power_entity_id));
    ui_runtime_copy_json_string(energy,
        "battery_charge_power_entity_id",
        out->battery_charge_power_entity_id,
        sizeof(out->battery_charge_power_entity_id));
    ui_runtime_copy_json_string(energy,
        "battery_discharge_power_entity_id",
        out->battery_discharge_power_entity_id,
        sizeof(out->battery_discharge_power_entity_id));
    ui_runtime_copy_json_string(
        energy, "battery_soc_entity_id", out->battery_soc_entity_id, sizeof(out->battery_soc_entity_id));

    if (!source_was_configured &&
        (out->home_power_entity_id[0] != '\0' || out->solar_power_entity_id[0] != '\0' ||
            out->grid_power_entity_id[0] != '\0' || out->grid_import_power_entity_id[0] != '\0' ||
            out->grid_export_power_entity_id[0] != '\0' || out->battery_power_entity_id[0] != '\0' ||
            out->battery_charge_power_entity_id[0] != '\0' || out->battery_discharge_power_entity_id[0] != '\0' ||
            out->battery_soc_entity_id[0] != '\0')) {
        snprintf(out->source, sizeof(out->source), "%s", "manual_live");
    }
}

static void ui_runtime_music_config_from_json(cJSON *page_json, const char *page_id, const char *page_title,
    ui_music_page_config_t *out)
{
    if (out == NULL) {
        return;
    }

    memset(out, 0, sizeof(*out));
    snprintf(out->page_id, sizeof(out->page_id), "%s", page_id != NULL ? page_id : "");
    snprintf(out->title, sizeof(out->title), "%s",
        (page_title != NULL && page_title[0] != '\0') ? page_title : "Music");

    cJSON *music = (page_json != NULL) ? cJSON_GetObjectItemCaseSensitive(page_json, "music") : NULL;
    if (!cJSON_IsObject(music)) {
        return;
    }

    ui_runtime_copy_json_string(
        music, "player_entity_id", out->player_entity_id, sizeof(out->player_entity_id));

    cJSON *players = cJSON_GetObjectItemCaseSensitive(music, "players");
    if (cJSON_IsArray(players)) {
        int n = cJSON_GetArraySize(players);
        for (int i = 0; i < n && out->player_count < UI_MUSIC_MAX_PLAYERS; i++) {
            cJSON *item = cJSON_GetArrayItem(players, i);
            if (cJSON_IsString(item) && item->valuestring != NULL && item->valuestring[0] != '\0') {
                snprintf(out->players[out->player_count], APP_MAX_ENTITY_ID_LEN, "%s", item->valuestring);
                out->player_count++;
            }
        }
    }
}

/* "radio" page object, mirroring the music page storage:
 *
 *   "radio": {
 *     "entity": "media_player.salon",                       optional default player
 *     "columns": 3,                                         optional, 2..4 (default 3)
 *     "stations": [ { "name": "RMF FM", "url": "https://...", "entity": "media_player.x" } ]
 *   }
 *
 * An empty station list is not an error: the page then falls back to the
 * compiled-in table in ui_radio_stations.c, so a fresh layout still has stations.
 */
static void ui_runtime_radio_config_from_json(cJSON *page_json, const char *page_id, const char *page_title,
    ui_radio_page_config_t *out)
{
    if (out == NULL) {
        return;
    }

    memset(out, 0, sizeof(*out));
    snprintf(out->page_id, sizeof(out->page_id), "%s", page_id != NULL ? page_id : "");
    snprintf(out->title, sizeof(out->title), "%s",
        (page_title != NULL && page_title[0] != '\0') ? page_title : "Radio");
    out->columns = UI_RADIO_DEFAULT_COLUMNS;

    cJSON *radio = (page_json != NULL) ? cJSON_GetObjectItemCaseSensitive(page_json, "radio") : NULL;
    if (!cJSON_IsObject(radio)) {
        return;
    }

    ui_runtime_copy_json_string(radio, "entity", out->player_entity_id, sizeof(out->player_entity_id));
    if (out->player_entity_id[0] == '\0') {
        /* Layouts written by the first radio draft used player_entity_id. */
        ui_runtime_copy_json_string(radio, "player_entity_id", out->player_entity_id, sizeof(out->player_entity_id));
    }

    cJSON *columns = cJSON_GetObjectItemCaseSensitive(radio, "columns");
    if (cJSON_IsNumber(columns)) {
        int value = columns->valueint;
        if (value < UI_RADIO_MIN_COLUMNS) {
            value = UI_RADIO_MIN_COLUMNS;
        }
        if (value > UI_RADIO_MAX_COLUMNS) {
            value = UI_RADIO_MAX_COLUMNS;
        }
        out->columns = (uint8_t)value;
    }

    /* Where the stream is played: "panel" uses the built-in speaker, "ha" hands
     * the URL to a media_player.  A "panel" boolean is accepted as well. */
    cJSON *mode = cJSON_GetObjectItemCaseSensitive(radio, "player_mode");
    if (cJSON_IsString(mode) && mode->valuestring != NULL) {
        out->use_panel_speaker = strcmp(mode->valuestring, "panel") == 0;
    }
    cJSON *panel = cJSON_GetObjectItemCaseSensitive(radio, "panel");
    if (cJSON_IsBool(panel)) {
        out->use_panel_speaker = cJSON_IsTrue(panel);
    }

    cJSON *stations = cJSON_GetObjectItemCaseSensitive(radio, "stations");
    if (!cJSON_IsArray(stations)) {
        return;
    }

    int requested = cJSON_GetArraySize(stations);
    for (int i = 0; i < requested && out->station_count < UI_RADIO_MAX_STATIONS; i++) {
        cJSON *item = cJSON_GetArrayItem(stations, i);
        if (!cJSON_IsObject(item)) {
            ESP_LOGW(TAG_UI, "radio page %s: station %d is not an object; skipped", out->page_id, i);
            continue;
        }

        ui_radio_station_config_t station = {0};
        ui_runtime_copy_json_string(item, "name", station.name, sizeof(station.name));
        ui_runtime_copy_json_string(item, "url", station.url, sizeof(station.url));
        ui_runtime_copy_json_string(item, "entity", station.entity, sizeof(station.entity));
        if (station.name[0] == '\0' || station.url[0] == '\0') {
            ESP_LOGW(TAG_UI, "radio page %s: station %d needs a name and a url; skipped", out->page_id, i);
            continue;
        }
        out->stations[out->station_count] = station;
        out->station_count++;
    }

    if (requested > (int)out->station_count) {
        ESP_LOGW(TAG_UI, "radio page %s: %d of %d stations ignored (max %d)", out->page_id,
                 requested - (int)out->station_count, requested, UI_RADIO_MAX_STATIONS);
    }
}

/* A full page table used to drop guaranteed app pages (Xiaozhi, cameras, radio)
 * without leaving a single trace, which made the missing top-bar radio chip
 * impossible to diagnose from the logs. Report it loudly instead. */
static void ui_runtime_warn_page_table_full(const char *page_id)
{
    ESP_LOGW(TAG_UI, "layout has no room for the guaranteed '%s' page: %u/%d slots used; "
        "remove a page in the web editor or raise APP_MAX_PAGES",
        page_id != NULL ? page_id : "?", (unsigned)ui_pages_count(), (int)APP_MAX_PAGES);
    system_log_event("ui", "guaranteed page '%s' skipped: page table full (%u/%d)",
        page_id != NULL ? page_id : "?", (unsigned)ui_pages_count(), (int)APP_MAX_PAGES);
}

static bool ui_runtime_is_background_widget_type(const char *type)
{
    return type != NULL && strcmp(type, "empty_tile") == 0;
}

/* Reads the optional per-page background ("page_*" keys). A page without any of
 * them gets an empty style, which leaves the page container untinted. */
static void ui_runtime_page_style_from_json(cJSON *page_json, ui_page_style_t *out)
{
    ui_page_style_init(out);
    if (out == NULL) {
        return;
    }
    ui_runtime_copy_json_string(page_json, "page_bg_color", out->bg_color, sizeof(out->bg_color));
    ui_runtime_copy_json_string(page_json, "page_bg_grad_color", out->bg_grad_color, sizeof(out->bg_grad_color));
    ui_runtime_copy_json_string(page_json, "page_bg_grad_dir", out->bg_grad_dir, sizeof(out->bg_grad_dir));
    if (out->bg_grad_dir[0] == '\0') {
        snprintf(out->bg_grad_dir, sizeof(out->bg_grad_dir), "%s", "none");
    }

    cJSON *wallpaper = cJSON_GetObjectItemCaseSensitive(page_json, "page_wallpaper");
    out->wallpaper = cJSON_IsBool(wallpaper) && cJSON_IsTrue(wallpaper);

    cJSON *dim = cJSON_GetObjectItemCaseSensitive(page_json, "page_dim");
    out->dim = cJSON_IsNumber(dim) ? dim->valueint : 0;
}

/* Default content of the "Pogoda" page behind the top-bar weather chip. It is
 * created hidden (no bottom-bar tab) and only when the stored layout has no
 * page with this id, so the web editor keeps the last word. Styles mirror the
 * weather/sensor tiles already used on the Salon page. */
static void ui_runtime_add_default_weather_page(void)
{
    lv_obj_t *container = ui_pages_add_hidden(UI_WEATHER_PAGE_ID, ui_i18n_get("page.weather", "Pogoda"));
    if (container == NULL) {
        ui_runtime_warn_page_table_full(UI_WEATHER_PAGE_ID);
        return;
    }

    static const ui_widget_def_t defs[] = {
        { .id = "pogoda_now", .type = "weather_tile", .title = "Pogoda", .entity_id = "weather.dom",
          .x = 0, .y = 0, .w = 390, .h = 230,
          .tile_bg_color = "#143a63", .tile_bg_grad_color = "#0b2038", .tile_bg_grad_dir = "ver",
          .tile_border_color = "#4f9dff", .tile_border_width = 1, .tile_radius = 16, .tile_opacity = 100,
          .tile_text_color = "#e8f1f8", .tile_title_color = "#cfe6ff", .tile_label_color = "#9fc0e0",
          .tile_value_color = "#ffffff", .tile_icon_color = "#6fb6ff", .tile_font_scale = "m" },
        { .id = "pogoda_3day", .type = "weather_3day", .title = "Prognoza 3 dni", .entity_id = "weather.dom",
          .x = 0, .y = 240, .w = 390, .h = 230,
          .tile_bg_color = "#143a63", .tile_bg_grad_color = "#0b2038", .tile_bg_grad_dir = "ver",
          .tile_border_color = "#4f9dff", .tile_border_width = 1, .tile_radius = 16, .tile_opacity = 100,
          .tile_text_color = "#e8f1f8", .tile_title_color = "#cfe6ff", .tile_label_color = "#9fc0e0",
          .tile_value_color = "#ffffff", .tile_icon_color = "#6fb6ff", .tile_font_scale = "m" },
        { .id = "pogoda_temp", .type = "sensor", .title = "Temperatura",
          .entity_id = "sensor.temperatura_salon_temperatura",
          .x = 400, .y = 0, .w = 624, .h = 230,
          .tile_bg_color = "#0f2a22", .tile_bg_grad_color = "#07130f", .tile_bg_grad_dir = "ver",
          .tile_border_color = "#2ecc9a", .tile_border_width = 1, .tile_radius = 16, .tile_opacity = 100,
          .tile_text_color = "#d8f7ec", .tile_title_color = "#7dffcf", .tile_label_color = "#8fd9c1",
          .tile_value_color = "#ffffff", .tile_icon_color = "#3ddba6", .tile_font_scale = "m" },
        { .id = "pogoda_hum", .type = "sensor", .title = "Wilgotność",
          .entity_id = "sensor.temperatura_salon_wilgotnosc",
          .x = 400, .y = 240, .w = 624, .h = 230,
          .tile_bg_color = "#0f2a22", .tile_bg_grad_color = "#07130f", .tile_bg_grad_dir = "ver",
          .tile_border_color = "#2ecc9a", .tile_border_width = 1, .tile_radius = 16, .tile_opacity = 100,
          .tile_text_color = "#d8f7ec", .tile_title_color = "#7dffcf", .tile_label_color = "#8fd9c1",
          .tile_value_color = "#ffffff", .tile_icon_color = "#3ddba6", .tile_font_scale = "m" },
    };

    for (size_t i = 0; i < sizeof(defs) / sizeof(defs[0]) && s_widget_count < APP_MAX_WIDGETS_TOTAL; i++) {
        ui_widget_instance_t *instance = &s_widgets[s_widget_count];
        if (ui_widget_factory_create(&defs[i], container, instance) != ESP_OK) {
            ESP_LOGW(TAG_UI, "weather page: widget '%s' (%s) could not be created", defs[i].id, defs[i].type);
            continue;
        }
        snprintf(instance->page_id, sizeof(instance->page_id), "%s", UI_WEATHER_PAGE_ID);
        s_widget_count++;
    }
}

/* ---- Tile gaps ----------------------------------------------------------
 * The layouts are authored in the web editor on a 10 px grid. Columns normally
 * keep that gap, but a tile dropped flush against another one leaves 0 px: the
 * two 1 px outlines then share the same pixel row and the rounded corners cross
 * each other, which reads as two tiles overlapping. The stored rectangles are
 * not rewritten (the editor and the API keep the user's numbers); the gap is
 * restored while the page is built instead, by pulling every edge that touches
 * a neighbour inward by half the gap. Rectangles that already have their own
 * spacing are untouched, because the test only fires on exactly touching
 * edges. */
typedef struct {
    int16_t x, y, w, h;     /* rectangle as parsed from the layout and clamped */
    int16_t gx, gy, gw, gh; /* the same rectangle after the gap pass */
    bool background;        /* empty_tile: a plate behind the other tiles */
} ui_runtime_tile_rect_t;

/* Only one page is built at a time and every caller holds the display lock, so
 * one shared table is enough. It stays in BSS on purpose: the callers run on
 * the small UI stacks that already carry a 1 KB ui_widget_def_t. */
static ui_runtime_tile_rect_t s_tile_rects[APP_MAX_WIDGETS_PER_PAGE];
static uint16_t s_tile_rect_count = 0;

/* Smallest side a gap inset may leave behind. The per-type minimum size is
 * deliberately not used as a floor: a page whose rows are exactly the minimum
 * height (the socket grid is 120 px tall and 120 px is also the minimum for its
 * tiles) would otherwise keep its merged outlines, and 5 px less content space
 * is far easier to live with than two borders sharing the same pixels. */
#define UI_RUNTIME_TILE_GAP_MIN_SIDE 32

/* Collects the clamped rectangles of one page. The widget definitions
 * themselves are parsed again when the widgets are created, so this table never
 * has to hold a full ui_widget_def_t. */
static void ui_runtime_collect_tile_rects(cJSON *widgets)
{
    s_tile_rect_count = 0;
    if (!cJSON_IsArray(widgets)) {
        return;
    }

    const int count = cJSON_GetArraySize(widgets);
    for (int i = 0; i < count && s_tile_rect_count < APP_MAX_WIDGETS_PER_PAGE; i++) {
        ui_widget_def_t def = {0};
        if (!ui_runtime_widget_from_json(cJSON_GetArrayItem(widgets, i), &def)) {
            continue;
        }
        ui_runtime_tile_rect_t *rect = &s_tile_rects[s_tile_rect_count++];
        rect->x = def.x;
        rect->y = def.y;
        rect->w = def.w;
        rect->h = def.h;
        rect->gx = def.x;
        rect->gy = def.y;
        rect->gw = def.w;
        rect->gh = def.h;
        rect->background = ui_runtime_is_background_widget_type(def.type);
    }
}

/* Neighbour detection always uses the parsed rectangle, never the adjusted one,
 * so trimming one tile can not change whether its neighbour still counts as
 * touching. Background plates are skipped on both sides: they are meant to sit
 * behind the other tiles and must not be pushed away from them. */
static void ui_runtime_apply_tile_gaps(void)
{
    const int half = APP_UI_TILE_GAP / 2;
    if (half <= 0) {
        return;
    }

    for (uint16_t i = 0; i < s_tile_rect_count; i++) {
        ui_runtime_tile_rect_t *a = &s_tile_rects[i];
        if (a->background) {
            continue;
        }

        for (uint16_t j = 0; j < s_tile_rect_count; j++) {
            if (i == j) {
                continue;
            }
            const ui_runtime_tile_rect_t *b = &s_tile_rects[j];
            if (b->background) {
                continue;
            }

            const bool columns_overlap = a->x < b->x + b->w && b->x < a->x + a->w;
            const bool rows_overlap = a->y < b->y + b->h && b->y < a->y + a->h;

            if (columns_overlap) {
                if (a->y + a->h == b->y && a->gh - half >= UI_RUNTIME_TILE_GAP_MIN_SIDE) {
                    a->gh -= half; /* bottom edge touches the tile below */
                } else if (b->y + b->h == a->y && a->gh - half >= UI_RUNTIME_TILE_GAP_MIN_SIDE) {
                    a->gy += half; /* top edge touches the tile above */
                    a->gh -= half;
                }
            }

            if (rows_overlap) {
                if (a->x + a->w == b->x && a->gw - half >= UI_RUNTIME_TILE_GAP_MIN_SIDE) {
                    a->gw -= half; /* right edge touches the next column */
                } else if (b->x + b->w == a->x && a->gw - half >= UI_RUNTIME_TILE_GAP_MIN_SIDE) {
                    a->gx += half; /* left edge touches the previous column */
                    a->gw -= half;
                }
            }
        }
    }
}

/* Hands the adjusted rectangle back to the definition that was just parsed.
 * Matching on the clamped rectangle is enough because the parse is
 * deterministic; two widgets that share a rectangle get the same inset, which
 * is what both of them need anyway. */
static void ui_runtime_apply_tile_gap_to_def(ui_widget_def_t *def)
{
    for (uint16_t i = 0; i < s_tile_rect_count; i++) {
        const ui_runtime_tile_rect_t *rect = &s_tile_rects[i];
        if (rect->x != def->x || rect->y != def->y || rect->w != def->w || rect->h != def->h) {
            continue;
        }
        def->x = rect->gx;
        def->y = rect->gy;
        def->w = rect->gw;
        def->h = rect->gh;
#if APP_UI_RECT_DIAG
        if (rect->x != rect->gx || rect->y != rect->gy || rect->w != rect->gw || rect->h != rect->gh) {
            ESP_LOGI(TAG_UI, "RECTDIAG gap %s/%s (%d,%d %dx%d) -> (%d,%d %dx%d)",
                     def->type, def->id, rect->x, rect->y, rect->w, rect->h,
                     rect->gx, rect->gy, rect->gw, rect->gh);
        }
#endif
        return;
    }
}

esp_err_t ui_runtime_load_layout(const char *layout_json)
{
    if (!display_lock(UI_LAYOUT_LOCK_TIMEOUT_MS)) {
        ESP_LOGW(TAG_UI, "Layout load: display lock busy");
        return ESP_ERR_TIMEOUT;
    }
    esp_err_t err = ui_runtime_apply_layout_locked(layout_json);
    display_unlock();
    if (err == ESP_OK) {
        /* The page set changed, so the top bar app shortcuts (radio / weather)
         * may have appeared or disappeared. */
        ui_pages_refresh_topbar();
    }
    return err;
}

/* Builds the whole UI from layout_json. The display lock MUST already be held:
 * page/widget creation and deletion must not race with the LVGL render task. */
static esp_err_t ui_runtime_apply_layout_locked(const char *layout_json)
{
    if (!s_initialized || layout_json == NULL || s_widgets == NULL || s_energy_pages == NULL ||
        s_music_pages == NULL || s_radio_pages == NULL) {
        return ESP_ERR_INVALID_STATE;
    }

    cJSON *root = cJSON_Parse(layout_json);
    if (root == NULL) {
        return ESP_ERR_INVALID_ARG;
    }
    cJSON *pages = cJSON_GetObjectItemCaseSensitive(root, "pages");
    if (!cJSON_IsArray(pages)) {
        cJSON_Delete(root);
        return ESP_ERR_INVALID_ARG;
    }

    s_topbar_cache.valid = false;
    ui_cameras_page_deinit();
    /* Radio pages own a PSRAM context and a live-state registry entry; release
     * them before their containers go away. */
    for (size_t i = 0; i < s_radio_page_count; i++) {
        ui_radio_page_deinit(&s_radio_pages[i]);
    }
    ui_pages_reset();
    /* The page containers were just deleted: forget the wallpaper pages and the
     * per-page theme overrides, both are re-read below. */
    ui_page_style_reset();
    ui_theme_router_reset_pages();
    memset(s_widgets, 0, APP_MAX_WIDGETS_TOTAL * sizeof(*s_widgets));
    s_widget_count = 0;
    memset(s_energy_pages, 0, APP_MAX_PAGES * sizeof(*s_energy_pages));
    s_energy_page_count = 0;
    memset(s_music_pages, 0, APP_MAX_PAGES * sizeof(*s_music_pages));
    s_music_page_count = 0;
    memset(s_radio_pages, 0, APP_MAX_PAGES * sizeof(*s_radio_pages));
    s_radio_page_count = 0;

    int page_count = cJSON_GetArraySize(pages);
    bool has_xiaozhi_page = false;
    bool has_cameras_page = false;
    bool has_radio_page = false;
    bool has_weather_page = false;
    for (int p = 0; p < page_count; p++) {
        cJSON *page = cJSON_GetArrayItem(pages, p);
        cJSON *page_id = cJSON_GetObjectItemCaseSensitive(page, "id");
        cJSON *page_title = cJSON_GetObjectItemCaseSensitive(page, "title");
        cJSON *page_type = cJSON_GetObjectItemCaseSensitive(page, "type");
        cJSON *widgets = cJSON_GetObjectItemCaseSensitive(page, "widgets");
        if (!cJSON_IsString(page_id)) {
            continue;
        }

        bool is_weather_page = strcmp(page_id->valuestring, UI_WEATHER_PAGE_ID) == 0;
        if (is_weather_page) {
            has_weather_page = true;
        }

        /* The weather page is reached from the top-bar weather chip, so a stored
         * one gets no bottom-bar tab either (same rule as the built-in default). */
        lv_obj_t *page_container = is_weather_page
            ? ui_pages_add_hidden(page_id->valuestring, cJSON_IsString(page_title) ? page_title->valuestring : page_id->valuestring)
            : ui_pages_add(page_id->valuestring, cJSON_IsString(page_title) ? page_title->valuestring : page_id->valuestring);
        if (page_container == NULL) {
            continue;
        }

        /* Background colour / gradient / wallpaper for this page. */
        ui_page_style_t page_style;
        ui_runtime_page_style_from_json(page, &page_style);
        ui_page_style_apply(page_container, &page_style);

        /* Optional per-page theme override: the page is painted with it as soon
         * as it becomes visible (see ui_theme_router). */
        char page_theme[APP_MAX_THEME_ID_LEN];
        ui_runtime_copy_json_string(page, "page_theme", page_theme, sizeof(page_theme));
        ui_theme_router_set_page_theme(page_id->valuestring, page_theme);

        bool is_energy_page = cJSON_IsString(page_type) && page_type->valuestring != NULL &&
                              strcmp(page_type->valuestring, "energy_dashboard") == 0;
        if (is_energy_page) {
            if (s_energy_page_count >= APP_MAX_PAGES) {
                continue;
            }
            ui_energy_page_config_t energy_config = {0};
            ui_runtime_energy_config_from_json(page,
                page_id->valuestring,
                cJSON_IsString(page_title) ? page_title->valuestring : page_id->valuestring,
                &energy_config);
            esp_err_t err =
                ui_energy_page_create(&energy_config, page_container, &s_energy_pages[s_energy_page_count]);
            if (err == ESP_OK) {
                s_energy_page_count++;
            }
            continue;
        }

        bool is_xiaozhi_page = cJSON_IsString(page_type) && page_type->valuestring != NULL &&
                               strcmp(page_type->valuestring, "xiaozhi") == 0;
        if (is_xiaozhi_page) {
            has_xiaozhi_page = true;
            xz_ui_build(page_container);
            continue;
        }

        bool is_cameras_page = cJSON_IsString(page_type) && page_type->valuestring != NULL &&
                               strcmp(page_type->valuestring, "cameras") == 0;
        if (is_cameras_page) {
            has_cameras_page = true;
            ui_cameras_page_build(page_container, page_id->valuestring);
            continue;
        }

        bool is_music_page = cJSON_IsString(page_type) && page_type->valuestring != NULL &&
                             strcmp(page_type->valuestring, "music_assistant") == 0;
        if (is_music_page) {
            if (s_music_page_count >= APP_MAX_PAGES) {
                continue;
            }
            ui_music_page_config_t music_config = {0};
            ui_runtime_music_config_from_json(page,
                page_id->valuestring,
                cJSON_IsString(page_title) ? page_title->valuestring : page_id->valuestring,
                &music_config);
            esp_err_t err =
                ui_music_page_create(&music_config, page_container, &s_music_pages[s_music_page_count]);
            if (err == ESP_OK) {
                s_music_page_count++;
            }
            continue;
        }

        bool is_radio_page = cJSON_IsString(page_type) && page_type->valuestring != NULL &&
                             strcmp(page_type->valuestring, "radio") == 0;
        if (is_radio_page) {
            has_radio_page = true;
            if (s_radio_page_count >= APP_MAX_PAGES) {
                continue;
            }
            ui_radio_page_config_t *radio_config = &s_radio_config_scratch;
            ui_runtime_radio_config_from_json(page,
                page_id->valuestring,
                cJSON_IsString(page_title) ? page_title->valuestring : page_id->valuestring,
                radio_config);
            esp_err_t err =
                ui_radio_page_create(radio_config, page_container, &s_radio_pages[s_radio_page_count]);
            if (err == ESP_OK) {
                s_radio_page_count++;
            } else {
                /* Without a context the container would stay empty: hide the
                 * entry point instead of leaving a blank page in the nav. */
                ESP_LOGW(TAG_UI, "radio page %s could not be created: %s", page_id->valuestring,
                         esp_err_to_name(err));
            }
            continue;
        }

        if (!cJSON_IsArray(widgets)) {
            continue;
        }

        ui_runtime_collect_tile_rects(widgets);
        ui_runtime_apply_tile_gaps();

        int widget_count = cJSON_GetArraySize(widgets);
        for (int pass = 0; pass < 2; pass++) {
            const bool background_pass = (pass == 0);
            for (int w = 0; w < widget_count; w++) {
                if (s_widget_count >= APP_MAX_WIDGETS_TOTAL) {
                    break;
                }
                ui_widget_def_t def = {0};
                if (!ui_runtime_widget_from_json(cJSON_GetArrayItem(widgets, w), &def)) {
                    continue;
                }
                ui_runtime_apply_tile_gap_to_def(&def);
                bool is_background = ui_runtime_is_background_widget_type(def.type);
                if (is_background != background_pass) {
                    continue;
                }
                esp_err_t err = ui_widget_factory_create(&def, page_container, &s_widgets[s_widget_count]);
                if (err == ESP_OK) {
                    snprintf(s_widgets[s_widget_count].page_id, sizeof(s_widgets[s_widget_count].page_id),
                             "%s", page_id->valuestring);
                    s_widget_count++;
                }
            }
        }
    }

    /* Guarantee a Xiaozhi entry point even when the stored layout predates
     * the Xiaozhi integration (or the user removed the page). */
    if (!has_xiaozhi_page) {
        lv_obj_t *xz_container = ui_pages_add("xiaozhi", "Xiaozhi");
        if (xz_container != NULL) {
            xz_ui_build(xz_container);
        } else {
            ui_runtime_warn_page_table_full("xiaozhi");
        }
    }

    /* Same guarantee for the cameras page: always provide the tab so cameras
     * configured in the web editor have a home even in older layouts. */
    if (!has_cameras_page) {
        lv_obj_t *cam_container = ui_pages_add("cameras", ui_i18n_get("page.cameras", "Kamery"));
        if (cam_container != NULL) {
            ui_cameras_page_build(cam_container, "cameras");
        } else {
            ui_runtime_warn_page_table_full("cameras");
        }
    }

    /* The radio page is reached from the top-bar radio chip, so it gets no
     * bottom-bar tab: create it hidden whenever the stored layout has none. */
    if (!has_radio_page && s_radio_page_count < APP_MAX_PAGES) {
        lv_obj_t *radio_container = ui_pages_add_hidden(UI_RADIO_PAGE_ID, ui_i18n_get("page.radio", "Radio"));
        if (radio_container != NULL) {
            ui_radio_page_config_t *radio_config = &s_radio_config_scratch;
            ui_runtime_radio_config_from_json(NULL, UI_RADIO_PAGE_ID, ui_i18n_get("page.radio", "Radio"), radio_config);
            if (ui_radio_page_create(radio_config, radio_container, &s_radio_pages[s_radio_page_count]) == ESP_OK) {
                s_radio_page_count++;
            } else {
                ESP_LOGW(TAG_UI, "radio page could not be created; top-bar radio chip stays hidden");
                system_log_event("ui", "radio page creation failed");
            }
        } else {
            ui_runtime_warn_page_table_full(UI_RADIO_PAGE_ID);
        }
    }

    /* The weather page is reached from the top-bar weather chip, so it gets no
     * bottom-bar tab either. */
    if (!has_weather_page) {
        ui_runtime_add_default_weather_page();
    }

    cJSON_Delete(root);

    if (ui_pages_count() > 0) {
        size_t index = 0;
        if (s_restore_page_id_valid) {
            s_restore_page_id_valid = false;
            uint16_t count = ui_pages_count();
            bool found = false;
            for (uint16_t i = 0; i < count; i++) {
                const char *id = ui_pages_id_at(i);
                if (id != NULL && strcmp(id, s_restore_page_id) == 0) {
                    index = i;
                    found = true;
                    break;
                }
            }
            if (!found) {
                ESP_LOGW(TAG_UI, "layout rebuild: page %s is gone, showing the first one", s_restore_page_id);
            }
            s_restore_page_id[0] = '\0';
        }
        ui_pages_show_index(index);
    }
    ui_runtime_apply_all_states();
    ui_runtime_refresh_topbar();
    ESP_LOGI(TAG_UI, "Layout loaded: %u widgets", (unsigned)s_widget_count);
    return ESP_OK;
}

esp_err_t ui_runtime_reload_layout(void)
{
    /* Reads NVS without the display lock: the file system/flash access can take
     * a while and holding the lock during it would freeze the render task. */
    char *json = NULL;
    esp_err_t err = layout_store_load(&json);
    if (err != ESP_OK || json == NULL) {
        json = strdup(layout_store_default_json());
        if (json == NULL) {
            return ESP_ERR_NO_MEM;
        }
    }

    /* The whole rebuild (theme styles + page/widget recreation) has to run under
     * the display lock: theme_default_rebuild_styles() resets LVGL styles that
     * are attached to live objects (widgets, pages), and the page teardown
     * deletes objects the render task may be reading. */
    if (!display_lock(UI_LAYOUT_LOCK_TIMEOUT_MS)) {
        free(json);
        s_layout_reload_pending = true;
        ESP_LOGW(TAG_UI, "Layout reload: display lock busy, retrying");
        return ESP_ERR_TIMEOUT;
    }

    int64_t t0 = esp_timer_get_time() / 1000;
    theme_default_rebuild_styles();
    int64_t t1 = esp_timer_get_time() / 1000;
    ui_runtime_kick_heartbeat();
    err = ui_runtime_apply_layout_locked(json);
    int64_t t2 = esp_timer_get_time() / 1000;
    display_unlock();
    free(json);

    s_layout_reload_pending = false;
    system_log_write_info(TAG_UI, "layout reload ok=%d (theme %lld ms, build %lld ms)",
                          (int)(err == ESP_OK), (long long)(t1 - t0), (long long)(t2 - t1));
    return err;
}

esp_err_t ui_runtime_request_layout_reload(void)
{
    app_event_t event = {.type = EV_LAYOUT_UPDATED};
    if (app_events_publish(&event, pdMS_TO_TICKS(UI_LAYOUT_PUBLISH_TIMEOUT_MS))) {
        /* The UI task applies it asynchronously. */
        system_log_write_info(TAG_UI, "layout reload queued (async)");
        return ESP_OK;
    }

    /* The event queue is saturated (UI task busy or not draining). Applying the
     * layout here keeps the caller honest: it reports the real outcome instead
     * of silently leaving the old look on screen. */
    ESP_LOGW(TAG_UI, "Layout reload event queue busy, applying synchronously");
    esp_err_t err = ui_runtime_reload_layout();
    if (err == ESP_ERR_TIMEOUT) {
        /* Display lock contention: the UI task loop retries until it succeeds. */
        return ESP_OK;
    }
    system_log_write_info(TAG_UI, "layout reload applied synchronously result=%s", esp_err_to_name(err));
    return err;
}

esp_err_t ui_runtime_request_layout_reload_on_page(const char *page_id)
{
    if (page_id != NULL && page_id[0] != '\0') {
        snprintf(s_restore_page_id, sizeof(s_restore_page_id), "%s", page_id);
        s_restore_page_id_valid = true;
    }

    /* Always asynchronous: the caller may be a page show callback, and
     * rebuilding there would delete the pages under the caller's feet. */
    app_event_t event = {.type = EV_LAYOUT_UPDATED};
    if (app_events_publish(&event, pdMS_TO_TICKS(UI_LAYOUT_PUBLISH_TIMEOUT_MS))) {
        system_log_write_info(TAG_UI, "layout reload queued (page %s)",
                              s_restore_page_id_valid ? s_restore_page_id : "-");
        return ESP_OK;
    }
    /* The UI task retries pending reloads on its own schedule. */
    s_layout_reload_pending = true;
    system_log_write_info(TAG_UI, "layout reload deferred (event queue busy)");
    return ESP_OK;
}

static void ui_runtime_handle_event(const app_event_t *event)
{
    if (event == NULL) {
        return;
    }

    bool needs_lock = (event->type != EV_LAYOUT_UPDATED);
    if (needs_lock) {
        system_log_note_stage("lock-event");
    }
    if (needs_lock && !display_lock(UI_EVENT_LOCK_TIMEOUT_MS)) {
        if (event->type == EV_HA_STATE_CHANGED || event->type == EV_HA_CONNECTED ||
            event->type == EV_HA_ENERGY_CHANGED) {
            s_pending_state_reconcile = true;
            s_pending_topbar_refresh = true;
        } else if (event->type == EV_HA_DISCONNECTED) {
            s_pending_topbar_refresh = true;
        }

        s_deferred_event_count++;
        int64_t now_ms = esp_timer_get_time() / 1000;
        if ((now_ms - s_deferred_event_log_ms) >= 5000) {
            ESP_LOGW(TAG_UI, "Deferred UI event processing due to display lock contention (deferred=%u)",
                (unsigned)s_deferred_event_count);
            s_deferred_event_log_ms = now_ms;
            s_deferred_event_count = 0;
        }
        return;
    }

    switch (event->type) {
    case EV_HA_STATE_CHANGED:
        ui_runtime_apply_entity_state(event->data.ha_state_changed.entity_id);
#if APP_HA_ROUTE_TRACE_LOG
        ESP_LOGI(TAG_UI, "route panel->ui entity=%s", event->data.ha_state_changed.entity_id);
#endif
        break;
    case EV_HA_CONNECTED:
        ui_runtime_refresh_topbar();
        /* During initial/partial HA sync we may temporarily miss some entities.
         * Preserve currently rendered widgets instead of forcing unavailable. */
        ui_runtime_apply_all_states_preserve_missing();
        break;
    case EV_HA_ENERGY_CHANGED:
        for (size_t i = 0; i < s_energy_page_count; i++) {
            ui_energy_page_apply_all_states(&s_energy_pages[i]);
        }
        break;
    case EV_HA_DISCONNECTED:
        ui_runtime_refresh_topbar();
        break;
    case EV_LAYOUT_UPDATED:
        ui_runtime_reload_layout();
        break;
    case EV_UI_NAVIGATE:
        ui_pages_show(event->data.navigate.page_id);
        break;
    case EV_NONE:
    default:
        break;
    }

    if (needs_lock) {
        display_unlock();
    }
}

static void ui_runtime_task(void *arg)
{
    (void)arg;
    while (true) {
        s_heartbeat++;
        system_log_note_stage("loop");
        app_event_t event = {0};
        while (app_events_receive(&event, 0)) {
            system_log_note_stage("event");
            ui_runtime_handle_event(&event);
            system_log_note_stage("loop");
        }

        int64_t now_ms = esp_timer_get_time() / 1000;

        /* Per-page theme overrides and the automatic day/night theme switch.
         * Runs on this task, so it may touch the palette and the layout. */
        system_log_note_stage("theme-tick");
        ui_theme_router_tick();

        if (s_layout_reload_pending && (now_ms - s_layout_reload_retry_ms) >= UI_LAYOUT_RETRY_INTERVAL_MS) {
            s_layout_reload_retry_ms = now_ms;
            system_log_note_stage("layout-reload");
            (void)ui_runtime_reload_layout();
        }

        system_log_note_stage("model-rev");
        uint32_t model_revision = ha_model_state_revision();
        if (model_revision != s_last_model_revision) {
            s_last_model_revision = model_revision;
            s_model_reconcile_pending = true;
        }
        system_log_note_stage("theme-tick");

        if (s_pending_state_reconcile || s_pending_topbar_refresh) {
            system_log_note_stage("lock-state");
            if (display_lock(20)) {
                if (s_pending_topbar_refresh) {
                    system_log_note_stage("topbar");
                    ui_runtime_refresh_topbar();
                    s_pending_topbar_refresh = false;
                }
                if (s_pending_state_reconcile) {
                    /* Reconcile all states after lock contention so UI never stays stale. */
                    system_log_note_stage("apply-states");
                    ui_runtime_apply_all_states_preserve_missing();
                    s_pending_state_reconcile = false;
                }
                display_unlock();
            }
            system_log_note_stage("theme-tick");
        }

        if (s_model_reconcile_pending && (now_ms - s_last_model_reconcile_ms) >= UI_MODEL_RECONCILE_INTERVAL_MS) {
            system_log_note_stage("lock-model");
            if (display_lock(20)) {
                /* Protect against missed per-entity events under burst: periodically reconcile from model snapshot. */
                system_log_note_stage("reconcile-model");
                ui_runtime_apply_all_states_preserve_missing();
                display_unlock();
                s_model_reconcile_pending = false;
                s_last_model_reconcile_ms = now_ms;
            }
            system_log_note_stage("theme-tick");
        }

        if ((now_ms - s_last_topbar_refresh_ms) >= 1000) {
            system_log_note_stage("lock-topbar");
            if (display_lock(20)) {
                system_log_note_stage("topbar-1s");
                ui_runtime_refresh_topbar();
                display_unlock();
                s_last_topbar_refresh_ms = now_ms;
            }
            system_log_note_stage("theme-tick");
        }

        system_log_note_stage("delay");
        vTaskDelay(pdMS_TO_TICKS(20));
    }
}

esp_err_t ui_runtime_init(void)
{
    esp_err_t err = ui_runtime_alloc_buffers();
    if (err != ESP_OK) {
        return err;
    }

    /* The wallpaper is a whole screen of file I/O: read it before the display
     * lock is taken, otherwise a slow card stalls the LVGL task right here. */
    ui_screen_saver_wallpaper_preload();

    if (!display_lock(0)) {
        return ESP_ERR_TIMEOUT;
    }
    s_topbar_cache.valid = false;
    theme_default_init();
    ui_pages_init();
    ui_screen_saver_init();
    ui_page_transition_init();
    ui_press_feedback_init();
    ui_value_anim_init();
    ui_pages_set_show_callback(ui_runtime_on_page_shown);
    ui_settings_init();
    ui_runtime_show_weather_icon_overlay();
    ui_runtime_refresh_topbar();
    display_unlock();
    s_last_topbar_refresh_ms = esp_timer_get_time() / 1000;
    s_last_model_reconcile_ms = s_last_topbar_refresh_ms;
    s_last_model_revision = ha_model_state_revision();
    s_model_reconcile_pending = false;
    s_pending_state_reconcile = false;
    s_pending_topbar_refresh = false;
    s_deferred_event_count = 0;
    s_deferred_event_log_ms = 0;
    s_initialized = true;
    return ESP_OK;
}

esp_err_t ui_runtime_start(void)
{
    if (!s_initialized) {
        return ESP_ERR_INVALID_STATE;
    }
    if (s_ui_task != NULL) {
        return ESP_OK;
    }

    BaseType_t created =
        app_task_create(ui_runtime_task, "ui_runtime", APP_UI_TASK_STACK, NULL, APP_UI_TASK_PRIO, &s_ui_task);
    return (created == pdPASS) ? ESP_OK : ESP_FAIL;
}

bool ui_runtime_is_running(void)
{
    return s_ui_task != NULL;
}

uint32_t ui_runtime_get_heartbeat(void)
{
    return s_heartbeat;
}

void ui_runtime_get_apply_stats(char *out, size_t out_len)
{
    if (out == NULL || out_len == 0) {
        return;
    }
    snprintf(out, out_len, "apply sweeps=%u last=%ums/%uw max=%ums skipped=%u",
             (unsigned)s_sweep_count, (unsigned)s_sweep_last_ms,
             (unsigned)s_sweep_last_painted, (unsigned)s_sweep_max_ms,
             (unsigned)s_apply_skipped_count);
}

int ui_runtime_get_task_state(void)
{
    TaskHandle_t task = s_ui_task;

    if (task == NULL) {
        return -1;
    }
    return (int)eTaskGetState(task);
}

void ui_runtime_kick_heartbeat(void)
{
    /* Long but healthy rebuilds (large layouts, slow PSRAM) must not trip the
     * UI watchdog: report progress from phase boundaries instead. */
    s_heartbeat++;
}
