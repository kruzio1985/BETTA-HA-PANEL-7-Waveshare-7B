/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#pragma once

#include "sdkconfig.h"

/* ---- Panel-variant-dependent geometry & identity ----------------------
 * Selected via CONFIG_APP_PANEL_VARIANT_* (see main/Kconfig.projbuild).
 * Defaults fall back to the 4" 720x720 baseline so an older sdkconfig
 * (pre-variant) still builds the smart86 target unchanged. */
#if defined(CONFIG_APP_PANEL_VARIANT_10INCH_1280)
#  define APP_NAME               "betta-ha-panel-10.1"
#  define APP_SCREEN_WIDTH       1280
#  define APP_SCREEN_HEIGHT      800
#  define APP_CONTENT_BOX_WIDTH  1280
#  define APP_CONTENT_BOX_HEIGHT 680
#elif defined(CONFIG_APP_PANEL_VARIANT_7INCH_1024)
#  define APP_NAME               "betta-ha-panel-7b"
#  define APP_SCREEN_WIDTH       1024
#  define APP_SCREEN_HEIGHT      600
#  define APP_CONTENT_BOX_WIDTH  1024
#  define APP_CONTENT_BOX_HEIGHT 480
#elif defined(CONFIG_APP_PANEL_VARIANT_S3_480)
#  define APP_NAME               "betta-ha-panel-s3"
#  define APP_SCREEN_WIDTH       480
#  define APP_SCREEN_HEIGHT      480
#  define APP_CONTENT_BOX_WIDTH  480
#  define APP_CONTENT_BOX_HEIGHT 360
#else /* CONFIG_APP_PANEL_VARIANT_4INCH_720 (default) */
#  define APP_NAME               "betta-ha-panel"
#  define APP_SCREEN_WIDTH       720
#  define APP_SCREEN_HEIGHT      720
#  define APP_CONTENT_BOX_WIDTH  720
#  define APP_CONTENT_BOX_HEIGHT 600
#endif
#define APP_CONTENT_BOX_X 0
#define APP_CONTENT_BOX_Y 60
#define APP_NAV_BUTTON_COUNT 5
#define APP_LVGL_ANTIALIASING 0
#define APP_UI_REWORK_V2 1
#define APP_UI_TEST_WEATHER_ICON_OVERLAY 0

#define APP_DISPLAY_ACTIVE_BRIGHTNESS_PERCENT 100
#define APP_DISPLAY_DIM_BRIGHTNESS_PERCENT 10
#define APP_DISPLAY_DIM_TIMEOUT_MS (3 * 60 * 1000)
#define APP_DISPLAY_OFF_TIMEOUT_MS (30 * 60 * 1000) /* full screen OFF after 30 min */
#define APP_DISPLAY_NIGHT_MODE_ENABLED 1
#define APP_DISPLAY_NIGHT_START_HOUR 22
#define APP_DISPLAY_NIGHT_END_HOUR 6

#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
#define APP_EVENT_QUEUE_LENGTH 64
#else
#define APP_EVENT_QUEUE_LENGTH 96
#endif
#define APP_EVENT_QUEUE_WAIT_MS 50
/* When the event queue is full (e.g. the UI task is stuck), evict the oldest
 * event instead of dropping the newest one. State events are superseded by the
 * HA model snapshot that the UI reconciles from, so the oldest is always the
 * least relevant. This guarantees the queue can never stay saturated. */
#define APP_EVENT_QUEUE_EVICT_ON_FULL 1

/* UI task watchdog: the system log task restarts the panel when the UI heartbeat
 * stops advancing for this long (the UI task is stuck holding the LVGL lock and
 * can never drain the event queue). */
#define APP_UI_WATCHDOG_TIMEOUT_MS 60000

/* Scheduled periodic restart: after this much uptime the panel performs a clean
 * software reset. This clears up slow leaks, heap fragmentation and any other
 * slowly-degrading runtime state that no watchdog can catch. */
#define APP_DAILY_RESTART_MS (24 * 60 * 60 * 1000)

/* Per-entity coalescing window for HA state-change events. Chatty sensors (e.g.
 * Zigbee power meters, weather) can flood the queue; within this window only the
 * latest state matters because the UI reconciles from the model snapshot. */
#define APP_EVENT_COALESCE_MS 1000

#define APP_LAYOUT_PATH "/littlefs/layout.json"
#define APP_LAYOUT_MAX_JSON_LEN 16384
#define APP_LAYOUT_MAX_ERRORS 16

#define APP_CAMERAS_PATH "/littlefs/cameras.json"
#define APP_CAMERAS_MAX_JSON_LEN 8192
#define APP_MAX_CAMERAS 4
#define APP_CAMERA_ID_MAX_LEN 32
#define APP_CAMERA_NAME_MAX_LEN 64
#define APP_CAMERA_URL_MAX_LEN 512
#define APP_CAMERA_SOURCE_MAX_LEN 8
#define APP_CAMERA_ENTITY_MAX_LEN 96
#define APP_CAMERA_USER_MAX_LEN 64
#define APP_CAMERA_PASS_MAX_LEN 64
#define APP_CAMERA_REFRESH_MIN_MS 1000
#define APP_CAMERA_REFRESH_MAX_MS 60000
#define APP_CAMERA_REFRESH_DEFAULT_MS 2000

#define APP_SETTINGS_PATH "/littlefs/settings.json"
#define APP_SETTINGS_MAX_JSON_LEN 4096

/* Persistent system/diagnostic log (auto-rotating, bounded on LittleFS). */
#define APP_LOG_DIR "/littlefs/logs"
#define APP_LOG_FILE "/littlefs/logs/system.log"
#define APP_LOG_MAX_FILE_BYTES (96 * 1024)
#define APP_LOG_MAX_ROTATED 3
#define APP_LOG_RING_BYTES 8192
#define APP_LOG_HEARTBEAT_MS 30000

#define APP_WIFI_SSID_MAX_LEN 33
#define APP_WIFI_PASSWORD_MAX_LEN 65
#define APP_WIFI_COUNTRY_CODE_MAX_LEN 3
#define APP_WIFI_BSSID_MAX_LEN 18
#define APP_HA_WS_URL_MAX_LEN 256
#define APP_HA_ACCESS_TOKEN_MAX_LEN 512
#define APP_NTP_SERVER_MAX_LEN 128
#define APP_TIME_TZ_MAX_LEN 128
#define APP_UI_LANGUAGE_MAX_LEN 16

#define APP_XIAOZHI_SERVER_MAX_LEN 256
#define APP_XIAOZHI_DEVICE_MAX_LEN 64
#define APP_XIAOZHI_TOKEN_MAX_LEN 512
#define APP_XIAOZHI_OTA_URL_MAX_LEN 256
#define APP_XIAOZHI_OTA_URL_DEFAULT "https://api.tenclass.net/xiaozhi/ota/"

#define APP_UI_DEFAULT_LANGUAGE "pl"

#define APP_I18N_DIR "/littlefs/i18n"
#define APP_I18N_MAX_JSON_LEN 32768

#define APP_THEME_DIR "/littlefs/themes"
#define APP_THEME_ACTIVE_PATH "/littlefs/themes/active.id"

#define APP_SETUP_AP_SSID_PREFIX "BETTA-Setup"
#define APP_SETUP_AP_PASSWORD ""
#define APP_SETUP_AP_CHANNEL 1
#define APP_SETUP_AP_MAX_CONNECTIONS 4

#define APP_MAX_PAGES 6
#define APP_MAX_WIDGETS_PER_PAGE 32
#define APP_MAX_WIDGETS_TOTAL (APP_MAX_PAGES * APP_MAX_WIDGETS_PER_PAGE)

#define APP_MAX_ENTITY_ID_LEN 96
#define APP_MAX_WIDGET_ID_LEN 32
#define APP_MAX_PAGE_ID_LEN 32
#define APP_MAX_STATE_LEN 64
#define APP_MAX_NAME_LEN 64
#define APP_MAX_UNIT_LEN 24
#define APP_MAX_ICON_LEN 64
#define APP_MAX_UI_OPTION_LEN 24
#define APP_MAX_COLOR_STR_LEN 16

#define APP_HA_MAX_ENTITIES 256
#define APP_HA_MAX_STATES 256
/* Must fit weather entity attributes incl. the compact forecast array
 * plus temperature/humidity/units.  The S3 variant keeps fewer forecast
 * rows, but 1024 leaves comfortable headroom for both panel classes. */
#define APP_HA_ATTRS_MAX_LEN 1024
/* Full RGBIC/Govee effect lists can exceed 3.8 KB (300+ names). They are kept
 * out of ha_state_t (which stays compact) in a dedicated per-light cache. */
#define APP_HA_LIGHT_EFFECTS_MAX_LEN 8192
#define APP_HA_LIGHT_DISCOVERY_MAX_ITEMS 256
#define APP_HA_LIGHT_DISCOVERY_MAX_AREAS 96
#define APP_HA_LIGHT_DISCOVERY_MAX_DEVICES 256
#define APP_HA_DISCOVERY_ID_MAX_LEN 48
#define APP_HA_DISCOVERY_DOMAIN_MAX_LEN 24
#define APP_HA_DISCOVERY_SEARCH_MAX_LEN 64
/* Disable only the raw HA registry WS discovery by default; the light picker stays enabled via template pages. */
#define APP_HA_LIGHT_DISCOVERY_REGISTRY_ENABLED 0
/* Default discovery path: HA renders compact light pages server-side; the panel fetches them one by one. */
#define APP_HA_LIGHT_DISCOVERY_TEMPLATE_ENABLED 1
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
#define APP_HA_LIGHT_DISCOVERY_PAGE_SIZE 16
#else
#define APP_HA_LIGHT_DISCOVERY_PAGE_SIZE 24
#endif

#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
#define APP_HA_QUEUE_LENGTH 48
#else
#define APP_HA_QUEUE_LENGTH 96
#endif
#define APP_HA_TASK_STACK 12288
#define APP_HA_TASK_PRIO 8
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
#define APP_HA_COVER_TASK_STACK 20480
#else
#define APP_HA_COVER_TASK_STACK 8192
#endif
#define APP_HA_COVER_TASK_PRIO 3

/* Keep pre-language behavior for light commands (explicit no-fade). */
#define APP_HA_LIGHT_USE_TRANSITION_ZERO 1

/* Optional A/B: use light.toggle for panel power actions (with desired-state guard). */
#define APP_HA_LIGHT_POWER_USE_TOGGLE 0

/* Keep pre-language WS subscription path enabled. */
#define APP_HA_USE_WS_ENTITIES_SUBSCRIPTION 1

/* Route tracing for state flow: WS -> panel model -> UI (verbose, keep off by default). */
#define APP_HA_ROUTE_TRACE_LOG 0

#define APP_UI_TASK_STACK 24576
#define APP_UI_TASK_PRIO 4

#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
#define APP_LVGL_TASK_STACK 16384
#else
#define APP_LVGL_TASK_STACK 24576
#endif

#define APP_HTTP_PORT 80
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
#define APP_HTTP_TASK_STACK 8192
#else
#define APP_HTTP_TASK_STACK 12288
#endif

#define APP_OTA_URL_MAX_LEN 512
#define APP_OTA_JSON_MAX_LEN 768
#define APP_OTA_CHUNK_SIZE 4096
#define APP_OTA_TASK_STACK 8192
#define APP_OTA_TASK_PRIO 5

#ifndef APP_HAVE_HOSTED_C6_FW_IMAGE
#define APP_HAVE_HOSTED_C6_FW_IMAGE 0
#endif

#ifdef CONFIG_APP_WIFI_SSID
#define APP_WIFI_SSID CONFIG_APP_WIFI_SSID
#else
#define APP_WIFI_SSID "YOUR_WIFI_SSID"
#endif

#ifdef CONFIG_APP_WIFI_PASSWORD
#define APP_WIFI_PASSWORD CONFIG_APP_WIFI_PASSWORD
#else
#define APP_WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#endif

#ifdef CONFIG_APP_WIFI_COUNTRY_CODE
#define APP_WIFI_COUNTRY_CODE CONFIG_APP_WIFI_COUNTRY_CODE
#else
#define APP_WIFI_COUNTRY_CODE "DE"
#endif

#ifdef CONFIG_APP_WIFI_WAIT_FOR_IP
#define APP_WIFI_WAIT_FOR_IP CONFIG_APP_WIFI_WAIT_FOR_IP
#else
#define APP_WIFI_WAIT_FOR_IP 1
#endif

#ifdef CONFIG_APP_WIFI_CONNECT_TIMEOUT_MS
#define APP_WIFI_CONNECT_TIMEOUT_MS CONFIG_APP_WIFI_CONNECT_TIMEOUT_MS
#else
#define APP_WIFI_CONNECT_TIMEOUT_MS 15000
#endif

#ifdef CONFIG_APP_WIFI_MAX_RETRIES
#define APP_WIFI_MAX_RETRIES CONFIG_APP_WIFI_MAX_RETRIES
#else
#define APP_WIFI_MAX_RETRIES 8
#endif

#ifdef CONFIG_APP_WIFI_DISABLE_POWER_SAVE
#define APP_WIFI_DISABLE_POWER_SAVE CONFIG_APP_WIFI_DISABLE_POWER_SAVE
#else
#define APP_WIFI_DISABLE_POWER_SAVE 1
#endif

#ifdef CONFIG_APP_HOSTED_AUTO_UPDATE_C6_FW
#define APP_HOSTED_AUTO_UPDATE_C6_FW CONFIG_APP_HOSTED_AUTO_UPDATE_C6_FW
#else
#define APP_HOSTED_AUTO_UPDATE_C6_FW 1
#endif

/* Expert override: allow bundled C6 FW version different from host ESP-Hosted stack version. */
#define APP_HOSTED_ALLOW_BUNDLED_C6_VERSION_MISMATCH 0

#ifdef CONFIG_APP_HA_WS_URL
#define APP_HA_WS_URL CONFIG_APP_HA_WS_URL
#else
#define APP_HA_WS_URL "YOUR_HA_WS_URL"
#endif

#ifdef CONFIG_APP_HA_ACCESS_TOKEN
#define APP_HA_ACCESS_TOKEN CONFIG_APP_HA_ACCESS_TOKEN
#else
#define APP_HA_ACCESS_TOKEN "YOUR_HA_ACCESS_TOKEN"
#endif

#ifdef CONFIG_APP_HA_FETCH_INITIAL_STATES
#define APP_HA_FETCH_INITIAL_STATES CONFIG_APP_HA_FETCH_INITIAL_STATES
#else
#define APP_HA_FETCH_INITIAL_STATES 1
#endif

#ifdef CONFIG_APP_HA_SUBSCRIBE_STATE_CHANGED
#define APP_HA_SUBSCRIBE_STATE_CHANGED CONFIG_APP_HA_SUBSCRIBE_STATE_CHANGED
#else
#define APP_HA_SUBSCRIBE_STATE_CHANGED 1
#endif

#ifdef CONFIG_APP_HA_PING_INTERVAL_MS
#define APP_HA_PING_INTERVAL_MS CONFIG_APP_HA_PING_INTERVAL_MS
#else
#define APP_HA_PING_INTERVAL_MS 8000
#endif

#ifdef CONFIG_APP_NTP_SERVER
#define APP_NTP_SERVER CONFIG_APP_NTP_SERVER
#else
#define APP_NTP_SERVER "pool.ntp.org"
#endif

#ifdef CONFIG_APP_TIME_TZ
#define APP_TIME_TZ CONFIG_APP_TIME_TZ
#else
#define APP_TIME_TZ "CET-1CEST,M3.5.0/2,M10.5.0/3"
#endif
