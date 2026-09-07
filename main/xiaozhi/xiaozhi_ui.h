#pragma once

// ============================================================
// Xiaozhi AI Screen (push-to-talk)
// ============================================================
//
// Ported from ForgeUI 18_UI_Xiaozhi.c (fg_xiaozhi_* -> xz_ui_*)
// for the BETTA-HA-PANEL firmware.
//
// Builds a page into a BETTA ui_pages_add() page container and
// is driven by the Xiaozhi client layer through the xz_ui_*
// setters. Those setters take the display lock because they are
// called from the WebSocket / capture / playback FreeRTOS tasks
// rather than the LVGL task.
//
// ============================================================

#include <stdbool.h>
#include "lvgl.h"

#ifdef __cplusplus
extern "C" {
#endif

// Builds the Xiaozhi AI assistant page content into the page container.
void xz_ui_build(lv_obj_t *parent);

// Screen state setters, called from the Xiaozhi client layer.
void xz_ui_set_listening(bool listening);
void xz_ui_set_status(const char *text);
void xz_ui_set_transcript(const char *text);
void xz_ui_set_response(const char *text);

// Conversation window: appends one line. `role` is "user", "assistant" or
// "system" (controls the prefix and colour). Takes the display lock.
void xz_ui_add_chat_message(const char *role, const char *text);

// Clears the whole conversation window.
void xz_ui_clear_chat(void);

// Switches the page into an informational overlay (cloud activation code,
// "connect to cloud" message, "configure me" hint). Hidden by default.
void xz_ui_show_overlay(const char *title, const char *code, const char *body);

// Hides the overlay and returns to the push-to-talk screen.
void xz_ui_show_ready(void);

#ifdef __cplusplus
}
#endif
