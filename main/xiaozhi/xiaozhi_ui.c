// ============================================================
// Xiaozhi AI Screen (push-to-talk)
// ============================================================
//
// Ported from ForgeUI 18_UI_Xiaozhi.c (fg_xiaozhi_* -> xz_ui_*)
// for the BETTA-HA-PANEL firmware.
//
// Responsibilities:
// - mic button (push to talk)
// - status line
// - live transcript (STT)
// - assistant response (TTS text)
//
// Rendering notes (2026-04): earlier versions of this screen built
// flex-column layouts with lv_pct() sizes into a page that is HIDDEN
// at build time, plus a full-screen "overlay" that re-used
// theme_default_style_screen() (which does not set bg_opa). On the
// 7" panel that combination produced a black page with no visible
// text. This rewrite follows the pattern proven by the boot splash
// and the energy page instead: plain lv_obj_create() objects,
// remove_style_all(), explicit pixel positions/sizes, explicit
// bg_opa/border/radius and explicit text colours/fonts. No flex,
// no pct(), no overlay stacking - the "setup/activation" view and
// the "push-to-talk" view are two sibling groups that are swapped
// with the HIDDEN flag.
//
// ============================================================

#include "xiaozhi_ui.h"
#include "xiaozhi_activate.h"
#include "xiaozhi_client.h"
#include "app_config.h"
#include "net/wifi_mgr.h"
#include "settings/runtime_settings.h"
#include "drivers/display_init.h"
#include "ui/theme/theme_default.h"
#include "ui/fonts/app_text_fonts.h"

#include "esp_log.h"
#include <stdio.h>
#include <string.h>

#define TAG "XZ_UI"

/* Layout is expressed against the 7" content area (1024x480) and scaled to
 * the real content box of whatever panel variant is compiled. */
#define XZ_REF_W 1024
#define XZ_REF_H 480

/* Conversation window limits (memory lives in PSRAM via the lv_mem allocator). */
#define XZ_CHAT_MAX_MSGS 60
#define XZ_CHAT_LINE_MAX 384

static lv_obj_t *s_page = NULL;   /* opaque page background */
static lv_obj_t *s_setup = NULL;  /* "not configured / activation code" group */
static lv_obj_t *s_ptt = NULL;    /* push-to-talk group */

/* Setup / activation group children */
static lv_obj_t *s_setup_title = NULL;
static lv_obj_t *s_setup_code = NULL;
static lv_obj_t *s_setup_body = NULL;

/* Push-to-talk group children */
static lv_obj_t *s_ptt_title = NULL;
static lv_obj_t *s_mic_btn = NULL;
static lv_obj_t *s_status_label = NULL;
static lv_obj_t *s_chat_cont = NULL; /* scrollable conversation window */

/* Cached view state so xz_ui_build() can re-apply it after a layout reload
 * (pages are only (re)built on reload_layout). */
static bool s_overlay_mode = false;
static char s_cache_title[64] = {0};
static char s_cache_code[16] = {0};
static char s_cache_body[512] = {0};

static void xz_ui_apply_setup_screen(void);
static void xz_ui_show_ptt_view(void);

/* Scale a reference Y (1024x480 space) to the active content box. */
static lv_coord_t xz_y(lv_coord_t y480)
{
    return (lv_coord_t)(((int32_t)y480 * APP_CONTENT_BOX_HEIGHT) / XZ_REF_H);
}

/* Scale a reference X to the active content box. */
static lv_coord_t xz_x(lv_coord_t x1024)
{
    return (lv_coord_t)(((int32_t)x1024 * APP_CONTENT_BOX_WIDTH) / XZ_REF_W);
}

/* Creates a transparent, non-scrollable full-page container. */
static lv_obj_t *xz_make_group(lv_obj_t *parent)
{
    lv_obj_t *g = lv_obj_create(parent);
    lv_obj_remove_style_all(g);
    lv_obj_set_size(g, APP_CONTENT_BOX_WIDTH, APP_CONTENT_BOX_HEIGHT);
    lv_obj_set_pos(g, 0, 0);
    lv_obj_set_style_bg_opa(g, LV_OPA_0, LV_PART_MAIN);
    lv_obj_set_style_border_width(g, 0, LV_PART_MAIN);
    lv_obj_set_style_radius(g, 0, LV_PART_MAIN);
    lv_obj_set_style_pad_all(g, 0, LV_PART_MAIN);
    lv_obj_clear_flag(g, LV_OBJ_FLAG_SCROLLABLE);
    return g;
}

/* Creates a label with explicit geometry & styling (no theme dependency). */
static lv_obj_t *xz_make_label(lv_obj_t *parent, const char *text,
                               const lv_font_t *font, lv_color_t color,
                               lv_coord_t x, lv_coord_t y, lv_coord_t w,
                               lv_text_align_t align, lv_label_long_mode_t long_mode)
{
    lv_obj_t *l = lv_label_create(parent);
    lv_obj_remove_style_all(l);
    lv_label_set_text(l, text != NULL ? text : "");
    lv_obj_set_style_text_font(l, font, LV_PART_MAIN);
    lv_obj_set_style_text_color(l, color, LV_PART_MAIN);
    lv_obj_set_style_text_align(l, align, LV_PART_MAIN);
    if (w > 0) {
        lv_obj_set_width(l, w);
    }
    if (long_mode != LV_LABEL_LONG_WRAP) {
        lv_label_set_long_mode(l, long_mode);
    } else {
        lv_label_set_long_mode(l, LV_LABEL_LONG_WRAP);
    }
    lv_obj_set_pos(l, x, y);
    return l;
}

static void mic_btn_cb(lv_event_t *e)
{
    LV_UNUSED(e);

    if (!xz_xiaozhi_configured()) {
        /* Not bound yet: point the user at the pairing / settings screen
         * instead of silently doing nothing. */
        xz_ui_apply_setup_screen();
        return;
    }

    if (xz_xiaozhi_get_state() == XIAOZHI_STATE_LISTENING) {
        xz_xiaozhi_stop_listening();
    } else {
        xz_xiaozhi_start_listening();
    }
}

/* Best URL the user can open to reach the web panel (STA IP preferred,
 * falls back to the setup AP). */
static void xz_ui_get_panel_url(char *out, size_t out_len)
{
    char addr[48] = {0};
    if (wifi_mgr_get_sta_ip(addr, sizeof(addr)) == ESP_OK && addr[0] != '\0') {
        snprintf(out, out_len, "http://%s", addr);
        return;
    }
    if (wifi_mgr_get_ap_ip(addr, sizeof(addr)) == ESP_OK && addr[0] != '\0') {
        snprintf(out, out_len, "http://%s", addr);
        return;
    }
    strlcpy(out, "http://<panel-ip>", out_len);
}

/* Full-screen guidance shown while the assistant is not bound/configured:
 * - enabled, no credentials -> make sure the cloud pairing flow is running;
 * - disabled                  -> tell the user how to enable it in the web UI. */
static void xz_ui_apply_setup_screen(void)
{
    char dev_id[24] = {0};
    xz_ident_get_mac(dev_id, sizeof(dev_id));

    runtime_settings_t st;
    if (runtime_settings_load(&st) != ESP_OK) {
        runtime_settings_set_defaults(&st);
    }

    char title[64] = {0};
    char body[512] = {0};
    snprintf(title, sizeof(title), "Xiaozhi AI");

    if (st.xiaozhi_enabled) {
        /* Unbound but enabled: make sure the activation task is running so the
         * 6-digit pairing code appears on this screen. */
        if (!xz_activate_is_pending()) {
            const char *url = st.xiaozhi_ota_url[0] != '\0' ? st.xiaozhi_ota_url : APP_XIAOZHI_OTA_URL_DEFAULT;
            xz_activate_start(url);
        }
        if (dev_id[0] != '\0') {
            snprintf(body, sizeof(body),
                     "Urzadzenie: %s\n\nLaczenie z chmura Xiaozhi...\nKod parowania pojawi sie za chwile.", dev_id);
        } else {
            strlcpy(body, "Laczenie z chmura Xiaozhi...\nKod parowania pojawi sie za chwile.", sizeof(body));
        }
    } else {
        char url[96] = {0};
        xz_ui_get_panel_url(url, sizeof(url));
        if (dev_id[0] != '\0') {
            snprintf(body, sizeof(body),
                     "Asystent glosowy jest wylaczony.\n\nAby go wlaczyc:\n"
                     "1. Otworz %s w przegladarce\n"
                     "2. Przejdz do Ustawienia -> Xiaozhi AI\n"
                     "3. Zaznacz 'Wlacz Xiaozhi' i zapisz\n\n"
                     "Urzadzenie: %s",
                     url, dev_id);
        } else {
            snprintf(body, sizeof(body),
                     "Asystent glosowy jest wylaczony.\n\nAby go wlaczyc:\n"
                     "1. Otworz %s w przegladarce\n"
                     "2. Przejdz do Ustawienia -> Xiaozhi AI\n"
                     "3. Zaznacz 'Wlacz Xiaozhi' i zapisz",
                     url);
        }
    }
    xz_ui_show_overlay(title, "", body);
}

static void xz_ui_build_setup_group(lv_obj_t *group)
{
    lv_coord_t body_w = APP_CONTENT_BOX_WIDTH - xz_x(160);

    s_setup_title = xz_make_label(group, "Xiaozhi AI",
                                  APP_FONT_TEXT_28, theme_default_color_text_primary(),
                                  0, xz_y(34), APP_CONTENT_BOX_WIDTH,
                                  LV_TEXT_ALIGN_CENTER, LV_LABEL_LONG_DOT);

    s_setup_code = xz_make_label(group, "",
                                 APP_FONT_DISPLAY_40, lv_color_hex(APP_UI_COLOR_STATE_ON),
                                 0, xz_y(168), APP_CONTENT_BOX_WIDTH,
                                 LV_TEXT_ALIGN_CENTER, LV_LABEL_LONG_DOT);
    lv_obj_set_style_text_letter_space(s_setup_code, xz_x(14), LV_PART_MAIN);

    s_setup_body = xz_make_label(group, "",
                                 APP_FONT_TEXT_16, theme_default_color_text_muted(),
                                 0, xz_y(300), body_w,
                                 LV_TEXT_ALIGN_CENTER, LV_LABEL_LONG_WRAP);
}

static void xz_ui_build_ptt_group(lv_obj_t *group)
{
    lv_coord_t body_w = APP_CONTENT_BOX_WIDTH - xz_x(120);
    lv_coord_t cx = APP_CONTENT_BOX_WIDTH / 2;
    lv_coord_t mic_size = 128;
    if (APP_CONTENT_BOX_HEIGHT < 420) {
        mic_size = 84;
    } else if (APP_CONTENT_BOX_WIDTH < 600) {
        mic_size = 104;
    }

    s_ptt_title = xz_make_label(group, "Xiaozhi AI",
                                APP_FONT_TEXT_28, theme_default_color_text_primary(),
                                0, xz_y(22), APP_CONTENT_BOX_WIDTH,
                                LV_TEXT_ALIGN_CENTER, LV_LABEL_LONG_DOT);

    /* Conversation window: a bordered, scrollable flex-column that holds one
     * label per message. Messages are appended at the end (newest on top of
     * the stacking order but visually at the bottom) and the window is
     * auto-scrolled to the newest line by xz_ui_add_chat_message(). */
    s_chat_cont = lv_obj_create(group);
    lv_obj_remove_style_all(s_chat_cont);
    lv_obj_set_size(s_chat_cont, body_w, xz_y(212));
    lv_obj_set_pos(s_chat_cont, (APP_CONTENT_BOX_WIDTH - body_w) / 2, xz_y(64));
    lv_obj_set_style_bg_color(s_chat_cont, lv_color_hex(APP_UI_COLOR_CONTENT_BG), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(s_chat_cont, LV_OPA_COVER, LV_PART_MAIN);
    lv_obj_set_style_border_width(s_chat_cont, 1, LV_PART_MAIN);
    lv_obj_set_style_border_color(s_chat_cont, theme_default_color_text_muted(), LV_PART_MAIN);
    lv_obj_set_style_border_opa(s_chat_cont, LV_OPA_30, LV_PART_MAIN);
    lv_obj_set_style_radius(s_chat_cont, xz_x(16), LV_PART_MAIN);
    lv_obj_set_style_pad_all(s_chat_cont, xz_x(16), LV_PART_MAIN);
    lv_obj_set_style_pad_row(s_chat_cont, xz_x(8), LV_PART_MAIN);
    lv_obj_set_flex_flow(s_chat_cont, LV_FLEX_COLUMN);
    lv_obj_set_flex_align(s_chat_cont, LV_FLEX_ALIGN_START, LV_FLEX_ALIGN_START, LV_FLEX_ALIGN_START);
    lv_obj_set_scroll_dir(s_chat_cont, LV_DIR_VER);
    lv_obj_set_scrollbar_mode(s_chat_cont, LV_SCROLLBAR_MODE_AUTO);

    s_status_label = xz_make_label(group, "Dotknij, aby mowic",
                                   APP_FONT_TEXT_16, theme_default_color_text_primary(),
                                   0, xz_y(292), APP_CONTENT_BOX_WIDTH,
                                   LV_TEXT_ALIGN_CENTER, LV_LABEL_LONG_DOT);

    s_mic_btn = lv_button_create(group);
    lv_obj_remove_style_all(s_mic_btn);
    lv_obj_set_size(s_mic_btn, mic_size, mic_size);
    lv_obj_set_pos(s_mic_btn, cx - mic_size / 2, xz_y(330));
    lv_obj_set_style_radius(s_mic_btn, LV_RADIUS_CIRCLE, LV_PART_MAIN);
    lv_obj_set_style_bg_color(s_mic_btn, lv_color_hex(APP_UI_COLOR_STATE_ON), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(s_mic_btn, LV_OPA_COVER, LV_PART_MAIN);
    lv_obj_set_style_border_width(s_mic_btn, 0, LV_PART_MAIN);
    lv_obj_set_style_pad_all(s_mic_btn, 0, LV_PART_MAIN);
    lv_obj_clear_flag(s_mic_btn, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_add_event_cb(s_mic_btn, mic_btn_cb, LV_EVENT_CLICKED, NULL);

    /* The mic glyph uses montserrat_14 on purpose: it is the one LVGL font in
     * this build that carries the LV_SYMBOL_* range. */
    lv_obj_t *mic_icon = lv_label_create(s_mic_btn);
    lv_obj_remove_style_all(mic_icon);
    lv_label_set_text(mic_icon, LV_SYMBOL_AUDIO);
    lv_obj_set_style_text_font(mic_icon, &lv_font_montserrat_14, LV_PART_MAIN);
    lv_obj_set_style_text_color(mic_icon, lv_color_hex(APP_UI_COLOR_SCREEN_BG), LV_PART_MAIN);
    lv_obj_center(mic_icon);
}

/* Debug: logs geometry/visibility of the two views once per build so a black
 * page can be diagnosed from the serial log without touching the panel. */
static void xz_ui_log_geometry(void)
{
    const struct {
        const char *name;
        lv_obj_t *obj;
    } objs[] = {
        { "page", s_page },
        { "setup", s_setup },
        { "setup_title", s_setup_title },
        { "setup_code", s_setup_code },
        { "setup_body", s_setup_body },
        { "ptt", s_ptt },
        { "ptt_title", s_ptt_title },
        { "mic_btn", s_mic_btn },
        { "status", s_status_label },
        { "chat_cont", s_chat_cont },
    };
    for (size_t i = 0; i < sizeof(objs) / sizeof(objs[0]); i++) {
        if (objs[i].obj == NULL) {
            ESP_LOGI(TAG, "geom[%s] NULL", objs[i].name);
            continue;
        }
        lv_obj_update_layout(objs[i].obj);
        ESP_LOGI(TAG,
                 "geom[%s] x=%d y=%d w=%d h=%d hidden=%d",
                 objs[i].name,
                 (int)lv_obj_get_x(objs[i].obj),
                 (int)lv_obj_get_y(objs[i].obj),
                 (int)lv_obj_get_width(objs[i].obj),
                 (int)lv_obj_get_height(objs[i].obj),
                 (int)lv_obj_has_flag(objs[i].obj, LV_OBJ_FLAG_HIDDEN));
    }
}

void xz_ui_build(lv_obj_t *parent)
{
    theme_default_init();

    s_page = lv_obj_create(parent);
    lv_obj_remove_style_all(s_page);
    lv_obj_set_size(s_page, APP_CONTENT_BOX_WIDTH, APP_CONTENT_BOX_HEIGHT);
    lv_obj_set_pos(s_page, 0, 0);
    lv_obj_set_style_bg_color(s_page, lv_color_hex(APP_UI_COLOR_CONTENT_BG), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(s_page, LV_OPA_COVER, LV_PART_MAIN);
    lv_obj_set_style_radius(s_page, 0, LV_PART_MAIN);
    lv_obj_set_style_border_width(s_page, 0, LV_PART_MAIN);
    lv_obj_clear_flag(s_page, LV_OBJ_FLAG_SCROLLABLE);

    s_setup = xz_make_group(s_page);
    s_ptt = xz_make_group(s_page);

    xz_ui_build_setup_group(s_setup);
    xz_ui_build_ptt_group(s_ptt);

    /* Both views start hidden; the mode application below reveals one. */
    lv_obj_add_flag(s_setup, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_ptt, LV_OBJ_FLAG_HIDDEN);

    if (s_overlay_mode) {
        xz_ui_show_overlay(s_cache_title, s_cache_code, s_cache_body);
    } else if (!xz_xiaozhi_configured()) {
        /* Not bound yet: replace the push-to-talk screen with a pairing /
         * configuration screen so the page is never a dead end. */
        xz_ui_apply_setup_screen();
    } else {
        xz_ui_show_ptt_view();
    }

    xz_ui_log_geometry();
}

/* Shows the setup/activation view and hides the push-to-talk view. */
static void xz_ui_show_setup_view(const char *title, const char *code, const char *body)
{
    if (s_setup == NULL || s_setup_title == NULL || s_setup_code == NULL || s_setup_body == NULL) {
        return;
    }

    lv_label_set_text(s_setup_title, (title != NULL && title[0] != '\0') ? title : "Xiaozhi AI");
    lv_label_set_text(s_setup_body, body != NULL ? body : "");

    const bool has_code = (code != NULL && code[0] != '\0');
    lv_label_set_text(s_setup_code, has_code ? code : "");
    if (has_code) {
        lv_obj_clear_flag(s_setup_code, LV_OBJ_FLAG_HIDDEN);
    } else {
        lv_obj_add_flag(s_setup_code, LV_OBJ_FLAG_HIDDEN);
    }

    /* Without a code the body moves up so there is no dead gap. */
    lv_coord_t body_y = has_code ? xz_y(310) : xz_y(190);
    lv_obj_set_pos(s_setup_body, (APP_CONTENT_BOX_WIDTH - lv_obj_get_width(s_setup_body)) / 2, body_y);

    lv_obj_clear_flag(s_setup, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_ptt, LV_OBJ_FLAG_HIDDEN);
}

static void xz_ui_show_ptt_view(void)
{
    if (s_ptt == NULL) {
        return;
    }
    if (s_status_label != NULL) {
        lv_label_set_text(s_status_label,
                          xz_xiaozhi_configured() ? "Dotknij, aby mowic" : "Skonfiguruj Xiaozhi w panelu WWW");
    }
    lv_obj_clear_flag(s_ptt, LV_OBJ_FLAG_HIDDEN);
    if (s_setup != NULL) {
        lv_obj_add_flag(s_setup, LV_OBJ_FLAG_HIDDEN);
    }
}

void xz_ui_set_listening(bool listening)
{
    if (s_status_label == NULL) {
        return;
    }

    display_lock(0);
    lv_label_set_text(s_status_label, listening ? "Sluchanie..." : "Dotknij, aby mowic");
    if (s_mic_btn) {
        lv_obj_set_style_bg_color(s_mic_btn,
                                  listening ? lv_color_hex(APP_UI_COLOR_ERROR) : lv_color_hex(APP_UI_COLOR_STATE_ON),
                                  LV_PART_MAIN);
    }
    display_unlock();
}

void xz_ui_set_status(const char *text)
{
    if (s_status_label == NULL || text == NULL) {
        return;
    }
    display_lock(0);
    lv_label_set_text(s_status_label, text);
    display_unlock();
}

static lv_color_t xz_chat_role_color(const char *role)
{
    if (role != NULL && strcmp(role, "user") == 0) {
        return theme_default_color_text_primary();
    }
    if (role != NULL && strcmp(role, "assistant") == 0) {
        return lv_color_hex(APP_UI_COLOR_OK);
    }
    return theme_default_color_text_muted();
}

/* Appends one line to the on-screen conversation window. `role` is one of
 * "user", "assistant", "system" and selects the prefix + colour. */
void xz_ui_add_chat_message(const char *role, const char *text)
{
    if (text == NULL || text[0] == '\0' || s_chat_cont == NULL) {
        return;
    }
    if (!display_lock(0)) {
        return;
    }

    char line[XZ_CHAT_LINE_MAX];
    if (role != NULL && strcmp(role, "user") == 0) {
        snprintf(line, sizeof(line), "Ty: %s", text);
    } else if (role != NULL && strcmp(role, "assistant") == 0) {
        snprintf(line, sizeof(line), "Xiaozhi: %s", text);
    } else {
        strlcpy(line, text, sizeof(line));
    }

    lv_obj_t *msg = lv_label_create(s_chat_cont);
    lv_obj_remove_style_all(msg);
    lv_label_set_long_mode(msg, LV_LABEL_LONG_WRAP);
    lv_obj_set_width(msg, lv_obj_get_content_width(s_chat_cont));
    lv_obj_set_style_text_font(msg, APP_FONT_TEXT_16, LV_PART_MAIN);
    lv_obj_set_style_text_color(msg, xz_chat_role_color(role), LV_PART_MAIN);
    lv_obj_set_style_text_letter_space(msg, 0, LV_PART_MAIN);
    lv_obj_set_style_text_line_space(msg, 0, LV_PART_MAIN);
    lv_label_set_text(msg, line);

    /* Keep the transcript bounded: drop the oldest message when the window
     * is full (child 0 is the first-created, i.e. oldest, message). */
    while (lv_obj_get_child_count(s_chat_cont) > XZ_CHAT_MAX_MSGS) {
        lv_obj_t *oldest = lv_obj_get_child(s_chat_cont, 0);
        if (oldest == NULL) {
            break;
        }
        lv_obj_delete(oldest);
    }

    lv_obj_update_layout(s_chat_cont);
    lv_obj_scroll_to_y(s_chat_cont, LV_COORD_MAX, LV_ANIM_OFF);
    display_unlock();
}

/* Empties the conversation window (start of a fresh session). */
void xz_ui_clear_chat(void)
{
    if (s_chat_cont == NULL) {
        return;
    }
    if (!display_lock(0)) {
        return;
    }
    lv_obj_clean(s_chat_cont);
    display_unlock();
}

void xz_ui_set_transcript(const char *text)
{
    xz_ui_add_chat_message("user", text);
}

void xz_ui_set_response(const char *text)
{
    xz_ui_add_chat_message("assistant", text);
}

/* Switches the page into an informational view (cloud activation code,
 * "connect to cloud" message, "configure me" hint). */
void xz_ui_show_overlay(const char *title, const char *code, const char *body)
{
    s_overlay_mode = true;
    strlcpy(s_cache_title, title != NULL ? title : "", sizeof(s_cache_title));
    strlcpy(s_cache_code, code != NULL ? code : "", sizeof(s_cache_code));
    strlcpy(s_cache_body, body != NULL ? body : "", sizeof(s_cache_body));

    display_lock(0);
    if (s_setup != NULL) {
        xz_ui_show_setup_view(s_cache_title, s_cache_code, s_cache_body);
    }
    display_unlock();
}

/* Hides the overlay and returns the page to the push-to-talk screen. */
void xz_ui_show_ready(void)
{
    s_overlay_mode = false;
    display_lock(0);
    xz_ui_show_ptt_view();
    display_unlock();
}
