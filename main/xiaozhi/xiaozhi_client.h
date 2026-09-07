#pragma once

// ============================================================
// Xiaozhi AI Voice Assistant Client
// ============================================================
//
// Ported from ForgeUI 70_Xiaozhi.c (fg_xiaozhi_* -> xz_xiaozhi_*)
// for the BETTA-HA-PANEL firmware.
//
// Implements the Xiaozhi (小智) WebSocket protocol v3 over
// esp_websocket_client:
//
//   - text handshake (client hello / server hello) with session_id
//   - binary Opus audio frames (60 ms, 16 kHz mono capture)
//   - push-to-talk listen start/stop and abort-speaking
//
// The client is self-contained: it owns the microphone capture
// task, the Opus codec instances and the WebSocket connection,
// and drives the Xiaozhi UI screen through the xz_ui_* setters.
//
// ============================================================

#include <stdbool.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    XIAOZHI_STATE_IDLE = 0,      /* Not connected, no session. */
    XIAOZHI_STATE_CONNECTING,    /* WebSocket handshake in progress. */
    XIAOZHI_STATE_CONNECTED,     /* Handshake done, idle (not capturing). */
    XIAOZHI_STATE_LISTENING,     /* Capturing microphone and streaming. */
    XIAOZHI_STATE_SPEAKING,      /* Playing server TTS audio. */
    XIAOZHI_STATE_ERROR,         /* Connection or setup failed. */
} xiaozhi_state_t;

/* Configuration snapshot copied at init (server/device/token). */
typedef struct {
    const char *server;   /* WebSocket URL, e.g. wss://api.tenclass.net/xiaozhi/v1/ */
    const char *device;   /* Optional device id (falls back to MAC). */
    const char *token;    /* Optional access token. */
    bool enabled;
} xiaozhi_config_t;

// Create primitives (idempotent). Copies cfg into internal storage.
esp_err_t xz_xiaozhi_init(const xiaozhi_config_t *cfg);

// Update the server/device/token at runtime (e.g. right after the cloud
// activation flow returns the bound WebSocket config). Safe at any time.
void xz_xiaozhi_set_config(const xiaozhi_config_t *cfg);

// True when a server URL is configured (regardless of connection state).
bool xz_xiaozhi_configured(void);

// Begin a push-to-talk capture session (connects async if needed).
esp_err_t xz_xiaozhi_start_listening(void);

// Stop the current capture session (keeps the WebSocket open).
esp_err_t xz_xiaozhi_stop_listening(void);

// Ask the server to interrupt TTS playback.
esp_err_t xz_xiaozhi_abort_speaking(void);

// Disconnect from the server and tear down the whole session.
esp_err_t xz_xiaozhi_disconnect(void);

// Current client state.
xiaozhi_state_t xz_xiaozhi_get_state(void);

#ifdef __cplusplus
}
#endif
