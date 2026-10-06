/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
const GRID = 10;
// Canvas pixel dimensions default to the 4" panel (720x600 content area).
// applyCanvasGeometry() below overrides them at runtime with the values
// returned by /api/version, so the same app.js works on both the 4"
// and 10.1" firmware variants.
let CANVAS_WIDTH = 720;
let CANVAS_HEIGHT = 600;
const MIN_WIDGET_SIZE = 60;
const DEFAULT_SLIDER_DIRECTION = "auto";
const DEFAULT_BUTTON_MODE = "auto";
const DEFAULT_BUTTON_ACCENT_COLOR = "#6fe8ff";
const DEFAULT_SLIDER_ACCENT_COLOR = "#6fe8ff";
const DEFAULT_GRAPH_LINE_COLOR = "#6fe8ff";
const DEFAULT_GRAPH_TIME_WINDOW_MIN = 120;
const GRAPH_POINTS_MIN = 16;
const GRAPH_POINTS_MAX = 64;
const GRAPH_TIME_WINDOW_MIN = 1;
const GRAPH_TIME_WINDOW_MAX = 1440;
const GRAPH_DISPLAY_MODES = ["line", "line_smooth_points", "line_smooth", "bars"];
const DEFAULT_GRAPH_DISPLAY_MODE = "line";
const GRAPH_BAR_BUCKET_MIN_OPTIONS = [5, 10, 15, 30];
const DEFAULT_GRAPH_BAR_BUCKET_MIN = 15;
const ENERGY_PAGE_TYPE = "energy_dashboard";
const XIAOZHI_PAGE_TYPE = "xiaozhi";
const MUSIC_PAGE_TYPE = "music_assistant";
const RADIO_PAGE_TYPE = "radio";
/* Fixed id of the weather page: the firmware hides this page from the bottom
   bar and links it to the weather chip in the top bar. */
const WEATHER_PAGE_ID = "pogoda";
const RADIO_COLUMNS_MIN = 2;
const RADIO_COLUMNS_MAX = 4;
const RADIO_COLUMNS_DEFAULT = 3;
const RADIO_MAX_STATIONS = 24;
const RADIO_MAX_PREVIEW_TILES = 9;
const LOG_VERBOSITY_LEVELS = new Set([0, 1, 2, 3, 4, 5]);
const ENERGY_SOURCE_HA = "ha_energy";
const ENERGY_SOURCE_MANUAL = "manual_live";
const ENERGY_SOURCES = new Set([ENERGY_SOURCE_HA, ENERGY_SOURCE_MANUAL]);
const ENERGY_PREVIEW_COLORS = {
  grid: "#039bef",
  solar: "#ff9800",
  battery: "#26a69a",
  idle: "#435566",
};

function isCompactCanvas() {
  return CANVAS_WIDTH <= 480 || CANVAS_HEIGHT <= 380;
}

const ENERGY_ENTITY_KEYS = [
  "home_power_entity_id",
  "solar_power_entity_id",
  "grid_power_entity_id",
  "grid_import_power_entity_id",
  "grid_export_power_entity_id",
  "battery_power_entity_id",
  "battery_charge_power_entity_id",
  "battery_discharge_power_entity_id",
  "battery_soc_entity_id",
];
const ENTITY_AUTOCOMPLETE_DEBOUNCE_MS = 220;
const ENTITY_AUTOCOMPLETE_MAX_ITEMS = 24;
const LIGHT_ENTITY_PICKER_POLL_MS = 700;
const LIGHT_ENTITY_PICKER_MAX_POLLS = 90;
const CAMERA_ENTITY_DISCOVERY_POLL_MS = 700;
const CAMERA_ENTITY_DISCOVERY_MAX_POLLS = 90;
const ENTITY_PICKER_SEARCH_DEBOUNCE_MS = 350;
const SETUP_WIZARD_PENDING_STORAGE_KEY = "betta.setupWizard.pending";
const SETUP_WIZARD_DISMISSED_STORAGE_KEY = "betta.setupWizard.dismissed";
const OTA_RELEASE_REPO = "cptkirki/BETTA-HA-PANEL";
/* Tiles that may stay without an entity; they bind one when it is set. */
const ENTITY_OPTIONAL_WIDGET_TYPES = ["cover_tile", "scene_tile", "person_tile", "timer_tile", "sensor_tile"];
const ENTITY_PICKER_CONFIGS = {
  sensor: {
    domain: "sensor",
    titleKey: "entity_picker.title_sensor",
    blankKey: "entity_picker.blank_sensor",
    widgetKey: "entity_picker.widget_sensor",
    itemsKey: "entity_picker.items_sensor",
    titleFallback: "Choose Sensor",
    blankFallback: "Blank Sensor Tile",
    widgetFallback: "Sensor tile",
    itemsFallback: "sensors",
    minSearch: 2,
    liveSearch: false,
  },
  light_tile: {
    domain: "light",
    titleKey: "entity_picker.title_light",
    blankKey: "entity_picker.blank_light",
    widgetKey: "entity_picker.widget_light",
    itemsKey: "entity_picker.items_light",
    titleFallback: "Choose Light",
    blankFallback: "Blank Light Tile",
    widgetFallback: "Light tile",
    itemsFallback: "lights",
  },
  button: {
    domain: "switch",
    titleKey: "entity_picker.title_switch",
    blankKey: "entity_picker.blank_button",
    widgetKey: "entity_picker.widget_button",
    itemsKey: "entity_picker.items_switch",
    titleFallback: "Choose Switch",
    blankFallback: "Blank Button Tile",
    widgetFallback: "Button tile",
    itemsFallback: "switches",
  },
  binary_sensor: {
    domain: "binary_sensor",
    titleKey: "entity_picker.title_binary",
    blankKey: "entity_picker.blank_binary",
    widgetKey: "entity_picker.widget_binary",
    itemsKey: "entity_picker.items_binary",
    titleFallback: "Choose Binary Sensor",
    blankFallback: "Blank Binary Sensor Tile",
    widgetFallback: "Binary Sensor tile",
    itemsFallback: "binary sensors",
    minSearch: 2,
    liveSearch: false,
  },
  alarm_tile: {
    domain: "alarm_control_panel",
    titleKey: "entity_picker.title_alarm",
    blankKey: "entity_picker.blank_alarm",
    widgetKey: "entity_picker.widget_alarm",
    itemsKey: "entity_picker.items_alarm",
    titleFallback: "Choose Alarm Panel",
    blankFallback: "Blank Alarm Tile",
    widgetFallback: "Alarm tile",
    itemsFallback: "alarm panels",
    minSearch: 2,
    liveSearch: false,
  },
  heating_tile: {
    domain: "climate",
    titleKey: "entity_picker.title_climate",
    blankKey: "entity_picker.blank_heating",
    widgetKey: "entity_picker.widget_heating",
    itemsKey: "entity_picker.items_climate",
    titleFallback: "Choose Heating",
    blankFallback: "Blank Heating Tile",
    widgetFallback: "Heating tile",
    itemsFallback: "climate entities",
  },
  weather_tile: {
    domain: "weather",
    titleKey: "entity_picker.title_weather",
    blankKey: "entity_picker.blank_weather",
    widgetKey: "entity_picker.widget_weather",
    itemsKey: "entity_picker.items_weather",
    titleFallback: "Choose Weather",
    blankFallback: "Blank Weather Tile",
    widgetFallback: "Weather tile",
    itemsFallback: "weather entities",
  },
  weather_3day: {
    domain: "weather",
    titleKey: "entity_picker.title_weather",
    blankKey: "entity_picker.blank_weather_3day",
    widgetKey: "entity_picker.widget_weather_3day",
    itemsKey: "entity_picker.items_weather",
    titleFallback: "Choose Weather",
    blankFallback: "Blank Weather Forecast Tile",
    widgetFallback: "Weather Forecast tile",
    itemsFallback: "weather entities",
  },
  todo_list: {
    domain: "todo",
    titleKey: "entity_picker.title_todo",
    blankKey: "entity_picker.blank_todo",
    widgetKey: "entity_picker.widget_todo",
    itemsKey: "entity_picker.items_todo",
    titleFallback: "Choose Todo List",
    blankFallback: "Blank Todo List Tile",
    widgetFallback: "Todo List tile",
    itemsFallback: "todo lists",
  },
  media_player: {
    domain: "media_player",
    titleKey: "entity_picker.title_media_player",
    blankKey: "entity_picker.blank_media_player",
    widgetKey: "entity_picker.widget_media_player",
    itemsKey: "entity_picker.items_media_player",
    titleFallback: "Choose Media Player",
    blankFallback: "Blank Media Player Tile",
    widgetFallback: "Media Player tile",
    itemsFallback: "media players",
  },
  roborock_tile: {
    domain: "vacuum",
    titleKey: "entity_picker.title_roborock",
    blankKey: "entity_picker.blank_roborock",
    widgetKey: "entity_picker.widget_roborock",
    itemsKey: "entity_picker.items_vacuum",
    titleFallback: "Choose Roborock",
    blankFallback: "Blank Roborock Tile",
    widgetFallback: "Roborock tile",
    itemsFallback: "vacuum robots",
  },
  graph: {
    domain: "sensor",
    titleKey: "entity_picker.title_sensor",
    blankKey: "entity_picker.blank_graph",
    widgetKey: "entity_picker.widget_graph",
    itemsKey: "entity_picker.items_sensor",
    titleFallback: "Choose Sensor",
    blankFallback: "Blank Graph Tile",
    widgetFallback: "Graph tile",
    itemsFallback: "sensors",
    minSearch: 2,
    liveSearch: false,
  },
  binary_sensor: {
    domain: "binary_sensor",
    titleKey: "entity_picker.title_binary",
    blankKey: "entity_picker.blank_binary",
    widgetKey: "entity_picker.widget_binary",
    itemsKey: "entity_picker.items_binary",
    titleFallback: "Choose Binary Sensor",
    blankFallback: "Blank Binary Sensor Tile",
    widgetFallback: "Binary Sensor tile",
    itemsFallback: "binary sensors",
  },
  cover: {
    domain: "cover",
    titleKey: "entity_picker.title_cover",
    blankKey: "entity_picker.blank_cover",
    widgetKey: "entity_picker.widget_cover",
    itemsKey: "entity_picker.items_cover",
    titleFallback: "Choose Cover",
    blankFallback: "Blank Cover Tile",
    widgetFallback: "Cover tile",
    itemsFallback: "covers",
  },
  lock: {
    domain: "lock",
    titleKey: "entity_picker.title_lock",
    blankKey: "entity_picker.blank_lock",
    widgetKey: "entity_picker.widget_lock",
    itemsKey: "entity_picker.items_lock",
    titleFallback: "Choose Lock",
    blankFallback: "Blank Lock Tile",
    widgetFallback: "Lock tile",
    itemsFallback: "locks",
  },
  fan: {
    domain: "fan",
    titleKey: "entity_picker.title_fan",
    blankKey: "entity_picker.blank_fan",
    widgetKey: "entity_picker.widget_fan",
    itemsKey: "entity_picker.items_fan",
    titleFallback: "Choose Fan",
    blankFallback: "Blank Fan Tile",
    widgetFallback: "Fan tile",
    itemsFallback: "fans",
  },
  select: {
    domain: "select",
    titleKey: "entity_picker.title_select",
    blankKey: "entity_picker.blank_select",
    widgetKey: "entity_picker.widget_select",
    itemsKey: "entity_picker.items_select",
    titleFallback: "Choose Select",
    blankFallback: "Blank Select Tile",
    widgetFallback: "Select tile",
    itemsFallback: "select entities",
  },
  number: {
    domain: "number",
    titleKey: "entity_picker.title_number",
    blankKey: "entity_picker.blank_number",
    widgetKey: "entity_picker.widget_number",
    itemsKey: "entity_picker.items_number",
    titleFallback: "Choose Number",
    blankFallback: "Blank Number Tile",
    widgetFallback: "Number tile",
    itemsFallback: "number entities",
  },
  cover_tile: {
    domain: "cover",
    titleKey: "entity_picker.title_cover",
    blankKey: "entity_picker.blank_cover",
    widgetKey: "entity_picker.widget_cover",
    itemsKey: "entity_picker.items_cover",
    titleFallback: "Choose Cover",
    blankFallback: "Blank Cover Tile",
    widgetFallback: "Cover tile",
    itemsFallback: "covers",
  },
  scene_tile: {
    domain: "scene",
    titleKey: "entity_picker.title_scene",
    blankKey: "entity_picker.blank_scene",
    widgetKey: "entity_picker.widget_scene",
    itemsKey: "entity_picker.items_scene",
    titleFallback: "Choose Scene",
    blankFallback: "Blank Scene Tile",
    widgetFallback: "Scene tile",
    itemsFallback: "scenes",
  },
  person_tile: {
    domain: "person",
    titleKey: "entity_picker.title_person",
    blankKey: "entity_picker.blank_person",
    widgetKey: "entity_picker.widget_person",
    itemsKey: "entity_picker.items_person",
    titleFallback: "Choose Person",
    blankFallback: "Blank Person Tile",
    widgetFallback: "Person tile",
    itemsFallback: "people",
  },
  timer_tile: {
    domain: "timer",
    titleKey: "entity_picker.title_timer",
    blankKey: "entity_picker.blank_timer",
    widgetKey: "entity_picker.widget_timer",
    itemsKey: "entity_picker.items_timer",
    titleFallback: "Choose Timer",
    blankFallback: "Blank Timer Tile",
    widgetFallback: "Timer tile",
    itemsFallback: "timers",
  },
};
const SETTINGS_NAV_ITEMS = [
  { sectionId: "settingsWifiSection", headingId: "settingsWifiHeading", labelKey: "settings.wifi.heading" },
  { sectionId: "settingsHaSection", headingId: "settingsHaHeading", labelKey: "settings.ha.heading" },
  { sectionId: "settingsXiaozhiSection", headingId: "settingsXiaozhiHeading", labelKey: "settings.xiaozhi.heading" },
  { sectionId: "settingsCamerasSection", headingId: "settingsCamerasHeading", labelKey: "settings.cameras.heading" },
  { sectionId: "settingsLocalCamSection", headingId: "settingsLocalCamHeading", labelKey: "settings.localCam.heading" },
  { sectionId: "settingsTimeSection", headingId: "settingsTimeHeading", labelKey: "settings.time.heading" },
  { sectionId: "settingsDisplaySection", headingId: "settingsDisplayHeading", labelKey: "settings.display.heading" },
  { sectionId: "settingsSdSection", headingId: "settingsSdHeading", labelKey: "settings.sd.heading" },
  { sectionId: "settingsPagesSection", headingId: "settingsPagesHeading", labelKey: "settings.pages.heading" },
  { sectionId: "settingsMqttSection", headingId: "settingsMqttHeading", labelKey: "settings.mqtt.heading" },
  { sectionId: "settingsUiSection", headingId: "settingsUiHeading", labelKey: "settings.ui.heading" },
  { sectionId: "settingsThemeSection", headingId: "settingsThemeHeading", labelKey: "settings.theme.heading" },
  { sectionId: "settingsApSection", headingId: "settingsApHeading", labelKey: "settings.ap.heading" },
  { sectionId: "settingsOtaSection", headingId: "settingsOtaHeading", labelKey: "settings.ota.heading" },
  { sectionId: "settingsSystemSection", headingId: "settingsSystemHeading", labelKey: "settings.system.heading" },
  { sectionId: "settingsBackupSection", headingId: "settingsBackupHeading", labelKey: "settings.backup.heading" },
  { sectionId: "settingsDiagnosticsSection", headingId: "settingsDiagnosticsHeading", labelKey: "settings.diagnostics.heading" },
  { sectionId: "settingsLogsSection", headingId: "settingsLogsHeading", labelKey: "settings.logs.heading" },
];
const OTA_STATUS_POLL_MS = 900;
const DEFAULT_SLIDER_ENTITY_DOMAIN = "auto";
const SLIDER_DIRECTIONS = new Set([
  "auto",
  "left_to_right",
  "right_to_left",
  "bottom_to_top",
  "top_to_bottom",
]);
const SLIDER_ENTITY_DOMAINS = new Set([
  "auto",
  "light",
  "media_player",
  "cover",
  "number",
  "input_number",
]);
const BUTTON_MODES = new Set([
  "auto",
  "play_pause",
  "stop",
  "next",
  "previous",
]);
const BUTTON_STYLES = new Set([
  "power_toggle",
  "power_status",
  "plug_icon",
  "lamp_icon",
  "highlight",
  "status_text",
]);
const DEFAULT_BUTTON_STYLE = "";
const LANGUAGE_CODE_RE = /^[a-z0-9][a-z0-9_-]{1,14}$/;
const DEFAULT_UI_LANGUAGE = "en";

const WEB_I18N_BUILTIN = {
  en: {
    "tabs.layout": "Layout",
    "tabs.settings": "Settings",
    "sidebar.title": "BETTA Editor",
    "sidebar.subtitle": "Layout source of truth: JSON",
    "layout.pages.heading": "Pages",
    "layout.pages.add": "+ Page",
    "layout.pages.add_energy": "+ Energy Page",
    "layout.pages.add_music": "+ Music Page",
    "layout.pages.add_radio": "+ Radio Page",
    "layout.pages.menu_normal": "Normal Page",
    "layout.pages.menu_energy": "Energy Page",
    "layout.pages.menu_xiaozhi": "Xiaozhi Page",
    "layout.pages.menu_music": "Music Page",
    "layout.pages.menu_radio": "Radio Page",
    "layout.pages.menu_weather": "Weather Page",
    "layout.pages.add_weather": "+ Weather Page",
    "layout.pages.weather_title": "Weather",
    "layout.pages.weather_hint": "Add the tiles you want (weather, forecast, sensors, ...). The page keeps the fixed id \"pogoda\", so it gets no tab in the panel bottom bar - the weather chip in the top bar opens it.",
    "layout.pages.weather_chip_hint": "The top-bar chip shows the entity weather.dom. Change the entity of the weather tile if you want a different one.",
    "layout.status.weather_page_added": "Weather page added. Save the layout to load it on the panel.",
    "layout.status.weather_page_exists": "The weather page already exists - opening it.",
    "layout.widgets.weather_now_title": "Weather",
    "layout.widgets.weather_forecast_title": "3-day forecast",
    "layout.widgets.weather_temp_title": "Temperature",
    "layout.widgets.weather_hum_title": "Humidity",
    "layout.pages.delete": "Delete",
    "layout.pages.confirm_delete": "Delete page \"{name}\"? This removes all of its widgets.",
    "layout.pages.title_label": "Page title",
    "layout.pages.title_placeholder": "Page name on the display",
    "layout.pages.apply_title": "Apply page title",
    "layout.pages.new_title": "Page {number}",
    "layout.pages.energy_title": "Energy",
    "layout.pages.xiaozhi_title": "Xiaozhi",
    "layout.pages.music_title": "Music",
    "layout.pages.radio_title": "Radio",
    "layout.energy.heading": "Energy Page",
    "layout.energy.hint": "Choose whether the page mirrors Home Assistant Energy or uses manual live sensors.",
    "layout.energy.source": "Data source",
    "layout.energy.source_ha": "Home Assistant Energy",
    "layout.energy.source_manual": "Manual live sensors",
    "layout.energy.source_hint_ha": "Uses the Energy dashboard configured in Home Assistant.",
    "layout.energy.source_hint_manual": "Expert fallback: use explicit W/kW sensors from Home Assistant.",
    "layout.energy.home_power": "Home power",
    "layout.energy.solar_power": "Solar power",
    "layout.energy.grid_power": "Grid power (signed)",
    "layout.energy.grid_import": "Grid import",
    "layout.energy.grid_export": "Grid export",
    "layout.energy.battery_power": "Battery power (signed)",
    "layout.energy.battery_charge": "Battery charge",
    "layout.energy.battery_discharge": "Battery discharge",
    "layout.energy.battery_soc": "Battery state of charge",
    "layout.energy.apply": "Apply energy config",
    "layout.energy.no_widgets": "Energy pages render a dedicated dashboard and do not use widgets.",
    "layout.energy.preview_title": "Energy distribution",
    "layout.energy.sensor_count_one": "{count} sensor",
    "layout.energy.sensor_count_many": "{count} sensors",
    "layout.energy.no_sensor": "no sensor",
    "layout.energy.preview_source_ha": "HA Energy",
    "layout.energy.preview_source_manual": "Live sensors",
    "layout.energy.preview_auto": "automatic from HA",
    "layout.energy.low_carbon": "Low-carbon",
    "layout.energy.grid": "Grid",
    "layout.energy.solar": "Solar",
    "layout.energy.gas": "Gas",
    "layout.energy.home": "Home",
    "layout.energy.battery": "Battery",
    "layout.energy.water": "Water",
    "layout.music.heading": "Music Assistant",
    "layout.music.hint": "Now Playing view with album art, transport, position and volume. Leave the player list empty to auto-discover media players from Home Assistant.",
    "layout.music.player_entity": "Primary player",
    "layout.music.players": "Player list (comma separated)",
    "layout.music.apply": "Apply music config",
    "layout.music.no_widgets": "Music pages render a dedicated Now Playing view and do not use widgets.",
    "layout.music.preview_title": "Now Playing",
    "layout.music.preview_subtitle": "Album art, transport, position and volume",
    "layout.radio.heading": "Internet Radio",
    "layout.radio.hint": "Full-screen station grid with now playing, volume and stop. Home Assistant plays the stream (media_player.play_media), the panel only sends the stream URL.",
    "layout.radio.player_entity": "Default player",
    "layout.radio.columns": "Columns (2-4)",
    "layout.radio.stations": "Stations",
    "layout.radio.add_station": "+ Station",
    "layout.radio.stations_hint": "Leave the list empty to use the built-in station list compiled into the firmware. Every station needs a name and an http(s) stream URL (up to 24).",
    "layout.radio.station_name": "Station name",
    "layout.radio.station_url": "Stream URL (http/https)",
    "layout.radio.station_entity": "Player override (optional)",
    "layout.radio.station_up": "Move up",
    "layout.radio.station_down": "Move down",
    "layout.radio.station_remove": "Remove station",
    "layout.radio.empty_list": "No stations yet - the built-in station list will be used.",
    "layout.radio.limit_reached": "The limit of {count} stations per page was reached.",
    "layout.radio.apply": "Apply radio config",
    "layout.radio.no_widgets": "Radio pages render a dedicated station grid and do not use widgets.",
    "layout.radio.preview_title": "Now playing",
    "layout.radio.preview_subtitle": "Station grid, volume and stop",
    "layout.radio.preview_defaults": "Built-in station list",
    "layout.radio.preview_more": "+{count} more",
    "layout.status.energy_page_only": "Energy pages do not accept widgets.",
    "layout.status.xiaozhi_page_only": "Xiaozhi pages are dedicated to the voice assistant and do not accept widgets.",
    "layout.status.xiaozhi_page_locked": "This page is managed by the Xiaozhi AI voice assistant built into the firmware. Configure it in Settings → Xiaozhi AI.",
    "layout.status.music_page_only": "Music pages do not accept widgets.",
    "layout.status.radio_page_only": "Radio pages do not accept widgets.",
    "layout.widgets.heading": "Widgets",
    "layout.widgets.add_sensor": "+ Sensor",
    "layout.widgets.add_binary": "+ Binary Sensor",
    "layout.widgets.add_binary_sensor": "+ Binary Sensor",
    "layout.widgets.add_button": "+ Button",
    "layout.widgets.add_slider": "+ Slider",
    "layout.widgets.add_graph": "+ Graph",
    "layout.widgets.add_empty_tile": "+ Empty Tile",
    "layout.widgets.add_light_tile": "+ Light Tile",
    "layout.widgets.add_heating_tile": "+ Heating Tile",
    "layout.widgets.add_weather_tile": "+ Weather",
    "layout.widgets.add_weather_3day": "+ Weather Forecast",
    "layout.widgets.add_todo": "+ Todo List",
    "layout.widgets.add_media_player": "+ Media Player",
    "layout.widgets.add_roborock": "+ Roborock",
    "layout.widgets.add_cover": "+ Cover",
    "layout.widgets.add_lock": "+ Lock",
    "layout.widgets.add_fan": "+ Fan",
    "layout.widgets.add_select": "+ Select",
    "layout.widgets.add_number": "+ Number",
    "layout.widgets.add_alarm_tile": "+ Alarm Panel",
    "layout.widgets.add_clock": "+ Clock",
    "layout.widgets.quick_setup": "Quick Setup",
    "layout.widgets.delete": "Delete Widget",
    "layout.widgets.confirm_delete": "Delete widget \"{name}\"?",
    "entity_picker.title": "Choose Light",
    "entity_picker.title_sensor": "Choose Sensor",
    "entity_picker.title_binary": "Choose Binary Sensor",
    "entity_picker.title_light": "Choose Light",
    "entity_picker.title_switch": "Choose Switch",
    "entity_picker.title_weather": "Choose Weather",
    "entity_picker.title_climate": "Choose Heating",
    "entity_picker.title_roborock": "Choose Roborock",
    "entity_picker.title_alarm": "Choose Alarm Panel",
    "entity_picker.title_scene": "Choose Scene",
    "entity_picker.title_person": "Choose Person",
    "entity_picker.title_timer": "Choose Timer",
    "entity_picker.refresh": "Refresh",
    "entity_picker.search": "Search",
    "entity_picker.close": "Close",
    "entity_picker.search_placeholder": "Search by name, entity ID, or room",
    "entity_picker.search_hint": "Type at least {count} characters to search {items}.",
    "entity_picker.search_ready": "Press Enter or Search to query {items}.",
    "entity_picker.blank": "Blank Light Tile",
    "entity_picker.blank_sensor": "Blank Sensor Tile",
    "entity_picker.blank_binary": "Blank Binary Sensor Tile",
    "entity_picker.blank_light": "Blank Light Tile",
    "entity_picker.blank_button": "Blank Button Tile",
    "entity_picker.blank_weather": "Blank Weather Tile",
    "entity_picker.blank_weather_3day": "Blank Weather Forecast Tile",
    "entity_picker.blank_graph": "Blank Graph Tile",
    "entity_picker.blank_heating": "Blank Heating Tile",
    "entity_picker.blank_roborock": "Blank Roborock Tile",
    "entity_picker.blank_alarm": "Blank Alarm Tile",
    "entity_picker.blank_scene": "Blank Scene Tile",
    "entity_picker.blank_person": "Blank Person Tile",
    "entity_picker.blank_timer": "Blank Timer Tile",
    "entity_picker.loading": "Loading lights...",
    "entity_picker.loading_items": "Loading {items}...",
    "entity_picker.refreshing": "Refreshing lights...",
    "entity_picker.refreshing_items": "Refreshing {items}...",
    "entity_picker.pending": "Waiting for Home Assistant...",
    "entity_picker.disconnected": "Home Assistant is not connected.",
    "entity_picker.empty": "No light entities found.",
    "entity_picker.empty_items": "No {items} found.",
    "entity_picker.truncated": "List truncated by firmware limit.",
    "entity_picker.unassigned_room": "No room",
    "entity_picker.added": "Light tile added: {entity}",
    "entity_picker.added_widget": "{widget} added: {entity}",
    "entity_picker.fetch_failed": "Light discovery failed: {error}",
    "entity_picker.fetch_failed_items": "{items} discovery failed: {error}",
    "entity_picker.progress": "{loaded} / {target}",
    "entity_picker.progress_total": "{loaded} / {target} of {total}",
    "entity_picker.items_light": "lights",
    "entity_picker.items_sensor": "sensors",
    "entity_picker.items_binary": "binary sensors",
    "entity_picker.items_switch": "switches",
    "entity_picker.items_weather": "weather entities",
    "entity_picker.items_climate": "climate entities",
    "entity_picker.items_vacuum": "vacuum robots",
    "entity_picker.items_alarm": "alarm panels",
    "entity_picker.items_scene": "scenes",
    "entity_picker.items_person": "people",
    "entity_picker.items_timer": "timers",
    "entity_picker.widget_light": "Light tile",
    "entity_picker.widget_sensor": "Sensor tile",
    "entity_picker.widget_binary": "Binary Sensor tile",
    "entity_picker.widget_button": "Button tile",
    "entity_picker.widget_weather": "Weather tile",
    "entity_picker.widget_weather_3day": "Weather Forecast tile",
    "entity_picker.widget_graph": "Graph tile",
    "entity_picker.widget_heating": "Heating tile",
    "entity_picker.widget_roborock": "Roborock tile",
    "entity_picker.title_cover": "Choose Cover",
    "entity_picker.title_lock": "Choose Lock",
    "entity_picker.title_fan": "Choose Fan",
    "entity_picker.title_select": "Choose Select",
    "entity_picker.blank_cover": "Blank Cover Tile",
    "entity_picker.blank_lock": "Blank Lock Tile",
    "entity_picker.blank_fan": "Blank Fan Tile",
    "entity_picker.blank_select": "Blank Select Tile",
    "entity_picker.widget_lock": "Lock tile",
    "entity_picker.widget_fan": "Fan tile",
    "entity_picker.widget_select": "Select tile",
    "entity_picker.title_number": "Choose Number",
    "entity_picker.blank_number": "Blank Number Tile",
    "entity_picker.widget_number": "Number tile",
    "entity_picker.items_number": "number entities",
    "entity_picker.items_cover": "covers",
    "entity_picker.items_lock": "locks",
    "entity_picker.items_fan": "fans",
    "entity_picker.items_select": "select entities",
    "entity_picker.widget_alarm": "Alarm tile",
    "entity_picker.widget_cover": "Cover tile",
    "entity_picker.widget_scene": "Scene tile",
    "entity_picker.widget_person": "Person tile",
    "entity_picker.widget_timer": "Timer tile",
    "layout.inspector.heading": "Inspector",
    "layout.inspector.title": "Title",
    "layout.inspector.entity": "Entity",
    "layout.inspector.secondary_entity": "Actual entity (sensor)",
    "layout.inspector.secondary_entity_roborock": "Map entity (image, optional)",
    "layout.inspector.button_mode": "Button mode",
    "layout.inspector.button_accent_color": "Button accent color",
    "layout.inspector.button_style": "Button style",
    "layout.inspector.slider_entity_domain": "Slider entity type",
    "layout.inspector.sensor_value_color": "Value color (empty = auto)",
    "layout.inspector.alarm_code": "PIN code (empty = no code)",
    "layout.inspector.alarm_ask_code": "Always ask for PIN (auto: when HA requires it)",
    "layout.inspector.alarm_backend": "Service backend",
    "layout.inspector.alarm_zone_label": "Zone caption (empty = none)",
    "layout.inspector.alarm_show_sensors": "Show open sensors on the tile",
    "layout.inspector.alarm_show_bypassed": "Show bypassed sensor count",
    "layout.inspector.alarm_force_arm": "Ask to force arm when sensors are open",
    "layout.inspector.alarm_skip_delay": "Skip exit delay (Alarmo)",
    "layout.inspector.alarm_modes": "Buttons on the tile",
    "layout.inspector.alarm_mode_away": "Arm away",
    "layout.inspector.alarm_mode_home": "Arm home",
    "layout.inspector.alarm_mode_night": "Arm night",
    "layout.inspector.alarm_mode_vacation": "Arm vacation",
    "layout.inspector.alarm_mode_custom": "Custom bypass",
    "layout.inspector.alarm_mode_disarm": "Disarm",
    "layout.inspector.clock_hint": "Clock tile: shows the current time (and optionally the date).",
    "layout.inspector.clock_show_seconds": "Show seconds",
    "layout.inspector.clock_show_date": "Show date",
    "layout.tile_look.group": "Tile look (this tile)",
    "layout.tile_look.preset": "Preset",
    "layout.tile_look.bg_color": "Background color",
    "layout.tile_look.bg_grad_color": "Gradient end color",
    "layout.tile_look.bg_grad_dir": "Gradient direction",
    "layout.tile_look.border_color": "Border color",
    "layout.tile_look.border_width": "Border width (px)",
    "layout.tile_look.radius": "Corner radius (px)",
    "layout.tile_look.corner_shape": "Corner shape",
    "layout.tile_look.corner_hint": "Square tiles become circles with the max radius.",
    "layout.tile_look.opacity": "BG opacity (%)",
    "layout.tile_look.font_scale": "Font size",
    "layout.tile_look.shadow": "Drop shadow",
    "layout.tile_look.text_color": "Text color (all)",
    "layout.tile_look.title_color": "Title color",
    "layout.tile_look.label_color": "Entity label color",
    "layout.tile_look.value_color": "Value / status color",
    "layout.tile_look.icon_color": "Icon color",
    "layout.tile_look.reset": "Reset tile look",
    "layout.tile_look.hint": "Empty fields use the theme. Colors accept #RRGGBB.",
  "layout.tile_look.copy_source": "Copy look from",
  "layout.tile_look.copy_apply": "Copy look",
  "layout.tile_look.copy_apply_page": "Apply to all tiles",
  "layout.tile_look.copy_placeholder": "Select a tile...",
  "layout.tile_look.copy_empty": "No other tiles to copy from",
  "layout.tile_look.copy_none": "Select a source tile first.",
  "layout.tile_look.copy_done": "Tile look copied from: {source}",
  "layout.tile_look.copy_page_done": "Tile look applied to {count} tile(s).",
  "layout.tile_look.copy_hint": "Copies background, border, colors and font size only - entity, title and size stay untouched.",
    "layout.page_look.heading": "Page look",
    "layout.page_look.group": "Page look (this page)",
    "layout.page_look.preset": "Preset",
    "layout.page_look.bg_color": "Background color",
    "layout.page_look.bg_grad_color": "Gradient end color",
    "layout.page_look.bg_grad_dir": "Gradient direction",
    "layout.page_look.wallpaper": "Use panel wallpaper",
    "layout.page_look.dim": "Darken wallpaper (%)",
    "layout.page_look.reset": "Reset page look",
    "layout.page_look.reset_done": "Page look reset.",
    "layout.page_look.page_theme": "Theme override for this page",
    "layout.page_look.page_theme_hint": "The page is repainted with this theme as soon as it is shown. \"Global\" follows the active / day-night theme.",
    "layout.page_look.theme_none": "- global / day-night theme -",
    "layout.page_look.hint": "Empty fields use the panel background. The wallpaper is dark-tinted on the panel.",
    "layout.option.page_preset.auto": "Panel default",
    "layout.option.page_preset.midnight": "Midnight",
    "layout.option.page_preset.deep_sea": "Deep sea",
    "layout.option.page_preset.forest": "Forest",
    "layout.option.page_preset.sunset": "Sunset",
    "layout.option.page_preset.plum": "Plum",
    "layout.option.page_preset.wallpaper": "Wallpaper",
    "layout.option.page_preset.wallpaper_dim": "Wallpaper (dark)",
    "layout.option.page_grad_dir.none": "None",
    "layout.option.page_grad_dir.hor": "Horizontal",
    "layout.option.page_grad_dir.ver": "Vertical",
    "layout.option.tile_grad_dir.none": "None",
    "layout.option.tile_grad_dir.hor": "Horizontal",
    "layout.option.tile_grad_dir.ver": "Vertical",
    "layout.option.tile_font_scale.auto": "Auto",
    "layout.option.tile_font_scale.s": "Small",
    "layout.option.tile_font_scale.m": "Medium",
    "layout.option.tile_font_scale.l": "Large",
    "layout.option.tile_font_scale.xl": "Extra large",
    "layout.option.tile_preset.auto": "Theme default",
    "layout.option.tile_preset.graphite": "Graphite",
    "layout.option.tile_preset.emerald": "Emerald",
    "layout.option.tile_preset.amber": "Amber",
    "layout.option.tile_preset.violet": "Violet",
    "layout.option.tile_preset.sky": "Sky",
    "layout.option.tile_preset.glass": "Glass",
    "layout.option.tile_corner.custom": "Custom (use radius)",
    "layout.option.tile_corner.square": "Square (0 px)",
    "layout.option.tile_corner.soft": "Soft (10 px)",
    "layout.option.tile_corner.rounded": "Rounded (16 px)",
    "layout.option.tile_corner.pill": "Pill (40 px)",
    "layout.option.tile_corner.circle": "Circle (max radius)",
    "layout.inspector.slider_direction": "Slider direction",
    "layout.inspector.slider_accent_color": "Slider accent color",
    "layout.inspector.graph_line_color": "Graph line color",
    "layout.inspector.graph_time_window_min": "Time window (minutes)",
    "layout.inspector.graph_point_count": "Render points (empty = auto)",
    "layout.inspector.graph_display_mode": "Display mode",
    "layout.inspector.graph_bar_bucket_min": "Bar interval (min)",
    "layout.inspector.binary_show_title": "Show title",
    "layout.inspector.binary_color_on": "Color when ON",
    "layout.inspector.binary_color_off": "Color when OFF",
    "layout.inspector.binary_text_on": "Text when ON",
    "layout.inspector.binary_text_off": "Text when OFF",
    "layout.option.graph_display_mode.line": "Line with points",
    "layout.option.graph_display_mode.line_smooth_points": "Smooth line with points",
    "layout.option.graph_display_mode.line_smooth": "Smooth line",
    "layout.option.graph_display_mode.bars": "Bars",
    "layout.inspector.apply": "Apply",
    "layout.option.button_mode.auto": "auto (default switch)",
    "layout.option.button_mode.play_pause": "play/pause (media_player)",
    "layout.option.button_mode.stop": "stop (media_player)",
    "layout.option.button_mode.next": "next (media_player)",
    "layout.option.button_mode.previous": "previous (media_player)",
    "layout.option.button_style.switch": "Switch (slider)",
    "layout.option.button_style.power_toggle": "Power icon (name + icon)",
    "layout.option.button_style.power_status": "Power icon + ON/OFF status text",
    "layout.option.button_style.plug_icon": "Socket/plug icon (name + icon)",
    "layout.option.button_style.lamp_icon": "Lamp/bulb icon (name + icon)",
    "layout.option.button_style.highlight": "Tile highlight (accent when ON)",
    "layout.option.button_style.status_text": "ON/OFF text only (no icon)",
    "layout.option.slider_entity_domain.auto": "auto (light, media_player, cover)",
    "layout.option.slider_entity_domain.light": "light",
    "layout.option.slider_entity_domain.media_player": "media_player",
    "layout.option.slider_entity_domain.cover": "cover",
    "layout.option.slider_entity_domain.number": "number",
    "layout.option.slider_entity_domain.input_number": "input_number",
    "layout.option.slider_direction.auto": "auto (width/height based)",
    "layout.option.slider_direction.left_to_right": "left_to_right (0% -> 100%)",
    "layout.option.slider_direction.right_to_left": "right_to_left (100% -> 0%)",
    "layout.option.slider_direction.bottom_to_top": "bottom_to_top (0% -> 100%)",
    "layout.option.slider_direction.top_to_bottom": "top_to_bottom (100% -> 0%)",
    "layout.actions.heading": "Actions",
    "layout.actions.reload": "Reload",
    "layout.actions.save": "Save",
    "layout.actions.export": "Export",
    "layout.actions.import": "Import JSON",
    "layout.actions.paste_placeholder": "Paste layout JSON here",
    "layout.canvas.title": "Canvas",
    "layout.default_page.title": "Living Room",
    "layout.status.loading": "Loading layout...",
    "layout.status.load_failed": "Layout load failed, using default: {error}",
    "layout.status.loaded": "Layout loaded",
    "layout.status.entity_fetch_failed": "Entity fetch failed: {error}",
    "layout.status.saving": "Saving layout...",
    "layout.status.saved": "Layout saved",
    "layout.status.imported": "Layout imported (not saved yet)",
    "layout.status.at_least_one_page": "At least one page is required",
    "layout.status.entity_domain_required": "Entity must use domain: {domains}",
    "layout.status.expected_domain": "the expected domain",
    "layout.status.secondary_sensor_required": "Actual entity must start with sensor.",
    "layout.status.secondary_image_required": "Map entity must start with image.",
    "layout.status.invalid_json": "Invalid layout JSON",
    "layout.status.save_failed": "Save failed: {error}",
    "layout.status.conflict_title": "Panel layout was changed elsewhere",
    "layout.status.conflict_confirm": "The layout on the panel was changed from another source (another browser tab, the API or a restore).\n\nOK = overwrite it with this editor version\nCancel = keep the panel version (reload the page to discard local edits).",
    "layout.status.conflict_overridden": "Panel changes overwritten by this editor.",
    "layout.status.import_failed": "Import failed: {error}",
    "layout.status.file_import_failed": "File import failed: {error}",
    "setup.title": "Quick Setup",
    "setup.step_ha": "HA connected",
    "setup.step_tiles": "Add tiles",
    "setup.step_save": "Save layout",
    "setup.subtitle": "Pick a few Home Assistant entities for your first dashboard.",
    "setup.page_label": "First page title",
    "setup.page_placeholder": "Living Room",
    "setup.add_light": "+ Light",
    "setup.add_heating": "+ Heating",
    "setup.add_weather": "+ Weather",
    "setup.add_button": "+ Switch",
    "setup.add_sensor": "+ Sensor",
    "setup.close": "Close",
    "setup.skip": "Skip",
    "setup.done": "Save + Done",
    "setup.save": "Save Layout",
    "setup.count_none": "No tiles added yet.",
    "setup.count_one": "1 tile on this page.",
    "setup.count_many": "{count} tiles on this page.",
    "setup.added": "Added: {title}",
    "setup.saving": "Saving layout...",
    "setup.saved": "Layout saved. The panel can use this dashboard now.",
    "setup.save_failed": "Save failed: {error}",
    "provision.wifi.title": "Wi-Fi Provisioning",
    "provision.wifi.subtitle": "Connect the panel to your Wi-Fi.",
    "provision.wifi.ssid": "SSID",
    "provision.wifi.country_code": "Country Code",
    "provision.wifi.password": "Password",
    "provision.wifi.password_placeholder": "Wi-Fi password",
    "provision.wifi.show_password": "Show password",
    "provision.ha.title": "HA Provisioning",
    "provision.ha.subtitle": "Connect the panel to Home Assistant.",
    "provision.ha.ws_url": "WebSocket URL (ws:// or wss://)",
    "provision.ha.token": "Long-lived Access Token",
    "provision.ha.show_token": "Show token",
    "settings.wifi.heading": "Wi-Fi",
    "settings.wifi.ssid": "SSID",
    "settings.wifi.country_code": "Country Code",
    "settings.wifi.bssid": "BSSID lock (optional)",
    "settings.wifi.password": "Password",
    "settings.wifi.password_placeholder": "Leave empty to keep the stored password",
    "settings.wifi.static_enabled": "Use static IP (instead of DHCP)",
    "settings.wifi.static_ip": "IP address",
    "settings.wifi.static_netmask": "Netmask",
    "settings.wifi.static_gateway": "Gateway",
    "settings.wifi.static_dns": "DNS (optional)",
    "settings.wifi.invalid_static_ip": "IP address, netmask and gateway must be valid IPv4 addresses when static IP is enabled",
    "settings.ha.heading": "Home Assistant",
    "settings.ha.ws_url": "WebSocket URL (ws:// or wss://)",
    "settings.ha.token": "Long-lived Access Token",
    "settings.ha.token_placeholder": "Leave empty to keep the stored token",
    "settings.ha.rest_fallback": "Enable HA REST fallback (Default: Off, WS-only preferred)",
    "settings.xiaozhi.heading": "Xiaozhi AI",
    "settings.xiaozhi.enabled": "Enable Xiaozhi AI voice assistant",
    "settings.xiaozhi.cloud_activation": "Cloud activation (pairing code)",
    "settings.xiaozhi.server": "WebSocket URL (ws:// or wss://)",
    "settings.xiaozhi.ota_url": "Xiaozhi Cloud OTA URL (pairing code)",
    "settings.xiaozhi.device": "Device ID (optional)",
    "settings.xiaozhi.token": "Access Token",
    "settings.cameras.heading": "Cameras",
    "settings.cameras.hint": "Configure up to 4 cameras (HA camera.* entities or HTTP snapshots).",
    "settings.cameras.add": "+ Add camera",
    "settings.cameras.name": "Name",
    "settings.cameras.source": "Source",
    "settings.cameras.source_ha": "HA entity (camera.*)",
    "settings.cameras.source_http": "HTTP snapshot URL",
    "settings.cameras.entity": "Camera entity",
    "settings.cameras.url": "Snapshot URL (http:// or https://)",
    "settings.cameras.username": "Username (optional)",
    "settings.cameras.password": "Password (optional)",
    "settings.cameras.refresh_ms": "Refresh (ms)",
    "settings.cameras.enabled": "Enabled",
    "settings.cameras.disabled": "Disabled",
    "settings.cameras.item_refresh": "Refresh: {ms} ms",
    "settings.cameras.save": "Save",
    "settings.cameras.delete": "Delete",
    "settings.cameras.none": "No cameras. Add your first camera.",
    "settings.cameras.saved": "Cameras saved.",
    "settings.cameras.load_failed": "Failed to load cameras: {error}",
    "settings.cameras.save_failed": "Save failed: {error}",
    "settings.cameras.invalid_url": "URL must start with http:// or https://",
    "settings.cameras.entity_hint": "No camera.* entities found — check the HA connection.",
    "settings.cameras.entity_loading": "Loading cameras...",
    "settings.cameras.invalid_entity": "Select a camera.* entity",
    "settings.cameras.delete_confirm": "Delete camera \"{name}\"?",
    "settings.localCam.heading": "Built-in camera",
    "settings.localCam.hint": "Built-in OV5647 MIPI-CSI camera. Changes apply immediately, no reboot needed.",
    "settings.localCam.enabled": "Camera enabled",
    "settings.localCam.stream": "Live stream to HA (MJPEG)",
    "settings.localCam.motion": "Motion detection (wake screen)",
    "settings.localCam.threshold": "Motion sensitivity (1..64, lower = more sensitive)",
    "settings.localCam.quality": "JPEG quality (10..95)",
    "settings.localCam.resolution": "Resolution",
    "settings.localCam.resolution_native": "1280x960 (native)",
    "settings.localCam.resolution_half": "640x480 (half)",
    "settings.localCam.hflip": "Flip horizontal (H)",
    "settings.localCam.vflip": "Flip vertical (V)",
    "settings.localCam.save": "Save",
    "settings.localCam.refresh_preview": "Refresh preview",
    "settings.localCam.preview_hint": "Preview works while the camera is enabled.",
    "settings.localCam.saved": "Camera settings saved.",
    "settings.localCam.save_failed": "Save failed: {error}",
    "settings.localCam.status_error": "Failed to load camera status: {error}",
    "settings.localCam.snapshot_failed": "Snapshot failed: {error}",
    "settings.localCam.motion_heading": "Motion detection",
    "settings.localCam.motion_hint": "Zones and thresholds for motion detection. Coordinates in % of frame (x, y from top-left).",
    "settings.localCam.motion_min_area": "Min. changed area (%)",
    "settings.localCam.motion_min_duration": "Min. motion duration (ms, 0 = off)",
    "settings.localCam.motion_cooldown": "Cooldown between detections (ms)",
    "settings.localCam.motion_start_delay": "Delay after camera start (ms)",
    "settings.localCam.motion_ignore_lighting": "Ignore sudden lighting changes",
    "settings.localCam.zones_hint": "Drag on the preview to draw a zone (max 4). No zones = whole frame.",
    "settings.localCam.zones_refresh": "Refresh zone preview",
    "settings.localCam.zones_clear": "Clear zones",
    "settings.localCam.zones_remove": "Remove zone",
    "settings.localCam.motion_diag": "Check detection",
    "settings.localCam.motion_level": "Level",
    "settings.localCam.motion_changed": "changed",
    "settings.localCam.motion_active": "Motion",
    "settings.localCam.motion_triggers": "triggers",
    "settings.localCam.motion_lighting": "lighting ignored",
    "settings.localCam.motion_diag_failed": "Detection check failed: {error}",
    "settings.time.heading": "Time",
    "settings.time.ntp_server": "NTP Server",
    "settings.time.timezone": "Timezone (POSIX TZ)",
    "settings.ui.heading": "UI",
    "settings.theme.heading": "Theme",
    "settings.ui.language": "Language",
    "settings.ui.reload_languages": "Reload Languages",
    "settings.ui.download_json": "Download JSON",
    "settings.ui.upload_code": "Language Code",
    "settings.ui.upload_file": "Translation JSON File",
    "settings.ui.upload_button": "Upload / Add Language",
    "settings.ap.heading": "Setup AP",
    "settings.ap.hint": "If setup AP is active, connect to it and open <code>http://192.168.4.1</code>.",
    "settings.ota.heading": "Firmware Update",
    "settings.ota.url": "OTA URL",
    "settings.ota.url_placeholder": "https://example.com/betta-ha-panel-7b.ota.bin",
    "settings.ota.flash_url": "Flash URL",
    "settings.ota.refresh": "Refresh Status",
    "settings.ota.file": "OTA .bin File",
    "settings.ota.upload": "Upload + Flash",
    "settings.ota.idle": "Ready for an OTA app image. Running: {running}, next slot: {next}, slot size: {size}.",
    "settings.ota.running": "OTA running: {progress}% ({written} / {total})",
    "settings.ota.downloading": "Downloading from URL: {progress}% ({written} / {total})",
    "settings.ota.uploading": "Upload received by panel: {progress}% ({written} / {total})",
    "settings.ota.success": "OTA image written. Rebooting now.",
    "settings.ota.error": "OTA failed: {error}",
    "settings.ota.rebooting": "Device is rebooting. Reopen the panel after it is back online.",
    "settings.ota.no_file": "Choose an OTA .bin file first.",
    "settings.ota.no_url": "Paste an OTA URL first.",
    "settings.ota.starting_url": "Starting OTA from URL...",
    "settings.ota.upload_progress": "Uploading to panel: {progress}% ({written} / {total})",
    "settings.ota.request_failed": "OTA request failed: {error}",
    "settings.ota.target_slot": "Target slot: {partition}",
    "settings.system.heading": "System",
    "settings.system.auto_restart_enabled": "Auto-restart the panel periodically",
    "settings.system.auto_restart_hours": "Restart every (hours)",
    "settings.system.hint": "When enabled, the panel reboots automatically after the configured number of hours (1-168).",
    "settings.backup.heading": "Backup / Restore",
    "settings.backup.hint": "The backup file contains the layout, the public settings and all custom themes. Wi-Fi credentials, the HA token, the MQTT password and the wallpaper image are deliberately NOT included.",
    "settings.backup.download": "Download backup",
    "settings.backup.file": "Backup file to restore",
    "settings.backup.restore": "Restore backup",
    "settings.backup.choose_file": "Choose a backup JSON file first.",
    "settings.backup.downloading": "Downloading backup...",
    "settings.backup.downloaded": "Backup downloaded.",
    "settings.backup.download_failed": "Backup download failed: {error}",
    "settings.backup.restoring": "Restoring backup...",
    "settings.backup.restore_failed": "Restore failed: {error}",
    "settings.backup.restored": "Backup restored: layout {layout}, settings {settings}, themes {themes}.",
    "settings.backup.restart_hint": "Connection settings changed - restart the panel to apply them.",
    "settings.diagnostics.heading": "Diagnostics",
    "settings.diagnostics.refresh": "Refresh",
    "settings.diagnostics.auto_refresh": "Auto-refresh (10 s)",
    "settings.diagnostics.loading": "Reading diagnostics...",
    "settings.diagnostics.updated": "Updated {time}",
    "settings.diagnostics.empty": "No data.",
    "settings.diagnostics.fetch_failed": "Could not read diagnostics: {error}",
    "settings.diagnostics.yes": "yes",
    "settings.diagnostics.no": "no",
    "settings.diagnostics.uptime": "Uptime",
    "settings.diagnostics.reset_reason": "Reset reason",
    "settings.diagnostics.boot_count": "Boot count",
    "settings.diagnostics.cpu_temp": "CPU temperature",
    "settings.diagnostics.version": "Firmware version",
    "settings.diagnostics.project": "Build project",
    "settings.diagnostics.idf": "ESP-IDF",
    "settings.diagnostics.build_date": "Built",
    "settings.diagnostics.panel": "Chip",
    "settings.diagnostics.screen": "Screen",
    "settings.diagnostics.heap_free": "Heap free",
    "settings.diagnostics.heap_min": "Heap low watermark",
    "settings.diagnostics.heap_largest": "Largest free block",
    "settings.diagnostics.heap_fragmentation": "Fragmentation",
    "settings.diagnostics.heap_dma": "Internal DMA free / largest",
    "settings.diagnostics.heap_blocks": "Heap blocks used / free",
    "settings.diagnostics.iram_free": "IRAM free",
    "settings.diagnostics.psram_free": "PSRAM free",
    "settings.diagnostics.connected": "Connected",
    "settings.diagnostics.ssid": "SSID",
    "settings.diagnostics.ip": "IP address",
    "settings.diagnostics.rssi": "RSSI",
    "settings.diagnostics.channel": "Channel",
    "settings.diagnostics.wifi_drops": "Wi-Fi disconnects",
    "settings.diagnostics.wifi_reconnects": "Reconnect attempts",
    "settings.diagnostics.wifi_recoveries": "Driver recoveries",
    "settings.diagnostics.wifi_last_drop": "Last disconnect",
    "settings.diagnostics.wifi_session": "Previous session",
    "settings.diagnostics.sync_done": "Initial sync done",
    "settings.diagnostics.base_url": "HA REST URL",
    "settings.diagnostics.cert_cn": "TLS common name",
    "settings.diagnostics.ws_connects": "WS connects",
    "settings.diagnostics.ws_disconnects": "WS disconnects",
    "settings.diagnostics.ws_recoveries": "HA recoveries",
    "settings.diagnostics.ws_last_session": "Last WS session",
    "settings.diagnostics.missing_entities": "Missing entities",
    "settings.diagnostics.mqtt_enabled": "MQTT enabled",
    "settings.diagnostics.mqtt_tls": "MQTT TLS",
    "settings.diagnostics.broker": "Broker",
    "settings.diagnostics.running_partition": "Running partition",
    "settings.diagnostics.next_partition": "Next update slot",
    "settings.diagnostics.image_state": "Image state",
    "settings.diagnostics.rollback_enabled": "Rollback enabled",
    "settings.diagnostics.boot_confirmed": "Image confirmed",
    "settings.diagnostics.card_status": "Status",
    "settings.diagnostics.card_firmware": "Firmware",
    "settings.diagnostics.card_memory": "Memory",
    "settings.diagnostics.card_wifi": "Wi-Fi",
    "settings.diagnostics.card_ha": "Home Assistant",
    "settings.diagnostics.card_mqtt": "MQTT",
    "settings.diagnostics.card_ota": "OTA / rollback",
    "settings.diagnostics.ota_state.new": "new (not booted yet)",
    "settings.diagnostics.ota_state.pending_verify": "pending verification",
    "settings.diagnostics.ota_state.valid": "valid",
    "settings.diagnostics.ota_state.invalid": "invalid",
    "settings.diagnostics.ota_state.aborted": "aborted",
    "settings.diagnostics.ota_state.undefined": "not tracked (bootloader without rollback)",
    "settings.diagnostics.bootloader_note": "The firmware supports rollback, but the bootloader on the panel does not track image state yet. Flash the bootloader once over USB (idf.py flash) to arm automatic rollback after a failed update.",
    "settings.actions.heading": "Settings Actions",
    "settings.actions.reload": "Reload Settings",
    "settings.actions.save": "Save + Reboot",
    "settings.actions.hint": "After save, the device reboots and may switch from setup AP to your home Wi-Fi.",
    "settings.logs.heading": "Logs",
    "settings.logs.refresh": "Refresh",
    "settings.logs.pause": "Pause",
    "settings.logs.resume": "Resume",
    "settings.logs.clear": "Clear",
    "settings.logs.auto_scroll": "Auto-scroll",
    "settings.logs.download": "Download log",
    "settings.logs.loading": "Loading logs...",
    "settings.logs.empty": "No log entries yet. Errors, warnings and crash markers will appear here.",
    "settings.logs.updated": "Updated {time}",
    "settings.logs.fetch_failed": "Could not read logs: {error}",
    "settings.logs.cleared": "Log file cleared.",
    "settings.logs.clear_failed": "Could not clear logs: {error}",
    "settings.logs.log_level": "Log level",
    "settings.logs.log_level_apply": "Apply log level",
    "settings.logs.log_level_hint": "Current device level: {level}",
    "settings.logs.log_level_unknown": "Device level {level} is outside the selectable range (0-5).",
    "settings.logs.log_level_applied": "Log level saved.",
    "settings.logs.log_level_0": "Off",
    "settings.logs.log_level_1": "Errors only",
    "settings.logs.log_level_2": "Warnings and errors",
    "settings.logs.log_level_3": "Info",
    "settings.logs.log_level_4": "Debug",
    "settings.logs.log_level_5": "Verbose (capture everything)",
    "settings.info.configured": "Configured",
    "settings.info.connected": "Connected",
    "settings.info.password_stored": "Password stored",
    "settings.info.country": "Country",
    "settings.info.rssi": "RSSI (connected AP)",
    "settings.info.connected_bssid": "Connected BSSID",
    "settings.info.channel": "Channel",
    "settings.info.token_stored": "Token stored",
    "settings.info.rest_fallback": "REST fallback",
    "common.yes": "yes",
    "common.no": "no",
    "common.scan": "Scan",
    "common.scan_wifi": "Scan Wi-Fi",
    "common.save_reboot": "Save + Reboot",
    "status.idle": "Idle",
    "status.loading_settings": "Loading settings...",
    "status.settings_loaded": "Settings loaded",
    "status.settings_load_failed": "Settings load failed: {error}",
    "status.settings_save_failed": "Settings save failed: {error}",
    "ha_diagnostics.missing_title": "Some entities in this layout were not found in Home Assistant",
    "ha_diagnostics.missing_title_more": "Some entities in this layout were not found in Home Assistant ({total} total, showing {listed})",
    "ha_diagnostics.missing_hint": "Open the affected widget, pick a valid entity and save the layout.",
    "ha_diagnostics.dismiss": "Dismiss",
    "status.saving_settings": "Saving settings...",
    "status.settings_saved_reboot": "Settings saved. Device reboots in ~2s. Reconnect and reopen the panel URL.",
    "status.wifi_scan_running": "Scanning Wi-Fi...",
    "status.wifi_scan_complete": "Wi-Fi scan complete ({count} networks)",
    "status.wifi_scan_failed": "Wi-Fi scan failed: {error}",
    "status.wifi_scan_timeout": "Wi-Fi scan request timed out",
    "common.unknown_error": "Unknown error",
    "wifi.scan_unavailable": "Wi-Fi scan is unavailable in setup AP mode on this hardware. Enter SSID manually.",
    "wifi.scan_click": "Click \"Scan Wi-Fi\" to list nearby networks.",
    "wifi.scan_click_short": "Click \"Scan\" to list nearby networks.",
    "wifi.scan_no_networks": "No networks found. Move closer to your router and scan again.",
    "wifi.scan_found": "{count} network(s) found. Select one to fill SSID.",
    "wifi.scan.connected_tag": "connected",
    "wifi.scan.option_unavailable": "Scan unavailable",
    "wifi.scan.option_scanning": "Scanning...",
    "wifi.scan.option_not_run": "No scan yet",
    "wifi.scan.option_no_networks": "No networks found",
    "wifi.scan.option_select": "Select network ({count} found)",
    "settings.time.info": "Applied after reboot. Time sync starts when Wi-Fi is connected.",
    "settings.display.heading": "Display / Screensaver",
    "settings.display.info": "Brightness and colors apply immediately. Wallpaper upload is stored on the device.",
    "settings.display.brightness": "Brightness (%)",
    "settings.display.screensaver_enabled": "Screensaver",
    "settings.display.screensaver_timeout": "Screensaver timeout (sec)",
    "settings.display.saver_brightness": "Screensaver brightness (%)",
    "settings.display.saver_wallpaper_dim": "Screensaver wallpaper dimming (%)",
    "settings.display.saver_wallpaper_dim_hint": "Darkens the picture behind the clock. 0 keeps the image as uploaded.",
    "settings.display.screen_off_enabled": "Turn off screen",
    "settings.display.screen_off_timeout": "Screen off timeout (sec)",
    "settings.display.clock_format": "Clock format",
    "settings.display.clock_format_h24": "24-hour (European, 23:00)",
    "settings.display.clock_format_h12": "12-hour (AM/PM, 11:00 PM)",
    "settings.display.clock_format_hint": "The 12-hour format shows an AM/PM marker on the screensaver clock and next to the top bar clock.",
    "settings.display.clock_style": "Clock style",
    "settings.display.clock_style_classic": "Classic",
    "settings.display.clock_style_flip": "Flip cards",
    "settings.display.clock_style_hint": "Flip cards animate on every change but show HH:MM only (no seconds).",
    "settings.display.show_seconds": "Show seconds",
    "settings.display.show_date": "Show date",
    "settings.display.clock_color": "Clock color",
    "settings.display.date_color": "Date color",
    "settings.display.night_mode_enabled": "Night schedule (dim / switch off at night)",
    "settings.display.night_start": "Night start",
    "settings.display.night_end": "Night end",
    "settings.display.night_brightness": "Night brightness (%, 0 = screen off)",
    "settings.display.night_wake": "Touch wake inside the night window (sec)",
    "settings.display.night_hint": "Inside the night window the panel forces the night brightness (0% switches the screen off). Touching the screen wakes it up for the configured number of seconds. Requires a synced clock.",
    "settings.display.night_currently_active": "Night mode is active right now.",
    "settings.display.theme_auto_enabled": "Match the theme to the time of day",
    "settings.display.theme_day": "Day theme",
    "settings.display.theme_night": "Night theme",
    "settings.display.theme_auto_none": "- global theme -",
    "settings.display.theme_auto_hint": "Outside the night window the day theme is painted, inside it the night theme. The window comes from the night start/end times below and works even when the night brightness schedule is off. A page that sets page_theme in the layout still overrides both. Requires a synced clock.",
    "settings.display.wallpaper": "Wallpaper",
    "settings.display.wallpaper_hint": "The image is scaled and converted to RGB565 in the browser, then sent to the panel.",
    "settings.display.upload_wallpaper": "Upload wallpaper",
    "settings.display.remove_wallpaper": "Remove wallpaper",
    "settings.display.apply": "Apply now (no reboot)",
    "settings.display.press_fx": "Tap feedback (visual reaction while a tile is held)",
    "settings.display.press_fx_dim": "Dim (%)",
    "settings.display.press_fx_scale": "Shrink (% of size)",
    "settings.display.press_fx_none": "None",
    "settings.display.press_fx_dim_mode": "Dim",
    "settings.display.press_fx_scale_mode": "Shrink",
    "settings.display.press_fx_both": "Dim + shrink",
    "settings.display.press_fx_hint": "Applies to tiles that react to a tap on the whole tile (switch, button, heating). Hold the sample below to preview.",
    "settings.display.press_fx_preview": "Tile",
    "settings.display.value_anim": "Value animation (when a tile value changes)",
    "settings.display.value_anim_ms": "Duration (ms)",
    "settings.display.value_anim_none": "None",
    "settings.display.value_anim_fade": "Fade in",
    "settings.display.value_anim_slide": "Slide in",
    "settings.display.value_anim_count": "Counting digits",
    "settings.display.value_anim_preview": "Preview",
    "settings.display.value_anim_hint": "Animates values that change by themselves (sensors, weather, power). Counting digits keeps the unit in place and works with values like \"22.5 °C\". 0 ms turns the effect off.",
    "settings.display.topbar": "Top bar",
    "settings.display.topbar_show_clock": "Clock",
    "settings.display.topbar_show_date": "Date",
    "settings.display.topbar_show_gear": "Settings icon",
    "settings.display.topbar_show_status": "Wi-Fi / HA icons",
    "settings.display.topbar_icon_text": "Text instead of logos",
    "settings.display.topbar_custom_colors": "Own colours",
    "settings.display.topbar_bg_color": "Bar background",
    "settings.display.topbar_clock_color": "Clock colour",
    "settings.display.topbar_date_color": "Date colour",
    "settings.display.topbar_gear_color": "Settings icon colour",
    "settings.display.topbar_ha_color": "Home Assistant colour",
    "settings.display.topbar_wifi_color": "Wi-Fi colour",
    "settings.display.topbar_hint": "The clock is centred in the space that is left over and its font shrinks automatically, so the elements never overlap. \"Text instead of logos\" replaces the Wi-Fi / Home Assistant / gear glyphs with words.",
    "settings.display.topbar_color_hint": "With \"Own colours\" switched off the top bar follows the active theme.",
    "settings.display.navbar": "Bottom bar (page tabs)",
    "settings.display.nav_custom_colors": "Own colours",
    "settings.display.nav_bar_bg_color": "Bar background",
    "settings.display.nav_bar_border_color": "Bar top border",
    "settings.display.nav_button_bg_color": "Tab background",
    "settings.display.nav_button_border_color": "Tab border",
    "settings.display.nav_tab_idle_color": "Page title colour",
    "settings.display.nav_tab_active_color": "Active page title colour",
    "settings.display.nav_home_idle_color": "Home icon colour",
    "settings.display.nav_home_active_color": "Active home icon colour",
    "settings.display.nav_hint": "The bottom bar shows the home button and one tab per page. Tab titles are shortened with \"...\" when a page name is too long.",
    "settings.display.nav_color_hint": "With \"Own colours\" switched off the bottom bar follows the active theme.",
    "settings.display.applied": "Display settings applied.",
    "settings.display.no_wallpaper_file": "Choose an image file first.",
    "settings.display.converting": "Converting image...",
    "settings.display.convert_failed": "Image conversion failed.",
    "settings.display.uploading": "Uploading wallpaper...",
    "settings.display.wallpaper_uploaded": "Wallpaper uploaded.",
    "settings.display.removing": "Removing wallpaper...",
    "settings.display.wallpaper_removed": "Wallpaper removed.",
    "settings.sd.heading": "microSD card",
    "settings.sd.enabled": "Enable microSD card (TF slot)",
    "settings.sd.refresh": "Refresh",
    "settings.sd.export_logs": "Export logs to card",
    "settings.sd.format": "Format card",
    "settings.sd.format_confirm": "Format the microSD card? Every file on it will be erased.",
    "settings.sd.up": "Up",
    "settings.sd.root": "Card root",
    "settings.sd.logs": "Logs folder",
    "settings.sd.photos": "Photos folder",
    "settings.sd.unsupported": "This board has no microSD socket.",
    "settings.sd.disabled": "microSD support is disabled. Tick the box to mount the card at boot.",
    "settings.sd.no_card": "No card detected in the slot. Insert it and press Refresh - the panel also picks it up on its own while it runs.",
    "settings.sd.no_filesystem": "Card {name} detected, but it carries no FAT filesystem the panel can read. Press \"Format\" to prepare it - this erases the card.",
    "settings.sd.exfat": "Card {name} is formatted as exFAT, which the panel cannot read. Press \"Format\" to convert it to FAT32 - this erases the card.",
    "settings.sd.ntfs": "Card {name} is formatted as NTFS, which the panel cannot read. Press \"Format\" to convert it to FAT32 - this erases the card.",
    "settings.sd.mounted": "Card: {name} - {total} MB total, {free} MB free",
    "settings.sd.empty": "This folder is empty.",
    "settings.sd.loading": "Reading the card...",
    "settings.sd.delete": "Delete",
    "settings.sd.delete_confirm": "Delete {name} from the card?",
    "settings.sd.deleted": "File deleted.",
    "settings.sd.delete_failed": "Could not delete this item.",
    "settings.sd.use_wallpaper": "Use as wallpaper",
    "settings.sd.wallpaper_failed": "Could not convert this image into a wallpaper.",
    "settings.sd.wallpaper_ok": "Image from the card is now the wallpaper.",
    "settings.sd.wallpaper_sd": "Screensaver picture: stored on this microSD card (the panel keeps a single copy and moves it to internal flash when the card is removed).",
    "settings.sd.wallpaper_flash": "Screensaver picture: stored in internal flash (it moves onto the card as soon as one is mounted).",
    "settings.sd.wallpaper_none": "Screensaver picture: none yet - upload one in Display settings.",
    "settings.sd.exporting": "Exporting logs...",
    "settings.sd.exported": "Logs exported to {path}",
    "settings.sd.export_failed": "Log export failed.",
    "settings.sd.formatting": "Formatting...",
    "settings.sd.formatted": "Card formatted.",
    "settings.sd.format_failed": "Format failed.",
    "settings.sd.type_dir": "Folder",
    "settings.sd.status_enabled": "microSD support enabled.",
    "settings.sd.status_disabled": "microSD support disabled.",
    "settings.sd.apply_failed": "Could not apply the microSD setting.",
    "settings.pages.heading": "Pages / Page transition",
    "settings.pages.transition": "Page transition",
    "settings.pages.transition_ms": "Transition duration (ms)",
    "settings.pages.transition_hint": "Animation played when the panel switches pages. 0 ms disables the selected effect.",
    "settings.pages.option_none": "None (instant)",
    "settings.pages.option_fade": "Fade",
    "settings.pages.option_slide": "Slide (left/right)",
    "settings.pages.option_slide_up": "Slide (up/down)",
    "settings.pages.option_fade_slide": "Fade + slide",
    "settings.pages.target": "Show page on panel",
    "settings.pages.reload": "Reload page list",
    "settings.pages.show": "Show now",
    "settings.pages.activated": "Page \"{page}\" is now shown on the panel.",
    "settings.pages.current": "Page currently shown: {page}",
    "settings.pages.apply": "Apply now (no reboot)",
    "settings.pages.applied": "Page transition settings applied.",
    "settings.mqtt.heading": "MQTT / Home Assistant",
    "settings.mqtt.enabled": "Enable MQTT (auto-discovered as a device in Home Assistant)",
    "settings.mqtt.use_tls": "Encrypt the connection (TLS, mqtts / port 8883)",
    "settings.mqtt.tls_hint": "TLS verifies the broker certificate against the ESP trust bundle. The port switches to 8883 automatically when the field still holds 1883.",
    "settings.mqtt.reapply_hint": "Click \"Apply MQTT\" to push the change to the panel.",
    "settings.mqtt.host": "Broker host (empty = derive from HA URL)",
    "settings.mqtt.port": "Broker port",
    "settings.mqtt.username": "Username",
    "settings.mqtt.password": "Password",
    "settings.mqtt.discovery_prefix": "Discovery prefix",
    "settings.mqtt.info": "The panel appears as a device in Home Assistant via MQTT discovery. Changes apply without reboot.",
    "settings.mqtt.apply": "Apply MQTT (no reboot)",
    "settings.mqtt.applied": "MQTT settings applied.",
    "settings.ui.info": "Preview switches immediately. Saved language applies after reboot.",
    "settings.ap.active": "Setup AP active: {ssid}\\nOpen http://192.168.4.1 while connected to this AP.",
    "settings.ap.inactive": "Setup AP inactive.\\nUse the panel IP in your home Wi-Fi network.",
    "settings.translation.info": "Upload a JSON file to add or update a language.",
    "settings.translation.upload_ok": "Language \"{lang}\" uploaded.",
    "settings.translation.upload_fail": "Upload failed: {error}",
    "settings.translation.no_file": "Choose a JSON file first.",
    "settings.translation.invalid_json": "Invalid JSON",
    "settings.translation.object_required": "JSON must be an object",
    "settings.translation.invalid_code": "Language code must use [a-z0-9_-] and be 2-15 chars.",
    "settings.language.invalid_country": "Wi-Fi country code must be a 2-letter ISO code (e.g. US, DE)",
    "settings.language.invalid_bssid": "BSSID must be empty or in format AA:BB:CC:DD:EE:FF",
    "settings.language.invalid_ha_url": "HA URL must start with ws:// or wss://",
    "settings.language.invalid_xiaozhi_url": "Xiaozhi URL must start with ws:// or wss://",
    "settings.language.invalid_ota_url": "Xiaozhi OTA URL must start with http:// or https://",
    "provision.wifi.required_ssid": "SSID is required.",
    "provision.wifi.required_country": "Country code must be 2 letters (e.g. US, DE).",
    "provision.ha.required_url": "WebSocket URL is required.",
    "provision.ha.invalid_url": "HA URL must start with ws:// or wss://.",
    "provision.ha.required_token": "Long-lived Access Token is required.",
    "provision.saving_reboot": "Saving settings and rebooting...",
    "provision.saved_reboot": "Settings saved. Device reboots in ~2s.",
    "provision.save_failed": "Save failed: {error}",
    "provision.wifi.hint": "Save reboots the panel. After reboot, HA provisioning is shown.",
    "provision.ha.hint": "Save reboots the panel. After reboot, the editor is unlocked.",
    "settings.language.option_de": "Deutsch",
    "settings.language.option_en": "English",
    "settings.language.option_es": "Espanol",
    "settings.language.option_fr": "Francais",
    "settings.language.option_pl": "Polski",
    "layout.widgets.presence_home": "Home",
    "layout.widgets.presence_away": "Away",
    "layout.music.preview_auto": "Auto-discover",
    "layout.pages.rename": "Rename",
  },
  de: {
    "tabs.layout": "Layout",
    "tabs.settings": "Einstellungen",
    "sidebar.title": "BETTA Editor",
    "sidebar.subtitle": "Layout Quelle: JSON",
    "layout.pages.heading": "Seiten",
    "layout.pages.add": "+ Seite",
    "layout.pages.add_energy": "+ Energie-Seite",
    "layout.pages.add_music": "+ Musik-Seite",
    "layout.pages.add_radio": "+ Radio-Seite",
    "layout.pages.menu_normal": "Normale Seite",
    "layout.pages.menu_energy": "Energie-Seite",
    "layout.pages.menu_xiaozhi": "Xiaozhi-Seite",
    "layout.pages.menu_music": "Musik-Seite",
    "layout.pages.menu_radio": "Radio-Seite",
    "layout.pages.menu_weather": "Wetter-Seite",
    "layout.pages.add_weather": "+ Wetter-Seite",
    "layout.pages.weather_title": "Wetter",
    "layout.pages.weather_hint": "Fuege die gewuenschten Kacheln hinzu (Wetter, Vorhersage, Sensoren, ...). Die Seite behaelt die feste Id \"pogoda\" und bekommt daher keinen Tab in der unteren Leiste - die Wetter-Schaltflaeche im oberen Balken oeffnet sie.",
    "layout.pages.weather_chip_hint": "Die Schaltflaeche im oberen Balken zeigt die Entitaet weather.dom. Aendere die Entitaet der Wetterkachel, wenn du eine andere willst.",
    "layout.status.weather_page_added": "Wetter-Seite hinzugefuegt. Layout speichern, um sie auf das Panel zu laden.",
    "layout.status.weather_page_exists": "Die Wetter-Seite existiert bereits - sie wird geoeffnet.",
    "layout.widgets.weather_now_title": "Wetter",
    "layout.widgets.weather_forecast_title": "3-Tage-Vorhersage",
    "layout.widgets.weather_temp_title": "Temperatur",
    "layout.widgets.weather_hum_title": "Luftfeuchte",
    "layout.pages.delete": "Loeschen",
    "layout.pages.confirm_delete": "Seite \"{name}\" wirklich loeschen? Alle zugehoerigen Widgets werden entfernt.",
    "layout.pages.title_label": "Seitentitel",
    "layout.pages.title_placeholder": "Seitenname auf dem Display",
    "layout.pages.apply_title": "Seitentitel uebernehmen",
    "layout.pages.new_title": "Seite {number}",
    "layout.pages.energy_title": "Energie",
    "layout.pages.xiaozhi_title": "Xiaozhi",
    "layout.pages.music_title": "Musik",
    "layout.pages.radio_title": "Radio",
    "layout.energy.heading": "Energie-Seite",
    "layout.energy.hint": "Waehle, ob die Seite Home Assistant Energy spiegelt oder manuelle Live-Sensoren nutzt.",
    "layout.energy.source": "Datenquelle",
    "layout.energy.source_ha": "Home Assistant Energy",
    "layout.energy.source_manual": "Manuelle Live-Sensoren",
    "layout.energy.source_hint_ha": "Verwendet das in Home Assistant konfigurierte Energy Dashboard.",
    "layout.energy.source_hint_manual": "Expert-Fallback: explizite W/kW-Sensoren aus Home Assistant nutzen.",
    "layout.energy.home_power": "Hausleistung",
    "layout.energy.solar_power": "Solarleistung",
    "layout.energy.grid_power": "Netzleistung (signed)",
    "layout.energy.grid_import": "Netzbezug",
    "layout.energy.grid_export": "Netzeinspeisung",
    "layout.energy.battery_power": "Batterieleistung (signed)",
    "layout.energy.battery_charge": "Batterie laden",
    "layout.energy.battery_discharge": "Batterie entladen",
    "layout.energy.battery_soc": "Batterieladestand",
    "layout.energy.apply": "Energie-Konfig uebernehmen",
    "layout.energy.no_widgets": "Energie-Seiten rendern ein eigenes Dashboard und verwenden keine Widgets.",
    "layout.energy.preview_title": "Energieverteilung",
    "layout.energy.sensor_count_one": "{count} Sensor",
    "layout.energy.sensor_count_many": "{count} Sensoren",
    "layout.energy.no_sensor": "kein Sensor",
    "layout.energy.preview_source_ha": "HA Energy",
    "layout.energy.preview_source_manual": "Live-Sensoren",
    "layout.energy.preview_auto": "automatisch aus HA",
    "layout.energy.low_carbon": "Low-carbon",
    "layout.energy.grid": "Netz",
    "layout.energy.solar": "Solar",
    "layout.energy.gas": "Gas",
    "layout.energy.home": "Haus",
    "layout.energy.battery": "Batterie",
    "layout.energy.water": "Wasser",
    "layout.music.heading": "Music Assistant",
    "layout.music.hint": "Now-Playing-Ansicht mit Cover, Transport, Position und Lautstaerke. Lasse die Player-Liste leer, um Media-Player automatisch aus Home Assistant zu erkennen.",
    "layout.music.player_entity": "Primaerer Player",
    "layout.music.players": "Player-Liste (Komma getrennt)",
    "layout.music.apply": "Musik-Konfiguration anwenden",
    "layout.music.no_widgets": "Musik-Seiten rendern eine eigene Now-Playing-Ansicht und nutzen keine Widgets.",
    "layout.music.preview_title": "Jetzt laeuft",
    "layout.music.preview_subtitle": "Cover, Transport, Position und Lautstaerke",
    "layout.status.radio_page_only": "Radio-Seiten akzeptieren keine Widgets.",
    "layout.radio.heading": "Internetradio",
    "layout.radio.hint": "Vollbild-Stationenraster mit Now-Playing, Lautstaerke und Stopp. Home Assistant spielt den Stream (media_player.play_media), das Panel sendet nur die Stream-URL.",
    "layout.radio.player_entity": "Standard-Player",
    "layout.radio.columns": "Spalten (2-4)",
    "layout.radio.stations": "Sender",
    "layout.radio.add_station": "+ Sender",
    "layout.radio.stations_hint": "Leer lassen, um die im Firmware eingebaute Senderliste zu verwenden. Jeder Sender braucht Namen und http(s)-Stream-URL (maximal 24).",
    "layout.radio.station_name": "Sendername",
    "layout.radio.station_url": "Stream-URL (http/https)",
    "layout.radio.station_entity": "Player-Ueberschreibung (optional)",
    "layout.radio.station_up": "Nach oben",
    "layout.radio.station_down": "Nach unten",
    "layout.radio.station_remove": "Sender entfernen",
    "layout.radio.empty_list": "Noch keine Sender - die eingebaute Senderliste wird verwendet.",
    "layout.radio.limit_reached": "Das Limit von {count} Sendern pro Seite ist erreicht.",
    "layout.radio.apply": "Radio-Konfiguration anwenden",
    "layout.radio.no_widgets": "Radio-Seiten rendern ein eigenes Senderraster und nutzen keine Widgets.",
    "layout.radio.preview_title": "Jetzt laeuft",
    "layout.radio.preview_subtitle": "Senderraster, Lautstaerke und Stopp",
    "layout.radio.preview_defaults": "Eingebaute Senderliste",
    "layout.radio.preview_more": "+{count} weitere",
    "layout.status.energy_page_only": "Energie-Seiten akzeptieren keine Widgets.",
    "layout.status.xiaozhi_page_only": "Xiaozhi-Seiten sind dem Sprachassistenten vorbehalten und akzeptieren keine Widgets.",
    "layout.status.xiaozhi_page_locked": "Diese Seite wird vom integrierten Xiaozhi-KI-Sprachassistenten verwaltet. Konfiguration unter Einstellungen → Xiaozhi-KI.",
    "layout.status.music_page_only": "Musik-Seiten akzeptieren keine Widgets.",
    "layout.widgets.heading": "Widgets",
    "layout.widgets.add_sensor": "+ Sensor",
    "layout.widgets.add_binary": "+ Binaer-Sensor",
    "layout.widgets.add_button": "+ Button",
    "layout.widgets.add_slider": "+ Slider",
    "layout.widgets.add_graph": "+ Graph",
    "layout.widgets.add_empty_tile": "+ Empty Tile",
    "layout.widgets.add_light_tile": "+ Light Tile",
    "layout.widgets.add_heating_tile": "+ Heating Tile",
    "layout.widgets.add_weather_tile": "+ Weather",
    "layout.widgets.add_weather_3day": "+ Wetter Vorhersage",
    "layout.widgets.add_todo": "+ Todo Liste",
    "layout.widgets.add_media_player": "+ Media Player",
    "layout.widgets.add_roborock": "+ Roborock",
    "layout.widgets.quick_setup": "Quick Setup",
    "layout.widgets.delete": "Widget loeschen",
    "layout.widgets.confirm_delete": "Widget \"{name}\" wirklich loeschen?",
    "entity_picker.title": "Licht auswaehlen",
    "entity_picker.title_sensor": "Sensor auswaehlen",
    "entity_picker.title_binary": "Binaer-Sensor auswaehlen",
    "entity_picker.title_light": "Licht auswaehlen",
    "entity_picker.title_switch": "Schalter auswaehlen",
    "entity_picker.title_weather": "Wetter auswaehlen",
    "entity_picker.title_climate": "Heizung auswaehlen",
    "entity_picker.title_roborock": "Roborock auswaehlen",
    "entity_picker.refresh": "Aktualisieren",
    "entity_picker.search": "Suchen",
    "entity_picker.close": "Schliessen",
    "entity_picker.search_placeholder": "Nach Name, Entitaet oder Raum suchen",
    "entity_picker.search_hint": "Mindestens {count} Zeichen eingeben, um {items} zu suchen.",
    "entity_picker.search_ready": "Enter druecken oder Suchen klicken, um {items} abzufragen.",
    "entity_picker.blank": "Leere Lichtkachel",
    "entity_picker.blank_sensor": "Leere Sensorkachel",
    "entity_picker.blank_binary": "Leere Binaer-Sensor-Kachel",
    "entity_picker.blank_light": "Leere Lichtkachel",
    "entity_picker.blank_button": "Leere Button-Kachel",
    "entity_picker.blank_weather": "Leere Wetterkachel",
    "entity_picker.blank_weather_3day": "Leere Wetter-Vorhersage-Kachel",
    "entity_picker.blank_graph": "Leere Graph-Kachel",
    "entity_picker.blank_heating": "Leere Heizungskachel",
    "entity_picker.blank_roborock": "Leere Roborock-Kachel",
    "entity_picker.loading": "Lichter werden geladen...",
    "entity_picker.loading_items": "{items} werden geladen...",
    "entity_picker.refreshing": "Lichter werden aktualisiert...",
    "entity_picker.refreshing_items": "{items} werden aktualisiert...",
    "entity_picker.pending": "Warte auf Home Assistant...",
    "entity_picker.disconnected": "Home Assistant ist nicht verbunden.",
    "entity_picker.empty": "Keine Licht-Entitaeten gefunden.",
    "entity_picker.empty_items": "Keine {items} gefunden.",
    "entity_picker.truncated": "Liste durch Firmware-Limit gekuerzt.",
    "entity_picker.unassigned_room": "Kein Raum",
    "entity_picker.added": "Lichtkachel hinzugefuegt: {entity}",
    "entity_picker.added_widget": "{widget} hinzugefuegt: {entity}",
    "entity_picker.fetch_failed": "Lichtsuche fehlgeschlagen: {error}",
    "entity_picker.fetch_failed_items": "Entitaetssuche fuer {items} fehlgeschlagen: {error}",
    "entity_picker.progress": "{loaded} / {target}",
    "entity_picker.progress_total": "{loaded} / {target} von {total}",
    "entity_picker.items_light": "Lichter",
    "entity_picker.items_sensor": "Sensoren",
    "entity_picker.items_binary": "Binaer-Sensoren",
    "entity_picker.items_switch": "Schalter",
    "entity_picker.items_weather": "Wetter-Entitaeten",
    "entity_picker.items_climate": "Climate-Entitaeten",
    "entity_picker.items_vacuum": "Saugroboter",
    "entity_picker.widget_light": "Lichtkachel",
    "entity_picker.widget_sensor": "Sensorkachel",
    "entity_picker.widget_binary": "Binaer-Sensor-Kachel",
    "entity_picker.widget_button": "Button-Kachel",
    "entity_picker.widget_weather": "Wetterkachel",
    "entity_picker.widget_weather_3day": "Wetter-Vorhersage-Kachel",
    "entity_picker.widget_graph": "Graph-Kachel",
    "entity_picker.widget_heating": "Heizungskachel",
    "entity_picker.widget_roborock": "Roborock-Kachel",
    "layout.inspector.heading": "Inspektor",
    "layout.tile_look.group": "Kachel-Optik (diese Kachel)",
    "layout.tile_look.preset": "Vorlage",
    "layout.tile_look.bg_color": "Hintergrundfarbe",
    "layout.tile_look.bg_grad_color": "Verlaufsendfarbe",
    "layout.tile_look.bg_grad_dir": "Verlaufsrichtung",
    "layout.tile_look.border_color": "Rahmenfarbe",
    "layout.tile_look.border_width": "Rahmenbreite (px)",
    "layout.tile_look.radius": "Eckenradius (px)",
    "layout.tile_look.corner_shape": "Eckenform",
    "layout.tile_look.corner_hint": "Quadratische Kacheln werden beim maximalen Radius zum Kreis.",
    "layout.tile_look.opacity": "Deckkraft Hintergrund (%)",
    "layout.tile_look.font_scale": "Schriftgroesse",
    "layout.tile_look.shadow": "Schlagschatten",
    "layout.tile_look.text_color": "Textfarbe (alle)",
    "layout.tile_look.title_color": "Titelfarbe",
    "layout.tile_look.label_color": "Farbe der Entitaetsbezeichnung",
    "layout.tile_look.value_color": "Farbe fuer Wert / Status",
    "layout.tile_look.icon_color": "Symbolfarbe",
    "layout.tile_look.reset": "Kachel-Optik zuruecksetzen",
    "layout.tile_look.hint": "Leere Felder verwenden das Thema. Farben im Format #RRGGBB.",
  "layout.tile_look.copy_source": "Optik uebernehmen von",
  "layout.tile_look.copy_apply": "Optik uebernehmen",
  "layout.tile_look.copy_apply_page": "Auf alle Kacheln anwenden",
  "layout.tile_look.copy_placeholder": "Kachel waehlen...",
  "layout.tile_look.copy_empty": "Keine weitere Kachel zum Kopieren",
  "layout.tile_look.copy_none": "Zuerst eine Quellkachel waehlen.",
  "layout.tile_look.copy_done": "Kachel-Optik uebernommen von: {source}",
  "layout.tile_look.copy_page_done": "Kachel-Optik auf {count} Kachel(n) angewendet.",
  "layout.tile_look.copy_hint": "Kopiert nur Hintergrund, Rahmen, Farben und Schriftgroesse - Entitaet, Titel und Groesse bleiben unveraendert.",
    "layout.page_look.heading": "Seiten-Optik",
    "layout.page_look.group": "Seiten-Optik (diese Seite)",
    "layout.page_look.preset": "Vorlage",
    "layout.page_look.bg_color": "Hintergrundfarbe",
    "layout.page_look.bg_grad_color": "Farbe des Verlaufsendes",
    "layout.page_look.bg_grad_dir": "Verlaufsrichtung",
    "layout.page_look.wallpaper": "Panel-Hintergrundbild nutzen",
    "layout.page_look.dim": "Hintergrundbild abdunkeln (%)",
    "layout.page_look.reset": "Seiten-Optik zuruecksetzen",
    "layout.page_look.reset_done": "Seiten-Optik zurueckgesetzt.",
    "layout.page_look.page_theme": "Theme nur fuer diese Seite",
    "layout.page_look.page_theme_hint": "Die Seite wird mit diesem Theme neu gezeichnet, sobald sie angezeigt wird. \"Global\" folgt dem aktiven bzw. Tages-/Nacht-Theme.",
    "layout.page_look.theme_none": "- globales / Tag-Nacht-Theme -",
    "layout.page_look.hint": "Leere Felder nutzen den Panel-Hintergrund. Das Hintergrundbild wird am Panel abgedunkelt.",
    "layout.option.page_preset.auto": "Panel-Standard",
    "layout.option.page_preset.midnight": "Mitternacht",
    "layout.option.page_preset.deep_sea": "Tiefsee",
    "layout.option.page_preset.forest": "Wald",
    "layout.option.page_preset.sunset": "Sonnenuntergang",
    "layout.option.page_preset.plum": "Pflaume",
    "layout.option.page_preset.wallpaper": "Hintergrundbild",
    "layout.option.page_preset.wallpaper_dim": "Hintergrundbild (dunkel)",
    "layout.option.page_grad_dir.none": "Keine",
    "layout.option.page_grad_dir.hor": "Horizontal",
    "layout.option.page_grad_dir.ver": "Vertikal",
    "layout.option.tile_grad_dir.none": "Keine",
    "layout.option.tile_grad_dir.hor": "Horizontal",
    "layout.option.tile_grad_dir.ver": "Vertikal",
    "layout.option.tile_font_scale.auto": "Auto",
    "layout.option.tile_font_scale.s": "Klein",
    "layout.option.tile_font_scale.m": "Mittel",
    "layout.option.tile_font_scale.l": "Gross",
    "layout.option.tile_font_scale.xl": "Sehr gross",
    "layout.option.tile_preset.auto": "Themen-Standard",
    "layout.option.tile_preset.graphite": "Graphit",
    "layout.option.tile_preset.emerald": "Smaragd",
    "layout.option.tile_preset.amber": "Bernstein",
    "layout.option.tile_preset.violet": "Violett",
  "layout.option.tile_preset.sky": "Himmel",
    "layout.option.tile_preset.glass": "Glas",
    "layout.option.tile_corner.custom": "Eigener Wert (Radius nutzen)",
    "layout.option.tile_corner.square": "Quadrat (0 px)",
    "layout.option.tile_corner.soft": "Sanft (10 px)",
    "layout.option.tile_corner.rounded": "Abgerundet (16 px)",
    "layout.option.tile_corner.pill": "Pille (40 px)",
    "layout.option.tile_corner.circle": "Kreis (max. Radius)",
    "layout.inspector.title": "Titel",
    "layout.inspector.entity": "Entitaet",
    "layout.inspector.secondary_entity": "Ist-Entitaet (Sensor)",
    "layout.inspector.secondary_entity_roborock": "Karten-Entitaet (image, optional)",
    "layout.inspector.button_mode": "Button Modus",
    "layout.inspector.button_accent_color": "Button Akzentfarbe",
    "layout.inspector.button_style": "Button-Stil",
    "layout.inspector.slider_entity_domain": "Slider Entitaetstyp",
    "layout.inspector.slider_direction": "Slider Richtung",
    "layout.inspector.slider_accent_color": "Slider Akzentfarbe",
    "layout.inspector.graph_line_color": "Graph Linienfarbe",
    "layout.inspector.graph_time_window_min": "Zeitfenster (Minuten)",
    "layout.inspector.graph_point_count": "Render Punkte (leer = auto)",
    "layout.inspector.graph_display_mode": "Anzeigeart",
    "layout.inspector.graph_bar_bucket_min": "Balken-Intervall (min)",
    "layout.inspector.binary_show_title": "Titel anzeigen",
    "layout.inspector.binary_color_on": "Farbe wenn EIN",
    "layout.inspector.binary_color_off": "Farbe wenn AUS",
    "layout.inspector.binary_text_on": "Text wenn EIN",
    "layout.inspector.binary_text_off": "Text wenn AUS",
    "layout.option.graph_display_mode.line": "Linie mit Punkten",
    "layout.option.graph_display_mode.line_smooth_points": "Glatte Linie mit Punkten",
    "layout.option.graph_display_mode.line_smooth": "Glatte Linie",
    "layout.option.graph_display_mode.bars": "Balken",
    "layout.inspector.apply": "Uebernehmen",
    "layout.option.button_mode.auto": "auto (Default switch)",
    "layout.option.button_mode.play_pause": "play/pause (media_player)",
    "layout.option.button_mode.stop": "stop (media_player)",
    "layout.option.button_mode.next": "next (media_player)",
    "layout.option.button_mode.previous": "previous (media_player)",
    "layout.option.button_style.switch": "Schalter (Schieberegler)",
    "layout.option.button_style.power_toggle": "Ein/Aus-Symbol (Name + Symbol)",
    "layout.option.button_style.power_status": "Ein/Aus-Symbol + EIN/AUS-Statustext",
    "layout.option.button_style.plug_icon": "Steckdosen-/Stecker-Symbol (Name + Symbol)",
    "layout.option.button_style.lamp_icon": "Lampen-/Glühbirnen-Symbol (Name + Symbol)",
    "layout.option.button_style.highlight": "Kachel-Hervorhebung (Akzent bei EIN)",
    "layout.option.button_style.status_text": "Nur EIN/AUS-Text (kein Symbol)",
    "layout.option.slider_entity_domain.auto": "auto (light, media_player, cover)",
    "layout.option.slider_entity_domain.light": "light",
    "layout.option.slider_entity_domain.media_player": "media_player",
    "layout.option.slider_entity_domain.cover": "cover",
    "layout.option.slider_direction.auto": "auto (nach Breite/Hoehe)",
    "layout.option.slider_direction.left_to_right": "left_to_right (0% -> 100%)",
    "layout.option.slider_direction.right_to_left": "right_to_left (100% -> 0%)",
    "layout.option.slider_direction.bottom_to_top": "bottom_to_top (0% -> 100%)",
    "layout.option.slider_direction.top_to_bottom": "top_to_bottom (100% -> 0%)",
    "layout.actions.heading": "Aktionen",
    "layout.actions.reload": "Neu laden",
    "layout.actions.save": "Speichern",
    "layout.actions.export": "Export",
    "layout.actions.import": "JSON importieren",
    "layout.actions.paste_placeholder": "Layout JSON hier einfuegen",
    "layout.canvas.title": "Canvas",
    "layout.default_page.title": "Wohnzimmer",
    "layout.status.loading": "Layout wird geladen...",
    "layout.status.load_failed": "Layout laden fehlgeschlagen, nutze Default: {error}",
    "layout.status.loaded": "Layout geladen",
    "layout.status.entity_fetch_failed": "Entitaeten laden fehlgeschlagen: {error}",
    "layout.status.saving": "Layout wird gespeichert...",
    "layout.status.saved": "Layout gespeichert",
    "layout.status.imported": "Layout importiert (noch nicht gespeichert)",
    "layout.status.at_least_one_page": "Mindestens eine Seite ist erforderlich",
    "layout.status.entity_domain_required": "Entitaet muss diese Domain nutzen: {domains}",
    "layout.status.expected_domain": "die erwartete Domain",
    "layout.status.secondary_sensor_required": "Ist-Entitaet muss mit sensor. beginnen.",
    "layout.status.secondary_image_required": "Karten-Entitaet muss mit image. beginnen.",
    "layout.status.invalid_json": "Ungueltiges Layout JSON",
    "layout.status.save_failed": "Speichern fehlgeschlagen: {error}",
    "layout.status.conflict_title": "Layout auf dem Panel wurde anderswo geaendert",
    "layout.status.conflict_confirm": "Das Layout auf dem Panel wurde aus einer anderen Quelle geaendert (anderer Browser-Tab, API oder Wiederherstellung).\n\nOK = mit dieser Editor-Version ueberschreiben\nAbbrechen = Panel-Version behalten (Seite neu laden, um lokale Aenderungen zu verwerfen).",
    "layout.status.conflict_overridden": "Aenderungen vom Panel durch diesen Editor ueberschrieben.",
    "layout.status.import_failed": "Import fehlgeschlagen: {error}",
    "layout.status.file_import_failed": "Dateiimport fehlgeschlagen: {error}",
    "setup.title": "Quick Setup",
    "setup.step_ha": "HA verbunden",
    "setup.step_tiles": "Kacheln waehlen",
    "setup.step_save": "Layout speichern",
    "setup.subtitle": "Waehle ein paar Home Assistant Entitaeten fuer dein erstes Dashboard.",
    "setup.page_label": "Titel der ersten Seite",
    "setup.page_placeholder": "Wohnzimmer",
    "setup.add_light": "+ Licht",
    "setup.add_heating": "+ Heizung",
    "setup.add_weather": "+ Wetter",
    "setup.add_button": "+ Schalter",
    "setup.add_sensor": "+ Sensor",
    "setup.close": "Schliessen",
    "setup.skip": "Ueberspringen",
    "setup.done": "Speichern + Fertig",
    "setup.save": "Layout speichern",
    "setup.count_none": "Noch keine Kacheln hinzugefuegt.",
    "setup.count_one": "1 Kachel auf dieser Seite.",
    "setup.count_many": "{count} Kacheln auf dieser Seite.",
    "setup.added": "Hinzugefuegt: {title}",
    "setup.saving": "Layout wird gespeichert...",
    "setup.saved": "Layout gespeichert. Das Panel kann dieses Dashboard jetzt nutzen.",
    "setup.save_failed": "Speichern fehlgeschlagen: {error}",
    "provision.wifi.title": "WLAN Provisioning",
    "provision.wifi.subtitle": "Verbinde das Panel mit deinem WLAN.",
    "provision.wifi.ssid": "SSID",
    "provision.wifi.country_code": "Laendercode",
    "provision.wifi.password": "Passwort",
    "provision.wifi.password_placeholder": "WLAN Passwort",
    "provision.wifi.show_password": "Passwort anzeigen",
    "provision.ha.title": "HA Provisioning",
    "provision.ha.subtitle": "Verbinde das Panel mit Home Assistant.",
    "provision.ha.ws_url": "WebSocket URL (ws:// oder wss://)",
    "provision.ha.token": "Long-lived Access Token",
    "provision.ha.show_token": "Token anzeigen",
    "settings.wifi.heading": "WLAN",
    "settings.wifi.ssid": "SSID",
    "settings.wifi.country_code": "Laendercode",
    "settings.wifi.bssid": "BSSID Lock (optional)",
    "settings.wifi.password": "Passwort",
    "settings.wifi.password_placeholder": "Leer lassen, um vorhandenes Passwort zu behalten",
    "settings.ha.heading": "Home Assistant",
    "settings.ha.ws_url": "WebSocket URL (ws:// oder wss://)",
    "settings.ha.token": "Long-lived Access Token",
    "settings.ha.token_placeholder": "Leer lassen, um vorhandenen Token zu behalten",
    "settings.ha.rest_fallback": "HA REST Fallback aktivieren (Standard: Aus, WS bevorzugt)",
    "settings.xiaozhi.heading": "Xiaozhi KI",
    "settings.xiaozhi.enabled": "Xiaozhi-KI-Sprachassistent aktivieren",
    "settings.xiaozhi.cloud_activation": "Cloud-Aktivierung (Kopplungscode)",
    "settings.xiaozhi.server": "WebSocket-URL (ws:// oder wss://)",
    "settings.xiaozhi.ota_url": "Xiaozhi-Cloud-OTA-URL (Kopplungscode)",
    "settings.xiaozhi.device": "Gerate-ID (optional)",
    "settings.xiaozhi.token": "Zugangstoken",
    "settings.cameras.heading": "Kameras",
    "settings.cameras.item_refresh": "Aktualisierung: {ms} ms",
    "settings.cameras.disabled": "Deaktiviert",
    "settings.cameras.hint": "Konfiguriere bis zu 4 Kameras (HA camera.*-Entitaten oder HTTP-Snapshots).",
    "settings.cameras.add": "+ Kamera hinzufugen",
    "settings.cameras.name": "Name",
    "settings.cameras.source": "Quelle",
    "settings.cameras.source_ha": "HA-Entitat (camera.*)",
    "settings.cameras.source_http": "HTTP-Snapshot-URL",
    "settings.cameras.entity": "Kamera-Entitat",
    "settings.cameras.url": "Snapshot-URL (http:// oder https://)",
    "settings.cameras.username": "Benutzername (optional)",
    "settings.cameras.password": "Passwort (optional)",
    "settings.cameras.refresh_ms": "Aktualisierung (ms)",
    "settings.cameras.enabled": "Aktiviert",
    "settings.cameras.save": "Speichern",
    "settings.cameras.delete": "Loschen",
    "settings.cameras.none": "Keine Kameras. Fuge die erste Kamera hinzu.",
    "settings.cameras.saved": "Kameras gespeichert.",
    "settings.cameras.load_failed": "Kameras konnten nicht geladen werden: {error}",
    "settings.cameras.save_failed": "Speichern fehlgeschlagen: {error}",
    "settings.cameras.invalid_url": "Die URL muss mit http:// oder https:// beginnen",
    "settings.cameras.entity_hint": "Keine camera.*-Entitaten gefunden — HA-Verbindung prufen.",
    "settings.cameras.entity_loading": "Kameras werden geladen...",
    "settings.cameras.invalid_entity": "Wahle eine camera.*-Entitat",
    "settings.cameras.delete_confirm": "Kamera \"{name}\" loschen?",
    "settings.localCam.heading": "Eingebaute Kamera",
    "settings.localCam.hint": "Eingebaute OV5647 MIPI-CSI-Kamera. Anderungen gelten sofort, ohne Neustart.",
    "settings.localCam.enabled": "Kamera aktiviert",
    "settings.localCam.stream": "Live-Stream zu HA (MJPEG)",
    "settings.localCam.motion": "Bewegungserkennung (Bildschirm wecken)",
    "settings.localCam.threshold": "Bewegungsempfindlichkeit (1..64, kleiner = empfindlicher)",
    "settings.localCam.quality": "JPEG-Qualitat (10..95)",
    "settings.localCam.resolution": "Auflosung",
    "settings.localCam.resolution_native": "1280x960 (nativ)",
    "settings.localCam.resolution_half": "640x480 (halbe)",
    "settings.localCam.hflip": "Horizontal spiegeln (H)",
    "settings.localCam.vflip": "Vertikal spiegeln (V)",
    "settings.localCam.save": "Speichern",
    "settings.localCam.refresh_preview": "Vorschau aktualisieren",
    "settings.localCam.preview_hint": "Die Vorschau funktioniert, wenn die Kamera aktiviert ist.",
    "settings.localCam.saved": "Kameraeinstellungen gespeichert.",
    "settings.localCam.save_failed": "Speichern fehlgeschlagen: {error}",
    "settings.localCam.status_error": "Kamerastatus konnte nicht geladen werden: {error}",
    "settings.localCam.snapshot_failed": "Schnappschuss fehlgeschlagen: {error}",
    "settings.localCam.motion_heading": "Bewegungserkennung",
    "settings.localCam.motion_hint": "Zonen und Schwellwerte fur die Bewegungserkennung. Koordinaten in % des Bildes (x, y ab oben links).",
    "settings.localCam.motion_min_area": "Min. geanderte Flache (%)",
    "settings.localCam.motion_min_duration": "Min. Bewegungsdauer (ms, 0 = aus)",
    "settings.localCam.motion_cooldown": "Pause zwischen Erkennungen (ms)",
    "settings.localCam.motion_start_delay": "Verzogerung nach Kamerastart (ms)",
    "settings.localCam.motion_ignore_lighting": "Plotzliche Lichtanderungen ignorieren",
    "settings.localCam.zones_hint": "Auf der Vorschau ziehen, um eine Zone zu zeichnen (max. 4). Keine Zonen = ganzes Bild.",
    "settings.localCam.zones_refresh": "Zonenvorschau aktualisieren",
    "settings.localCam.zones_clear": "Zonen loschen",
    "settings.localCam.zones_remove": "Zone entfernen",
    "settings.localCam.motion_diag": "Erkennung prufen",
    "settings.localCam.motion_level": "Pegel",
    "settings.localCam.motion_changed": "geandert",
    "settings.localCam.motion_active": "Bewegung",
    "settings.localCam.motion_triggers": "Auslosungen",
    "settings.localCam.motion_lighting": "Licht ignoriert",
    "settings.localCam.motion_diag_failed": "Erkennungsprufung fehlgeschlagen: {error}",
    "settings.time.heading": "Zeit",
    "settings.time.ntp_server": "NTP Server",
    "settings.time.timezone": "Zeitzone (POSIX TZ)",
    "settings.ui.heading": "UI",
    "settings.theme.heading": "Theme",
    "settings.ui.language": "Sprache",
    "settings.ui.reload_languages": "Sprachen neu laden",
    "settings.ui.download_json": "JSON herunterladen",
    "settings.ui.upload_code": "Sprachcode",
    "settings.ui.upload_file": "Uebersetzungsdatei (JSON)",
    "settings.ui.upload_button": "Upload / Sprache hinzufuegen",
    "settings.ap.heading": "Setup AP",
    "settings.ap.hint": "Wenn Setup AP aktiv ist, verbinden und <code>http://192.168.4.1</code> oeffnen.",
    "settings.ota.heading": "Firmware Update",
    "settings.ota.url": "OTA URL",
    "settings.ota.url_placeholder": "https://example.com/betta-ha-panel-7b.ota.bin",
    "settings.ota.flash_url": "URL flashen",
    "settings.ota.refresh": "Status aktualisieren",
    "settings.ota.file": "OTA .bin Datei",
    "settings.ota.upload": "Upload + Flash",
    "settings.ota.idle": "Bereit fuer ein OTA App-Image. Laufend: {running}, naechster Slot: {next}, Slotgroesse: {size}.",
    "settings.ota.running": "OTA laeuft: {progress}% ({written} / {total})",
    "settings.ota.downloading": "Download per URL: {progress}% ({written} / {total})",
    "settings.ota.uploading": "Upload vom Panel empfangen: {progress}% ({written} / {total})",
    "settings.ota.success": "OTA Image geschrieben. Neustart laeuft.",
    "settings.ota.error": "OTA fehlgeschlagen: {error}",
    "settings.ota.rebooting": "Geraet startet neu. Oeffne das Panel erneut, sobald es wieder online ist.",
    "settings.ota.no_file": "Bitte zuerst eine OTA .bin Datei waehlen.",
    "settings.ota.no_url": "Bitte zuerst eine OTA URL einfuegen.",
    "settings.ota.starting_url": "OTA per URL wird gestartet...",
    "settings.ota.upload_progress": "Upload zum Panel: {progress}% ({written} / {total})",
    "settings.ota.request_failed": "OTA Anfrage fehlgeschlagen: {error}",
    "settings.ota.target_slot": "Zielslot: {partition}",
    "settings.actions.heading": "Einstellungsaktionen",
    "settings.actions.reload": "Einstellungen neu laden",
    "settings.actions.save": "Speichern + Neustart",
    "settings.actions.hint": "Nach dem Speichern startet das Geraet neu und wechselt ggf. vom Setup AP ins Heim-WLAN.",
    "settings.info.configured": "Konfiguriert",
    "settings.info.connected": "Verbunden",
    "settings.info.password_stored": "Passwort gespeichert",
    "settings.info.country": "Land",
    "settings.info.rssi": "RSSI (verbundener AP)",
    "settings.info.connected_bssid": "Verbundener BSSID",
    "settings.info.channel": "Kanal",
    "settings.info.token_stored": "Token gespeichert",
    "settings.info.rest_fallback": "REST Fallback",
    "common.yes": "ja",
    "common.no": "nein",
    "common.scan": "Scan",
    "common.scan_wifi": "WLAN scannen",
    "common.save_reboot": "Speichern + Neustart",
    "status.idle": "Bereit",
    "status.loading_settings": "Einstellungen werden geladen...",
    "status.settings_loaded": "Einstellungen geladen",
    "status.settings_load_failed": "Einstellungen laden fehlgeschlagen: {error}",
    "status.settings_save_failed": "Einstellungen speichern fehlgeschlagen: {error}",
    "ha_diagnostics.missing_title": "Einige Entitäten aus diesem Layout wurden in Home Assistant nicht gefunden",
    "ha_diagnostics.missing_title_more": "Einige Entitäten aus diesem Layout wurden in Home Assistant nicht gefunden ({total} insgesamt, {listed} angezeigt)",
    "ha_diagnostics.missing_hint": "Öffne das betroffene Widget, wähle eine gültige Entität und speichere das Layout.",
    "ha_diagnostics.dismiss": "Schließen",
    "status.saving_settings": "Einstellungen werden gespeichert...",
    "status.settings_saved_reboot": "Einstellungen gespeichert. Das Geraet startet in ~2s neu.",
    "status.wifi_scan_running": "WLAN Suche laeuft...",
    "status.wifi_scan_complete": "WLAN Scan fertig ({count} Netze)",
    "status.wifi_scan_failed": "WLAN Scan fehlgeschlagen: {error}",
    "status.wifi_scan_timeout": "WLAN Scan Anfrage abgelaufen",
    "common.unknown_error": "Unbekannter Fehler",
    "wifi.scan_unavailable": "WLAN Scan ist im Setup AP Modus auf dieser Hardware nicht verfuegbar. SSID manuell eingeben.",
    "wifi.scan_click": "Auf \"WLAN scannen\" klicken, um Netze zu finden.",
    "wifi.scan_click_short": "Auf \"Scan\" klicken, um Netze zu finden.",
    "wifi.scan_no_networks": "Keine Netze gefunden. Gehe naeher an den Router und versuche es erneut.",
    "wifi.scan_found": "{count} Netzwerk(e) gefunden. SSID auswaehlen.",
    "wifi.scan.connected_tag": "verbunden",
    "wifi.scan.option_unavailable": "Scan nicht verfuegbar",
    "wifi.scan.option_scanning": "Suche laeuft...",
    "wifi.scan.option_not_run": "Noch kein Scan",
    "wifi.scan.option_no_networks": "Keine Netze gefunden",
    "wifi.scan.option_select": "Netz waehlen ({count} gefunden)",
    "settings.time.info": "Wird nach Neustart angewendet. Zeitsync startet bei WLAN Verbindung.",
    "settings.ui.info": "Vorschau wechselt sofort. Gespeicherte Sprache gilt nach Neustart.",
    "settings.ap.active": "Setup AP aktiv: {ssid}\\nhttp://192.168.4.1 im AP oeffnen.",
    "settings.ap.inactive": "Setup AP inaktiv.\\nNutze die Panel-IP im Heimnetz.",
    "settings.translation.info": "JSON hochladen, um eine Sprache hinzuzufuegen oder zu aktualisieren.",
    "settings.translation.upload_ok": "Sprache \"{lang}\" hochgeladen.",
    "settings.translation.upload_fail": "Upload fehlgeschlagen: {error}",
    "settings.translation.no_file": "Bitte zuerst eine JSON Datei auswaehlen.",
    "settings.translation.invalid_json": "Ungueltiges JSON",
    "settings.translation.object_required": "JSON muss ein Objekt sein",
    "settings.translation.invalid_code": "Sprachcode muss [a-z0-9_-] nutzen und 2-15 Zeichen haben.",
    "settings.language.invalid_country": "WLAN Laendercode muss ein 2-stelliger ISO Code sein (z.B. US, DE)",
    "settings.language.invalid_bssid": "BSSID muss leer sein oder Format AA:BB:CC:DD:EE:FF haben",
    "settings.language.invalid_ha_url": "HA URL muss mit ws:// oder wss:// beginnen",
    "settings.language.invalid_xiaozhi_url": "Xiaozhi-URL muss mit ws:// oder wss:// beginnen",
    "settings.language.invalid_ota_url": "Xiaozhi-OTA-URL muss mit http:// oder https:// beginnen",
    "provision.wifi.required_ssid": "SSID ist erforderlich.",
    "provision.wifi.required_country": "Laendercode muss 2 Buchstaben haben (z.B. US, DE).",
    "provision.ha.required_url": "WebSocket URL ist erforderlich.",
    "provision.ha.invalid_url": "HA URL muss mit ws:// oder wss:// beginnen.",
    "provision.ha.required_token": "Long-lived Access Token ist erforderlich.",
    "provision.saving_reboot": "Speichere Einstellungen und starte neu...",
    "provision.saved_reboot": "Einstellungen gespeichert. Geraet startet in ~2s neu.",
    "provision.save_failed": "Speichern fehlgeschlagen: {error}",
    "provision.wifi.hint": "Speichern startet das Panel neu. Danach folgt die HA Einrichtung.",
    "provision.ha.hint": "Speichern startet das Panel neu. Danach ist der Editor freigeschaltet.",
    "settings.language.option_de": "Deutsch",
    "settings.language.option_en": "Englisch",
    "settings.language.option_es": "Spanisch",
    "settings.language.option_fr": "Franzoesisch",
    "settings.language.option_pl": "Polnisch",
    "layout.widgets.presence_home": "Zuhause",
    "layout.widgets.presence_away": "Abwesend",
    "layout.music.preview_auto": "Automatisch erkennen",
    "layout.pages.rename": "Umbenennen",
  },
  es: {
    "tabs.layout": "Diseno",
    "tabs.settings": "Configuracion",
    "sidebar.title": "BETTA Editor",
    "sidebar.subtitle": "Fuente de verdad del layout: JSON",
    "layout.pages.heading": "Paginas",
    "layout.pages.add": "+ Pagina",
    "layout.pages.delete": "Eliminar",
    "layout.pages.title_label": "Titulo de pagina",
    "layout.pages.title_placeholder": "Nombre de pagina en la pantalla",
    "layout.pages.apply_title": "Aplicar titulo de pagina",
    "layout.pages.new_title": "Pagina {number}",
    "layout.widgets.heading": "Widgets",
    "layout.widgets.add_sensor": "+ Sensor",
    "layout.widgets.add_binary": "+ Sensor binario",
    "layout.widgets.add_button": "+ Boton",
    "layout.widgets.add_slider": "+ Slider",
    "layout.widgets.add_graph": "+ Grafico",
    "layout.widgets.add_empty_tile": "+ Tile vacio",
    "layout.widgets.add_light_tile": "+ Tile de luz",
    "layout.widgets.add_heating_tile": "+ Tile de calefaccion",
    "layout.widgets.add_weather_tile": "+ Clima",
    "layout.widgets.add_weather_3day": "+ Previsão do tempo",
    "layout.widgets.delete": "Eliminar Widget",
    "entity_picker.title": "Elegir luz",
    "entity_picker.refresh": "Actualizar",
    "entity_picker.close": "Cerrar",
    "entity_picker.blank": "Tile de luz vacio",
    "entity_picker.loading": "Cargando luces...",
    "entity_picker.refreshing": "Actualizando luces...",
    "entity_picker.pending": "Esperando Home Assistant...",
    "entity_picker.disconnected": "Home Assistant no esta conectado.",
    "entity_picker.empty": "No se encontraron luces.",
    "entity_picker.truncated": "Lista recortada por limite de firmware.",
    "entity_picker.unassigned_room": "Sin sala",
    "entity_picker.added": "Tile de luz agregado: {entity}",
    "entity_picker.fetch_failed": "Error al buscar luces: {error}",
    "layout.inspector.heading": "Inspector",
    "layout.tile_look.group": "Aspecto del mosaico (este mosaico)",
    "layout.tile_look.preset": "Plantilla",
    "layout.tile_look.bg_color": "Color de fondo",
    "layout.tile_look.bg_grad_color": "Color final del degradado",
    "layout.tile_look.bg_grad_dir": "Direccion del degradado",
    "layout.tile_look.border_color": "Color del borde",
    "layout.tile_look.border_width": "Ancho del borde (px)",
    "layout.tile_look.radius": "Radio de esquina (px)",
    "layout.tile_look.corner_shape": "Forma de las esquinas",
    "layout.tile_look.corner_hint": "Con el radio maximo, un mosaico cuadrado se vuelve un circulo.",
    "layout.tile_look.opacity": "Opacidad del fondo (%)",
    "layout.tile_look.font_scale": "Tamano de fuente",
    "layout.tile_look.shadow": "Sombra",
    "layout.tile_look.text_color": "Color del texto (todo)",
    "layout.tile_look.title_color": "Color del titulo",
    "layout.tile_look.label_color": "Color de la etiqueta de entidad",
    "layout.tile_look.value_color": "Color del valor / estado",
    "layout.tile_look.icon_color": "Color del icono",
    "layout.tile_look.reset": "Restablecer aspecto del mosaico",
    "layout.tile_look.hint": "Los campos vacios usan el tema. Colores en formato #RRGGBB.",
  "layout.tile_look.copy_source": "Copiar aspecto de",
  "layout.tile_look.copy_apply": "Copiar aspecto",
  "layout.tile_look.copy_apply_page": "Aplicar a todos los mosaicos",
  "layout.tile_look.copy_placeholder": "Selecciona un mosaico...",
  "layout.tile_look.copy_empty": "No hay otros mosaicos para copiar",
  "layout.tile_look.copy_none": "Selecciona primero un mosaico de origen.",
  "layout.tile_look.copy_done": "Aspecto copiado de: {source}",
  "layout.tile_look.copy_page_done": "Aspecto aplicado a {count} mosaico(s).",
  "layout.tile_look.copy_hint": "Copia solo fondo, borde, colores y tamano de fuente; la entidad, el titulo y el tamano no cambian.",
    "layout.page_look.heading": "Aspecto de la pagina",
    "layout.page_look.group": "Aspecto de la pagina (esta pagina)",
    "layout.page_look.preset": "Preajuste",
    "layout.page_look.bg_color": "Color de fondo",
    "layout.page_look.bg_grad_color": "Color final del degradado",
    "layout.page_look.bg_grad_dir": "Direccion del degradado",
    "layout.page_look.wallpaper": "Usar fondo de pantalla del panel",
    "layout.page_look.dim": "Oscurecer fondo (%)",
    "layout.page_look.reset": "Restablecer aspecto",
    "layout.page_look.reset_done": "Aspecto de la pagina restablecido.",
    "layout.page_look.page_theme": "Tema solo para esta pagina",
    "layout.page_look.page_theme_hint": "La pagina se repinta con este tema en cuanto se muestra. \"Global\" sigue el tema activo / dia-noche.",
    "layout.page_look.theme_none": "- tema global / dia-noche -",
    "layout.page_look.hint": "Los campos vacios usan el fondo del panel. El fondo se oscurece en el panel.",
    "layout.option.page_preset.auto": "Predeterminado del panel",
    "layout.option.page_preset.midnight": "Medianoche",
    "layout.option.page_preset.deep_sea": "Mar profundo",
    "layout.option.page_preset.forest": "Bosque",
    "layout.option.page_preset.sunset": "Atardecer",
    "layout.option.page_preset.plum": "Ciruela",
    "layout.option.page_preset.wallpaper": "Fondo de pantalla",
    "layout.option.page_preset.wallpaper_dim": "Fondo de pantalla (oscuro)",
    "layout.option.page_grad_dir.none": "Ninguna",
    "layout.option.page_grad_dir.hor": "Horizontal",
    "layout.option.page_grad_dir.ver": "Vertical",
    "layout.option.tile_grad_dir.none": "Ninguna",
    "layout.option.tile_grad_dir.hor": "Horizontal",
    "layout.option.tile_grad_dir.ver": "Vertical",
    "layout.option.tile_font_scale.auto": "Auto",
    "layout.option.tile_font_scale.s": "Pequena",
    "layout.option.tile_font_scale.m": "Media",
    "layout.option.tile_font_scale.l": "Grande",
    "layout.option.tile_font_scale.xl": "Muy grande",
    "layout.option.tile_preset.auto": "Predeterminado del tema",
    "layout.option.tile_preset.graphite": "Grafito",
    "layout.option.tile_preset.emerald": "Esmeralda",
    "layout.option.tile_preset.amber": "Ambar",
    "layout.option.tile_preset.violet": "Violeta",
  "layout.option.tile_preset.sky": "Cielo",
    "layout.option.tile_preset.glass": "Cristal",
    "layout.option.tile_corner.custom": "Personalizado (usa el radio)",
    "layout.option.tile_corner.square": "Cuadrado (0 px)",
    "layout.option.tile_corner.soft": "Suave (10 px)",
    "layout.option.tile_corner.rounded": "Redondeado (16 px)",
    "layout.option.tile_corner.pill": "Pastilla (40 px)",
    "layout.option.tile_corner.circle": "Circulo (radio maximo)",
    "layout.inspector.title": "Titulo",
    "layout.inspector.entity": "Entidad",
    "layout.inspector.secondary_entity": "Entidad real (sensor)",
    "layout.inspector.button_mode": "Modo de boton",
    "layout.inspector.button_accent_color": "Color de acento del boton",
    "layout.inspector.button_style": "Estilo del boton",
    "layout.inspector.slider_entity_domain": "Tipo de entidad del slider",
    "layout.inspector.slider_direction": "Direccion del slider",
    "layout.inspector.slider_accent_color": "Color de acento del slider",
    "layout.inspector.graph_line_color": "Color de linea del grafico",
    "layout.inspector.graph_time_window_min": "Ventana de tiempo (minutos)",
    "layout.inspector.graph_point_count": "Puntos de render (vacio = auto)",
    "layout.inspector.graph_display_mode": "Modo de visualizacion",
    "layout.inspector.graph_bar_bucket_min": "Intervalo de barras (min)",
    "layout.inspector.binary_show_title": "Mostrar titulo",
    "layout.inspector.binary_color_on": "Color cuando ON",
    "layout.inspector.binary_color_off": "Color cuando OFF",
    "layout.inspector.binary_text_on": "Texto cuando ON",
    "layout.inspector.binary_text_off": "Texto cuando OFF",
    "layout.option.graph_display_mode.line": "Linea con puntos",
    "layout.option.graph_display_mode.line_smooth_points": "Linea suave con puntos",
    "layout.option.graph_display_mode.line_smooth": "Linea suave",
    "layout.option.graph_display_mode.bars": "Barras",
    "layout.inspector.apply": "Aplicar",
    "layout.option.button_mode.auto": "auto (switch por defecto)",
    "layout.option.button_mode.play_pause": "play/pause (media_player)",
    "layout.option.button_mode.stop": "stop (media_player)",
    "layout.option.button_mode.next": "next (media_player)",
    "layout.option.button_mode.previous": "previous (media_player)",
    "layout.option.button_style.switch": "Interruptor (control deslizante)",
    "layout.option.button_style.power_toggle": "Icono de encendido (nombre + icono)",
    "layout.option.button_style.power_status": "Icono de encendido + texto de estado",
    "layout.option.button_style.plug_icon": "Icono de enchufe (nombre + icono)",
    "layout.option.button_style.lamp_icon": "Icono de lámpara/bombilla (nombre + icono)",
    "layout.option.button_style.highlight": "Resaltar tarjeta (acento cuando está ON)",
    "layout.option.button_style.status_text": "Solo texto ON/OFF (sin icono)",
    "layout.option.slider_entity_domain.auto": "auto (light, media_player, cover)",
    "layout.option.slider_entity_domain.light": "light",
    "layout.option.slider_entity_domain.media_player": "media_player",
    "layout.option.slider_entity_domain.cover": "cover",
    "layout.option.slider_direction.auto": "auto (segun ancho/alto)",
    "layout.option.slider_direction.left_to_right": "left_to_right (0% -> 100%)",
    "layout.option.slider_direction.right_to_left": "right_to_left (100% -> 0%)",
    "layout.option.slider_direction.bottom_to_top": "bottom_to_top (0% -> 100%)",
    "layout.option.slider_direction.top_to_bottom": "top_to_bottom (100% -> 0%)",
    "layout.actions.heading": "Acciones",
    "layout.actions.reload": "Recargar",
    "layout.actions.save": "Guardar",
    "layout.actions.export": "Exportar",
    "layout.actions.import": "Importar JSON",
    "layout.actions.paste_placeholder": "Pega aqui el JSON del layout",
    "layout.canvas.title": "Canvas",
    "layout.default_page.title": "Sala",
    "layout.status.loading": "Cargando layout...",
    "layout.status.load_failed": "Error al cargar layout, usando default: {error}",
    "layout.status.loaded": "Layout cargado",
    "layout.status.entity_fetch_failed": "Error al cargar entidades: {error}",
    "layout.status.saving": "Guardando layout...",
    "layout.status.saved": "Layout guardado",
    "layout.status.imported": "Layout importado (aun no guardado)",
    "layout.status.at_least_one_page": "Se requiere al menos una pagina",
    "layout.status.entity_domain_required": "La entidad debe usar el dominio: {domains}",
    "layout.status.expected_domain": "el dominio esperado",
    "layout.status.secondary_sensor_required": "La entidad real debe empezar con sensor.",
    "layout.status.invalid_json": "JSON de layout invalido",
    "layout.status.save_failed": "Error al guardar: {error}",
    "layout.status.conflict_title": "El diseno del panel cambio en otro lugar",
    "layout.status.conflict_confirm": "El diseno del panel se modifico desde otra fuente (otra pestana, la API o una restauracion).\n\nAceptar = sobrescribir con esta version del editor\nCancelar = conservar la version del panel (recarga la pagina para descartar los cambios locales).",
    "layout.status.conflict_overridden": "Cambios del panel sobrescritos por este editor.",
    "layout.status.import_failed": "Error al importar: {error}",
    "layout.status.file_import_failed": "Error al importar archivo: {error}",
    "provision.wifi.title": "Provision Wi-Fi",
    "provision.wifi.subtitle": "Conecta el panel a tu red Wi-Fi.",
    "provision.wifi.ssid": "SSID",
    "provision.wifi.country_code": "Codigo de pais",
    "provision.wifi.password": "Contrasena",
    "provision.wifi.password_placeholder": "Contrasena Wi-Fi",
    "provision.wifi.show_password": "Mostrar contrasena",
    "provision.ha.title": "Provision HA",
    "provision.ha.subtitle": "Conecta el panel a Home Assistant.",
    "provision.ha.ws_url": "URL WebSocket (ws:// o wss://)",
    "provision.ha.token": "Token de acceso de larga duracion",
    "provision.ha.show_token": "Mostrar token",
    "settings.wifi.heading": "Wi-Fi",
    "settings.wifi.ssid": "SSID",
    "settings.wifi.country_code": "Codigo de pais",
    "settings.wifi.bssid": "Bloqueo BSSID (opcional)",
    "settings.wifi.password": "Contrasena",
    "settings.wifi.password_placeholder": "Dejar vacio para conservar la contrasena guardada",
    "settings.ha.heading": "Home Assistant",
    "settings.ha.ws_url": "URL WebSocket (ws:// o wss://)",
    "settings.ha.token": "Token de acceso de larga duracion",
    "settings.ha.token_placeholder": "Dejar vacio para conservar el token guardado",
    "settings.ha.rest_fallback": "Activar fallback REST de HA (por defecto: off, se prefiere WS)",
    "settings.xiaozhi.heading": "Xiaozhi IA",
    "settings.xiaozhi.enabled": "Activar asistente de voz Xiaozhi IA",
    "settings.xiaozhi.cloud_activation": "Activacion en la nube (codigo de vinculacion)",
    "settings.xiaozhi.server": "URL WebSocket (ws:// o wss://)",
    "settings.xiaozhi.ota_url": "URL OTA de la nube Xiaozhi (codigo de vinculacion)",
    "settings.xiaozhi.device": "ID de dispositivo (opcional)",
    "settings.xiaozhi.token": "Token de acceso",
    "settings.cameras.heading": "Camaras",
    "settings.cameras.item_refresh": "Actualizacion: {ms} ms",
    "settings.cameras.disabled": "Desactivada",
    "layout.status.xiaozhi_page_only": "Las paginas Xiaozhi estan dedicadas al asistente de voz y no aceptan widgets.",
    "layout.status.xiaozhi_page_locked": "Esta pagina la gestiona el asistente de voz Xiaozhi AI integrado en el firmware. Configuralo en Ajustes -> Xiaozhi AI.",
    "layout.pages.xiaozhi_title": "Xiaozhi",
    "settings.cameras.hint": "Configura hasta 4 camaras (entidades HA camera.* o instantaneas HTTP).",
    "settings.cameras.add": "+ Agregar camara",
    "settings.cameras.name": "Nombre",
    "settings.cameras.source": "Fuente",
    "settings.cameras.source_ha": "Entidad HA (camera.*)",
    "settings.cameras.source_http": "URL de instantanea HTTP",
    "settings.cameras.entity": "Entidad de camara",
    "settings.cameras.url": "URL de instantanea (http:// o https://)",
    "settings.cameras.username": "Usuario (opcional)",
    "settings.cameras.password": "Contrasena (opcional)",
    "settings.cameras.refresh_ms": "Actualizacion (ms)",
    "settings.cameras.enabled": "Activada",
    "settings.cameras.save": "Guardar",
    "settings.cameras.delete": "Eliminar",
    "settings.cameras.none": "Sin camaras. Agrega la primera camara.",
    "settings.cameras.saved": "Camaras guardadas.",
    "settings.cameras.load_failed": "No se pudieron cargar las camaras: {error}",
    "settings.cameras.save_failed": "Error al guardar: {error}",
    "settings.cameras.invalid_url": "La URL debe comenzar con http:// o https://",
    "settings.cameras.entity_hint": "No se encontraron entidades camera.* — revisa la conexion HA.",
    "settings.cameras.entity_loading": "Cargando camaras...",
    "settings.cameras.invalid_entity": "Selecciona una entidad camera.*",
    "settings.cameras.delete_confirm": "Eliminar la camara \"{name}\"?",
    "settings.localCam.heading": "Camara integrada",
    "settings.localCam.hint": "Camara OV5647 MIPI-CSI integrada. Los cambios se aplican de inmediato, sin reinicio.",
    "settings.localCam.enabled": "Camara activada",
    "settings.localCam.stream": "Transmision en vivo a HA (MJPEG)",
    "settings.localCam.motion": "Deteccion de movimiento (despertar pantalla)",
    "settings.localCam.threshold": "Sensibilidad de movimiento (1..64, menor = mas sensible)",
    "settings.localCam.quality": "Calidad JPEG (10..95)",
    "settings.localCam.resolution": "Resolucion",
    "settings.localCam.resolution_native": "1280x960 (nativa)",
    "settings.localCam.resolution_half": "640x480 (mitad)",
    "settings.localCam.hflip": "Voltear horizontal (H)",
    "settings.localCam.vflip": "Voltear vertical (V)",
    "settings.localCam.save": "Guardar",
    "settings.localCam.refresh_preview": "Actualizar vista previa",
    "settings.localCam.preview_hint": "La vista previa funciona cuando la camara esta activada.",
    "settings.localCam.saved": "Ajustes de camara guardados.",
    "settings.localCam.save_failed": "Error al guardar: {error}",
    "settings.localCam.status_error": "No se pudo cargar el estado de la camara: {error}",
    "settings.localCam.snapshot_failed": "Error en la captura: {error}",
    "settings.localCam.motion_heading": "Deteccion de movimiento",
    "settings.localCam.motion_hint": "Zonas y umbrales para la deteccion de movimiento. Coordenadas en % del cuadro (x, y desde arriba a la izquierda).",
    "settings.localCam.motion_min_area": "Area minima cambiada (%)",
    "settings.localCam.motion_min_duration": "Duracion minima del movimiento (ms, 0 = off)",
    "settings.localCam.motion_cooldown": "Espera entre detecciones (ms)",
    "settings.localCam.motion_start_delay": "Retardo tras iniciar la camara (ms)",
    "settings.localCam.motion_ignore_lighting": "Ignorar cambios bruscos de luz",
    "settings.localCam.zones_hint": "Arrastra sobre la vista previa para dibujar una zona (max. 4). Sin zonas = cuadro completo.",
    "settings.localCam.zones_refresh": "Actualizar vista de zonas",
    "settings.localCam.zones_clear": "Borrar zonas",
    "settings.localCam.zones_remove": "Eliminar zona",
    "settings.localCam.motion_diag": "Comprobar deteccion",
    "settings.localCam.motion_level": "Nivel",
    "settings.localCam.motion_changed": "cambiado",
    "settings.localCam.motion_active": "Movimiento",
    "settings.localCam.motion_triggers": "disparos",
    "settings.localCam.motion_lighting": "luz ignorada",
    "settings.localCam.motion_diag_failed": "Fallo al comprobar la deteccion: {error}",
    "settings.time.heading": "Hora",
    "settings.time.ntp_server": "Servidor NTP",
    "settings.time.timezone": "Zona horaria (POSIX TZ)",
    "settings.ui.heading": "UI",
    "settings.theme.heading": "Tema",
    "settings.ui.language": "Idioma",
    "settings.ui.reload_languages": "Recargar idiomas",
    "settings.ui.download_json": "Descargar JSON",
    "settings.ui.upload_code": "Codigo de idioma",
    "settings.ui.upload_file": "Archivo JSON de traduccion",
    "settings.ui.upload_button": "Subir / Agregar idioma",
    "settings.ap.heading": "AP de setup",
    "settings.ap.hint": "Si el AP de setup esta activo, conectate y abre <code>http://192.168.4.1</code>.",
    "settings.ota.heading": "Actualizacion de firmware",
    "settings.ota.url": "URL OTA",
    "settings.ota.url_placeholder": "https://example.com/betta-ha-panel-7b.ota.bin",
    "settings.ota.flash_url": "Flashear URL",
    "settings.ota.refresh": "Actualizar estado",
    "settings.ota.file": "Archivo OTA .bin",
    "settings.ota.upload": "Subir + Flashear",
    "settings.ota.idle": "Listo para una imagen OTA de app. Ejecutando: {running}, siguiente slot: {next}, tamano de slot: {size}.",
    "settings.ota.running": "OTA en curso: {progress}% ({written} / {total})",
    "settings.ota.downloading": "Descargando desde URL: {progress}% ({written} / {total})",
    "settings.ota.uploading": "Upload recibido por el panel: {progress}% ({written} / {total})",
    "settings.ota.success": "Imagen OTA escrita. Reiniciando ahora.",
    "settings.ota.error": "OTA fallo: {error}",
    "settings.ota.rebooting": "El dispositivo se esta reiniciando. Abre el panel de nuevo cuando vuelva online.",
    "settings.ota.no_file": "Elige primero un archivo OTA .bin.",
    "settings.ota.no_url": "Pega primero una URL OTA.",
    "settings.ota.starting_url": "Iniciando OTA desde URL...",
    "settings.ota.upload_progress": "Subiendo al panel: {progress}% ({written} / {total})",
    "settings.ota.request_failed": "Solicitud OTA fallida: {error}",
    "settings.ota.target_slot": "Slot destino: {partition}",
    "settings.actions.heading": "Acciones de configuracion",
    "settings.actions.reload": "Recargar configuracion",
    "settings.actions.save": "Guardar + Reiniciar",
    "settings.actions.hint": "Despues de guardar, el dispositivo reinicia y puede cambiar del AP de setup al Wi-Fi de casa.",
    "settings.info.configured": "Configurado",
    "settings.info.connected": "Conectado",
    "settings.info.password_stored": "Contrasena guardada",
    "settings.info.country": "Pais",
    "settings.info.rssi": "RSSI (AP conectado)",
    "settings.info.connected_bssid": "BSSID conectado",
    "settings.info.channel": "Canal",
    "settings.info.token_stored": "Token guardado",
    "settings.info.rest_fallback": "Fallback REST",
    "common.yes": "si",
    "common.no": "no",
    "common.scan": "Escanear",
    "common.scan_wifi": "Escanear Wi-Fi",
    "common.save_reboot": "Guardar + Reiniciar",
    "status.idle": "Listo",
    "status.loading_settings": "Cargando configuracion...",
    "status.settings_loaded": "Configuracion cargada",
    "status.settings_load_failed": "Error al cargar configuracion: {error}",
    "status.settings_save_failed": "Error al guardar configuracion: {error}",
    "status.saving_settings": "Guardando configuracion...",
    "status.settings_saved_reboot": "Configuracion guardada. El dispositivo reinicia en ~2s.",
    "status.wifi_scan_running": "Escaneo Wi-Fi en curso...",
    "status.wifi_scan_complete": "Escaneo Wi-Fi completo ({count} redes)",
    "status.wifi_scan_failed": "Error en escaneo Wi-Fi: {error}",
    "status.wifi_scan_timeout": "Tiempo de espera agotado para escaneo Wi-Fi",
    "common.unknown_error": "Error desconocido",
    "wifi.scan_unavailable": "El escaneo Wi-Fi no esta disponible en modo setup AP en este hardware. Ingresa SSID manualmente.",
    "wifi.scan_click": "Pulsa \"Escanear Wi-Fi\" para listar redes cercanas.",
    "wifi.scan_click_short": "Pulsa \"Escanear\" para listar redes cercanas.",
    "wifi.scan_no_networks": "No se encontraron redes. Acercate al router e intenta de nuevo.",
    "wifi.scan_found": "{count} red(es) encontradas. Selecciona una para llenar SSID.",
    "wifi.scan.connected_tag": "conectado",
    "wifi.scan.option_unavailable": "Escaneo no disponible",
    "wifi.scan.option_scanning": "Escaneando...",
    "wifi.scan.option_not_run": "Sin escaneo",
    "wifi.scan.option_no_networks": "No se encontraron redes",
    "wifi.scan.option_select": "Selecciona red ({count} encontradas)",
    "settings.time.info": "Se aplica despues de reiniciar. La sincronizacion inicia cuando Wi-Fi esta conectado.",
    "settings.ui.info": "La vista previa cambia al instante. El idioma guardado se aplica tras reiniciar.",
    "settings.ap.active": "AP de setup activo: {ssid}\\nAbre http://192.168.4.1 conectado a este AP.",
    "settings.ap.inactive": "AP de setup inactivo.\\nUsa la IP del panel en tu Wi-Fi.",
    "settings.translation.info": "Sube un JSON para agregar o actualizar un idioma.",
    "settings.translation.upload_ok": "Idioma \"{lang}\" subido.",
    "settings.translation.upload_fail": "Error de subida: {error}",
    "settings.translation.no_file": "Selecciona primero un archivo JSON.",
    "settings.translation.invalid_json": "JSON invalido",
    "settings.translation.object_required": "El JSON debe ser un objeto",
    "settings.translation.invalid_code": "El codigo de idioma debe usar [a-z0-9_-] y tener 2-15 caracteres.",
    "settings.language.invalid_country": "El codigo de pais Wi-Fi debe ser ISO de 2 letras (p.ej. US, DE)",
    "settings.language.invalid_bssid": "El BSSID debe estar vacio o en formato AA:BB:CC:DD:EE:FF",
    "settings.language.invalid_ha_url": "La URL HA debe empezar con ws:// o wss://",
    "settings.language.invalid_xiaozhi_url": "La URL Xiaozhi debe empezar con ws:// o wss://",
    "settings.language.invalid_ota_url": "La URL OTA Xiaozhi debe empezar con http:// o https://",
    "provision.wifi.required_ssid": "SSID es obligatorio.",
    "provision.wifi.required_country": "El codigo de pais debe tener 2 letras (p.ej. US, DE).",
    "provision.ha.required_url": "La URL WebSocket es obligatoria.",
    "provision.ha.invalid_url": "La URL HA debe empezar con ws:// o wss://.",
    "provision.ha.required_token": "El token de acceso es obligatorio.",
    "provision.saving_reboot": "Guardando configuracion y reiniciando...",
    "provision.saved_reboot": "Configuracion guardada. El dispositivo reinicia en ~2s.",
    "provision.save_failed": "Error al guardar: {error}",
    "provision.wifi.hint": "Guardar reinicia el panel. Despues se muestra la provision de HA.",
    "provision.ha.hint": "Guardar reinicia el panel. Despues se desbloquea el editor.",
    "settings.language.option_de": "Aleman",
    "settings.language.option_en": "Ingles",
    "settings.language.option_es": "Espanol",
    "settings.language.option_fr": "Frances",
    "settings.language.option_pl": "Polaco",
    "layout.widgets.presence_home": "En casa",
    "layout.widgets.presence_away": "Fuera",
    "layout.music.preview_auto": "Deteccion automatica",
    "layout.pages.rename": "Renombrar",
  },
  fr: {
    "tabs.layout": "Layout",
    "tabs.settings": "Parametres",
    "sidebar.title": "BETTA Editor",
    "sidebar.subtitle": "Source du layout: JSON",
    "layout.pages.heading": "Pages",
    "layout.pages.add": "+ Page",
    "layout.pages.delete": "Supprimer",
    "layout.pages.title_label": "Titre de page",
    "layout.pages.title_placeholder": "Nom de page sur l'ecran",
    "layout.pages.apply_title": "Appliquer le titre",
    "layout.pages.new_title": "Page {number}",
    "layout.widgets.heading": "Widgets",
    "layout.widgets.add_sensor": "+ Capteur",
    "layout.widgets.add_binary": "+ Capteur binaire",
    "layout.widgets.add_button": "+ Bouton",
    "layout.widgets.add_slider": "+ Curseur",
    "layout.widgets.add_graph": "+ Graphe",
    "layout.widgets.add_empty_tile": "+ Tuile vide",
    "layout.widgets.add_light_tile": "+ Tuile lumiere",
    "layout.widgets.add_heating_tile": "+ Tuile chauffage",
    "layout.widgets.add_weather_tile": "+ Meteo",
    "layout.widgets.add_weather_3day": "+ Prévision météo",
    "layout.widgets.delete": "Supprimer le widget",
    "entity_picker.title": "Choisir une lumiere",
    "entity_picker.refresh": "Actualiser",
    "entity_picker.close": "Fermer",
    "entity_picker.blank": "Tuile lumiere vide",
    "entity_picker.loading": "Chargement des lumieres...",
    "entity_picker.refreshing": "Actualisation des lumieres...",
    "entity_picker.pending": "En attente de Home Assistant...",
    "entity_picker.disconnected": "Home Assistant n'est pas connecte.",
    "entity_picker.empty": "Aucune entite lumiere trouvee.",
    "entity_picker.truncated": "Liste limitee par le firmware.",
    "entity_picker.unassigned_room": "Sans piece",
    "entity_picker.added": "Tuile lumiere ajoutee: {entity}",
    "entity_picker.fetch_failed": "Echec de la recherche de lumieres: {error}",
    "layout.inspector.heading": "Inspecteur",
    "layout.tile_look.group": "Aspect de la tuile (cette tuile)",
    "layout.tile_look.preset": "Prereglage",
    "layout.tile_look.bg_color": "Couleur de fond",
    "layout.tile_look.bg_grad_color": "Couleur de fin du degrade",
    "layout.tile_look.bg_grad_dir": "Direction du degrade",
    "layout.tile_look.border_color": "Couleur de bordure",
    "layout.tile_look.border_width": "Epaisseur de bordure (px)",
    "layout.tile_look.radius": "Rayon des coins (px)",
    "layout.tile_look.corner_shape": "Forme des coins",
    "layout.tile_look.corner_hint": "Avec le rayon maximal, une tuile carree devient un cercle.",
    "layout.tile_look.opacity": "Opacite du fond (%)",
    "layout.tile_look.font_scale": "Taille de police",
    "layout.tile_look.shadow": "Ombre portee",
    "layout.tile_look.text_color": "Couleur du texte (tout)",
    "layout.tile_look.title_color": "Couleur du titre",
    "layout.tile_look.label_color": "Couleur du libelle d'entite",
    "layout.tile_look.value_color": "Couleur de la valeur / etat",
    "layout.tile_look.icon_color": "Couleur de l'icone",
    "layout.tile_look.reset": "Reinitialiser l'aspect de la tuile",
    "layout.tile_look.hint": "Les champs vides utilisent le theme. Couleurs au format #RRGGBB.",
  "layout.tile_look.copy_source": "Copier l'aspect de",
  "layout.tile_look.copy_apply": "Copier l'aspect",
  "layout.tile_look.copy_apply_page": "Appliquer a toutes les tuiles",
  "layout.tile_look.copy_placeholder": "Choisir une tuile...",
  "layout.tile_look.copy_empty": "Aucune autre tuile a copier",
  "layout.tile_look.copy_none": "Choisissez d'abord une tuile source.",
  "layout.tile_look.copy_done": "Aspect copie de : {source}",
  "layout.tile_look.copy_page_done": "Aspect applique a {count} tuile(s).",
  "layout.tile_look.copy_hint": "Copie uniquement le fond, la bordure, les couleurs et la taille de police - entite, titre et taille inchanges.",
    "layout.page_look.heading": "Apparence de la page",
    "layout.page_look.group": "Apparence de la page (cette page)",
    "layout.page_look.preset": "Preset",
    "layout.page_look.bg_color": "Couleur de fond",
    "layout.page_look.bg_grad_color": "Couleur de fin du degrade",
    "layout.page_look.bg_grad_dir": "Direction du degrade",
    "layout.page_look.wallpaper": "Utiliser le fond d'ecran du panneau",
    "layout.page_look.dim": "Assombrir le fond (%)",
    "layout.page_look.reset": "Reinitialiser l'apparence",
    "layout.page_look.reset_done": "Apparence de la page reinitialisee.",
    "layout.page_look.page_theme": "Theme pour cette page uniquement",
    "layout.page_look.page_theme_hint": "La page est redessinee avec ce theme des qu'elle est affichee. \"Global\" suit le theme actif / jour-nuit.",
    "layout.page_look.theme_none": "- theme global / jour-nuit -",
    "layout.page_look.hint": "Les champs vides utilisent le fond du panneau. Le fond d'ecran est assombri sur le panneau.",
    "layout.option.page_preset.auto": "Defaut du panneau",
    "layout.option.page_preset.midnight": "Minuit",
    "layout.option.page_preset.deep_sea": "Grand large",
    "layout.option.page_preset.forest": "Foret",
    "layout.option.page_preset.sunset": "Coucher de soleil",
    "layout.option.page_preset.plum": "Prune",
    "layout.option.page_preset.wallpaper": "Fond d'ecran",
    "layout.option.page_preset.wallpaper_dim": "Fond d'ecran (sombre)",
    "layout.option.page_grad_dir.none": "Aucune",
    "layout.option.page_grad_dir.hor": "Horizontal",
    "layout.option.page_grad_dir.ver": "Vertical",
    "layout.option.tile_grad_dir.none": "Aucun",
    "layout.option.tile_grad_dir.hor": "Horizontal",
    "layout.option.tile_grad_dir.ver": "Vertical",
    "layout.option.tile_font_scale.auto": "Auto",
    "layout.option.tile_font_scale.s": "Petite",
    "layout.option.tile_font_scale.m": "Moyenne",
    "layout.option.tile_font_scale.l": "Grande",
    "layout.option.tile_font_scale.xl": "Tres grande",
    "layout.option.tile_preset.auto": "Theme par defaut",
    "layout.option.tile_preset.graphite": "Graphite",
    "layout.option.tile_preset.emerald": "Emeraude",
    "layout.option.tile_preset.amber": "Ambre",
    "layout.option.tile_preset.violet": "Violet",
    "layout.option.tile_preset.sky": "Ciel",
    "layout.option.tile_preset.glass": "Verre",
    "layout.option.tile_corner.custom": "Personnalise (utiliser le rayon)",
    "layout.option.tile_corner.square": "Carre (0 px)",
    "layout.option.tile_corner.soft": "Doux (10 px)",
    "layout.option.tile_corner.rounded": "Arrondi (16 px)",
    "layout.option.tile_corner.pill": "Pilule (40 px)",
    "layout.option.tile_corner.circle": "Cercle (rayon max)",
    "layout.inspector.title": "Titre",
    "layout.inspector.entity": "Entite",
    "layout.inspector.secondary_entity": "Entite reelle (capteur)",
    "layout.inspector.button_mode": "Mode du bouton",
    "layout.inspector.button_accent_color": "Couleur d'accent du bouton",
    "layout.inspector.button_style": "Style du bouton",
    "layout.inspector.slider_entity_domain": "Type d'entite du curseur",
    "layout.inspector.slider_direction": "Direction du curseur",
    "layout.inspector.slider_accent_color": "Couleur d'accent du curseur",
    "layout.inspector.graph_line_color": "Couleur de ligne du graphe",
    "layout.inspector.graph_time_window_min": "Fenetre de temps (minutes)",
    "layout.inspector.graph_point_count": "Points de rendu (vide = auto)",
    "layout.inspector.graph_display_mode": "Mode d'affichage",
    "layout.inspector.graph_bar_bucket_min": "Intervalle de barres (min)",
    "layout.inspector.binary_show_title": "Afficher le titre",
    "layout.inspector.binary_color_on": "Couleur si ON",
    "layout.inspector.binary_color_off": "Couleur si OFF",
    "layout.inspector.binary_text_on": "Texte si ON",
    "layout.inspector.binary_text_off": "Texte si OFF",
    "layout.option.graph_display_mode.line": "Ligne avec points",
    "layout.option.graph_display_mode.line_smooth_points": "Ligne lissee avec points",
    "layout.option.graph_display_mode.line_smooth": "Ligne lissee",
    "layout.option.graph_display_mode.bars": "Barres",
    "layout.inspector.apply": "Appliquer",
    "layout.option.button_mode.auto": "auto (interrupteur par defaut)",
    "layout.option.button_mode.play_pause": "play/pause (media_player)",
    "layout.option.button_mode.stop": "stop (media_player)",
    "layout.option.button_mode.next": "next (media_player)",
    "layout.option.button_mode.previous": "previous (media_player)",
    "layout.option.button_style.switch": "Interrupteur (curseur)",
    "layout.option.button_style.power_toggle": "Icône d'alimentation (nom + icône)",
    "layout.option.button_style.power_status": "Icône d'alimentation + texte de statut",
    "layout.option.button_style.plug_icon": "Icône de prise (nom + icône)",
    "layout.option.button_style.lamp_icon": "Icône de lampe/ampoule (nom + icône)",
    "layout.option.button_style.highlight": "Surligner la tuile (accent quand ON)",
    "layout.option.button_style.status_text": "Texte ON/OFF uniquement (sans icône)",
    "layout.option.slider_entity_domain.auto": "auto (light, media_player, cover)",
    "layout.option.slider_entity_domain.light": "light",
    "layout.option.slider_entity_domain.media_player": "media_player",
    "layout.option.slider_entity_domain.cover": "cover",
    "layout.option.slider_direction.auto": "auto (selon largeur/hauteur)",
    "layout.option.slider_direction.left_to_right": "left_to_right (0% -> 100%)",
    "layout.option.slider_direction.right_to_left": "right_to_left (100% -> 0%)",
    "layout.option.slider_direction.bottom_to_top": "bottom_to_top (0% -> 100%)",
    "layout.option.slider_direction.top_to_bottom": "top_to_bottom (100% -> 0%)",
    "layout.actions.heading": "Actions",
    "layout.actions.reload": "Recharger",
    "layout.actions.save": "Enregistrer",
    "layout.actions.export": "Exporter",
    "layout.actions.import": "Importer JSON",
    "layout.actions.paste_placeholder": "Coller le JSON du layout ici",
    "layout.canvas.title": "Canvas",
    "layout.default_page.title": "Salon",
    "layout.status.loading": "Chargement du layout...",
    "layout.status.load_failed": "Echec du chargement du layout, defaut utilise: {error}",
    "layout.status.loaded": "Layout charge",
    "layout.status.entity_fetch_failed": "Echec du chargement des entites: {error}",
    "layout.status.saving": "Enregistrement du layout...",
    "layout.status.saved": "Layout enregistre",
    "layout.status.imported": "Layout importe (pas encore enregistre)",
    "layout.status.at_least_one_page": "Au moins une page est requise",
    "layout.status.entity_domain_required": "L'entite doit utiliser le domaine: {domains}",
    "layout.status.expected_domain": "le domaine attendu",
    "layout.status.secondary_sensor_required": "L'entite reelle doit commencer par sensor.",
    "layout.status.invalid_json": "JSON de layout invalide",
    "layout.status.save_failed": "Echec de l'enregistrement: {error}",
    "layout.status.conflict_title": "La disposition du panneau a change ailleurs",
    "layout.status.conflict_confirm": "La disposition du panneau a ete modifiee depuis une autre source (autre onglet, API ou restauration).\n\nOK = ecraser avec cette version de l'editeur\nAnnuler = conserver la version du panneau (rechargez la page pour annuler les modifications locales).",
    "layout.status.conflict_overridden": "Modifications du panneau ecrasees par cet editeur.",
    "layout.status.import_failed": "Echec de l'import: {error}",
    "layout.status.file_import_failed": "Echec de l'import du fichier: {error}",
    "provision.wifi.title": "Provision Wi-Fi",
    "provision.wifi.subtitle": "Connectez le panneau a votre Wi-Fi.",
    "provision.wifi.ssid": "SSID",
    "provision.wifi.country_code": "Code pays",
    "provision.wifi.password": "Mot de passe",
    "provision.wifi.password_placeholder": "Mot de passe Wi-Fi",
    "provision.wifi.show_password": "Afficher le mot de passe",
    "provision.ha.title": "Provision HA",
    "provision.ha.subtitle": "Connectez le panneau a Home Assistant.",
    "provision.ha.ws_url": "URL WebSocket (ws:// ou wss://)",
    "provision.ha.token": "Jeton d'acces longue duree",
    "provision.ha.show_token": "Afficher le token",
    "settings.wifi.heading": "Wi-Fi",
    "settings.wifi.ssid": "SSID",
    "settings.wifi.country_code": "Code pays",
    "settings.wifi.bssid": "Verrou BSSID (optionnel)",
    "settings.wifi.password": "Mot de passe",
    "settings.wifi.password_placeholder": "Laisser vide pour garder le mot de passe stocke",
    "settings.ha.heading": "Home Assistant",
    "settings.ha.ws_url": "URL WebSocket (ws:// ou wss://)",
    "settings.ha.token": "Jeton d'acces longue duree",
    "settings.ha.token_placeholder": "Laisser vide pour garder le token stocke",
    "settings.ha.rest_fallback": "Activer le fallback REST HA (defaut: off, WS prefere)",
    "settings.xiaozhi.heading": "Xiaozhi IA",
    "settings.xiaozhi.enabled": "Activer l'assistant vocal Xiaozhi IA",
    "settings.xiaozhi.cloud_activation": "Activation cloud (code d'appairage)",
    "settings.xiaozhi.server": "URL WebSocket (ws:// ou wss://)",
    "settings.xiaozhi.ota_url": "URL OTA du cloud Xiaozhi (code d'appairage)",
    "settings.xiaozhi.device": "ID de l'appareil (facultatif)",
    "settings.xiaozhi.token": "Jeton d'acces",
    "settings.cameras.heading": "Cameras",
    "settings.cameras.item_refresh": "Actualisation : {ms} ms",
    "settings.cameras.disabled": "Desactivee",
    "layout.status.xiaozhi_page_only": "Les pages Xiaozhi sont dediees a l'assistant vocal et n'acceptent pas de widgets.",
    "layout.status.xiaozhi_page_locked": "Cette page est geree par l'assistant vocal Xiaozhi AI integre au firmware. Configurez-le dans Reglages -> Xiaozhi AI.",
    "layout.pages.xiaozhi_title": "Xiaozhi",
    "settings.cameras.hint": "Configurez jusqu'a 4 cameras (entites HA camera.* ou instantanes HTTP).",
    "settings.cameras.add": "+ Ajouter une camera",
    "settings.cameras.name": "Nom",
    "settings.cameras.source": "Source",
    "settings.cameras.source_ha": "Entite HA (camera.*)",
    "settings.cameras.source_http": "URL d'instantane HTTP",
    "settings.cameras.entity": "Entite de camera",
    "settings.cameras.url": "URL de l'instantane (http:// ou https://)",
    "settings.cameras.username": "Utilisateur (facultatif)",
    "settings.cameras.password": "Mot de passe (facultatif)",
    "settings.cameras.refresh_ms": "Actualisation (ms)",
    "settings.cameras.enabled": "Activee",
    "settings.cameras.save": "Enregistrer",
    "settings.cameras.delete": "Supprimer",
    "settings.cameras.none": "Aucune camera. Ajoutez votre premiere camera.",
    "settings.cameras.saved": "Cameras enregistrees.",
    "settings.cameras.load_failed": "Impossible de charger les cameras : {error}",
    "settings.cameras.save_failed": "Echec de l'enregistrement : {error}",
    "settings.cameras.invalid_url": "L'URL doit commencer par http:// ou https://",
    "settings.cameras.entity_hint": "Aucune entite camera.* trouvee — verifiez la connexion HA.",
    "settings.cameras.entity_loading": "Chargement des cameras...",
    "settings.cameras.invalid_entity": "Selectionnez une entite camera.*",
    "settings.cameras.delete_confirm": "Supprimer la camera \"{name}\" ?",
    "settings.localCam.heading": "Camera integree",
    "settings.localCam.hint": "Camera OV5647 MIPI-CSI integree. Les changements s'appliquent immediatement, sans redemarrage.",
    "settings.localCam.enabled": "Camera activee",
    "settings.localCam.stream": "Flux en direct vers HA (MJPEG)",
    "settings.localCam.motion": "Detection de mouvement (reveil ecran)",
    "settings.localCam.threshold": "Sensibilite au mouvement (1..64, plus petit = plus sensible)",
    "settings.localCam.quality": "Qualite JPEG (10..95)",
    "settings.localCam.resolution": "Resolution",
    "settings.localCam.resolution_native": "1280x960 (native)",
    "settings.localCam.resolution_half": "640x480 (moitie)",
    "settings.localCam.hflip": "Retourner horizontalement (H)",
    "settings.localCam.vflip": "Retourner verticalement (V)",
    "settings.localCam.save": "Enregistrer",
    "settings.localCam.refresh_preview": "Actualiser l'apercu",
    "settings.localCam.preview_hint": "L'apercu fonctionne lorsque la camera est activee.",
    "settings.localCam.saved": "Parametres de la camera enregistres.",
    "settings.localCam.save_failed": "Echec de l'enregistrement : {error}",
    "settings.localCam.status_error": "Echec du chargement de l'etat de la camera : {error}",
    "settings.localCam.snapshot_failed": "Echec de la capture : {error}",
    "settings.localCam.motion_heading": "Detection de mouvement",
    "settings.localCam.motion_hint": "Zones et seuils de detection de mouvement. Coordonnees en % de l'image (x, y depuis le coin superieur gauche).",
    "settings.localCam.motion_min_area": "Surface modifiee min. (%)",
    "settings.localCam.motion_min_duration": "Duree min. du mouvement (ms, 0 = off)",
    "settings.localCam.motion_cooldown": "Delai entre detections (ms)",
    "settings.localCam.motion_start_delay": "Delai apres le demarrage de la camera (ms)",
    "settings.localCam.motion_ignore_lighting": "Ignorer les changements de lumiere brusques",
    "settings.localCam.zones_hint": "Glissez sur l'apercu pour dessiner une zone (max. 4). Sans zone = image entiere.",
    "settings.localCam.zones_refresh": "Actualiser l'apercu des zones",
    "settings.localCam.zones_clear": "Effacer les zones",
    "settings.localCam.zones_remove": "Supprimer la zone",
    "settings.localCam.motion_diag": "Verifier la detection",
    "settings.localCam.motion_level": "Niveau",
    "settings.localCam.motion_changed": "modifie",
    "settings.localCam.motion_active": "Mouvement",
    "settings.localCam.motion_triggers": "declenchements",
    "settings.localCam.motion_lighting": "lumiere ignoree",
    "settings.localCam.motion_diag_failed": "Echec de la verification : {error}",
    "settings.time.heading": "Temps",
    "settings.time.ntp_server": "Serveur NTP",
    "settings.time.timezone": "Fuseau horaire (POSIX TZ)",
    "settings.ui.heading": "UI",
    "settings.theme.heading": "Thème",
    "settings.ui.language": "Langue",
    "settings.ui.reload_languages": "Recharger les langues",
    "settings.ui.download_json": "Telecharger JSON",
    "settings.ui.upload_code": "Code langue",
    "settings.ui.upload_file": "Fichier JSON de traduction",
    "settings.ui.upload_button": "Uploader / Ajouter une langue",
    "settings.ap.heading": "Setup AP",
    "settings.ap.hint": "Si le setup AP est actif, connectez-vous et ouvrez <code>http://192.168.4.1</code>.",
    "settings.ota.heading": "Mise a jour firmware",
    "settings.ota.url": "URL OTA",
    "settings.ota.url_placeholder": "https://example.com/betta-ha-panel-7b.ota.bin",
    "settings.ota.flash_url": "Flasher URL",
    "settings.ota.refresh": "Actualiser statut",
    "settings.ota.file": "Fichier OTA .bin",
    "settings.ota.upload": "Upload + Flash",
    "settings.ota.idle": "Pret pour une image OTA app. En cours: {running}, prochain slot: {next}, taille du slot: {size}.",
    "settings.ota.running": "OTA en cours: {progress}% ({written} / {total})",
    "settings.ota.downloading": "Telechargement depuis URL: {progress}% ({written} / {total})",
    "settings.ota.uploading": "Upload recu par le panneau: {progress}% ({written} / {total})",
    "settings.ota.success": "Image OTA ecrite. Redemarrage en cours.",
    "settings.ota.error": "OTA echouee: {error}",
    "settings.ota.rebooting": "L'appareil redemarre. Rouvrez le panneau lorsqu'il est de retour en ligne.",
    "settings.ota.no_file": "Choisissez d'abord un fichier OTA .bin.",
    "settings.ota.no_url": "Collez d'abord une URL OTA.",
    "settings.ota.starting_url": "Demarrage de l'OTA depuis l'URL...",
    "settings.ota.upload_progress": "Upload vers le panneau: {progress}% ({written} / {total})",
    "settings.ota.request_failed": "Requete OTA echouee: {error}",
    "settings.ota.target_slot": "Slot cible: {partition}",
    "settings.actions.heading": "Actions des parametres",
    "settings.actions.reload": "Recharger les parametres",
    "settings.actions.save": "Enregistrer + Redemarrer",
    "settings.actions.hint": "Apres enregistrement, l'appareil redemarre et peut passer du setup AP au Wi-Fi domestique.",
    "settings.info.configured": "Configure",
    "settings.info.connected": "Connecte",
    "settings.info.password_stored": "Mot de passe stocke",
    "settings.info.country": "Pays",
    "settings.info.rssi": "RSSI (AP connecte)",
    "settings.info.connected_bssid": "BSSID connecte",
    "settings.info.channel": "Canal",
    "settings.info.token_stored": "Token stocke",
    "settings.info.rest_fallback": "Fallback REST",
    "common.yes": "oui",
    "common.no": "non",
    "common.scan": "Scanner",
    "common.scan_wifi": "Scanner Wi-Fi",
    "common.save_reboot": "Enregistrer + Redemarrer",
    "status.idle": "Pret",
    "status.loading_settings": "Chargement des parametres...",
    "status.settings_loaded": "Parametres charges",
    "status.settings_load_failed": "Echec du chargement des parametres: {error}",
    "status.settings_save_failed": "Echec de l'enregistrement des parametres: {error}",
    "status.saving_settings": "Enregistrement des parametres...",
    "status.settings_saved_reboot": "Parametres enregistres. L'appareil redemarre dans ~2s.",
    "status.wifi_scan_running": "Scan Wi-Fi en cours...",
    "status.wifi_scan_complete": "Scan Wi-Fi termine ({count} reseaux)",
    "status.wifi_scan_failed": "Echec du scan Wi-Fi: {error}",
    "status.wifi_scan_timeout": "Delai du scan Wi-Fi depasse",
    "common.unknown_error": "Erreur inconnue",
    "wifi.scan_unavailable": "Le scan Wi-Fi est indisponible en mode setup AP sur ce materiel. Entrez le SSID manuellement.",
    "wifi.scan_click": "Cliquez sur \"Scanner Wi-Fi\" pour lister les reseaux proches.",
    "wifi.scan_click_short": "Cliquez sur \"Scanner\" pour lister les reseaux proches.",
    "wifi.scan_no_networks": "Aucun reseau trouve. Rapprochez-vous du routeur et reessayez.",
    "wifi.scan_found": "{count} reseau(x) trouve(s). Selectionnez-en un pour remplir le SSID.",
    "wifi.scan.connected_tag": "connecte",
    "wifi.scan.option_unavailable": "Scan indisponible",
    "wifi.scan.option_scanning": "Scan en cours...",
    "wifi.scan.option_not_run": "Aucun scan",
    "wifi.scan.option_no_networks": "Aucun reseau trouve",
    "wifi.scan.option_select": "Selectionner reseau ({count} trouves)",
    "settings.time.info": "Applique apres redemarrage. La synchronisation demarre quand le Wi-Fi est connecte.",
    "settings.ui.info": "L'apercu change immediatement. La langue enregistree s'applique apres redemarrage.",
    "settings.ap.active": "Setup AP actif: {ssid}\\nOuvrez http://192.168.4.1 en etant connecte a cet AP.",
    "settings.ap.inactive": "Setup AP inactif.\\nUtilisez l'IP du panneau sur votre Wi-Fi.",
    "settings.translation.info": "Uploadez un JSON pour ajouter ou mettre a jour une langue.",
    "settings.translation.upload_ok": "Langue \"{lang}\" uploadee.",
    "settings.translation.upload_fail": "Echec de l'upload: {error}",
    "settings.translation.no_file": "Choisissez d'abord un fichier JSON.",
    "settings.translation.invalid_json": "JSON invalide",
    "settings.translation.object_required": "Le JSON doit etre un objet",
    "settings.translation.invalid_code": "Le code langue doit utiliser [a-z0-9_-] et avoir 2-15 caracteres.",
    "settings.language.invalid_country": "Le code pays Wi-Fi doit etre un code ISO a 2 lettres (ex: US, DE)",
    "settings.language.invalid_bssid": "Le BSSID doit etre vide ou au format AA:BB:CC:DD:EE:FF",
    "settings.language.invalid_ha_url": "L'URL HA doit commencer par ws:// ou wss://",
    "settings.language.invalid_xiaozhi_url": "L'URL Xiaozhi doit commencer par ws:// ou wss://",
    "settings.language.invalid_ota_url": "L'URL OTA Xiaozhi doit commencer par http:// ou https://",
    "provision.wifi.required_ssid": "SSID requis.",
    "provision.wifi.required_country": "Le code pays doit avoir 2 lettres (ex: US, DE).",
    "provision.ha.required_url": "URL WebSocket requise.",
    "provision.ha.invalid_url": "L'URL HA doit commencer par ws:// ou wss://.",
    "provision.ha.required_token": "Jeton d'acces longue duree requis.",
    "provision.saving_reboot": "Enregistrement des parametres et redemarrage...",
    "provision.saved_reboot": "Parametres enregistres. L'appareil redemarre dans ~2s.",
    "provision.save_failed": "Echec de l'enregistrement: {error}",
    "provision.wifi.hint": "Enregistrer redemarre le panneau. Apres redemarrage, la provision HA s'affiche.",
    "provision.ha.hint": "Enregistrer redemarre le panneau. Apres redemarrage, l'editeur est debloque.",
    "settings.language.option_de": "Allemand",
    "settings.language.option_en": "Anglais",
    "settings.language.option_es": "Espagnol",
    "settings.language.option_fr": "Francais",
    "settings.language.option_pl": "Polonais",
    "layout.widgets.presence_home": "Present",
    "layout.widgets.presence_away": "Absent",
    "layout.music.preview_auto": "Detection automatique",
    "layout.pages.rename": "Renommer",
  },
  pl: {
    "tabs.layout": "Układ",
    "tabs.settings": "Ustawienia",
    "sidebar.title": "Edytor BETTA",
    "sidebar.subtitle": "Źródło układu: JSON",
    "layout.pages.heading": "Strony",
    "layout.pages.add": "+ Strona",
    "layout.pages.add_energy": "+ Strona Energii",
    "layout.pages.delete": "Usuń",
    "layout.pages.confirm_delete": "Usunąć stronę \"{name}\"? Spowoduje to usunięcie wszystkich jej widżetów.",
    "layout.pages.title_label": "Tytuł strony",
    "layout.pages.title_placeholder": "Nazwa strony na wyświetlaczu",
    "layout.pages.apply_title": "Zastosuj tytuł strony",
    "layout.pages.new_title": "Strona {number}",
    "layout.pages.energy_title": "Energia",
    "layout.pages.xiaozhi_title": "Xiaozhi",
    "layout.energy.heading": "Strona Energii",
    "layout.energy.hint": "Wybierz, czy strona odzwierciedla Energię z Home Assistant, czy używa ręcznych czujników na żywo.",
    "layout.energy.source": "Źródło danych",
    "layout.energy.source_ha": "Energia z Home Assistant",
    "layout.energy.source_manual": "Ręczne czujniki na żywo",
    "layout.energy.source_hint_ha": "Używa pulpitu Energii skonfigurowanego w Home Assistant.",
    "layout.energy.source_hint_manual": "Dla zaawansowanych: użyj jawnych czujników W/kW z Home Assistant.",
    "layout.energy.home_power": "Moc domu",
    "layout.energy.solar_power": "Moc fotowoltaiki",
    "layout.energy.grid_power": "Moc sieci (ze znakiem)",
    "layout.energy.grid_import": "Pobór z sieci",
    "layout.energy.grid_export": "Oddanie do sieci",
    "layout.energy.battery_power": "Moc baterii (ze znakiem)",
    "layout.energy.battery_charge": "Ładowanie baterii",
    "layout.energy.battery_discharge": "Rozładowanie baterii",
    "layout.energy.battery_soc": "Poziom naładowania baterii",
    "layout.energy.apply": "Zastosuj konfigurację energii",
    "layout.energy.no_widgets": "Strony Energii renderują dedykowany pulpit i nie używają widżetów.",
    "layout.energy.preview_title": "Rozdział energii",
    "layout.energy.sensor_count_one": "{count} czujnik",
    "layout.energy.sensor_count_many": "{count} czujników",
    "layout.energy.no_sensor": "brak czujnika",
    "layout.energy.preview_source_ha": "Energia HA",
    "layout.energy.preview_source_manual": "Czujniki na żywo",
    "layout.energy.preview_auto": "automatycznie z HA",
    "layout.energy.low_carbon": "Niskoemisyjne",
    "layout.energy.grid": "Sieć",
    "layout.energy.solar": "Fotowoltaika",
    "layout.energy.gas": "Gaz",
    "layout.energy.home": "Dom",
    "layout.energy.battery": "Bateria",
    "layout.energy.water": "Woda",
    "layout.status.energy_page_only": "Strony Energii nie przyjmują widżetów.",
    "layout.status.xiaozhi_page_only": "Strony Xiaozhi są przeznaczone dla asystenta głosowego i nie przyjmują widżetów.",
    "layout.status.xiaozhi_page_locked": "Ta strona jest zarządzana przez asystenta głosowego Xiaozhi AI wbudowanego w oprogramowanie. Skonfiguruj go w Ustawienia → Xiaozhi AI.",
    "layout.widgets.heading": "Widżety",
    "layout.widgets.add_sensor": "+ Czujnik",
    "layout.widgets.add_binary": "+ Czujnik binarny",
    "layout.widgets.add_button": "+ Przycisk",
    "layout.widgets.add_slider": "+ Suwak",
    "layout.widgets.add_graph": "+ Wykres",
    "layout.widgets.add_empty_tile": "+ Pusty kafelek",
    "layout.widgets.add_light_tile": "+ Kafelek światła",
    "layout.widgets.add_heating_tile": "+ Kafelek ogrzewania",
    "layout.widgets.add_weather_tile": "+ Pogoda",
    "layout.widgets.add_weather_3day": "+ Prognoza pogody",
    "layout.widgets.add_todo": "+ Lista zadań",
    "layout.widgets.add_media_player": "+ Odtwarzacz",
    "layout.widgets.add_roborock": "+ Roborock",
    "layout.widgets.add_cover": "+ Osłona (Cover)",
    "layout.widgets.add_lock": "+ Zamek (Lock)",
    "layout.widgets.add_fan": "+ Wentylator (Fan)",
    "layout.widgets.add_select": "+ Wybór (Select)",
    "layout.widgets.add_number": "+ Liczba (Number)",
    "layout.widgets.quick_setup": "Szybka konfiguracja",
    "layout.widgets.delete": "Usuń widżet",
    "layout.widgets.confirm_delete": "Usunąć widżet \"{name}\"?",
    "entity_picker.title": "Wybierz światło",
    "entity_picker.title_sensor": "Wybierz czujnik",
    "entity_picker.title_binary": "Wybierz czujnik binarny",
    "entity_picker.title_light": "Wybierz światło",
    "entity_picker.title_switch": "Wybierz przełącznik",
    "entity_picker.title_weather": "Wybierz pogodę",
    "entity_picker.title_climate": "Wybierz ogrzewanie",
    "entity_picker.title_roborock": "Wybierz Roborock",
    "entity_picker.refresh": "Odśwież",
    "entity_picker.search": "Szukaj",
    "entity_picker.close": "Zamknij",
    "entity_picker.search_placeholder": "Szukaj po nazwie, ID encji lub pomieszczeniu",
    "entity_picker.search_hint": "Wpisz co najmniej {count} znaków, aby przeszukać {items}.",
    "entity_picker.search_ready": "Naciśnij Enter lub Szukaj, aby wyszukać {items}.",
    "entity_picker.blank": "Pusty kafelek światła",
    "entity_picker.blank_sensor": "Pusty kafelek czujnika",
    "entity_picker.blank_binary": "Pusty kafelek czujnika binarnego",
    "entity_picker.blank_light": "Pusty kafelek światła",
    "entity_picker.blank_button": "Pusty kafelek przycisku",
    "entity_picker.blank_weather": "Pusty kafelek pogody",
    "entity_picker.blank_weather_3day": "Pusty kafelek prognozy pogody",
    "entity_picker.blank_graph": "Pusty kafelek wykresu",
    "entity_picker.blank_heating": "Pusty kafelek ogrzewania",
    "entity_picker.blank_roborock": "Pusty kafelek Roborock",
    "entity_picker.loading": "Wczytywanie świateł...",
    "entity_picker.loading_items": "Wczytywanie {items}...",
    "entity_picker.refreshing": "Odświeżanie świateł...",
    "entity_picker.refreshing_items": "Odświeżanie {items}...",
    "entity_picker.pending": "Oczekiwanie na Home Assistant...",
    "entity_picker.disconnected": "Home Assistant nie jest połączony.",
    "entity_picker.empty": "Nie znaleziono encji świateł.",
    "entity_picker.empty_items": "Nie znaleziono {items}.",
    "entity_picker.truncated": "Lista przycięta przez limit oprogramowania.",
    "entity_picker.unassigned_room": "Brak pomieszczenia",
    "entity_picker.added": "Dodano kafelek światła: {entity}",
    "entity_picker.added_widget": "Dodano {widget}: {entity}",
    "entity_picker.fetch_failed": "Wykrywanie świateł nie powiodło się: {error}",
    "entity_picker.fetch_failed_items": "Wykrywanie {items} nie powiodło się: {error}",
    "entity_picker.progress": "{loaded} / {target}",
    "entity_picker.progress_total": "{loaded} / {target} z {total}",
    "entity_picker.items_light": "świateł",
    "entity_picker.items_sensor": "czujników",
    "entity_picker.items_binary": "czujników binarnych",
    "entity_picker.items_switch": "przełączników",
    "entity_picker.items_weather": "encji pogody",
    "entity_picker.items_climate": "encji klimatu",
    "entity_picker.items_vacuum": "robotów sprzątających",
    "entity_picker.widget_light": "Kafelek światła",
    "entity_picker.widget_sensor": "Kafelek czujnika",
    "entity_picker.widget_binary": "Kafelek czujnika binarnego",
    "entity_picker.widget_button": "Kafelek przycisku",
    "entity_picker.widget_weather": "Kafelek pogody",
    "entity_picker.widget_weather_3day": "Kafelek prognozy pogody",
    "entity_picker.widget_graph": "Kafelek wykresu",
    "entity_picker.widget_heating": "Kafelek ogrzewania",
    "entity_picker.widget_roborock": "Kafelek Roborock",
    "entity_picker.title_cover": "Wybierz osłonę (Cover)",
    "entity_picker.title_lock": "Wybierz zamek (Lock)",
    "entity_picker.title_fan": "Wybierz wentylator (Fan)",
    "entity_picker.title_select": "Wybierz encję wyboru (Select)",
    "entity_picker.blank_cover": "Pusty kafelek osłony",
    "entity_picker.blank_lock": "Pusty kafelek zamka",
    "entity_picker.blank_fan": "Pusty kafelek wentylatora",
    "entity_picker.blank_select": "Pusty kafelek wyboru",
    "entity_picker.widget_cover": "Kafelek osłony",
    "entity_picker.widget_lock": "Kafelek zamka",
    "entity_picker.widget_fan": "Kafelek wentylatora",
    "entity_picker.widget_select": "Kafelek wyboru",
    "entity_picker.title_number": "Wybierz liczbę (Number)",
    "entity_picker.blank_number": "Pusty kafelek liczby",
    "entity_picker.widget_number": "Kafelek liczby",
    "entity_picker.items_number": "encje number",
    "entity_picker.items_cover": "osłony (cover)",
    "entity_picker.items_lock": "zamki (lock)",
    "entity_picker.items_fan": "wentylatory (fan)",
    "entity_picker.items_select": "encje select",
    "layout.inspector.heading": "Inspektor",
    "layout.inspector.title": "Tytuł",
    "layout.inspector.entity": "Encja",
    "layout.inspector.secondary_entity": "Rzeczywista encja (czujnik)",
    "layout.inspector.secondary_entity_roborock": "Encja mapy (obraz, opcjonalnie)",
    "layout.inspector.button_mode": "Tryb przycisku",
    "layout.inspector.button_accent_color": "Kolor akcentu przycisku",
    "layout.inspector.button_style": "Styl przycisku",
    "layout.inspector.slider_entity_domain": "Typ encji suwaka",
    "layout.inspector.slider_direction": "Kierunek suwaka",
    "layout.inspector.slider_accent_color": "Kolor akcentu suwaka",
    "layout.inspector.graph_line_color": "Kolor linii wykresu",
    "layout.inspector.graph_time_window_min": "Okno czasu (minuty)",
    "layout.inspector.graph_point_count": "Punkty renderowania (puste = auto)",
    "layout.inspector.graph_display_mode": "Tryb wyświetlania",
    "layout.inspector.graph_bar_bucket_min": "Interwał słupków (min)",
    "layout.inspector.binary_show_title": "Pokaż tytuł",
    "layout.inspector.binary_color_on": "Kolor przy WŁ.",
    "layout.inspector.binary_color_off": "Kolor przy WYŁ.",
    "layout.inspector.binary_text_on": "Tekst przy WŁ.",
    "layout.inspector.binary_text_off": "Tekst przy WYŁ.",
    "layout.option.graph_display_mode.line": "Linia z punktami",
    "layout.option.graph_display_mode.line_smooth_points": "Gładka linia z punktami",
    "layout.option.graph_display_mode.line_smooth": "Gładka linia",
    "layout.option.graph_display_mode.bars": "Słupki",
    "layout.inspector.apply": "Zastosuj",
    "layout.option.button_mode.auto": "auto (domyślny przełącznik)",
    "layout.option.button_mode.play_pause": "odtwórz/pauza (media_player)",
    "layout.option.button_mode.stop": "stop (media_player)",
    "layout.option.button_mode.next": "następny (media_player)",
    "layout.option.button_mode.previous": "poprzedni (media_player)",
    "layout.option.button_style.switch": "Przełącznik (suwak)",
    "layout.option.button_style.power_toggle": "Ikona zasilania (nazwa + ikona)",
    "layout.option.button_style.power_status": "Ikona zasilania + tekst WŁ/WYŁ",
    "layout.option.button_style.plug_icon": "Ikona gniazdka/wtyczki (nazwa + ikona)",
    "layout.option.button_style.lamp_icon": "Ikona lampy/żarówki (nazwa + ikona)",
    "layout.option.button_style.highlight": "Podświetlenie kafelka (akcent gdy WŁ)",
    "layout.option.button_style.status_text": "Tylko tekst WŁ/WYŁ (bez ikony)",
    "layout.option.slider_entity_domain.auto": "auto (light, media_player, cover)",
    "layout.option.slider_entity_domain.light": "light (światło)",
    "layout.option.slider_entity_domain.media_player": "media_player",
    "layout.option.slider_entity_domain.cover": "cover (osłona)",
    "layout.option.slider_entity_domain.number": "number (liczba)",
    "layout.option.slider_entity_domain.input_number": "input_number",
    "layout.option.slider_direction.auto": "auto (na podstawie szerokości/wysokości)",
    "layout.option.slider_direction.left_to_right": "lewo → prawo (0% → 100%)",
    "layout.option.slider_direction.right_to_left": "prawo → lewo (100% → 0%)",
    "layout.option.slider_direction.bottom_to_top": "dół → góra (0% → 100%)",
    "layout.option.slider_direction.top_to_bottom": "góra → dół (100% → 0%)",
    "layout.actions.heading": "Akcje",
    "layout.actions.reload": "Przeładuj",
    "layout.actions.save": "Zapisz",
    "layout.actions.export": "Eksportuj",
    "layout.actions.import": "Importuj JSON",
    "layout.actions.paste_placeholder": "Wklej tutaj JSON układu",
    "layout.canvas.title": "Płótno",
    "layout.default_page.title": "Salon",
    "layout.status.loading": "Wczytywanie układu...",
    "layout.status.load_failed": "Nie udało się wczytać układu, używam domyślnego: {error}",
    "layout.status.loaded": "Układ wczytany",
    "layout.status.entity_fetch_failed": "Pobieranie encji nie powiodło się: {error}",
    "layout.status.saving": "Zapisywanie układu...",
    "layout.status.saved": "Układ zapisany",
    "layout.status.imported": "Układ zaimportowany (jeszcze nie zapisany)",
    "layout.status.at_least_one_page": "Wymagana jest co najmniej jedna strona",
    "layout.status.entity_domain_required": "Encja musi używać domeny: {domains}",
    "layout.status.expected_domain": "oczekiwana domena",
    "layout.status.secondary_sensor_required": "Rzeczywista encja musi zaczynać się od sensor.",
    "layout.status.secondary_image_required": "Encja mapy musi zaczynać się od image.",
    "layout.status.invalid_json": "Nieprawidłowy JSON układu",
    "layout.status.save_failed": "Zapis nie powiódł się: {error}",
    "layout.status.import_failed": "Import nie powiódł się: {error}",
    "layout.status.file_import_failed": "Import pliku nie powiódł się: {error}",
    "setup.title": "Szybka konfiguracja",
    "setup.step_ha": "HA połączone",
    "setup.step_tiles": "Dodaj kafelki",
    "setup.step_save": "Zapisz układ",
    "setup.subtitle": "Wybierz kilka encji Home Assistant dla swojego pierwszego pulpitu.",
    "setup.page_label": "Tytuł pierwszej strony",
    "setup.page_placeholder": "Salon",
    "setup.add_light": "+ Światło",
    "setup.add_heating": "+ Ogrzewanie",
    "setup.add_weather": "+ Pogoda",
    "setup.add_button": "+ Przełącznik",
    "setup.add_sensor": "+ Czujnik",
    "setup.close": "Zamknij",
    "setup.skip": "Pomiń",
    "setup.done": "Zapisz + Gotowe",
    "setup.save": "Zapisz układ",
    "setup.count_none": "Nie dodano jeszcze żadnych kafelków.",
    "setup.count_one": "1 kafelek na tej stronie.",
    "setup.count_many": "{count} kafelków na tej stronie.",
    "setup.added": "Dodano: {title}",
    "setup.saving": "Zapisywanie układu...",
    "setup.saved": "Układ zapisany. Panel może teraz używać tego pulpitu.",
    "setup.save_failed": "Zapis nie powiódł się: {error}",
    "provision.wifi.title": "Konfiguracja Wi-Fi",
    "provision.wifi.subtitle": "Połącz panel ze swoim Wi-Fi.",
    "provision.wifi.ssid": "SSID",
    "provision.wifi.country_code": "Kod kraju",
    "provision.wifi.password": "Hasło",
    "provision.wifi.password_placeholder": "Hasło Wi-Fi",
    "provision.wifi.show_password": "Pokaż hasło",
    "provision.ha.title": "Konfiguracja HA",
    "provision.ha.subtitle": "Połącz panel z Home Assistant.",
    "provision.ha.ws_url": "Adres WebSocket (ws:// lub wss://)",
    "provision.ha.token": "Długoterminowy token dostępu",
    "provision.ha.show_token": "Pokaż token",
    "settings.wifi.heading": "Wi-Fi",
    "settings.wifi.ssid": "SSID",
    "settings.wifi.country_code": "Kod kraju",
    "settings.wifi.bssid": "Blokada BSSID (opcjonalnie)",
    "settings.wifi.password": "Hasło",
    "settings.wifi.password_placeholder": "Pozostaw puste, aby zachować zapisane hasło",
    "settings.ha.heading": "Home Assistant",
    "settings.ha.ws_url": "Adres WebSocket (ws:// lub wss://)",
    "settings.ha.token": "Długoterminowy token dostępu",
    "settings.ha.token_placeholder": "Pozostaw puste, aby zachować zapisany token",
    "settings.ha.rest_fallback": "Włącz zapasowy REST HA (Domyślnie: Wył., preferowany tylko WS)",
    "settings.xiaozhi.heading": "Xiaozhi AI",
    "settings.xiaozhi.enabled": "Włącz asystenta głosowego Xiaozhi AI",
    "settings.xiaozhi.cloud_activation": "Aktywacja w chmurze (kod parowania)",
    "settings.xiaozhi.server": "Adres WebSocket (ws:// lub wss://)",
    "settings.xiaozhi.ota_url": "Adres OTA Xiaozhi Cloud (kod parowania)",
    "settings.xiaozhi.device": "ID urządzenia (opcjonalnie)",
    "settings.xiaozhi.token": "Token dostępu",
    "settings.cameras.heading": "Kamery",
    "settings.cameras.hint": "Skonfiguruj do 4 kamer (encje HA camera.* lub migawki HTTP).",
    "settings.cameras.add": "+ Dodaj kamerę",
    "settings.cameras.name": "Nazwa",
    "settings.cameras.source": "Źródło",
    "settings.cameras.source_ha": "Encja HA (camera.*)",
    "settings.cameras.source_http": "URL migawki HTTP",
    "settings.cameras.entity": "Encja kamery",
    "settings.cameras.url": "URL migawki (http:// lub https://)",
    "settings.cameras.username": "Użytkownik (opcjonalnie)",
    "settings.cameras.password": "Hasło (opcjonalnie)",
    "settings.cameras.refresh_ms": "Odświeżanie (ms)",
    "settings.cameras.enabled": "Włączona",
    "settings.cameras.disabled": "Wyłączona",
    "settings.cameras.item_refresh": "Odświeżanie: {ms} ms",
    "settings.cameras.save": "Zapisz",
    "settings.cameras.delete": "Usuń",
    "settings.cameras.none": "Brak kamer. Dodaj pierwszą kamerę.",
    "settings.cameras.saved": "Kamery zapisane.",
    "settings.cameras.load_failed": "Nie udało się wczytać kamer: {error}",
    "settings.cameras.save_failed": "Nie udało się zapisać: {error}",
    "settings.cameras.invalid_url": "URL musi zaczynać się od http:// lub https://",
    "settings.cameras.entity_hint": "Brak encji camera.* — sprawdź połączenie z HA.",
    "settings.cameras.entity_loading": "Wczytywanie kamer...",
    "settings.cameras.invalid_entity": "Wybierz encję camera.*",
    "settings.cameras.delete_confirm": "Usunąć kamerę \"{name}\"?",
    "settings.time.heading": "Czas",
    "settings.time.ntp_server": "Serwer NTP",
    "settings.time.timezone": "Strefa czasowa (POSIX TZ)",
    "settings.time.info": "Zastosowane po restarcie. Synchronizacja czasu zaczyna się po połączeniu Wi-Fi.",
    "settings.ui.heading": "Interfejs",
    "settings.theme.heading": "Motyw",
    "settings.ui.language": "Język",
    "settings.ui.reload_languages": "Przeładuj języki",
    "settings.ui.download_json": "Pobierz JSON",
    "settings.ui.upload_code": "Kod języka",
    "settings.ui.upload_file": "Plik JSON tłumaczenia",
    "settings.ui.upload_button": "Wgraj / dodaj język",
    "settings.ui.info": "Podgląd zmienia się natychmiast. Zapisany język zostanie zastosowany po restarcie.",
    "settings.ap.heading": "AP konfiguracyjny",
    "settings.ap.hint": "Jeśli AP konfiguracyjny jest aktywny, połącz się z nim i otwórz <code>http://192.168.4.1</code>.",
    "settings.ap.active": "AP konfiguracyjny aktywny: {ssid}\nOtwórz http://192.168.4.1, będąc połączonym z tym AP.",
    "settings.ap.inactive": "AP konfiguracyjny nieaktywny.\nUżyj adresu IP panelu w domowej sieci Wi-Fi.",
    "settings.ota.heading": "Aktualizacja oprogramowania",
    "settings.ota.url": "Adres OTA",
    "settings.ota.url_placeholder": "https://example.com/betta-ha-panel-7b.ota.bin",
    "settings.ota.flash_url": "Adres flash",
    "settings.ota.refresh": "Odśwież status",
    "settings.ota.file": "Plik OTA .bin",
    "settings.ota.upload": "Wgraj + Flash",
    "settings.ota.idle": "Gotowy na obraz aplikacji OTA. Działa: {running}, następny slot: {next}, rozmiar slotu: {size}.",
    "settings.ota.running": "OTA działa: {progress}% ({written} / {total})",
    "settings.ota.downloading": "Pobieranie z adresu: {progress}% ({written} / {total})",
    "settings.ota.uploading": "Panel otrzymał wgranie: {progress}% ({written} / {total})",
    "settings.ota.upload_progress": "Wgrywanie do panelu: {progress}% ({written} / {total})",
    "settings.ota.success": "Obraz OTA zapisany. Trwa restart.",
    "settings.ota.error": "OTA nie powiodło się: {error}",
    "settings.ota.rebooting": "Urządzenie się restartuje. Otwórz ponownie panel, gdy wróci do sieci.",
    "settings.ota.no_file": "Najpierw wybierz plik OTA .bin.",
    "settings.ota.no_url": "Najpierw wklej adres OTA.",
    "settings.ota.starting_url": "Uruchamianie OTA z adresu...",
    "settings.ota.request_failed": "Żądanie OTA nie powiodło się: {error}",
    "settings.ota.target_slot": "Docelowy slot: {partition}",
    "settings.actions.heading": "Akcje ustawień",
    "settings.actions.reload": "Przeładuj ustawienia",
    "settings.actions.save": "Zapisz + restart",
    "settings.actions.hint": "Po zapisaniu urządzenie zrestartuje się i może przełączyć się z AP konfiguracyjnego na domowe Wi-Fi.",
    "settings.logs.heading": "Logi",
    "settings.logs.refresh": "Odśwież",
    "settings.logs.pause": "Wstrzymaj",
    "settings.logs.resume": "Wznów",
    "settings.logs.clear": "Wyczyść",
    "settings.logs.auto_scroll": "Auto-przewijanie",
    "settings.logs.download": "Pobierz log",
    "settings.logs.loading": "Wczytywanie logów...",
    "settings.logs.empty": "Brak wpisów. Pojawią się tu błędy, ostrzeżenia i znaczniki awarii.",
    "settings.logs.updated": "Zaktualizowano {time}",
    "settings.logs.fetch_failed": "Nie udało się odczytać logów: {error}",
    "settings.logs.cleared": "Plik logu wyczyszczony.",
    "settings.logs.clear_failed": "Nie udało się wyczyścić logów: {error}",
    "settings.info.configured": "Skonfigurowano",
    "settings.info.connected": "Połączono",
    "settings.info.password_stored": "Hasło zapisane",
    "settings.info.country": "Kraj",
    "settings.info.rssi": "RSSI (połączony AP)",
    "settings.info.connected_bssid": "Połączony BSSID",
    "settings.info.channel": "Kanał",
    "settings.info.token_stored": "Token zapisany",
    "settings.info.rest_fallback": "Zapas REST",
    "common.yes": "tak",
    "common.no": "nie",
    "common.scan": "Skanuj",
    "common.scan_wifi": "Skanuj Wi-Fi",
    "common.save_reboot": "Zapisz + restart",
    "status.idle": "Bezczynny",
    "status.loading_settings": "Wczytywanie ustawień...",
    "status.settings_loaded": "Ustawienia wczytane",
    "status.settings_load_failed": "Wczytanie ustawień nie powiodło się: {error}",
    "status.settings_save_failed": "Zapis ustawień nie powiódł się: {error}",
    "status.saving_settings": "Zapisywanie ustawień...",
    "status.settings_saved_reboot": "Ustawienia zapisane. Urządzenie zrestartuje się za ~2s. Połącz się ponownie i otwórz adres panelu.",
    "status.wifi_scan_running": "Skanowanie Wi-Fi...",
    "status.wifi_scan_complete": "Skanowanie Wi-Fi zakończone ({count} sieci)",
    "status.wifi_scan_failed": "Skanowanie Wi-Fi nie powiodło się: {error}",
    "status.wifi_scan_timeout": "Przekroczono czas żądania skanowania Wi-Fi",
    "common.unknown_error": "Nieznany błąd",
    "wifi.scan_unavailable": "Skanowanie Wi-Fi jest niedostępne w trybie AP konfiguracyjnego na tym sprzęcie. Wpisz SSID ręcznie.",
    "wifi.scan_click": "Kliknij \"Skanuj Wi-Fi\", aby wyświetlić pobliskie sieci.",
    "wifi.scan_click_short": "Kliknij \"Skanuj\", aby wyświetlić pobliskie sieci.",
    "wifi.scan_no_networks": "Nie znaleziono sieci. Zbliż się do routera i zeskanuj ponownie.",
    "wifi.scan_found": "Znaleziono {count} sieci. Wybierz jedną, aby uzupełnić SSID.",
    "wifi.scan.connected_tag": "połączona",
    "wifi.scan.option_unavailable": "Skanowanie niedostępne",
    "wifi.scan.option_scanning": "Skanowanie...",
    "wifi.scan.option_not_run": "Brak skanowania",
    "wifi.scan.option_no_networks": "Nie znaleziono sieci",
    "wifi.scan.option_select": "Wybierz sieć ({count} znalezionych)",
    "settings.translation.info": "Wgraj plik JSON, aby dodać lub zaktualizować język.",
    "settings.translation.upload_ok": "Język \"{lang}\" został wgrany.",
    "settings.translation.upload_fail": "Wgranie nie powiodło się: {error}",
    "settings.translation.no_file": "Najpierw wybierz plik JSON.",
    "settings.translation.invalid_json": "Nieprawidłowy JSON",
    "settings.translation.object_required": "JSON musi być obiektem",
    "settings.translation.invalid_code": "Kod języka musi używać [a-z0-9_-] i mieć 2-15 znaków.",
    "settings.language.invalid_country": "Kod kraju Wi-Fi musi być 2-literowym kodem ISO (np. US, DE)",
    "settings.language.invalid_bssid": "BSSID musi być puste lub w formacie AA:BB:CC:DD:EE:FF",
    "settings.language.invalid_ha_url": "Adres HA musi zaczynać się od ws:// lub wss://",
    "settings.language.invalid_xiaozhi_url": "Adres Xiaozhi musi zaczynać się od ws:// lub wss://",
    "settings.language.invalid_ota_url": "Adres OTA Xiaozhi musi zaczynać się od http:// lub https://",
    "provision.wifi.required_ssid": "SSID jest wymagane.",
    "provision.wifi.required_country": "Kod kraju musi mieć 2 litery (np. US, DE).",
    "provision.ha.required_url": "Adres WebSocket jest wymagany.",
    "provision.ha.invalid_url": "Adres HA musi zaczynać się od ws:// lub wss://.",
    "provision.ha.required_token": "Długoterminowy token dostępu jest wymagany.",
    "provision.saving_reboot": "Zapisywanie ustawień i restartowanie...",
    "provision.saved_reboot": "Ustawienia zapisane. Urządzenie zrestartuje się za ~2s.",
    "provision.save_failed": "Zapis nie powiódł się: {error}",
    "provision.wifi.hint": "Zapis restartuje panel. Po restarcie pokazana zostanie konfiguracja HA.",
    "provision.ha.hint": "Zapis restartuje panel. Po restarcie edytor zostanie odblokowany.",
    "ha_diagnostics.missing_title": "Niektóre encje w tym układzie nie zostały znalezione w Home Assistant",
    "ha_diagnostics.missing_title_more": "Niektóre encje w tym układzie nie zostały znalezione w Home Assistant ({total} łącznie, pokazuję {listed})",
    "ha_diagnostics.missing_hint": "Otwórz odpowiedni widżet, wybierz prawidłową encję i zapisz układ.",
    "ha_diagnostics.dismiss": "Zamknij",
    "settings.language.option_de": "Niemiecki",
    "settings.language.option_en": "Angielski",
    "settings.language.option_es": "Hiszpański",
    "settings.language.option_fr": "Francuski",
    "settings.language.option_pl": "Polski",
    "layout.widgets.presence_home": "W domu",
    "layout.widgets.presence_away": "Poza domem",
    "layout.music.preview_auto": "Auto-wykrywanie",
    "layout.pages.rename": "Zmie? nazw?",
    "layout.music.preview_title": "Teraz odtwarzane",
    "layout.music.preview_subtitle": "Ok?adka, sterowanie, pozycja i g?o?no??",
    "layout.status.music_page_only": "Strony Muzyki nie przyjmuj? wid?et?w.",
    "layout.pages.music_title": "Muzyka",
    "layout.status.radio_page_only": "Strony Radia nie przyjmują widżetów.",
    "layout.pages.add_radio": "+ Strona Radia",
    "layout.pages.menu_weather": "Strona pogody",
    "layout.pages.add_weather": "+ Strona pogody",
    "layout.pages.weather_title": "Pogoda",
    "layout.pages.weather_hint": "Dodaj kafelki, jakie chcesz (pogoda, prognoza, czujniki, ...). Strona ma stałe id \"pogoda\", więc nie dostaje zakładki na dole panelu - otwiera ją ikona pogody na górnym pasku.",
    "layout.pages.weather_chip_hint": "Ikona na górnym pasku pokazuje encję weather.dom. Zmień encję kafelka pogody, jeśli chcesz inną.",
    "layout.status.weather_page_added": "Dodano stronę pogody. Zapisz układ, aby wgrać ją na panel.",
    "layout.status.weather_page_exists": "Strona pogody już istnieje - otwieram ją.",
    "layout.widgets.weather_now_title": "Pogoda",
    "layout.widgets.weather_forecast_title": "Prognoza 3 dni",
    "layout.widgets.weather_temp_title": "Temperatura",
    "layout.widgets.weather_hum_title": "Wilgotność",
    "layout.pages.menu_normal": "Zwykła strona",
    "layout.pages.menu_energy": "Strona energii",
    "layout.pages.menu_xiaozhi": "Strona Xiaozhi",
    "layout.pages.menu_music": "Strona muzyki",
    "layout.pages.menu_radio": "Strona radia",
    "layout.pages.radio_title": "Radio",
    "layout.radio.heading": "Radio internetowe",
    "layout.radio.hint": "Pełnoekranowa siatka stacji z podglądem odtwarzania, głośnością i zatrzymaniem. Strumień odtwarza Home Assistant (media_player.play_media), panel tylko wysyła adres strumienia.",
    "layout.radio.player_entity": "Domyślny odtwarzacz",
    "layout.radio.columns": "Kolumny (2-4)",
    "layout.radio.stations": "Stacje",
    "layout.radio.add_station": "+ Stacja",
    "layout.radio.stations_hint": "Pozostaw listę pustą, aby użyć wbudowanej listy stacji zapisanej w firmware. Każda stacja wymaga nazwy i adresu strumienia http(s) (maksymalnie 24).",
    "layout.radio.station_name": "Nazwa stacji",
    "layout.radio.station_url": "Adres strumienia (http/https)",
    "layout.radio.station_entity": "Zastępczy odtwarzacz (opcjonalnie)",
    "layout.radio.station_up": "Przenieś w górę",
    "layout.radio.station_down": "Przenieś w dół",
    "layout.radio.station_remove": "Usuń stację",
    "layout.radio.empty_list": "Brak stacji - zostanie użyta wbudowana lista stacji.",
    "layout.radio.limit_reached": "Osiągnięto limit {count} stacji na stronę.",
    "layout.radio.apply": "Zastosuj konfigurację radia",
    "layout.radio.no_widgets": "Strony Radia rysują własną siatkę stacji i nie używają widżetów.",
    "layout.radio.preview_title": "Teraz odtwarzane",
    "layout.radio.preview_subtitle": "Siatka stacji, głośność i zatrzymanie",
    "layout.radio.preview_defaults": "Wbudowana lista stacji",
    "layout.radio.preview_more": "+{count} więcej",
  },
  pl: {
    "common.yes": "tak",
    "common.no": "nie",
    "common.unknown_error": "nieznany błąd",
    "tabs.layout": "Układ",
    "tabs.settings": "Ustawienia",
    "status.saving_settings": "Zapisywanie ustawień...",
    "status.settings_loaded": "Ustawienia wczytane",
    "status.settings_save_failed": "Zapis ustawień nie powiódł się: {error}",
    "status.settings_load_failed": "Wczytanie ustawień nie powiodło się: {error}",
    "settings.wifi.heading": "Wi-Fi",
    "settings.cameras.username": "Użytkownik (opcjonalnie)",
    "settings.cameras.url": "URL migawki (http:// lub https://)",
    "settings.cameras.source_http": "URL migawki HTTP",
    "settings.cameras.source_ha": "Encja HA (camera.*)",
    "settings.cameras.source": "Źródło",
    "settings.cameras.saved": "Kamery zapisane.",
    "settings.cameras.save_failed": "Nie udało się zapisać: {error}",
    "settings.cameras.save": "Zapisz",
    "settings.cameras.refresh_ms": "Odświeżanie (ms)",
    "settings.cameras.password": "Hasło (opcjonalnie)",
    "settings.cameras.none": "Brak kamer. Dodaj pierwszą kamerę.",
    "settings.cameras.name": "Nazwa",
    "settings.cameras.load_failed": "Nie udało się wczytać kamer: {error}",
    "settings.cameras.item_refresh": "Odświeżanie: {ms} ms",
    "settings.cameras.invalid_url": "URL musi zaczynać się od http:// lub https://",
    "settings.cameras.invalid_entity": "Wybierz encję camera.*",
    "settings.cameras.hint": "Skonfiguruj do 4 kamer (encje HA camera.* lub migawki HTTP).",
    "settings.cameras.heading": "Kamery",
    "settings.cameras.entity_loading": "Wczytywanie kamer...",
    "settings.cameras.entity_hint": "Brak encji camera.* — sprawdź połączenie z HA.",
    "settings.cameras.entity": "Encja kamery",
    "settings.cameras.enabled": "Włączona",
    "settings.cameras.disabled": "Wyłączona",
    "settings.cameras.delete_confirm": "Usunąć kamerę \"{name}\"?",
    "settings.cameras.delete": "Usuń",
    "settings.cameras.add": "+ Dodaj kamerę",
    "settings.localCam.heading": "Wbudowana kamera",
    "settings.localCam.hint": "Wbudowana kamera OV5647 MIPI-CSI. Zmiany działają od razu, bez restartu panelu.",
    "settings.localCam.enabled": "Kamera włączona",
    "settings.localCam.stream": "Transmisja na żywo do HA (MJPEG)",
    "settings.localCam.motion": "Detekcja ruchu (wybudzanie ekranu)",
    "settings.localCam.threshold": "Czułość detekcji ruchu (1..64, mniej = czuliej)",
    "settings.localCam.quality": "Jakość JPEG (10..95)",
    "settings.localCam.resolution": "Rozdzielczość",
    "settings.localCam.resolution_native": "1280x960 (natywna)",
    "settings.localCam.resolution_half": "640x480 (połowa)",
    "settings.localCam.hflip": "Odbicie poziome (H)",
    "settings.localCam.vflip": "Odbicie pionowe (V)",
    "settings.localCam.save": "Zapisz",
    "settings.localCam.refresh_preview": "Odśwież podgląd",
    "settings.localCam.preview_hint": "Podgląd działa, gdy kamera jest włączona.",
    "settings.localCam.saved": "Ustawienia kamery zapisane.",
    "settings.localCam.save_failed": "Zapis nieudany: {error}",
    "settings.localCam.status_error": "Nie udało się pobrać stanu kamery: {error}",
    "settings.localCam.snapshot_failed": "Nie udało się pobrać klatki: {error}",
    "settings.localCam.motion_heading": "Detekcja ruchu",
    "settings.localCam.motion_hint": "Strefy i progi detekcji ruchu. Współrzędne w % kadru (x, y od lewego górnego rogu).",
    "settings.localCam.motion_min_area": "Min. zmieniony obszar (%)",
    "settings.localCam.motion_min_duration": "Min. czas trwania ruchu (ms, 0 = wyłączone)",
    "settings.localCam.motion_cooldown": "Przerwa między detekcjami (ms)",
    "settings.localCam.motion_start_delay": "Opóźnienie po starcie kamery (ms)",
    "settings.localCam.motion_ignore_lighting": "Ignoruj nagłe zmiany oświetlenia",
    "settings.localCam.zones_hint": "Przeciągnij po podglądzie, aby narysować strefę (maks. 4). Brak stref = cały kadr.",
    "settings.localCam.zones_refresh": "Odśwież podgląd stref",
    "settings.localCam.zones_clear": "Wyczyść strefy",
    "settings.localCam.zones_remove": "Usuń strefę",
    "settings.localCam.motion_diag": "Sprawdź detekcję",
    "settings.localCam.motion_level": "Poziom",
    "settings.localCam.motion_changed": "zmiana",
    "settings.localCam.motion_active": "Ruch",
    "settings.localCam.motion_triggers": "wyzwolenia",
    "settings.localCam.motion_lighting": "oświetlenie ignorowane",
    "settings.localCam.motion_diag_failed": "Sprawdzenie detekcji nieudane: {error}",
    "layout.status.xiaozhi_page_only": "Strony Xiaozhi są przeznaczone dla asystenta głosowego i nie przyjmują widżetów.",
    "layout.status.xiaozhi_page_locked": "Ta strona jest zarządzana przez asystenta głosowego Xiaozhi AI wbudowanego w oprogramowanie. Skonfiguruj go w Ustawienia → Xiaozhi AI.",
    "layout.pages.xiaozhi_title": "Xiaozhi",
    "settings.wifi.ssid": "SSID",
    "settings.wifi.country_code": "Kod kraju",
    "settings.wifi.bssid": "Blokada BSSID (opcjonalnie)",
    "settings.wifi.password": "Hasło",
    "settings.wifi.password_placeholder": "Pozostaw puste, aby zachować zapisane hasło",
    "settings.wifi.static_enabled": "Stały adres IP (zamiast DHCP)",
    "settings.wifi.static_ip": "Adres IP",
    "settings.wifi.static_netmask": "Maska sieci",
    "settings.wifi.static_gateway": "Brama",
    "settings.wifi.static_dns": "DNS (opcjonalnie)",
    "settings.wifi.invalid_static_ip": "Adres IP, maska i brama muszą być poprawnymi adresami IPv4, gdy włączony jest stały IP",
    "settings.display.heading": "Wyświetlacz / Wygaszacz",
    "settings.display.info": "Jasność i kolory działają natychmiast. Tapeta jest zapisywana w urządzeniu.",
    "settings.display.brightness": "Jasność (%)",
    "settings.display.screensaver_enabled": "Wygaszacz ekranu",
    "settings.display.screensaver_timeout": "Czas wygaszacza (s)",
    "settings.display.saver_brightness": "Jasność wygaszacza (%)",
    "settings.display.saver_wallpaper_dim": "Przyciemnienie tapety wygaszacza (%)",
    "settings.display.saver_wallpaper_dim_hint": "Przyciemnia obraz za zegarem. 0 pozostawia tapetę bez zmian.",
    "settings.display.screen_off_enabled": "Wyłącz ekran",
    "settings.display.screen_off_timeout": "Czas do wyłączenia (s)",
    "settings.display.clock_format": "Format zegara",
    "settings.display.clock_format_h24": "24-godzinny (europejski, 23:00)",
    "settings.display.clock_format_h12": "12-godzinny (AM/PM, 11:00 PM)",
    "settings.display.clock_format_hint": "Format 12-godzinny pokazuje znacznik AM/PM na zegarze wygaszacza oraz przy zegarze w górnym pasku.",
    "settings.display.clock_style": "Styl zegara",
    "settings.display.clock_style_classic": "Klasyczny",
    "settings.display.clock_style_flip": "Kafelki z przewracaniem",
    "settings.display.clock_style_hint": "Kafelki animują się przy każdej zmianie, ale pokazują tylko HH:MM (bez sekund).",
    "settings.display.show_seconds": "Pokaż sekundy",
    "settings.display.show_date": "Pokaż datę",
    "settings.display.clock_color": "Kolor godziny",
    "settings.display.date_color": "Kolor daty",
    "settings.display.night_mode_enabled": "Harmonogram nocny (przyciemnienie / wyłączenie ekranu w nocy)",
    "settings.display.night_start": "Początek nocy",
    "settings.display.night_end": "Koniec nocy",
    "settings.display.night_brightness": "Jasność w nocy (%, 0 = ekran wyłączony)",
    "settings.display.night_wake": "Wybudzenie dotykiem w oknie nocnym (s)",
    "settings.display.night_hint": "W oknie nocnym panel wymusza jasność nocną (0% wyłącza ekran). Dotknięcie ekranu wybudza go na ustawioną liczbę sekund. Wymaga zsynchronizowanego zegara.",
    "settings.display.night_currently_active": "Tryb nocny jest teraz aktywny.",
    "settings.display.theme_auto_enabled": "Motyw zależny od pory dnia",
    "settings.display.theme_day": "Motyw dzienny",
    "settings.display.theme_night": "Motyw nocny",
    "settings.display.theme_auto_none": "- motyw globalny -",
    "settings.display.theme_auto_hint": "Poza oknem nocnym rysowany jest motyw dzienny, w oknie nocnym motyw nocny. Okno wyznaczają godziny początku i końca nocy poniżej i działa nawet gdy harmonogram jasności nocnej jest wyłączony. Strona z ustawionym page_theme w layoucie i tak ma pierwszeństwo. Wymaga zsynchronizowanego zegara.",
    "settings.display.wallpaper": "Tapeta",
    "settings.display.wallpaper_hint": "Obraz jest skalowany i konwertowany do RGB565 w przeglądarce, a następnie wysyłany do panelu.",
    "settings.display.upload_wallpaper": "Wgraj tapetę",
    "settings.display.remove_wallpaper": "Usuń tapetę",
    "settings.display.apply": "Zastosuj teraz (bez restartu)",
    "settings.display.press_fx": "Reakcja na dotyk (wygląd kafelka przy przytrzymaniu)",
    "settings.display.press_fx_dim": "Przygaszenie (%)",
    "settings.display.press_fx_scale": "Zmniejszenie (% rozmiaru)",
    "settings.display.press_fx_none": "Brak",
    "settings.display.press_fx_dim_mode": "Przygaszenie",
    "settings.display.press_fx_scale_mode": "Zmniejszenie",
    "settings.display.press_fx_both": "Przygaszenie + zmniejszenie",
    "settings.display.press_fx_hint": "Działa dla kafelków reagujących na dotyk całego kafelka (przełącznik, przycisk, ogrzewanie). Przytrzymaj próbkę poniżej, aby zobaczyć efekt.",
    "settings.display.press_fx_preview": "Kafelek",
    "settings.display.value_anim": "Animacja wartości (gdy wartość kafelka się zmienia)",
    "settings.display.value_anim_ms": "Czas trwania (ms)",
    "settings.display.value_anim_none": "Brak",
    "settings.display.value_anim_fade": "Płynne pojawienie",
    "settings.display.value_anim_slide": "Wjazd z dołu",
    "settings.display.value_anim_count": "Przeliczanie cyfr",
    "settings.display.value_anim_preview": "Podgląd",
    "settings.display.value_anim_hint": "Ożywia wartości zmieniające się same (czujniki, pogoda, moc). Przeliczanie cyfr zostawia jednostkę na miejscu i działa dla wartości typu \"22.5 °C\". 0 ms wyłącza efekt.",
    "settings.display.topbar": "Górny pasek",
    "settings.display.topbar_show_clock": "Zegar",
    "settings.display.topbar_show_date": "Data",
    "settings.display.topbar_show_gear": "Ikona ustawień",
    "settings.display.topbar_show_status": "Ikony Wi-Fi / HA",
    "settings.display.topbar_icon_text": "Napisy zamiast logo",
    "settings.display.topbar_custom_colors": "Własne kolory",
    "settings.display.topbar_bg_color": "Tło paska",
    "settings.display.topbar_clock_color": "Kolor zegara",
    "settings.display.topbar_date_color": "Kolor daty",
    "settings.display.topbar_gear_color": "Kolor ikony ustawień",
    "settings.display.topbar_ha_color": "Kolor Home Assistant",
    "settings.display.topbar_wifi_color": "Kolor Wi-Fi",
    "settings.display.topbar_hint": "Zegar jest wyśrodkowany w wolnym miejscu, a jego czcionka sama się zmniejsza, więc elementy nigdy na siebie nie nachodzą. \"Napisy zamiast logo\" zamienia glify Wi-Fi / Home Assistant / zębatki na wyrazy.",
    "settings.display.topbar_color_hint": "Przy wyłączonych \"Własnych kolorach\" górny pasek korzysta z aktywnego motywu.",
    "settings.display.navbar": "Dolny pasek (zakładki stron)",
    "settings.display.nav_custom_colors": "Własne kolory",
    "settings.display.nav_bar_bg_color": "Tło paska",
    "settings.display.nav_bar_border_color": "Górna krawędź paska",
    "settings.display.nav_button_bg_color": "Tło zakładki",
    "settings.display.nav_button_border_color": "Obramowanie zakładki",
    "settings.display.nav_tab_idle_color": "Kolor tytułu strony",
    "settings.display.nav_tab_active_color": "Kolor aktywnego tytułu strony",
    "settings.display.nav_home_idle_color": "Kolor ikony domu",
    "settings.display.nav_home_active_color": "Kolor aktywnej ikony domu",
    "settings.display.nav_hint": "Dolny pasek pokazuje przycisk domu i jedną zakładkę na każdą stronę. Zbyt długie nazwy stron są skracane wielokropkiem.",
    "settings.display.nav_color_hint": "Przy wyłączonych \"Własnych kolorach\" dolny pasek korzysta z aktywnego motywu.",
    "settings.display.applied": "Ustawienia wyświetlacza zastosowane.",
    "settings.display.no_wallpaper_file": "Najpierw wybierz plik obrazu.",
    "settings.display.converting": "Konwertowanie obrazu...",
    "settings.display.convert_failed": "Konwersja obrazu nie powiodła się.",
    "settings.display.uploading": "Wgrywanie tapety...",
    "settings.display.wallpaper_uploaded": "Tapeta wgrana.",
    "settings.display.removing": "Usuwanie tapety...",
    "settings.display.wallpaper_removed": "Tapeta usunięta.",
    "settings.sd.heading": "Karta microSD",
    "settings.sd.enabled": "Włącz kartę microSD (gniazdo TF)",
    "settings.sd.refresh": "Odśwież",
    "settings.sd.export_logs": "Zapisz logi na karcie",
    "settings.sd.format": "Formatuj kartę",
    "settings.sd.format_confirm": "Sformatować kartę microSD? Wszystkie pliki na karcie zostaną usunięte.",
    "settings.sd.up": "W górę",
    "settings.sd.root": "Katalog główny karty",
    "settings.sd.logs": "Folder logów",
    "settings.sd.photos": "Folder zdjęć",
    "settings.sd.unsupported": "Ta płytka nie ma gniazda microSD.",
    "settings.sd.disabled": "Obsługa microSD jest wyłączona. Zaznacz opcję, aby karta była montowana przy starcie.",
    "settings.sd.no_card": "W gniazdku nie ma karty. Włóż kartę i naciśnij Odśwież - panel wykryje ją też sam podczas pracy.",
    "settings.sd.no_filesystem": "Wykryto kartę {name}, ale nie ma na niej systemu plików FAT, który panel potrafi odczytać. Naciśnij Formatuj, aby ją przygotować - to usuwa zawartość karty.",
    "settings.sd.exfat": "Karta {name} ma system plików exFAT, którego panel nie potrafi odczytać. Naciśnij Formatuj, aby zmienić go na FAT32 - to usuwa zawartość karty.",
    "settings.sd.ntfs": "Karta {name} ma system plików NTFS, którego panel nie potrafi odczytać. Naciśnij Formatuj, aby zmienić go na FAT32 - to usuwa zawartość karty.",
    "settings.sd.mounted": "Karta: {name} - razem {total} MB, wolne {free} MB",
    "settings.sd.empty": "Ten folder jest pusty.",
    "settings.sd.loading": "Odczyt karty...",
    "settings.sd.delete": "Usuń",
    "settings.sd.delete_confirm": "Usunąć {name} z karty?",
    "settings.sd.deleted": "Plik usunięty.",
    "settings.sd.delete_failed": "Nie udało się usunąć tego elementu.",
    "settings.sd.use_wallpaper": "Ustaw jako tapetę",
    "settings.sd.wallpaper_failed": "Nie udało się zamienić tego obrazu na tapetę.",
    "settings.sd.wallpaper_ok": "Obraz z karty jest teraz tapetą.",
    "settings.sd.wallpaper_sd": "Obraz wygaszacza: na tej karcie microSD (panel trzyma jedną kopię i przenosi ją do pamięci wewnętrznej po wyjęciu karty).",
    "settings.sd.wallpaper_flash": "Obraz wygaszacza: w pamięci wewnętrznej (przeniesie się na kartę, gdy tylko zostanie włożona).",
    "settings.sd.wallpaper_none": "Obraz wygaszacza: brak - wgraj go w ustawieniach ekranu.",
    "settings.sd.exporting": "Zapisywanie logów...",
    "settings.sd.exported": "Logi zapisane w {path}",
    "settings.sd.export_failed": "Nie udało się zapisać logów.",
    "settings.sd.formatting": "Formatowanie...",
    "settings.sd.formatted": "Karta sformatowana.",
    "settings.sd.format_failed": "Formatowanie nie powiodło się.",
    "settings.sd.type_dir": "Folder",
    "settings.sd.status_enabled": "Obsługa microSD włączona.",
    "settings.sd.status_disabled": "Obsługa microSD wyłączona.",
    "settings.sd.apply_failed": "Nie udało się zastosować ustawienia microSD.",
    "settings.pages.heading": "Strony / Przejścia stron",
    "settings.pages.transition": "Przejście stron",
    "settings.pages.transition_ms": "Czas przejścia (ms)",
    "settings.pages.transition_hint": "Animacja odtwarzana przy zmianie strony panelu. 0 ms wyłącza wybrany efekt.",
    "settings.pages.option_none": "Brak (natychmiast)",
    "settings.pages.option_fade": "Przenikanie",
    "settings.pages.option_slide": "Przesuwanie (lewo/prawo)",
    "settings.pages.option_slide_up": "Przesuwanie (góra/dół)",
    "settings.pages.option_fade_slide": "Przenikanie + przesuwanie",
    "settings.pages.target": "Pokaż stronę na panelu",
    "settings.pages.reload": "Odśwież listę stron",
    "settings.pages.show": "Pokaż teraz",
    "settings.pages.activated": "Strona \"{page}\" jest teraz wyświetlana na panelu.",
    "settings.pages.current": "Aktualnie wyświetlana strona: {page}",
    "settings.pages.apply": "Zastosuj teraz (bez restartu)",
    "settings.pages.applied": "Ustawienia przejść stron zastosowane.",
    "settings.mqtt.heading": "MQTT / Home Assistant",
    "settings.mqtt.enabled": "Włącz MQTT (automatyczne wykrycie jako urządzenie w Home Assistant)",
    "settings.mqtt.use_tls": "Szyfruj połączenie (TLS, mqtts / port 8883)",
    "settings.mqtt.tls_hint": "TLS weryfikuje certyfikat brokera względem wbudowanego zbioru zaufanych certyfikatów ESP. Port przełączy się na 8883 automatycznie, gdy w polu nadal jest 1883.",
    "settings.mqtt.reapply_hint": "Kliknij „Zastosuj MQTT”, aby wysłać zmianę do panelu.",
    "settings.mqtt.host": "Adres brokera (pusty = wyznacz z adresu HA)",
    "settings.mqtt.port": "Port brokera",
    "settings.mqtt.username": "Użytkownik",
    "settings.mqtt.password": "Hasło",
    "settings.mqtt.discovery_prefix": "Prefiks wykrywania",
    "settings.mqtt.info": "Panel pojawia się jako urządzenie w Home Assistant przez wykrywanie MQTT. Zmiany działają bez restartu.",
    "settings.mqtt.apply": "Zastosuj MQTT (bez restartu)",
    "settings.mqtt.applied": "Ustawienia MQTT zastosowane.",
    "layout.status.conflict_title": "Układ na panelu został zmieniony w innym miejscu",
    "layout.status.conflict_confirm": "Układ na panelu został zmieniony z innego źródła (inna karta przeglądarki, API lub przywracanie kopii).\n\nOK = nadpisz wersją z edytora\nAnuluj = zachowaj wersję z panelu (odśwież stronę, aby odrzucić lokalne zmiany).",
    "layout.status.conflict_overridden": "Zmiany z panelu nadpisane przez edytor.",
    "layout.widgets.add_binary_sensor": "+ Czujnik binarny",
    "layout.inspector.button_style": "Styl przycisku",
    "layout.inspector.binary_show_title": "Pokaż tytuł",
    "layout.inspector.binary_color_on": "Kolor ON (puste = auto)",
    "layout.inspector.binary_color_off": "Kolor OFF (puste = auto)",
    "layout.inspector.binary_text_on": "Tekst ON (puste = auto)",
    "layout.inspector.binary_text_off": "Tekst OFF (puste = auto)",
    "layout.inspector.sensor_value_color": "Kolor wartości (puste = auto)",
    "layout.tile_look.group": "Wygląd kafelka (ten kafelek)",
    "layout.tile_look.preset": "Szablon",
    "layout.tile_look.bg_color": "Kolor tła",
    "layout.tile_look.bg_grad_color": "Kolor końca gradientu",
    "layout.tile_look.bg_grad_dir": "Kierunek gradientu",
    "layout.tile_look.border_color": "Kolor obramowania",
    "layout.tile_look.border_width": "Grubość obramowania (px)",
    "layout.tile_look.radius": "Promień narożników (px)",
    "layout.tile_look.corner_shape": "Kształt narożników",
    "layout.tile_look.corner_hint": "Kwadratowy kafelek przy maksymalnym promieniu staje się kołem.",
    "layout.tile_look.opacity": "Krycie tła (%)",
    "layout.tile_look.font_scale": "Rozmiar czcionki",
    "layout.tile_look.shadow": "Cień",
    "layout.tile_look.text_color": "Kolor tekstu (wszystko)",
    "layout.tile_look.title_color": "Kolor tytułu",
    "layout.tile_look.label_color": "Kolor opisu encji",
    "layout.tile_look.value_color": "Kolor wartości / statusu",
    "layout.tile_look.icon_color": "Kolor ikony",
    "layout.tile_look.reset": "Przywróć domyślny wygląd",
    "layout.tile_look.hint": "Puste pola = motyw. Kolory w formacie #RRGGBB.",
  "layout.tile_look.copy_source": "Kopiuj wygląd z",
  "layout.tile_look.copy_apply": "Kopiuj wygląd",
  "layout.tile_look.copy_apply_page": "Zastosuj do wszystkich kafelków",
  "layout.tile_look.copy_placeholder": "Wybierz kafelek...",
  "layout.tile_look.copy_empty": "Brak innych kafelków do skopiowania",
  "layout.tile_look.copy_none": "Najpierw wybierz kafelek źródłowy.",
  "layout.tile_look.copy_done": "Skopiowano wygląd z: {source}",
  "layout.tile_look.copy_page_done": "Zastosowano wygląd do {count} kafelków.",
  "layout.tile_look.copy_hint": "Kopiuje tylko tło, obramowanie, kolory i rozmiar czcionki - encja, tytuł i wymiary bez zmian.",
    "layout.page_look.heading": "Wygląd strony",
    "layout.page_look.group": "Wygląd strony (ta strona)",
    "layout.page_look.preset": "Zestaw",
    "layout.page_look.bg_color": "Kolor tła",
    "layout.page_look.bg_grad_color": "Kolor końca gradientu",
    "layout.page_look.bg_grad_dir": "Kierunek gradientu",
    "layout.page_look.wallpaper": "Użyj tapety panelu",
    "layout.page_look.dim": "Przyciemnienie tapety (%)",
    "layout.page_look.reset": "Reset wyglądu strony",
    "layout.page_look.reset_done": "Wygląd strony zresetowany.",
    "layout.page_look.page_theme": "Motyw tylko dla tej strony",
    "layout.page_look.page_theme_hint": "Strona zostanie przemalowana tym motywem zaraz po jej pokazaniu. \"Globalny\" oznacza aktywny motyw / motyw dzienno-nocny.",
    "layout.page_look.theme_none": "- motyw globalny / dzień-noc -",
    "layout.page_look.hint": "Puste pola oznaczają tło panelu. Tapeta jest na panelu przyciemniana.",
    "layout.option.page_preset.auto": "Domyślny panelu",
    "layout.option.page_preset.midnight": "Północ",
    "layout.option.page_preset.deep_sea": "Głębokie morze",
    "layout.option.page_preset.forest": "Las",
    "layout.option.page_preset.sunset": "Zachód słońca",
    "layout.option.page_preset.plum": "Śliwka",
    "layout.option.page_preset.wallpaper": "Tapeta",
    "layout.option.page_preset.wallpaper_dim": "Tapeta (ciemna)",
    "layout.option.page_grad_dir.none": "Brak",
    "layout.option.page_grad_dir.hor": "Poziomy",
    "layout.option.page_grad_dir.ver": "Pionowy",
    "layout.option.tile_grad_dir.none": "Brak",
    "layout.option.tile_grad_dir.hor": "Poziomy",
    "layout.option.tile_grad_dir.ver": "Pionowy",
    "layout.option.tile_font_scale.auto": "Auto",
    "layout.option.tile_font_scale.s": "Mała",
    "layout.option.tile_font_scale.m": "Średnia",
    "layout.option.tile_font_scale.l": "Duża",
    "layout.option.tile_font_scale.xl": "Bardzo duża",
    "layout.option.tile_preset.auto": "Domyślny motywu",
    "layout.option.tile_preset.graphite": "Grafit",
    "layout.option.tile_preset.emerald": "Szmaragd",
    "layout.option.tile_preset.amber": "Bursztyn",
    "layout.option.tile_preset.violet": "Fiolet",
  "layout.option.tile_preset.sky": "Niebo",
    "layout.option.tile_preset.glass": "Szkło",
    "layout.option.tile_corner.custom": "Własny (użyj promienia)",
    "layout.option.tile_corner.square": "Kwadrat (0 px)",
    "layout.option.tile_corner.soft": "Delikatny (10 px)",
    "layout.option.tile_corner.rounded": "Zaokrąglony (16 px)",
    "layout.option.tile_corner.pill": "Kapsuła (40 px)",
    "layout.option.tile_corner.circle": "Koło (maks. promień)",
    "layout.option.button_style.switch": "przełącznik (domyślny)",
    "layout.option.button_style.power_toggle": "przełącznik zasilania",
    "layout.option.button_style.power_status": "status zasilania",
    "layout.option.button_style.plug_icon": "ikona wtyczki",
    "layout.option.button_style.lamp_icon": "ikona lampy",
    "layout.option.button_style.highlight": "podświetlenie",
    "layout.option.button_style.status_text": "tekst statusu",
    "entity_picker.refresh": "Odśwież",
    "entity_picker.search": "Szukaj",
    "entity_picker.close": "Zamknij",
    "entity_picker.search_placeholder": "Szukaj po nazwie, encji lub pomieszczeniu",
    "entity_picker.search_hint": "Wpisz co najmniej {count} znaki, aby wyszukać {items}.",
    "entity_picker.search_ready": "Naciśnij Enter lub Szukaj, aby wyszukać {items}.",
    "entity_picker.loading_items": "Ładowanie: {items}...",
    "entity_picker.refreshing_items": "Odświeżanie: {items}...",
    "entity_picker.pending": "Czekam na Home Assistant...",
    "entity_picker.disconnected": "Home Assistant nie jest połączony.",
    "entity_picker.empty_items": "Brak wyników: {items}.",
    "entity_picker.truncated": "Lista obcięta limitem firmware.",
    "entity_picker.progress_total": "{loaded} / {target} z {total}",
    "entity_picker.fetch_failed_items": "Błąd wyszukiwania ({items}): {error}",
    "entity_picker.added_widget": "Dodano {widget}: {entity}",
    "entity_picker.title_binary": "Wybierz czujnik binarny",
    "entity_picker.blank_binary": "Pusty kafelek czujnika binarnego",
    "entity_picker.widget_binary": "Kafelek czujnika binarnego",
    "entity_picker.items_binary": "czujniki binarne",
    "entity_picker.title_alarm": "Wybierz panel alarmu",
    "entity_picker.blank_alarm": "Pusty kafelek alarmu",
    "entity_picker.widget_alarm": "Kafelek alarmu",
    "entity_picker.items_alarm": "panele alarmu",
    "entity_picker.items_cover": "rolety",
    "entity_picker.items_scene": "sceny",
    "entity_picker.items_person": "osoby",
    "entity_picker.items_timer": "minutniki",
    "entity_picker.title_cover": "Wybierz roletę",
    "entity_picker.title_scene": "Wybierz scenę",
    "entity_picker.title_person": "Wybierz osobę",
    "entity_picker.title_timer": "Wybierz minutnik",
    "entity_picker.blank_cover": "Pusty kafelek rolety",
    "entity_picker.blank_scene": "Pusty kafelek sceny",
    "entity_picker.blank_person": "Pusty kafelek obecności",
    "entity_picker.blank_timer": "Pusty kafelek minutnika",
    "entity_picker.widget_cover": "Kafelek rolety",
    "entity_picker.widget_scene": "Kafelek sceny",
    "entity_picker.widget_person": "Kafelek obecności",
    "entity_picker.widget_timer": "Kafelek minutnika",
    "layout.widgets.add_alarm_tile": "+ Panel alarmu",
    "layout.inspector.alarm_code": "Kod PIN (puste = bez kodu)",
    "layout.inspector.alarm_ask_code": "Zawsze pytaj o PIN (auto: gdy wymaga HA)",
    "layout.inspector.alarm_backend": "Sposób sterowania",
    "layout.inspector.alarm_zone_label": "Nazwa strefy (puste = brak)",
    "layout.inspector.alarm_show_sensors": "Pokaż otwarte czujniki na kafelku",
    "layout.inspector.alarm_show_bypassed": "Pokaż liczbę pominiętych czujników",
    "layout.inspector.alarm_force_arm": "Pytaj o wymuszone uzbrojenie przy otwartych czujnikach",
    "layout.inspector.alarm_skip_delay": "Pomiń opóźnienie wyjścia (Alarmo)",
    "layout.inspector.alarm_modes": "Przyciski na kafelku",
    "layout.inspector.alarm_mode_away": "Uzbrój poza domem",
    "layout.inspector.alarm_mode_home": "Uzbrój w domu",
    "layout.inspector.alarm_mode_night": "Uzbrój na noc",
    "layout.inspector.alarm_mode_vacation": "Uzbrój na urlop",
    "layout.inspector.alarm_mode_custom": "Uzbrojenie własne",
    "layout.inspector.alarm_mode_disarm": "Rozbrój",
    "layout.widgets.add_clock": "+ Zegar",
    "layout.inspector.clock_hint": "Kafelek zegara: pokazuje aktualną godzinę (i opcjonalnie datę).",
    "layout.inspector.clock_show_seconds": "Pokazuj sekundy",
    "layout.inspector.clock_show_date": "Pokazuj datę",
    "settings.system.heading": "System",
    "settings.system.auto_restart_enabled": "Okresowo restartuj panel",
    "settings.system.auto_restart_hours": "Restart co (godzin)",
    "settings.system.hint": "Po włączeniu panel sam się zrestartuje po ustawionej liczbie godzin (1-168).",
    "settings.backup.heading": "Kopia zapasowa / Przywracanie",
    "settings.backup.hint": "Plik kopii zawiera układ, ustawienia publiczne oraz wszystkie motywy własne. Dane Wi-Fi, token HA, hasło MQTT i tapeta celowo NIE są zapisywane.",
    "settings.backup.download": "Pobierz kopię zapasową",
    "settings.backup.file": "Plik kopii do przywrócenia",
    "settings.backup.restore": "Przywróć kopię",
    "settings.backup.choose_file": "Najpierw wybierz plik JSON kopii zapasowej.",
    "settings.backup.downloading": "Pobieranie kopii...",
    "settings.backup.downloaded": "Kopia zapasowa pobrana.",
    "settings.backup.download_failed": "Nie udało się pobrać kopii: {error}",
    "settings.backup.restoring": "Przywracanie kopii...",
    "settings.backup.restore_failed": "Przywracanie nie udało się: {error}",
    "settings.backup.restored": "Kopia przywrócona: układ {layout}, ustawienia {settings}, motywy {themes}.",
    "settings.backup.restart_hint": "Zmieniły się ustawienia połączenia - zrestartuj panel, aby je zastosować.",
    "settings.logs.heading": "Logi",
    "settings.logs.refresh": "Odśwież",
    "settings.logs.pause": "Wstrzymaj",
    "settings.logs.resume": "Wznów",
    "settings.logs.clear": "Wyczyść",
    "settings.logs.auto_scroll": "Auto-przewijanie",
    "settings.logs.download": "Pobierz log",
    "settings.logs.loading": "Wczytywanie logów...",
    "settings.logs.empty": "Brak wpisów. Pojawią się tu błędy, ostrzeżenia i znaczniki awarii.",
    "settings.logs.updated": "Zaktualizowano {time}",
    "settings.logs.fetch_failed": "Nie udało się odczytać logów: {error}",
    "settings.logs.cleared": "Plik logu wyczyszczony.",
    "settings.logs.clear_failed": "Nie udało się wyczyścić logów: {error}",
    "settings.logs.log_level": "Poziom logów",
    "settings.logs.log_level_apply": "Zastosuj poziom logów",
    "settings.logs.log_level_hint": "Aktualny poziom na urządzeniu: {level}",
    "settings.logs.log_level_unknown": "Poziom {level} na urządzeniu jest poza zakresem wyboru (0-5).",
    "settings.logs.log_level_applied": "Poziom logów zapisany.",
    "settings.logs.log_level_0": "Wyłączone",
    "settings.logs.log_level_1": "Tylko błędy",
    "settings.logs.log_level_2": "Ostrzeżenia i błędy",
    "settings.logs.log_level_3": "Informacje",
    "settings.logs.log_level_4": "Debug / całkowite",
    "settings.logs.log_level_5": "Verbose / absolutnie wszystko",
    "settings.diagnostics.heading": "Diagnostyka",
    "settings.diagnostics.refresh": "Odśwież",
    "settings.diagnostics.auto_refresh": "Odświeżaj automatycznie (10 s)",
    "settings.diagnostics.loading": "Odczyt diagnostyki...",
    "settings.diagnostics.updated": "Zaktualizowano {time}",
    "settings.diagnostics.empty": "Brak danych.",
    "settings.diagnostics.fetch_failed": "Nie udało się odczytać diagnostyki: {error}",
    "settings.diagnostics.yes": "tak",
    "settings.diagnostics.no": "nie",
    "settings.diagnostics.uptime": "Czas pracy",
    "settings.diagnostics.reset_reason": "Przyczyna restartu",
    "settings.diagnostics.boot_count": "Liczba uruchomień",
    "settings.diagnostics.cpu_temp": "Temperatura CPU",
    "settings.diagnostics.version": "Wersja firmware",
    "settings.diagnostics.project": "Projekt kompilacji",
    "settings.diagnostics.idf": "ESP-IDF",
    "settings.diagnostics.build_date": "Kompilacja",
    "settings.diagnostics.panel": "Układ",
    "settings.diagnostics.screen": "Ekran",
    "settings.diagnostics.heap_free": "Wolny heap",
    "settings.diagnostics.heap_min": "Minimum heapu",
    "settings.diagnostics.heap_largest": "Największy wolny blok",
    "settings.diagnostics.heap_fragmentation": "Fragmentacja",
    "settings.diagnostics.heap_dma": "Wewnętrzne DMA wolne / największy",
    "settings.diagnostics.heap_blocks": "Bloki heapu użyte / wolne",
    "settings.diagnostics.iram_free": "Wolne IRAM",
    "settings.diagnostics.psram_free": "Wolne PSRAM",
    "settings.diagnostics.connected": "Połączono",
    "settings.diagnostics.ssid": "SSID",
    "settings.diagnostics.ip": "Adres IP",
    "settings.diagnostics.rssi": "Sygnał (RSSI)",
    "settings.diagnostics.channel": "Kanał",
    "settings.diagnostics.wifi_drops": "Rozłączenia Wi-Fi",
    "settings.diagnostics.wifi_reconnects": "Próby ponownego połączenia",
    "settings.diagnostics.wifi_recoveries": "Rekowery sterownika",
    "settings.diagnostics.wifi_last_drop": "Ostatnie rozłączenie",
    "settings.diagnostics.wifi_session": "Poprzednia sesja",
    "settings.diagnostics.sync_done": "Synchronizacja wstępna",
    "settings.diagnostics.base_url": "Adres HA REST",
    "settings.diagnostics.cert_cn": "Nazwa w certyfikacie TLS",
    "settings.diagnostics.ws_connects": "Połączenia WS",
    "settings.diagnostics.ws_disconnects": "Rozłączenia WS",
    "settings.diagnostics.ws_recoveries": "Rekowery HA",
    "settings.diagnostics.ws_last_session": "Ostatnia sesja WS",
    "settings.diagnostics.missing_entities": "Brakujące encje",
    "settings.diagnostics.mqtt_enabled": "MQTT włączone",
    "settings.diagnostics.mqtt_tls": "MQTT TLS",
    "settings.diagnostics.broker": "Broker",
    "settings.diagnostics.running_partition": "Aktywna partycja",
    "settings.diagnostics.next_partition": "Slot aktualizacji",
    "settings.diagnostics.image_state": "Stan obrazu",
    "settings.diagnostics.rollback_enabled": "Rollback włączony",
    "settings.diagnostics.boot_confirmed": "Obraz potwierdzony",
    "settings.diagnostics.card_status": "Stan",
    "settings.diagnostics.card_firmware": "Firmware",
    "settings.diagnostics.card_memory": "Pamięć",
    "settings.diagnostics.card_wifi": "Wi-Fi",
    "settings.diagnostics.card_ha": "Home Assistant",
    "settings.diagnostics.card_mqtt": "MQTT",
    "settings.diagnostics.card_ota": "OTA / rollback",
    "settings.diagnostics.ota_state.new": "nowy (jeszcze nie uruchomiony)",
    "settings.diagnostics.ota_state.pending_verify": "czeka na potwierdzenie",
    "settings.diagnostics.ota_state.valid": "poprawny",
    "settings.diagnostics.ota_state.invalid": "niepoprawny",
    "settings.diagnostics.ota_state.aborted": "przerwany",
    "settings.diagnostics.ota_state.undefined": "nie śledzony (bootloader bez rollbacku)",
    "settings.diagnostics.bootloader_note": "Firmware obsługuje rollback, ale bootloader na panelu jeszcze nie śledzi stanu obrazu. Wgraj raz bootloader przez USB (idf.py flash), aby automatyczny powrót do poprzedniej wersji po nieudanej aktualizacji zaczął działać.",
    "settings.language.option_pl": "Polski",
    "common.save_reboot": "Zapisz + restart",
    "common.scan": "Skanuj",
    "common.scan_wifi": "Skanuj Wi-Fi",
    "entity_picker.added": "Dodano kafelek światła: {entity}",
    "entity_picker.blank": "Pusty kafelek światła",
    "entity_picker.blank_button": "Pusty kafelek przycisku",
    "entity_picker.blank_fan": "Pusty kafelek wentylatora",
    "entity_picker.blank_graph": "Pusty kafelek wykresu",
    "entity_picker.blank_heating": "Pusty kafelek ogrzewania",
    "entity_picker.blank_light": "Pusty kafelek światła",
    "entity_picker.blank_lock": "Pusty kafelek zamka",
    "entity_picker.blank_number": "Pusty kafelek liczby",
    "entity_picker.blank_roborock": "Pusty kafelek Roborock",
    "entity_picker.blank_select": "Pusty kafelek wyboru",
    "entity_picker.blank_sensor": "Pusty kafelek czujnika",
    "entity_picker.blank_weather": "Pusty kafelek pogody",
    "entity_picker.blank_weather_3day": "Pusty kafelek prognozy pogody",
    "entity_picker.empty": "Nie znaleziono encji świateł.",
    "entity_picker.fetch_failed": "Wykrywanie świateł nie powiodło się: {error}",
    "entity_picker.items_climate": "encji klimatu",
    "entity_picker.items_fan": "wentylatory (fan)",
    "entity_picker.items_light": "świateł",
    "entity_picker.items_lock": "zamki (lock)",
    "entity_picker.items_number": "encje number",
    "entity_picker.items_select": "encje select",
    "entity_picker.items_sensor": "czujników",
    "entity_picker.items_switch": "przełączników",
    "entity_picker.items_vacuum": "robotów sprzątających",
    "entity_picker.items_weather": "encji pogody",
    "entity_picker.loading": "Wczytywanie świateł...",
    "entity_picker.progress": "{loaded} / {target}",
    "entity_picker.refreshing": "Odświeżanie świateł...",
    "entity_picker.title": "Wybierz światło",
    "entity_picker.title_climate": "Wybierz ogrzewanie",
    "entity_picker.title_fan": "Wybierz wentylator (Fan)",
    "entity_picker.title_light": "Wybierz światło",
    "entity_picker.title_lock": "Wybierz zamek (Lock)",
    "entity_picker.title_number": "Wybierz liczbę (Number)",
    "entity_picker.title_roborock": "Wybierz Roborock",
    "entity_picker.title_select": "Wybierz encję wyboru (Select)",
    "entity_picker.title_sensor": "Wybierz czujnik",
    "entity_picker.title_switch": "Wybierz przełącznik",
    "entity_picker.title_weather": "Wybierz pogodę",
    "entity_picker.unassigned_room": "Brak pomieszczenia",
    "entity_picker.widget_button": "Kafelek przycisku",
    "entity_picker.widget_fan": "Kafelek wentylatora",
    "entity_picker.widget_graph": "Kafelek wykresu",
    "entity_picker.widget_heating": "Kafelek ogrzewania",
    "entity_picker.widget_light": "Kafelek światła",
    "entity_picker.widget_lock": "Kafelek zamka",
    "entity_picker.widget_number": "Kafelek liczby",
    "entity_picker.widget_roborock": "Kafelek Roborock",
    "entity_picker.widget_select": "Kafelek wyboru",
    "entity_picker.widget_sensor": "Kafelek czujnika",
    "entity_picker.widget_weather": "Kafelek pogody",
    "entity_picker.widget_weather_3day": "Kafelek prognozy pogody",
    "ha_diagnostics.dismiss": "Zamknij",
    "ha_diagnostics.missing_hint": "Otwórz odpowiedni widżet, wybierz prawidłową encję i zapisz układ.",
    "ha_diagnostics.missing_title": "Niektóre encje w tym układzie nie zostały znalezione w Home Assistant",
    "ha_diagnostics.missing_title_more": "Niektóre encje w tym układzie nie zostały znalezione w Home Assistant ({total} łącznie, pokazuję {listed})",
    "layout.actions.export": "Eksportuj",
    "layout.actions.heading": "Akcje",
    "layout.actions.import": "Importuj JSON",
    "layout.actions.paste_placeholder": "Wklej tutaj JSON układu",
    "layout.actions.reload": "Przeładuj",
    "layout.actions.save": "Zapisz",
    "layout.canvas.title": "Płótno",
    "layout.default_page.title": "Salon",
    "layout.energy.apply": "Zastosuj konfigurację energii",
    "layout.energy.battery": "Bateria",
    "layout.energy.battery_charge": "Ładowanie baterii",
    "layout.energy.battery_discharge": "Rozładowanie baterii",
    "layout.energy.battery_power": "Moc baterii (ze znakiem)",
    "layout.energy.battery_soc": "Poziom naładowania baterii",
    "layout.energy.gas": "Gaz",
    "layout.energy.grid": "Sieć",
    "layout.energy.grid_export": "Oddanie do sieci",
    "layout.energy.grid_import": "Pobór z sieci",
    "layout.energy.grid_power": "Moc sieci (ze znakiem)",
    "layout.energy.heading": "Strona Energii",
    "layout.energy.hint": "Wybierz, czy strona odzwierciedla Energię z Home Assistant, czy używa ręcznych czujników na żywo.",
    "layout.energy.home": "Dom",
    "layout.energy.home_power": "Moc domu",
    "layout.energy.low_carbon": "Niskoemisyjne",
    "layout.energy.no_sensor": "brak czujnika",
    "layout.energy.no_widgets": "Strony Energii renderują dedykowany pulpit i nie używają widżetów.",
    "layout.energy.preview_auto": "automatycznie z HA",
    "layout.energy.preview_source_ha": "Energia HA",
    "layout.energy.preview_source_manual": "Czujniki na żywo",
    "layout.energy.preview_title": "Rozdział energii",
    "layout.energy.sensor_count_many": "{count} czujników",
    "layout.energy.sensor_count_one": "{count} czujnik",
    "layout.energy.solar": "Fotowoltaika",
    "layout.energy.solar_power": "Moc fotowoltaiki",
    "layout.energy.source": "Źródło danych",
    "layout.energy.source_ha": "Energia z Home Assistant",
    "layout.energy.source_hint_ha": "Używa pulpitu Energii skonfigurowanego w Home Assistant.",
    "layout.energy.source_hint_manual": "Dla zaawansowanych: użyj jawnych czujników W/kW z Home Assistant.",
    "layout.energy.source_manual": "Ręczne czujniki na żywo",
    "layout.energy.water": "Woda",
    "layout.inspector.apply": "Zastosuj",
    "layout.inspector.button_accent_color": "Kolor akcentu przycisku",
    "layout.inspector.button_mode": "Tryb przycisku",
    "layout.inspector.entity": "Encja",
    "layout.inspector.graph_bar_bucket_min": "Interwał słupków (min)",
    "layout.inspector.graph_display_mode": "Tryb wyświetlania",
    "layout.inspector.graph_line_color": "Kolor linii wykresu",
    "layout.inspector.graph_point_count": "Punkty renderowania (puste = auto)",
    "layout.inspector.graph_time_window_min": "Okno czasu (minuty)",
    "layout.inspector.heading": "Inspektor",
    "layout.inspector.secondary_entity": "Rzeczywista encja (czujnik)",
    "layout.inspector.secondary_entity_roborock": "Encja mapy (obraz, opcjonalnie)",
    "layout.inspector.slider_accent_color": "Kolor akcentu suwaka",
    "layout.inspector.slider_direction": "Kierunek suwaka",
    "layout.inspector.slider_entity_domain": "Typ encji suwaka",
    "layout.inspector.title": "Tytuł",
    "layout.option.button_mode.auto": "auto (domyślny przełącznik)",
    "layout.option.button_mode.next": "następny (media_player)",
    "layout.option.button_mode.play_pause": "odtwórz/pauza (media_player)",
    "layout.option.button_mode.previous": "poprzedni (media_player)",
    "layout.option.button_mode.stop": "stop (media_player)",
    "layout.option.graph_display_mode.bars": "Słupki",
    "layout.option.graph_display_mode.line": "Linia z punktami",
    "layout.option.graph_display_mode.line_smooth": "Gładka linia",
    "layout.option.graph_display_mode.line_smooth_points": "Gładka linia z punktami",
    "layout.option.slider_direction.auto": "auto (na podstawie szerokości/wysokości)",
    "layout.option.slider_direction.bottom_to_top": "dół → góra (0% → 100%)",
    "layout.option.slider_direction.left_to_right": "lewo → prawo (0% → 100%)",
    "layout.option.slider_direction.right_to_left": "prawo → lewo (100% → 0%)",
    "layout.option.slider_direction.top_to_bottom": "góra → dół (100% → 0%)",
    "layout.option.slider_entity_domain.auto": "auto (light, media_player, cover)",
    "layout.option.slider_entity_domain.cover": "cover (osłona)",
    "layout.option.slider_entity_domain.input_number": "input_number",
    "layout.option.slider_entity_domain.light": "light (światło)",
    "layout.option.slider_entity_domain.media_player": "media_player",
    "layout.option.slider_entity_domain.number": "number (liczba)",
    "layout.pages.add": "+ Strona",
    "layout.pages.add_energy": "+ Strona Energii",
    "layout.pages.apply_title": "Zastosuj tytuł strony",
    "layout.pages.confirm_delete": "Usunąć stronę \"{name}\"? Spowoduje to usunięcie wszystkich jej widżetów.",
    "layout.pages.delete": "Usuń",
    "layout.pages.energy_title": "Energia",
    "layout.pages.heading": "Strony",
    "layout.pages.new_title": "Strona {number}",
    "layout.pages.title_label": "Tytuł strony",
    "layout.pages.title_placeholder": "Nazwa strony na wyświetlaczu",
    "layout.status.at_least_one_page": "Wymagana jest co najmniej jedna strona",
    "layout.status.energy_page_only": "Strony Energii nie przyjmują widżetów.",
    "layout.status.entity_domain_required": "Encja musi używać domeny: {domains}",
    "layout.status.entity_fetch_failed": "Pobieranie encji nie powiodło się: {error}",
    "layout.status.expected_domain": "oczekiwana domena",
    "layout.status.file_import_failed": "Import pliku nie powiódł się: {error}",
    "layout.status.import_failed": "Import nie powiódł się: {error}",
    "layout.status.imported": "Układ zaimportowany (jeszcze nie zapisany)",
    "layout.status.invalid_json": "Nieprawidłowy JSON układu",
    "layout.status.load_failed": "Nie udało się wczytać układu, używam domyślnego: {error}",
    "layout.status.loaded": "Układ wczytany",
    "layout.status.loading": "Wczytywanie układu...",
    "layout.status.save_failed": "Zapis nie powiódł się: {error}",
    "layout.status.saved": "Układ zapisany",
    "layout.status.saving": "Zapisywanie układu...",
    "layout.status.secondary_image_required": "Encja mapy musi zaczynać się od image.",
    "layout.status.secondary_sensor_required": "Rzeczywista encja musi zaczynać się od sensor.",
    "layout.widgets.add_binary": "+ Czujnik binarny",
    "layout.widgets.add_button": "+ Przycisk",
    "layout.widgets.add_cover": "+ Osłona (Cover)",
    "layout.widgets.add_empty_tile": "+ Pusty kafelek",
    "layout.widgets.add_fan": "+ Wentylator (Fan)",
    "layout.widgets.add_graph": "+ Wykres",
    "layout.widgets.add_heating_tile": "+ Kafelek ogrzewania",
    "layout.widgets.add_light_tile": "+ Kafelek światła",
    "layout.widgets.add_lock": "+ Zamek (Lock)",
    "layout.widgets.add_media_player": "+ Odtwarzacz",
    "layout.widgets.add_number": "+ Liczba (Number)",
    "layout.widgets.add_roborock": "+ Roborock",
    "layout.widgets.add_select": "+ Wybór (Select)",
    "layout.widgets.add_sensor": "+ Czujnik",
    "layout.widgets.add_slider": "+ Suwak",
    "layout.widgets.add_todo": "+ Lista zadań",
    "layout.widgets.add_weather_3day": "+ Prognoza pogody",
    "layout.widgets.add_weather_tile": "+ Pogoda",
    "layout.widgets.confirm_delete": "Usunąć widżet \"{name}\"?",
    "layout.widgets.delete": "Usuń widżet",
    "layout.widgets.heading": "Widżety",
    "layout.widgets.quick_setup": "Szybka konfiguracja",
    "provision.ha.hint": "Zapis restartuje panel. Po restarcie edytor zostanie odblokowany.",
    "provision.ha.invalid_url": "Adres HA musi zaczynać się od ws:// lub wss://.",
    "provision.ha.required_token": "Długoterminowy token dostępu jest wymagany.",
    "provision.ha.required_url": "Adres WebSocket jest wymagany.",
    "provision.ha.show_token": "Pokaż token",
    "provision.ha.subtitle": "Połącz panel z Home Assistant.",
    "provision.ha.title": "Konfiguracja HA",
    "provision.ha.token": "Długoterminowy token dostępu",
    "provision.ha.ws_url": "Adres WebSocket (ws:// lub wss://)",
    "provision.save_failed": "Zapis nie powiódł się: {error}",
    "provision.saved_reboot": "Ustawienia zapisane. Urządzenie zrestartuje się za ~2s.",
    "provision.saving_reboot": "Zapisywanie ustawień i restartowanie...",
    "provision.wifi.country_code": "Kod kraju",
    "provision.wifi.hint": "Zapis restartuje panel. Po restarcie pokazana zostanie konfiguracja HA.",
    "provision.wifi.password": "Hasło",
    "provision.wifi.password_placeholder": "Hasło Wi-Fi",
    "provision.wifi.required_country": "Kod kraju musi mieć 2 litery (np. US, DE).",
    "provision.wifi.required_ssid": "SSID jest wymagane.",
    "provision.wifi.show_password": "Pokaż hasło",
    "provision.wifi.ssid": "SSID",
    "provision.wifi.subtitle": "Połącz panel ze swoim Wi-Fi.",
    "provision.wifi.title": "Konfiguracja Wi-Fi",
    "settings.actions.heading": "Akcje ustawień",
    "settings.actions.hint": "Po zapisaniu urządzenie zrestartuje się i może przełączyć się z AP konfiguracyjnego na domowe Wi-Fi.",
    "settings.actions.reload": "Przeładuj ustawienia",
    "settings.actions.save": "Zapisz + restart",
    "settings.ap.active": "AP konfiguracyjny aktywny: {ssid}\nOtwórz http://192.168.4.1, będąc połączonym z tym AP.",
    "settings.ap.heading": "AP konfiguracyjny",
    "settings.ap.hint": "Jeśli AP konfiguracyjny jest aktywny, połącz się z nim i otwórz <code>http://192.168.4.1</code>.",
    "settings.ap.inactive": "AP konfiguracyjny nieaktywny.\nUżyj adresu IP panelu w domowej sieci Wi-Fi.",
    "settings.ha.heading": "Home Assistant",
    "settings.ha.rest_fallback": "Włącz zapasowy REST HA (Domyślnie: Wył., preferowany tylko WS)",
    "settings.ha.token": "Długoterminowy token dostępu",
    "settings.ha.token_placeholder": "Pozostaw puste, aby zachować zapisany token",
    "settings.ha.ws_url": "Adres WebSocket (ws:// lub wss://)",
    "settings.info.channel": "Kanał",
    "settings.info.configured": "Skonfigurowano",
    "settings.info.connected": "Połączono",
    "settings.info.connected_bssid": "Połączony BSSID",
    "settings.info.country": "Kraj",
    "settings.info.password_stored": "Hasło zapisane",
    "settings.info.rest_fallback": "Zapas REST",
    "settings.info.rssi": "RSSI (połączony AP)",
    "settings.info.token_stored": "Token zapisany",
    "settings.language.invalid_bssid": "BSSID musi być puste lub w formacie AA:BB:CC:DD:EE:FF",
    "settings.language.invalid_country": "Kod kraju Wi-Fi musi być 2-literowym kodem ISO (np. US, DE)",
    "settings.language.invalid_ha_url": "Adres HA musi zaczynać się od ws:// lub wss://",
    "settings.language.invalid_ota_url": "Adres OTA Xiaozhi musi zaczynać się od http:// lub https://",
    "settings.language.invalid_xiaozhi_url": "Adres Xiaozhi musi zaczynać się od ws:// lub wss://",
    "settings.language.option_de": "Niemiecki",
    "settings.language.option_en": "Angielski",
    "settings.language.option_es": "Hiszpański",
    "settings.language.option_fr": "Francuski",
    "settings.ota.downloading": "Pobieranie z adresu: {progress}% ({written} / {total})",
    "settings.ota.error": "OTA nie powiodło się: {error}",
    "settings.ota.file": "Plik OTA .bin",
    "settings.ota.flash_url": "Adres flash",
    "settings.ota.heading": "Aktualizacja oprogramowania",
    "settings.ota.idle": "Gotowy na obraz aplikacji OTA. Działa: {running}, następny slot: {next}, rozmiar slotu: {size}.",
    "settings.ota.no_file": "Najpierw wybierz plik OTA .bin.",
    "settings.ota.no_url": "Najpierw wklej adres OTA.",
    "settings.ota.rebooting": "Urządzenie się restartuje. Otwórz ponownie panel, gdy wróci do sieci.",
    "settings.ota.refresh": "Odśwież status",
    "settings.ota.request_failed": "Żądanie OTA nie powiodło się: {error}",
    "settings.ota.running": "OTA działa: {progress}% ({written} / {total})",
    "settings.ota.starting_url": "Uruchamianie OTA z adresu...",
    "settings.ota.success": "Obraz OTA zapisany. Trwa restart.",
    "settings.ota.target_slot": "Docelowy slot: {partition}",
    "settings.ota.upload": "Wgraj + Flash",
    "settings.ota.upload_progress": "Wgrywanie do panelu: {progress}% ({written} / {total})",
    "settings.ota.uploading": "Panel otrzymał wgranie: {progress}% ({written} / {total})",
    "settings.ota.url": "Adres OTA",
    "settings.ota.url_placeholder": "https://example.com/betta-ha-panel-7b.ota.bin",
    "settings.theme.heading": "Motyw",
    "settings.time.heading": "Czas",
    "settings.time.info": "Zastosowane po restarcie. Synchronizacja czasu zaczyna się po połączeniu Wi-Fi.",
    "settings.time.ntp_server": "Serwer NTP",
    "settings.time.timezone": "Strefa czasowa (POSIX TZ)",
    "settings.translation.info": "Wgraj plik JSON, aby dodać lub zaktualizować język.",
    "settings.translation.invalid_code": "Kod języka musi używać [a-z0-9_-] i mieć 2-15 znaków.",
    "settings.translation.invalid_json": "Nieprawidłowy JSON",
    "settings.translation.no_file": "Najpierw wybierz plik JSON.",
    "settings.translation.object_required": "JSON musi być obiektem",
    "settings.translation.upload_fail": "Wgranie nie powiodło się: {error}",
    "settings.translation.upload_ok": "Język \"{lang}\" został wgrany.",
    "settings.ui.download_json": "Pobierz JSON",
    "settings.ui.heading": "Interfejs",
    "settings.ui.info": "Podgląd zmienia się natychmiast. Zapisany język zostanie zastosowany po restarcie.",
    "settings.ui.language": "Język",
    "settings.ui.reload_languages": "Przeładuj języki",
    "settings.ui.upload_button": "Wgraj / dodaj język",
    "settings.ui.upload_code": "Kod języka",
    "settings.ui.upload_file": "Plik JSON tłumaczenia",
    "settings.xiaozhi.cloud_activation": "Aktywacja w chmurze (kod parowania)",
    "settings.xiaozhi.device": "ID urządzenia (opcjonalnie)",
    "settings.xiaozhi.enabled": "Włącz asystenta głosowego Xiaozhi AI",
    "settings.xiaozhi.heading": "Xiaozhi AI",
    "settings.xiaozhi.ota_url": "Adres OTA Xiaozhi Cloud (kod parowania)",
    "settings.xiaozhi.server": "Adres WebSocket (ws:// lub wss://)",
    "settings.xiaozhi.token": "Token dostępu",
    "setup.add_button": "+ Przełącznik",
    "setup.add_heating": "+ Ogrzewanie",
    "setup.add_light": "+ Światło",
    "setup.add_sensor": "+ Czujnik",
    "setup.add_weather": "+ Pogoda",
    "setup.added": "Dodano: {title}",
    "setup.close": "Zamknij",
    "setup.count_many": "{count} kafelków na tej stronie.",
    "setup.count_none": "Nie dodano jeszcze żadnych kafelków.",
    "setup.count_one": "1 kafelek na tej stronie.",
    "setup.done": "Zapisz + Gotowe",
    "setup.page_label": "Tytuł pierwszej strony",
    "setup.page_placeholder": "Salon",
    "setup.save": "Zapisz układ",
    "setup.save_failed": "Zapis nie powiódł się: {error}",
    "setup.saved": "Układ zapisany. Panel może teraz używać tego pulpitu.",
    "setup.saving": "Zapisywanie układu...",
    "setup.skip": "Pomiń",
    "setup.step_ha": "HA połączone",
    "setup.step_save": "Zapisz układ",
    "setup.step_tiles": "Dodaj kafelki",
    "setup.subtitle": "Wybierz kilka encji Home Assistant dla swojego pierwszego pulpitu.",
    "setup.title": "Szybka konfiguracja",
    "sidebar.subtitle": "Źródło układu: JSON",
    "sidebar.title": "Edytor BETTA",
    "status.idle": "Bezczynny",
    "status.loading_settings": "Wczytywanie ustawień...",
    "status.settings_saved_reboot": "Ustawienia zapisane. Urządzenie zrestartuje się za ~2s. Połącz się ponownie i otwórz adres panelu.",
    "status.wifi_scan_complete": "Skanowanie Wi-Fi zakończone ({count} sieci)",
    "status.wifi_scan_failed": "Skanowanie Wi-Fi nie powiodło się: {error}",
    "status.wifi_scan_running": "Skanowanie Wi-Fi...",
    "status.wifi_scan_timeout": "Przekroczono czas żądania skanowania Wi-Fi",
    "wifi.scan.connected_tag": "połączona",
    "wifi.scan.option_no_networks": "Nie znaleziono sieci",
    "wifi.scan.option_not_run": "Brak skanowania",
    "wifi.scan.option_scanning": "Skanowanie...",
    "wifi.scan.option_select": "Wybierz sieć ({count} znalezionych)",
    "wifi.scan.option_unavailable": "Skanowanie niedostępne",
    "wifi.scan_click": "Kliknij \"Skanuj Wi-Fi\", aby wyświetlić pobliskie sieci.",
    "wifi.scan_click_short": "Kliknij \"Skanuj\", aby wyświetlić pobliskie sieci.",
    "wifi.scan_found": "Znaleziono {count} sieci. Wybierz jedną, aby uzupełnić SSID.",
    "wifi.scan_no_networks": "Nie znaleziono sieci. Zbliż się do routera i zeskanuj ponownie.",
    "wifi.scan_unavailable": "Skanowanie Wi-Fi jest niedostępne w trybie AP konfiguracyjnego na tym sprzęcie. Wpisz SSID ręcznie.",
    "layout.widgets.presence_home": "W domu",
    "layout.widgets.presence_away": "Poza domem",
    "layout.music.preview_auto": "Auto-wykrywanie",
    "layout.pages.rename": "Zmień nazwę",
    "layout.music.preview_title": "Teraz odtwarzane",
    "layout.music.preview_subtitle": "Okładka, sterowanie, pozycja i głośność",
    "layout.status.music_page_only": "Strony Muzyki nie przyjmują widżetów.",
    "layout.pages.music_title": "Muzyka",
    "layout.status.radio_page_only": "Strony Radia nie przyjmują widżetów.",
    "layout.pages.add_radio": "+ Strona Radia",
    "layout.pages.menu_weather": "Strona pogody",
    "layout.pages.add_weather": "+ Strona pogody",
    "layout.pages.weather_title": "Pogoda",
    "layout.pages.weather_hint": "Dodaj kafelki, jakie chcesz (pogoda, prognoza, czujniki, ...). Strona ma stałe id \"pogoda\", więc nie dostaje zakładki na dole panelu - otwiera ją ikona pogody na górnym pasku.",
    "layout.pages.weather_chip_hint": "Ikona na górnym pasku pokazuje encję weather.dom. Zmień encję kafelka pogody, jeśli chcesz inną.",
    "layout.status.weather_page_added": "Dodano stronę pogody. Zapisz układ, aby wgrać ją na panel.",
    "layout.status.weather_page_exists": "Strona pogody już istnieje - otwieram ją.",
    "layout.widgets.weather_now_title": "Pogoda",
    "layout.widgets.weather_forecast_title": "Prognoza 3 dni",
    "layout.widgets.weather_temp_title": "Temperatura",
    "layout.widgets.weather_hum_title": "Wilgotność",
    "layout.pages.menu_normal": "Zwykła strona",
    "layout.pages.menu_energy": "Strona energii",
    "layout.pages.menu_xiaozhi": "Strona Xiaozhi",
    "layout.pages.menu_music": "Strona muzyki",
    "layout.pages.menu_radio": "Strona radia",
    "layout.pages.radio_title": "Radio",
    "layout.radio.heading": "Radio internetowe",
    "layout.radio.hint": "Pełnoekranowa siatka stacji z podglądem odtwarzania, głośnością i zatrzymaniem. Strumień odtwarza Home Assistant (media_player.play_media), panel tylko wysyła adres strumienia.",
    "layout.radio.player_entity": "Domyślny odtwarzacz",
    "layout.radio.columns": "Kolumny (2-4)",
    "layout.radio.stations": "Stacje",
    "layout.radio.add_station": "+ Stacja",
    "layout.radio.stations_hint": "Pozostaw listę pustą, aby użyć wbudowanej listy stacji zapisanej w firmware. Każda stacja wymaga nazwy i adresu strumienia http(s) (maksymalnie 24).",
    "layout.radio.station_name": "Nazwa stacji",
    "layout.radio.station_url": "Adres strumienia (http/https)",
    "layout.radio.station_entity": "Zastępczy odtwarzacz (opcjonalnie)",
    "layout.radio.station_up": "Przenieś w górę",
    "layout.radio.station_down": "Przenieś w dół",
    "layout.radio.station_remove": "Usuń stację",
    "layout.radio.empty_list": "Brak stacji - zostanie użyta wbudowana lista stacji.",
    "layout.radio.limit_reached": "Osiągnięto limit {count} stacji na stronę.",
    "layout.radio.apply": "Zastosuj konfigurację radia",
    "layout.radio.no_widgets": "Strony Radia rysują własną siatkę stacji i nie używają widżetów.",
    "layout.radio.preview_title": "Teraz odtwarzane",
    "layout.radio.preview_subtitle": "Siatka stacji, głośność i zatrzymanie",
    "layout.radio.preview_defaults": "Wbudowana lista stacji",
    "layout.radio.preview_more": "+{count} więcej",
  },
};

function widgetSizeLimits(type) {
  const compact = isCompactCanvas();
  const fallback = {
    minW: MIN_WIDGET_SIZE,
    minH: MIN_WIDGET_SIZE,
    maxW: CANVAS_WIDTH,
    maxH: CANVAS_HEIGHT,
  };

  switch (type) {
    case "sensor":
    case "binary_sensor":
      return compact
        ? { minW: 90, minH: 60, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 120, minH: 80, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "binary_sensor":
    case "presence":
      return compact
        ? { minW: 90, minH: 60, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 120, minH: 80, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "alarm_tile":
      return compact
        ? { minW: 150, minH: 110, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 200, minH: 140, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "clock_alarm":
      return compact
        ? { minW: 110, minH: 80, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 150, minH: 110, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "button":
      return compact
        ? { minW: 82, minH: 82, maxW: 320, maxH: 260 }
        : { minW: 100, minH: 100, maxW: 480, maxH: 320 };
    case "slider":
      return compact
        ? { minW: 100, minH: 80, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 100, minH: 100, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "graph":
      return compact
        ? { minW: 150, minH: 100, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 220, minH: 140, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "empty_tile":
      return compact
        ? { minW: 100, minH: 70, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 120, minH: 80, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "light_tile":
      return compact
        ? { minW: 140, minH: 140, maxW: 480, maxH: 480 }
        : { minW: 150, minH: 150, maxW: 480, maxH: 480 };
    case "heating_tile":
      return compact
        ? { minW: 150, minH: 150, maxW: 480, maxH: 480 }
        : { minW: 220, minH: 200, maxW: 480, maxH: 480 };
    case "weather_tile":
      return compact
        ? { minW: 160, minH: 150, maxW: 480, maxH: 480 }
        : { minW: 220, minH: 200, maxW: 480, maxH: 480 };
    case "weather_3day":
      return compact
        ? { minW: 280, minH: 180, maxW: 640, maxH: 480 }
        : { minW: 260, minH: 220, maxW: 640, maxH: 480 };
    case "todo_list":
      return compact
        ? { minW: 180, minH: 160, maxW: 640, maxH: 640 }
        : { minW: 220, minH: 200, maxW: 640, maxH: 640 };
    case "media_player":
      return compact
        ? { minW: 200, minH: 170, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 260, minH: 220, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "roborock_tile":
      return compact
        ? { minW: 220, minH: 190, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 240, minH: 220, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "cover":
    case "lock":
    case "fan":
    case "number":
      return compact
        ? { minW: 100, minH: 90, maxW: 480, maxH: 480 }
        : { minW: 140, minH: 120, maxW: 480, maxH: 480 };
    case "select":
      return compact
        ? { minW: 140, minH: 80, maxW: 480, maxH: 300 }
        : { minW: 180, minH: 100, maxW: 480, maxH: 300 };
    case "cover_tile":
      return compact
        ? { minW: 140, minH: 110, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 180, minH: 140, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "scene_tile":
      return compact
        ? { minW: 96, minH: 90, maxW: 480, maxH: 480 }
        : { minW: 120, minH: 110, maxW: 480, maxH: 480 };
    case "person_tile":
      return compact
        ? { minW: 110, minH: 80, maxW: 640, maxH: 480 }
        : { minW: 140, minH: 100, maxW: 640, maxH: 480 };
    case "timer_tile":
      return compact
        ? { minW: 110, minH: 90, maxW: 480, maxH: 480 }
        : { minW: 140, minH: 110, maxW: 480, maxH: 480 };
    case "sensor_tile":
      return compact
        ? { minW: 100, minH: 100, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 100, minH: 100, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    default:
      return fallback;
  }
}

function clampRectToCanvas(rect, type) {
  const limits = widgetSizeLimits(type);
  const maxW = Math.min(limits.maxW, CANVAS_WIDTH);
  const maxH = Math.min(limits.maxH, CANVAS_HEIGHT);
  const minW = Math.min(limits.minW, maxW);
  const minH = Math.min(limits.minH, maxH);

  const w = clamp(snap(Number(rect.w || minW)), minW, maxW);
  const h = clamp(snap(Number(rect.h || minH)), minH, maxH);
  const x = clamp(snap(Number(rect.x || 0)), 0, CANVAS_WIDTH - w);
  const y = clamp(snap(Number(rect.y || 0)), 0, CANVAS_HEIGHT - h);

  return { x, y, w, h };
}

const editor = {
  layout: null,
  layoutSignature: "",
  entities: [],
  states: new Map(),
  energySnapshot: null,
  localCamZones: [],
  localCamZoneDraft: null,
  localCameraRunning: false,
  selectedPageId: null,
  selectedWidgetId: null,
  activePane: "layout",
  activeSettingsSection: "settingsWifiSection",
  provisioningStage: null,
  editorStarted: false,
  settings: null,
  sd: { state: null, busy: false, dir: "", entries: [] },
  appVersion: "",
  appProject: "",
  appScreenW: 0,
  appScreenH: 0,
  haDiagnostics: { total: 0, listed: 0, updatedUnixMs: 0, names: [], dismissedSignature: "" },
  wifiScanItems: [],
  wifiScanHasRun: false,
  wifiScanInProgress: false,
  wifiScanSupported: true,
  lightPicker: {
    items: [],
    itemsByDomain: {},
    loadedByDomain: {},
    domain: "light",
    widgetType: "light_tile",
    search: "",
    searchByDomain: {},
    searchDebounceId: null,
    loading: false,
    hasLoaded: false,
    pollTimerId: null,
    requestSeq: 0,
    lastStatus: "",
  },
  setupWizard: {
    active: false,
    openedManually: false,
    addedSinceOpen: 0,
  },
  ota: {
    status: null,
    pollTimerId: null,
    uploadInProgress: false,
  },
  cameras: {
    list: [],
    selectedIndex: -1,
    loaded: false,
    entityRequestSeq: 0,
    entityTimerId: null,
  },
  logs: {
    paused: false,
    pollTimerId: null,
    requestSeq: 0,
    lastEtag: "",
  },
  logs: {
    paused: false,
    pollTimerId: null,
    requestSeq: 0,
    lastEtag: "",
  },
  diagnostics: {
    pollTimerId: null,
    requestSeq: 0,
    lastData: null,
  },
  languageCatalog: [],
  i18nLanguage: DEFAULT_UI_LANGUAGE,
  i18nMap: { ...(WEB_I18N_BUILTIN.en || {}) },
  i18nEffective: {},
  // Signature of the radio station rows currently rendered in the editor, so
  // that re-renders triggered by unrelated actions do not steal focus from a
  // station input the user is typing into.
  radioRowsSignature: "",
  sectionCollapsed: {
    pages: false,
    widgets: false,
    inspector: false,
  },
};

const el = {
  provisioningRoot: document.getElementById("provisioningRoot"),
  provisioningWifiPage: document.getElementById("provisioningWifiPage"),
  provisioningHaPage: document.getElementById("provisioningHaPage"),
  editorShell: document.getElementById("editorShell"),
  sidebarTitleText: document.getElementById("sidebarTitleText"),
  appVersionLabel: document.getElementById("appVersionLabel"),
  layoutTabBtn: document.getElementById("layoutTabBtn"),
  settingsTabBtn: document.getElementById("settingsTabBtn"),
  layoutPane: document.getElementById("layoutPane"),
  settingsPane: document.getElementById("settingsPane"),
  settingsContentPane: document.getElementById("settingsContentPane"),
  settingsNavButtons: [],
  settingsContentSections: [],
  canvasWrap: document.querySelector(".canvas-wrap"),
  actionsPanel: document.querySelector("aside.actions-panel"),
  pagesList: document.getElementById("pagesList"),
  pagesMiniList: document.getElementById("pagesMiniList"),
  widgetsList: document.getElementById("widgetsList"),
  canvas: document.getElementById("canvas"),
  canvasTitle: document.getElementById("canvasTitle"),
  status: document.getElementById("status"),
  haDiagnosticsBanner: document.getElementById("haDiagnosticsBanner"),
  haDiagnosticsTitle: document.getElementById("haDiagnosticsTitle"),
  haDiagnosticsList: document.getElementById("haDiagnosticsList"),
  haDiagnosticsHint: document.getElementById("haDiagnosticsHint"),
  haDiagnosticsDismiss: document.getElementById("haDiagnosticsDismiss"),
  pagesSection: document.getElementById("pagesSection"),
  widgetsSection: document.getElementById("widgetsSection"),
  inspectorSection: document.getElementById("inspectorSection"),
  togglePagesSection: document.getElementById("togglePagesSection"),
  toggleWidgetsSection: document.getElementById("toggleWidgetsSection"),
  toggleInspectorSection: document.getElementById("toggleInspectorSection"),
  addPageBtn: document.getElementById("addPageBtn"),
  addEnergyPageBtn: document.getElementById("addEnergyPageBtn"),
  addXiaozhiPageBtn: document.getElementById("addXiaozhiPageBtn"),
  addMusicPageBtn: document.getElementById("addMusicPageBtn"),
  addRadioPageBtn: document.getElementById("addRadioPageBtn"),
  addWeatherPageBtn: document.getElementById("addWeatherPageBtn"),
  deletePageBtn: document.getElementById("deletePageBtn"),
  pageTitleInput: document.getElementById("pageTitleInput"),
  applyPageBtn: document.getElementById("applyPageBtn"),
  energyPageOptions: document.getElementById("energyPageOptions"),
  energySource: document.getElementById("energySource"),
  energySourceHint: document.getElementById("energySourceHint"),
  energyManualOptions: document.getElementById("energyManualOptions"),
  energyHomePower: document.getElementById("energyHomePower"),
  energySolarPower: document.getElementById("energySolarPower"),
  energyGridPower: document.getElementById("energyGridPower"),
  energyGridImport: document.getElementById("energyGridImport"),
  energyGridExport: document.getElementById("energyGridExport"),
  energyBatteryPower: document.getElementById("energyBatteryPower"),
  energyBatteryCharge: document.getElementById("energyBatteryCharge"),
  energyBatteryDischarge: document.getElementById("energyBatteryDischarge"),
  energyBatterySoc: document.getElementById("energyBatterySoc"),
  applyEnergyPageBtn: document.getElementById("applyEnergyPageBtn"),
  musicPageOptions: document.getElementById("musicPageOptions"),
  musicPlayerEntity: document.getElementById("musicPlayerEntity"),
  musicPlayers: document.getElementById("musicPlayers"),
  applyMusicPageBtn: document.getElementById("applyMusicPageBtn"),
  radioPageOptions: document.getElementById("radioPageOptions"),
  weatherPageOptions: document.getElementById("weatherPageOptions"),
  radioPlayerEntity: document.getElementById("radioPlayerEntity"),
  radioColumns: document.getElementById("radioColumns"),
  radioStationsList: document.getElementById("radioStationsList"),
  radioAddStationBtn: document.getElementById("radioAddStationBtn"),
  applyRadioPageBtn: document.getElementById("applyRadioPageBtn"),
  addSensorBtn: document.getElementById("addSensorBtn"),
  addBinarySensorBtn: document.getElementById("addBinarySensorBtn"),
  addButtonBtn: document.getElementById("addButtonBtn"),
  addBinarySensorBtn: document.getElementById("addBinarySensorBtn"),
  addAlarmTileBtn: document.getElementById("addAlarmTileBtn"),
  addCoverTileBtn: document.getElementById("addCoverTileBtn"),
  addSceneTileBtn: document.getElementById("addSceneTileBtn"),
  addPersonTileBtn: document.getElementById("addPersonTileBtn"),
  addTimerTileBtn: document.getElementById("addTimerTileBtn"),
  addClockBtn: document.getElementById("addClockBtn"),
  addSliderBtn: document.getElementById("addSliderBtn"),
  addGraphBtn: document.getElementById("addGraphBtn"),
  addEmptyTileBtn: document.getElementById("addEmptyTileBtn"),
  addLightTileBtn: document.getElementById("addLightTileBtn"),
  openSetupWizardBtn: document.getElementById("openSetupWizardBtn"),
  lightEntityPickerOverlay: document.getElementById("lightEntityPickerOverlay"),
  lightEntityPickerTitle: document.getElementById("lightEntityPickerTitle"),
  lightEntityPickerRefreshBtn: document.getElementById("lightEntityPickerRefreshBtn"),
  lightEntityPickerCloseBtn: document.getElementById("lightEntityPickerCloseBtn"),
  lightEntityPickerBlankBtn: document.getElementById("lightEntityPickerBlankBtn"),
  lightEntityPickerSearch: document.getElementById("lightEntityPickerSearch"),
  lightEntityPickerStatus: document.getElementById("lightEntityPickerStatus"),
  lightEntityPickerProgress: document.getElementById("lightEntityPickerProgress"),
  lightEntityPickerProgressBar: document.getElementById("lightEntityPickerProgressBar"),
  lightEntityPickerProgressText: document.getElementById("lightEntityPickerProgressText"),
  lightEntityPickerRooms: document.getElementById("lightEntityPickerRooms"),
  addHeatingTileBtn: document.getElementById("addHeatingTileBtn"),
  addWeatherTileBtn: document.getElementById("addWeatherTileBtn"),
  addWeather3DayBtn: document.getElementById("addWeather3DayBtn"),
  addTodoListBtn: document.getElementById("addTodoListBtn"),
  addMediaPlayerBtn: document.getElementById("addMediaPlayerBtn"),
  addRoborockTileBtn: document.getElementById("addRoborockTileBtn"),
  addCoverBtn: document.getElementById("addCoverBtn"),
  addLockBtn: document.getElementById("addLockBtn"),
  addFanBtn: document.getElementById("addFanBtn"),
  addSelectBtn: document.getElementById("addSelectBtn"),
  addNumberBtn: document.getElementById("addNumberBtn"),
  deleteWidgetBtn: document.getElementById("deleteWidgetBtn"),
  reloadBtn: document.getElementById("reloadBtn"),
  saveBtn: document.getElementById("saveBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  jsonPaste: document.getElementById("jsonPaste"),
  fTitle: document.getElementById("fTitle"),
  fType: document.getElementById("fType"),
  fEntityWrap: document.getElementById("fEntityWrap"),
  fEntity: document.getElementById("fEntity"),
  fSecondaryEntityWrap: document.getElementById("fSecondaryEntityWrap"),
  fSecondaryEntityLabel: document.getElementById("fSecondaryEntityLabel"),
  fSecondaryEntity: document.getElementById("fSecondaryEntity"),
  buttonOptions: document.getElementById("buttonOptions"),
  fButtonMode: document.getElementById("fButtonMode"),
  fSliderEntityDomain: document.getElementById("fSliderEntityDomain"),
  fButtonAccentColor: document.getElementById("fButtonAccentColor"),
  fButtonStyle: document.getElementById("fButtonStyle"),
  sliderOptions: document.getElementById("sliderOptions"),
  fSliderDirection: document.getElementById("fSliderDirection"),
  fSliderAccentColor: document.getElementById("fSliderAccentColor"),
  graphOptions: document.getElementById("graphOptions"),
  fGraphLineColor: document.getElementById("fGraphLineColor"),
  fGraphTimeWindowMin: document.getElementById("fGraphTimeWindowMin"),
  fGraphPointCount: document.getElementById("fGraphPointCount"),
  fGraphPointCountWrap: document.getElementById("fGraphPointCountWrap"),
  fGraphDisplayMode: document.getElementById("fGraphDisplayMode"),
  fGraphDisplayModeLabel: document.getElementById("fGraphDisplayModeLabel"),
  fGraphBarBucketMin: document.getElementById("fGraphBarBucketMin"),
  fGraphBarBucketMinLabel: document.getElementById("fGraphBarBucketMinLabel"),
  fGraphBarBucketMinWrap: document.getElementById("fGraphBarBucketMinWrap"),
  heatingOptions: document.getElementById("heatingOptions"),
  fHeatingStyleVariant: document.getElementById("fHeatingStyleVariant"),
  fHeatingArcOpening: document.getElementById("fHeatingArcOpening"),
  fHeatingArcOpeningWrap: document.getElementById("fHeatingArcOpeningWrap"),
  binaryOptions: document.getElementById("binaryOptions"),
  fBinaryShowTitle: document.getElementById("fBinaryShowTitle"),
  fBinaryShowTitleLabel: document.getElementById("fBinaryShowTitleLabel"),
  fBinaryColorOn: document.getElementById("fBinaryColorOn"),
  fBinaryColorOnLabel: document.getElementById("fBinaryColorOnLabel"),
  fBinaryColorOff: document.getElementById("fBinaryColorOff"),
  fBinaryColorOffLabel: document.getElementById("fBinaryColorOffLabel"),
  fBinaryTextOn: document.getElementById("fBinaryTextOn"),
  fBinaryTextOnLabel: document.getElementById("fBinaryTextOnLabel"),
  fBinaryTextOff: document.getElementById("fBinaryTextOff"),
  fBinaryTextOffLabel: document.getElementById("fBinaryTextOffLabel"),
  binaryOptions: document.getElementById("binaryOptions"),
  fBinaryShowTitle: document.getElementById("fBinaryShowTitle"),
  fBinaryColorOn: document.getElementById("fBinaryColorOn"),
  fBinaryColorOff: document.getElementById("fBinaryColorOff"),
  fBinaryTextOn: document.getElementById("fBinaryTextOn"),
  fBinaryTextOff: document.getElementById("fBinaryTextOff"),
  alarmOptions: document.getElementById("alarmOptions"),
  fAlarmCode: document.getElementById("fAlarmCode"),
  fAlarmAskCode: document.getElementById("fAlarmAskCode"),
  fAlarmBackend: document.getElementById("fAlarmBackend"),
  fAlarmZoneLabel: document.getElementById("fAlarmZoneLabel"),
  fAlarmShowSensors: document.getElementById("fAlarmShowSensors"),
  fAlarmShowBypassed: document.getElementById("fAlarmShowBypassed"),
  fAlarmForceArm: document.getElementById("fAlarmForceArm"),
  fAlarmSkipDelay: document.getElementById("fAlarmSkipDelay"),
  fAlarmModes: document.getElementById("fAlarmModes"),
  clockOptions: document.getElementById("clockOptions"),
  fClockShowSeconds: document.getElementById("fClockShowSeconds"),
  fClockShowDate: document.getElementById("fClockShowDate"),
  sensorOptions: document.getElementById("sensorOptions"),
  fSensorValueColor: document.getElementById("fSensorValueColor"),
  sensorTileOptions: document.getElementById("sensorTileOptions"),
  fSensorTileEntityIds: document.getElementById("fSensorTileEntityIds"),
  tileLookGroup: document.getElementById("tileLookGroup"),
  fTilePreset: document.getElementById("fTilePreset"),
  fTileBgColor: document.getElementById("fTileBgColor"),
  fTileBgColorPick: document.getElementById("fTileBgColorPick"),
  fTileBgGradColor: document.getElementById("fTileBgGradColor"),
  fTileBgGradColorPick: document.getElementById("fTileBgGradColorPick"),
  fTileBgGradDir: document.getElementById("fTileBgGradDir"),
  fTileBorderColor: document.getElementById("fTileBorderColor"),
  fTileBorderColorPick: document.getElementById("fTileBorderColorPick"),
  fTileBorderWidth: document.getElementById("fTileBorderWidth"),
  fTileRadius: document.getElementById("fTileRadius"),
  fTileOpacity: document.getElementById("fTileOpacity"),
  fTileShadow: document.getElementById("fTileShadow"),
  fTileFontScale: document.getElementById("fTileFontScale"),
  fTileTextColor: document.getElementById("fTileTextColor"),
  fTileTextColorPick: document.getElementById("fTileTextColorPick"),
  fTileTitleColor: document.getElementById("fTileTitleColor"),
  fTileTitleColorPick: document.getElementById("fTileTitleColorPick"),
  fTileLabelColor: document.getElementById("fTileLabelColor"),
  fTileLabelColorPick: document.getElementById("fTileLabelColorPick"),
  fTileValueColor: document.getElementById("fTileValueColor"),
  fTileValueColorPick: document.getElementById("fTileValueColorPick"),
  fTileIconColor: document.getElementById("fTileIconColor"),
  fTileIconColorPick: document.getElementById("fTileIconColorPick"),
  fTileResetBtn: document.getElementById("tileLookResetBtn"),
  tileLookResetBtn: document.getElementById("tileLookResetBtn"),
  fTileCornerShape: document.getElementById("fTileCornerShape"),
  fTileCopySource: document.getElementById("fTileCopySource"),
  tileLookCopyBtn: document.getElementById("tileLookCopyBtn"),
  tileLookCopyPageBtn: document.getElementById("tileLookCopyPageBtn"),
  pageLookOptions: document.getElementById("pageLookOptions"),
  fPagePreset: document.getElementById("fPagePreset"),
  fPageBgColor: document.getElementById("fPageBgColor"),
  fPageBgColorPick: document.getElementById("fPageBgColorPick"),
  fPageBgGradColor: document.getElementById("fPageBgGradColor"),
  fPageBgGradColorPick: document.getElementById("fPageBgGradColorPick"),
  fPageBgGradDir: document.getElementById("fPageBgGradDir"),
  fPageWallpaper: document.getElementById("fPageWallpaper"),
  fPageDim: document.getElementById("fPageDim"),
  fPageTheme: document.getElementById("fPageTheme"),
  pageLookResetBtn: document.getElementById("pageLookResetBtn"),
  fX: document.getElementById("fX"),
  fY: document.getElementById("fY"),
  fW: document.getElementById("fW"),
  fH: document.getElementById("fH"),
  applyInspectorBtn: document.getElementById("applyInspectorBtn"),
  entityOptions: document.getElementById("entityOptions"),
  energyEntityOptions: document.getElementById("energyEntityOptions"),
  musicEntityOptions: document.getElementById("musicEntityOptions"),
  sensorEntityOptions: document.getElementById("sensorEntityOptions"),
  settingsWifiSsid: document.getElementById("settingsWifiSsid"),
  settingsWifiCountryCode: document.getElementById("settingsWifiCountryCode"),
  settingsWifiBssid: document.getElementById("settingsWifiBssid"),
  scanWifiBtn: document.getElementById("scanWifiBtn"),
  settingsWifiScanResults: document.getElementById("settingsWifiScanResults"),
  settingsWifiScanInfo: document.getElementById("settingsWifiScanInfo"),
  settingsWifiPassword: document.getElementById("settingsWifiPassword"),
  settingsWifiStaticEnabled: document.getElementById("settingsWifiStaticEnabled"),
  settingsWifiStaticIp: document.getElementById("settingsWifiStaticIp"),
  settingsWifiStaticNetmask: document.getElementById("settingsWifiStaticNetmask"),
  settingsWifiStaticGateway: document.getElementById("settingsWifiStaticGateway"),
  settingsWifiStaticDns: document.getElementById("settingsWifiStaticDns"),
  settingsHaUrl: document.getElementById("settingsHaUrl"),
  settingsHaToken: document.getElementById("settingsHaToken"),
  settingsHaRestEnabled: document.getElementById("settingsHaRestEnabled"),
  settingsXiaozhiEnabled: document.getElementById("settingsXiaozhiEnabled"),
  settingsXiaozhiServer: document.getElementById("settingsXiaozhiServer"),
  settingsXiaozhiOtaUrl: document.getElementById("settingsXiaozhiOtaUrl"),
  settingsXiaozhiDevice: document.getElementById("settingsXiaozhiDevice"),
  settingsXiaozhiToken: document.getElementById("settingsXiaozhiToken"),
  settingsXiaozhiInfo: document.getElementById("settingsXiaozhiInfo"),
  camerasList: document.getElementById("camerasList"),
  camerasAddBtn: document.getElementById("camerasAddBtn"),
  camerasEditor: document.getElementById("camerasEditor"),
  camerasName: document.getElementById("camerasName"),
  camerasSource: document.getElementById("camerasSource"),
  camerasEntity: document.getElementById("camerasEntity"),
  camerasHaFields: document.getElementById("camerasHaFields"),
  camerasHttpFields: document.getElementById("camerasHttpFields"),
  camerasEntityHint: document.getElementById("camerasEntityHint"),
  camerasUrl: document.getElementById("camerasUrl"),
  camerasUser: document.getElementById("camerasUser"),
  camerasPass: document.getElementById("camerasPass"),
  camerasRefresh: document.getElementById("camerasRefresh"),
  camerasEnabled: document.getElementById("camerasEnabled"),
  camerasSaveBtn: document.getElementById("camerasSaveBtn"),
  camerasDeleteBtn: document.getElementById("camerasDeleteBtn"),
  camerasInfo: document.getElementById("camerasInfo"),
  settingsLocalCamStatus: document.getElementById("settingsLocalCamStatus"),
  settingsLocalCamEnabled: document.getElementById("settingsLocalCamEnabled"),
  settingsLocalCamStream: document.getElementById("settingsLocalCamStream"),
  settingsLocalCamMotion: document.getElementById("settingsLocalCamMotion"),
  settingsLocalCamThreshold: document.getElementById("settingsLocalCamThreshold"),
  settingsLocalCamQuality: document.getElementById("settingsLocalCamQuality"),
  settingsLocalCamResolution: document.getElementById("settingsLocalCamResolution"),
  settingsLocalCamHflip: document.getElementById("settingsLocalCamHflip"),
  settingsLocalCamVflip: document.getElementById("settingsLocalCamVflip"),
  settingsLocalCamSaveBtn: document.getElementById("settingsLocalCamSaveBtn"),
  settingsLocalCamSnapshot: document.getElementById("settingsLocalCamSnapshot"),
  settingsLocalCamSnapshotBtn: document.getElementById("settingsLocalCamSnapshotBtn"),
  settingsLocalCamSnapshotHint: document.getElementById("settingsLocalCamSnapshotHint"),
  settingsLocalCamMotionMinArea: document.getElementById("settingsLocalCamMotionMinArea"),
  settingsLocalCamMotionMinAreaVal: document.getElementById("settingsLocalCamMotionMinAreaVal"),
  settingsLocalCamMotionMinDuration: document.getElementById("settingsLocalCamMotionMinDuration"),
  settingsLocalCamMotionCooldown: document.getElementById("settingsLocalCamMotionCooldown"),
  settingsLocalCamMotionStartDelay: document.getElementById("settingsLocalCamMotionStartDelay"),
  settingsLocalCamMotionIgnoreLighting: document.getElementById("settingsLocalCamMotionIgnoreLighting"),
  settingsLocalCamZonesWrap: document.getElementById("settingsLocalCamZonesWrap"),
  settingsLocalCamZonesSnapshot: document.getElementById("settingsLocalCamZonesSnapshot"),
  settingsLocalCamZonesOverlay: document.getElementById("settingsLocalCamZonesOverlay"),
  settingsLocalCamZonesList: document.getElementById("settingsLocalCamZonesList"),
  settingsLocalCamZonesSnapshotBtn: document.getElementById("settingsLocalCamZonesSnapshotBtn"),
  settingsLocalCamZonesClearBtn: document.getElementById("settingsLocalCamZonesClearBtn"),
  settingsLocalCamMotionDiag: document.getElementById("settingsLocalCamMotionDiag"),
  settingsLocalCamMotionDiagBtn: document.getElementById("settingsLocalCamMotionDiagBtn"),
  settingsNtpServer: document.getElementById("settingsNtpServer"),
  settingsTimezone: document.getElementById("settingsTimezone"),
  settingsLanguage: document.getElementById("settingsLanguage"),
  reloadLanguagesBtn: document.getElementById("reloadLanguagesBtn"),
  downloadLanguageBtn: document.getElementById("downloadLanguageBtn"),
  uploadLanguageCode: document.getElementById("uploadLanguageCode"),
  uploadLanguageFile: document.getElementById("uploadLanguageFile"),
  uploadLanguageBtn: document.getElementById("uploadLanguageBtn"),
  settingsTranslationInfo: document.getElementById("settingsTranslationInfo"),
  settingsWifiInfo: document.getElementById("settingsWifiInfo"),
  settingsHaInfo: document.getElementById("settingsHaInfo"),
  settingsTimeInfo: document.getElementById("settingsTimeInfo"),
  settingsBrightness: document.getElementById("settingsBrightness"),
  settingsScreensaverEnabled: document.getElementById("settingsScreensaverEnabled"),
  settingsScreensaverTimeout: document.getElementById("settingsScreensaverTimeout"),
  settingsSaverBrightness: document.getElementById("settingsSaverBrightness"),
  settingsSaverWallpaperDim: document.getElementById("settingsSaverWallpaperDim"),
  settingsSaverWallpaperDimHint: document.getElementById("settingsSaverWallpaperDimHint"),
  settingsScreenOffEnabled: document.getElementById("settingsScreenOffEnabled"),
  settingsScreenOffTimeout: document.getElementById("settingsScreenOffTimeout"),
  settingsClockFormat: document.getElementById("settingsClockFormat"),
  settingsClockStyle: document.getElementById("settingsClockStyle"),
  settingsShowSeconds: document.getElementById("settingsShowSeconds"),
  settingsShowDate: document.getElementById("settingsShowDate"),
  settingsClockColor: document.getElementById("settingsClockColor"),
  settingsDateColor: document.getElementById("settingsDateColor"),
  settingsNightModeEnabled: document.getElementById("settingsNightModeEnabled"),
  settingsNightStart: document.getElementById("settingsNightStart"),
  settingsNightEnd: document.getElementById("settingsNightEnd"),
  settingsNightBrightness: document.getElementById("settingsNightBrightness"),
  settingsNightWakeSec: document.getElementById("settingsNightWakeSec"),
  settingsNightHint: document.getElementById("settingsNightHint"),
  settingsThemeAutoEnabled: document.getElementById("settingsThemeAutoEnabled"),
  settingsThemeDaySelect: document.getElementById("settingsThemeDaySelect"),
  settingsThemeNightSelect: document.getElementById("settingsThemeNightSelect"),
  settingsThemeAutoHint: document.getElementById("settingsThemeAutoHint"),
  settingsTilePressFx: document.getElementById("settingsTilePressFx"),
  settingsTilePressFxDim: document.getElementById("settingsTilePressFxDim"),
  settingsTilePressFxScale: document.getElementById("settingsTilePressFxScale"),
  settingsTilePressFxHint: document.getElementById("settingsTilePressFxHint"),
  settingsTilePressFxPreviewTile: document.getElementById("settingsTilePressFxPreviewTile"),
  settingsValueAnim: document.getElementById("settingsValueAnim"),
  settingsValueAnimMs: document.getElementById("settingsValueAnimMs"),
  settingsValueAnimHint: document.getElementById("settingsValueAnimHint"),
  settingsValueAnimPreview: document.getElementById("settingsValueAnimPreview"),
  settingsValueAnimPreviewBtn: document.getElementById("settingsValueAnimPreviewBtn"),
  settingsTopbarShowClock: document.getElementById("settingsTopbarShowClock"),
  settingsTopbarShowDate: document.getElementById("settingsTopbarShowDate"),
  settingsTopbarShowGear: document.getElementById("settingsTopbarShowGear"),
  settingsTopbarShowStatus: document.getElementById("settingsTopbarShowStatus"),
  settingsTopbarIconText: document.getElementById("settingsTopbarIconText"),
  settingsTopbarCustomColors: document.getElementById("settingsTopbarCustomColors"),
  settingsTopbarColors: document.getElementById("settingsTopbarColors"),
  settingsTopbarBgColor: document.getElementById("settingsTopbarBgColor"),
  settingsTopbarClockColor: document.getElementById("settingsTopbarClockColor"),
  settingsTopbarDateColor: document.getElementById("settingsTopbarDateColor"),
  settingsTopbarGearColor: document.getElementById("settingsTopbarGearColor"),
  settingsTopbarHaColor: document.getElementById("settingsTopbarHaColor"),
  settingsTopbarWifiColor: document.getElementById("settingsTopbarWifiColor"),
  settingsTopbarHint: document.getElementById("settingsTopbarHint"),
  settingsTopbarColorHint: document.getElementById("settingsTopbarColorHint"),
  settingsNavCustomColors: document.getElementById("settingsNavCustomColors"),
  settingsNavColors: document.getElementById("settingsNavColors"),
  settingsNavBarBgColor: document.getElementById("settingsNavBarBgColor"),
  settingsNavBarBorderColor: document.getElementById("settingsNavBarBorderColor"),
  settingsNavButtonBgColor: document.getElementById("settingsNavButtonBgColor"),
  settingsNavButtonBorderColor: document.getElementById("settingsNavButtonBorderColor"),
  settingsNavTabIdleColor: document.getElementById("settingsNavTabIdleColor"),
  settingsNavTabActiveColor: document.getElementById("settingsNavTabActiveColor"),
  settingsNavHomeIdleColor: document.getElementById("settingsNavHomeIdleColor"),
  settingsNavHomeActiveColor: document.getElementById("settingsNavHomeActiveColor"),
  settingsNavColorHint: document.getElementById("settingsNavColorHint"),
  settingsPageTransition: document.getElementById("settingsPageTransition"),
  settingsPageTransitionMs: document.getElementById("settingsPageTransitionMs"),
  settingsPageTransitionHint: document.getElementById("settingsPageTransitionHint"),
  settingsPageTarget: document.getElementById("settingsPageTarget"),
  reloadPagesBtn: document.getElementById("reloadPagesBtn"),
  showPageOnPanelBtn: document.getElementById("showPageOnPanelBtn"),
  applyPagesBtn: document.getElementById("applyPagesBtn"),
  settingsPagesInfo: document.getElementById("settingsPagesInfo"),
  settingsPageActivateInfo: document.getElementById("settingsPageActivateInfo"),
  downloadBackupBtn: document.getElementById("downloadBackupBtn"),
  settingsBackupFile: document.getElementById("settingsBackupFile"),
  restoreBackupBtn: document.getElementById("restoreBackupBtn"),
  settingsBackupInfo: document.getElementById("settingsBackupInfo"),
  settingsWallpaperFile: document.getElementById("settingsWallpaperFile"),
  uploadWallpaperBtn: document.getElementById("uploadWallpaperBtn"),
  removeWallpaperBtn: document.getElementById("removeWallpaperBtn"),
  settingsWallpaperInfo: document.getElementById("settingsWallpaperInfo"),
  applyDisplayBtn: document.getElementById("applyDisplayBtn"),
  settingsDisplayInfo: document.getElementById("settingsDisplayInfo"),
  settingsSdEnabled: document.getElementById("settingsSdEnabled"),
  settingsSdStatus: document.getElementById("settingsSdStatus"),
  settingsSdInfo: document.getElementById("settingsSdInfo"),
  sdRefreshBtn: document.getElementById("sdRefreshBtn"),
  sdExportLogsBtn: document.getElementById("sdExportLogsBtn"),
  sdFormatBtn: document.getElementById("sdFormatBtn"),
  sdUpBtn: document.getElementById("sdUpBtn"),
  sdRootBtn: document.getElementById("sdRootBtn"),
  sdLogsBtn: document.getElementById("sdLogsBtn"),
  sdPhotosBtn: document.getElementById("sdPhotosBtn"),
  sdPath: document.getElementById("sdPath"),
  sdFileList: document.getElementById("sdFileList"),
  sdWallpaperStore: document.getElementById("sdWallpaperStore"),
  settingsMqttEnabled: document.getElementById("settingsMqttEnabled"),
  settingsMqttUseTls: document.getElementById("settingsMqttUseTls"),
  settingsMqttTlsHint: document.getElementById("settingsMqttTlsHint"),
  settingsMqttHost: document.getElementById("settingsMqttHost"),
  settingsMqttPort: document.getElementById("settingsMqttPort"),
  settingsMqttUsername: document.getElementById("settingsMqttUsername"),
  settingsMqttPassword: document.getElementById("settingsMqttPassword"),
  settingsMqttDiscoveryPrefix: document.getElementById("settingsMqttDiscoveryPrefix"),
  applyMqttBtn: document.getElementById("applyMqttBtn"),
  settingsMqttInfo: document.getElementById("settingsMqttInfo"),
  settingsUiInfo: document.getElementById("settingsUiInfo"),
  settingsApInfo: document.getElementById("settingsApInfo"),
  settingsOtaUrl: document.getElementById("settingsOtaUrl"),
  startOtaUrlBtn: document.getElementById("startOtaUrlBtn"),
  refreshOtaStatusBtn: document.getElementById("refreshOtaStatusBtn"),
  settingsOtaFile: document.getElementById("settingsOtaFile"),
  uploadOtaBtn: document.getElementById("uploadOtaBtn"),
  settingsOtaProgressBar: document.getElementById("settingsOtaProgressBar"),
  settingsOtaInfo: document.getElementById("settingsOtaInfo"),
  settingsLogsViewer: document.getElementById("settingsLogsViewer"),
  logsRefreshBtn: document.getElementById("logsRefreshBtn"),
  logsPauseBtn: document.getElementById("logsPauseBtn"),
  logsClearBtn: document.getElementById("logsClearBtn"),
  logsAutoScroll: document.getElementById("logsAutoScroll"),
  logsMeta: document.getElementById("logsMeta"),
  settingsAutoRestartEnabled: document.getElementById("settingsAutoRestartEnabled"),
  settingsAutoRestartHours: document.getElementById("settingsAutoRestartHours"),
  settingsSystemInfo: document.getElementById("settingsSystemInfo"),
  settingsLogsViewer: document.getElementById("settingsLogsViewer"),
  logsRefreshBtn: document.getElementById("logsRefreshBtn"),
  logsPauseBtn: document.getElementById("logsPauseBtn"),
  logsClearBtn: document.getElementById("logsClearBtn"),
  logsAutoScroll: document.getElementById("logsAutoScroll"),
  logsMeta: document.getElementById("logsMeta"),
  logsDownloadLink: document.getElementById("logsDownloadLink"),
  logsLevel: document.getElementById("logsLevel"),
  logsLevelApplyBtn: document.getElementById("logsLevelApplyBtn"),
  logsLevelInfo: document.getElementById("logsLevelInfo"),
  diagnosticsRefreshBtn: document.getElementById("diagnosticsRefreshBtn"),
  diagnosticsAutoRefresh: document.getElementById("diagnosticsAutoRefresh"),
  diagnosticsMeta: document.getElementById("diagnosticsMeta"),
  diagnosticsGrid: document.getElementById("diagnosticsGrid"),
  reloadSettingsBtn: document.getElementById("reloadSettingsBtn"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  provWifiSsid: document.getElementById("provWifiSsid"),
  provWifiCountryCode: document.getElementById("provWifiCountryCode"),
  provScanWifiBtn: document.getElementById("provScanWifiBtn"),
  provWifiScanResults: document.getElementById("provWifiScanResults"),
  provWifiScanInfo: document.getElementById("provWifiScanInfo"),
  provWifiPassword: document.getElementById("provWifiPassword"),
  provWifiShowPassword: document.getElementById("provWifiShowPassword"),
  provWifiInfo: document.getElementById("provWifiInfo"),
  provWifiSaveBtn: document.getElementById("provWifiSaveBtn"),
  provHaUrl: document.getElementById("provHaUrl"),
  provHaToken: document.getElementById("provHaToken"),
  provHaShowToken: document.getElementById("provHaShowToken"),
  provHaInfo: document.getElementById("provHaInfo"),
  provHaSaveBtn: document.getElementById("provHaSaveBtn"),
  setupWizardOverlay: document.getElementById("setupWizardOverlay"),
  setupWizardTitle: document.getElementById("setupWizardTitle"),
  setupWizardCloseBtn: document.getElementById("setupWizardCloseBtn"),
  setupWizardStepHa: document.getElementById("setupWizardStepHa"),
  setupWizardStepTiles: document.getElementById("setupWizardStepTiles"),
  setupWizardStepSave: document.getElementById("setupWizardStepSave"),
  setupWizardSubtitle: document.getElementById("setupWizardSubtitle"),
  setupWizardPageTitle: document.getElementById("setupWizardPageTitle"),
  setupWizardCount: document.getElementById("setupWizardCount"),
  setupWizardStatus: document.getElementById("setupWizardStatus"),
  setupWizardAddLightBtn: document.getElementById("setupWizardAddLightBtn"),
  setupWizardAddHeatingBtn: document.getElementById("setupWizardAddHeatingBtn"),
  setupWizardAddWeatherBtn: document.getElementById("setupWizardAddWeatherBtn"),
  setupWizardAddButtonBtn: document.getElementById("setupWizardAddButtonBtn"),
  setupWizardAddSensorBtn: document.getElementById("setupWizardAddSensorBtn"),
  setupWizardSkipBtn: document.getElementById("setupWizardSkipBtn"),
  setupWizardSaveBtn: document.getElementById("setupWizardSaveBtn"),
  setupWizardDoneBtn: document.getElementById("setupWizardDoneBtn"),
};

const entityAutocomplete = {
  primary: {
    timerId: null,
    requestSeq: 0,
  },
  secondary: {
    timerId: null,
    requestSeq: 0,
  },
};

function normalizeSliderDirection(value) {
  return SLIDER_DIRECTIONS.has(value) ? value : DEFAULT_SLIDER_DIRECTION;
}

function normalizeSliderEntityDomain(value) {
  return SLIDER_ENTITY_DOMAINS.has(value) ? value : DEFAULT_SLIDER_ENTITY_DOMAIN;
}

function normalizeButtonMode(value) {
  return BUTTON_MODES.has(value) ? value : DEFAULT_BUTTON_MODE;
}

function buttonModeRequiresMediaPlayer(value) {
  const mode = normalizeButtonMode(value);
  return mode === "play_pause" || mode === "stop" || mode === "next" || mode === "previous";
}

function normalizeButtonStyle(value) {
  return BUTTON_STYLES.has(value) ? value : DEFAULT_BUTTON_STYLE;
}

function normalizeBinaryText(value) {
  return typeof value === "string" ? value : "";
}

const ALARM_MODES = new Set(["away", "home", "night", "vacation", "custom", "disarm"]);
const ALARM_BACKENDS = new Set(["auto", "alarmo", "builtin"]);
const DEFAULT_ALARM_MODES = "away,home,night,disarm";

function normalizeAlarmCode(value) {
  const source = typeof value === "string" ? value.trim() : "";
  return source.slice(0, 24);
}

function normalizeAlarmBackend(value) {
  const source = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ALARM_BACKENDS.has(source) ? source : "auto";
}

function normalizeAlarmZoneLabel(value) {
  const source = typeof value === "string" ? value.trim() : "";
  return source.slice(0, 63);
}

function normalizeAlarmModes(value) {
  const source = typeof value === "string" ? value : "";
  const modes = source
    .split(/[,;\s]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => ALARM_MODES.has(entry));
  const unique = [...new Set(modes)];
  return unique.length > 0 ? unique.join(",") : DEFAULT_ALARM_MODES;
}

function alarmModeInputs() {
  if (!el.fAlarmModes) return [];
  return Array.from(el.fAlarmModes.querySelectorAll("input[data-alarm-mode]"));
}

/* Language neutral preview of the clock in the editor canvas. */
function clockPreviewState() {
  return "12:34";
}

function resetClockInspectorFields() {
  if (el.fClockShowSeconds) el.fClockShowSeconds.checked = false;
  if (el.fClockShowDate) el.fClockShowDate.checked = true;
}

function normalizeBoolDefaultTrue(value) {
  return value === false ? false : true;
}

function normalizeHexColor(value, fallback = DEFAULT_SLIDER_ACCENT_COLOR) {
  const source = (typeof value === "string" ? value : "").trim();
  const fallbackNorm = typeof fallback === "string" ? fallback.trim().toLowerCase() : DEFAULT_SLIDER_ACCENT_COLOR;
  if (!source) return fallbackNorm;

  let hex = source.toLowerCase();
  if (hex.startsWith("0x")) {
    hex = `#${hex.slice(2)}`;
  }
  if (!hex.startsWith("#")) {
    hex = `#${hex}`;
  }

  if (/^#[0-9a-f]{6}$/.test(hex)) {
    return hex;
  }
  return fallbackNorm;
}

function normalizeGraphPointCount(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "string" && value.trim() === "") return 0;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;

  const rounded = Math.round(parsed);
  if (rounded <= 0) return 0;
  return clamp(rounded, GRAPH_POINTS_MIN, GRAPH_POINTS_MAX);
}

function normalizeGraphTimeWindowMin(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_GRAPH_TIME_WINDOW_MIN;
  const rounded = Math.round(parsed);
  if (rounded <= 0) return DEFAULT_GRAPH_TIME_WINDOW_MIN;
  return clamp(rounded, GRAPH_TIME_WINDOW_MIN, GRAPH_TIME_WINDOW_MAX);
}

function normalizeGraphDisplayMode(value) {
  if (typeof value === "string" && GRAPH_DISPLAY_MODES.includes(value)) {
    return value;
  }
  return DEFAULT_GRAPH_DISPLAY_MODE;
}

function normalizeGraphBarBucketMin(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_GRAPH_BAR_BUCKET_MIN;
  const rounded = Math.round(parsed);
  if (GRAPH_BAR_BUCKET_MIN_OPTIONS.includes(rounded)) return rounded;
  return DEFAULT_GRAPH_BAR_BUCKET_MIN;
}

/* --- Per-tile visual overrides (mirrors main/ui/ui_tile_style.h) -------------- */

const TILE_LOOK_COLOR_KEYS = [
  "tile_bg_color",
  "tile_bg_grad_color",
  "tile_border_color",
  "tile_text_color",
  "tile_title_color",
  "tile_label_color",
  "tile_value_color",
  "tile_icon_color",
];
const TILE_LOOK_GRAD_DIRS = ["none", "hor", "ver"];
const TILE_LOOK_FONT_SCALES = ["auto", "s", "m", "l", "xl"];
const TILE_LOOK_INT_KEYS = [
  ["tile_border_width", 0, 16],
  ["tile_radius", 0, 128],
  ["tile_opacity", 0, 100],
];
const TILE_LOOK_PRESETS = {
  auto: {},
  graphite: {
    tile_bg_color: "#1a1f27",
    tile_bg_grad_color: "#0d1117",
    tile_bg_grad_dir: "ver",
    tile_border_color: "#313a45",
    tile_border_width: 1,
    tile_radius: 14,
    tile_opacity: 100,
    tile_text_color: "#c9d1d9",
    tile_title_color: "#e6edf3",
    tile_label_color: "#8b949e",
    tile_value_color: "#ffffff",
    tile_icon_color: "#8b949e",
    tile_font_scale: "auto",
  },
  emerald: {
    tile_bg_color: "#0f2a22",
    tile_bg_grad_color: "#07130f",
    tile_bg_grad_dir: "ver",
    tile_border_color: "#2ecc9a",
    tile_border_width: 1,
    tile_radius: 16,
    tile_opacity: 100,
    tile_text_color: "#d8f7ec",
    tile_title_color: "#7dffcf",
    tile_label_color: "#8fd9c1",
    tile_value_color: "#ffffff",
    tile_icon_color: "#3ddba6",
    tile_font_scale: "m",
  },
  amber: {
    tile_bg_color: "#2a1d0a",
    tile_bg_grad_color: "#150e04",
    tile_bg_grad_dir: "ver",
    tile_border_color: "#ffb648",
    tile_border_width: 2,
    tile_radius: 12,
    tile_opacity: 100,
    tile_text_color: "#ffeeda",
    tile_title_color: "#ffc978",
    tile_label_color: "#e0b483",
    tile_value_color: "#ffffff",
    tile_icon_color: "#ffa726",
    tile_font_scale: "l",
  },
  violet: {
    tile_bg_color: "#211a35",
    tile_bg_grad_color: "#0f0a1c",
    tile_bg_grad_dir: "ver",
    tile_border_color: "#a37bff",
    tile_border_width: 1,
    tile_radius: 18,
    tile_opacity: 100,
    tile_text_color: "#ece6ff",
    tile_title_color: "#c9b6ff",
    tile_label_color: "#a99ccf",
    tile_value_color: "#ffffff",
    tile_icon_color: "#b794ff",
    tile_font_scale: "m",
  },
  sky: {
    tile_bg_color: "#143a63",
    tile_bg_grad_color: "#0b2038",
    tile_bg_grad_dir: "ver",
    tile_border_color: "#4f9dff",
    tile_border_width: 1,
    tile_radius: 16,
    tile_opacity: 100,
    tile_text_color: "#e8f1f8",
    tile_title_color: "#cfe6ff",
    tile_label_color: "#9fc0e0",
    tile_value_color: "#ffffff",
    tile_icon_color: "#6fb6ff",
    tile_font_scale: "m",
  },
  glass: {
    tile_bg_color: "#22303d",
    tile_bg_grad_color: "#16202b",
    tile_bg_grad_dir: "hor",
    tile_border_color: "#5a7d99",
    tile_border_width: 1,
    tile_radius: 20,
    tile_opacity: 60,
    tile_text_color: "#eaf4ff",
    tile_title_color: "#ffffff",
    tile_label_color: "#a9c0d3",
    tile_value_color: "#ffffff",
    tile_icon_color: "#9fd8ff",
    tile_font_scale: "auto",
  },
};

/* Corner shape presets: value = tile_radius in px (LVGL clamps the radius to
   half of the smaller side, so a square tile + max radius becomes a circle). */
const TILE_CORNER_SHAPES = {
  square: 0,
  soft: 10,
  rounded: 16,
  pill: 40,
  circle: 128,
};

function tileCornerShapeKey(radius) {
  const value = normalizeTileIntField(radius, 0, 128);
  if (value === "") return "custom";
  for (const [key, px] of Object.entries(TILE_CORNER_SHAPES)) {
    if (px === value) return key;
  }
  return "custom";
}

function applyTileCornerShape(shapeKey) {
  const radius = TILE_CORNER_SHAPES[shapeKey];
  if (radius === undefined || !el.fTileRadius) return;
  el.fTileRadius.value = String(radius);
  autoApplyInspector({ softEntityValidation: true });
}

function syncTileCornerShapeSelect() {
  if (!el.fTileCornerShape) return;
  const radius = el.fTileRadius ? el.fTileRadius.value : "";
  el.fTileCornerShape.value = tileCornerShapeKey(radius);
}

function normalizeTileColorValue(value) {
  return normalizeHexColor(value, "");
}

function normalizeTileGradDir(value) {
  const source = (typeof value === "string" ? value : "").trim().toLowerCase();
  return TILE_LOOK_GRAD_DIRS.includes(source) ? source : "";
}

function normalizeTileFontScale(value) {
  const source = (typeof value === "string" ? value : "").trim().toLowerCase();
  return TILE_LOOK_FONT_SCALES.includes(source) ? source : "";
}

function normalizeTileIntField(value, min, max) {
  if (value === null || value === undefined || value === "") return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizeTileLook(widget) {
  if (!widget || typeof widget !== "object") return;
  for (const key of TILE_LOOK_COLOR_KEYS) {
    const value = normalizeTileColorValue(widget[key]);
    if (value) {
      widget[key] = value;
    } else {
      delete widget[key];
    }
  }
  const gradDir = normalizeTileGradDir(widget.tile_bg_grad_dir);
  if (gradDir && gradDir !== "none") {
    widget.tile_bg_grad_dir = gradDir;
  } else {
    delete widget.tile_bg_grad_dir;
  }
  const fontScale = normalizeTileFontScale(widget.tile_font_scale);
  if (fontScale && fontScale !== "auto") {
    widget.tile_font_scale = fontScale;
  } else {
    delete widget.tile_font_scale;
  }
  for (const [key, min, max] of TILE_LOOK_INT_KEYS) {
    const value = normalizeTileIntField(widget[key], min, max);
    if (value === "") {
      delete widget[key];
    } else {
      widget[key] = value;
    }
  }
  if (widget.tile_shadow === true) {
    widget.tile_shadow = true;
  } else {
    delete widget.tile_shadow;
  }
}

const TILE_LOOK_KEYS = [
  ...TILE_LOOK_COLOR_KEYS,
  "tile_bg_grad_dir",
  "tile_font_scale",
  ...TILE_LOOK_INT_KEYS.map(([key]) => key),
  "tile_shadow",
];

function tileLookColorFields() {
  return [
    ["tile_bg_color", el.fTileBgColor, el.fTileBgColorPick],
    ["tile_bg_grad_color", el.fTileBgGradColor, el.fTileBgGradColorPick],
    ["tile_border_color", el.fTileBorderColor, el.fTileBorderColorPick],
    ["tile_text_color", el.fTileTextColor, el.fTileTextColorPick],
    ["tile_title_color", el.fTileTitleColor, el.fTileTitleColorPick],
    ["tile_label_color", el.fTileLabelColor, el.fTileLabelColorPick],
    ["tile_value_color", el.fTileValueColor, el.fTileValueColorPick],
    ["tile_icon_color", el.fTileIconColor, el.fTileIconColorPick],
  ];
}

function setTileColorField(textInput, colorInput, value) {
  const hex = normalizeTileColorValue(value);
  if (textInput) {
    textInput.value = hex;
  }
  if (colorInput) {
    if (!colorInput.dataset.autoColor) {
      colorInput.dataset.autoColor = colorInput.value;
    }
    colorInput.value = hex || colorInput.dataset.autoColor;
  }
}

function renderTileLookInspector(widget) {
  for (const [key, textInput, colorInput] of tileLookColorFields()) {
    setTileColorField(textInput, colorInput, widget ? widget[key] : "");
  }
  if (el.fTileBgGradDir) {
    el.fTileBgGradDir.value = (widget && normalizeTileGradDir(widget.tile_bg_grad_dir)) || "none";
  }
  if (el.fTileFontScale) {
    el.fTileFontScale.value = (widget && normalizeTileFontScale(widget.tile_font_scale)) || "auto";
  }
  if (el.fTileBorderWidth) {
    el.fTileBorderWidth.value = widget ? normalizeTileIntField(widget.tile_border_width, 0, 16) : "";
  }
  if (el.fTileRadius) {
    el.fTileRadius.value = widget ? normalizeTileIntField(widget.tile_radius, 0, 128) : "";
  }
  if (el.fTileCornerShape) {
    el.fTileCornerShape.value = tileCornerShapeKey(widget ? widget.tile_radius : "");
  }
  if (el.fTileOpacity) {
    el.fTileOpacity.value = widget ? normalizeTileIntField(widget.tile_opacity, 0, 100) : "";
  }
  if (el.fTileShadow) {
    el.fTileShadow.checked = !!(widget && widget.tile_shadow === true);
  }
  if (el.fTilePreset) {
    el.fTilePreset.value = "auto";
  }
  renderTileLookCopyOptions(widget);
}

function applyTileLookFromInspector(widget) {
  if (!widget) return;
  for (const [key, textInput] of tileLookColorFields()) {
    const value = normalizeTileColorValue(textInput?.value);
    if (value) {
      widget[key] = value;
    } else {
      delete widget[key];
    }
  }
  const gradDir = normalizeTileGradDir(el.fTileBgGradDir?.value);
  if (gradDir && gradDir !== "none") {
    widget.tile_bg_grad_dir = gradDir;
  } else {
    delete widget.tile_bg_grad_dir;
  }
  const fontScale = normalizeTileFontScale(el.fTileFontScale?.value);
  if (fontScale && fontScale !== "auto") {
    widget.tile_font_scale = fontScale;
  } else {
    delete widget.tile_font_scale;
  }
  const borderWidth = normalizeTileIntField(el.fTileBorderWidth?.value, 0, 16);
  if (borderWidth === "") {
    delete widget.tile_border_width;
  } else {
    widget.tile_border_width = borderWidth;
  }
  const radius = normalizeTileIntField(el.fTileRadius?.value, 0, 128);
  if (radius === "") {
    delete widget.tile_radius;
  } else {
    widget.tile_radius = radius;
  }
  const opacity = normalizeTileIntField(el.fTileOpacity?.value, 0, 100);
  if (opacity === "") {
    delete widget.tile_opacity;
  } else {
    widget.tile_opacity = opacity;
  }
  if (el.fTileShadow?.checked) {
    widget.tile_shadow = true;
  } else {
    delete widget.tile_shadow;
  }
}

function clearTileLookInspector() {
  for (const [, textInput, colorInput] of tileLookColorFields()) {
    setTileColorField(textInput, colorInput, "");
  }
  if (el.fTileBgGradDir) el.fTileBgGradDir.value = "none";
  if (el.fTileFontScale) el.fTileFontScale.value = "auto";
  if (el.fTileBorderWidth) el.fTileBorderWidth.value = "";
  if (el.fTileRadius) el.fTileRadius.value = "";
  if (el.fTileCornerShape) el.fTileCornerShape.value = "custom";
  if (el.fTileOpacity) el.fTileOpacity.value = "";
  if (el.fTileShadow) el.fTileShadow.checked = false;
  if (el.fTilePreset) el.fTilePreset.value = "auto";
  renderTileLookCopyOptions(null);
}

function applyTileLookPreset(presetKey) {
  const preset = TILE_LOOK_PRESETS[presetKey];
  if (!preset) return;
  for (const [key, textInput, colorInput] of tileLookColorFields()) {
    setTileColorField(textInput, colorInput, preset[key]);
  }
  if (el.fTileBgGradDir) el.fTileBgGradDir.value = preset.tile_bg_grad_dir || "none";
  if (el.fTileFontScale) el.fTileFontScale.value = preset.tile_font_scale || "auto";
  if (el.fTileBorderWidth) el.fTileBorderWidth.value = preset.tile_border_width ?? "";
  if (el.fTileRadius) el.fTileRadius.value = preset.tile_radius ?? "";
  if (el.fTileCornerShape) el.fTileCornerShape.value = tileCornerShapeKey(preset.tile_radius ?? "");
  if (el.fTileOpacity) el.fTileOpacity.value = preset.tile_opacity ?? "";
  if (el.fTileShadow) el.fTileShadow.checked = preset.tile_shadow === true;
  applyTileLookFromInspector(selectedWidget());
  if (el.fTilePreset) el.fTilePreset.value = "auto";
  renderInspectorChange(false);
}

function tileLookSnapshot(widget) {
  const snapshot = {};
  if (!widget) return snapshot;
  for (const key of TILE_LOOK_KEYS) {
    if (Object.prototype.hasOwnProperty.call(widget, key)) {
      snapshot[key] = widget[key];
    }
  }
  return snapshot;
}

function applyTileLookSnapshot(widget, snapshot) {
  if (!widget) return;
  for (const key of TILE_LOOK_KEYS) {
    delete widget[key];
  }
  for (const key of TILE_LOOK_KEYS) {
    if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
      widget[key] = snapshot[key];
    }
  }
  normalizeTileLook(widget);
}

function tileLookCopyCandidates(targetWidget) {
  const candidates = [];
  const pages = editor.layout && Array.isArray(editor.layout.pages) ? editor.layout.pages : [];
  for (const page of pages) {
    if (!page || !Array.isArray(page.widgets)) continue;
    for (const widget of page.widgets) {
      if (!widget || typeof widget !== "object" || !widget.id) continue;
      if (targetWidget && widget.id === targetWidget.id) continue;
      candidates.push({ widget, page });
    }
  }
  return candidates;
}

function tileLookCopyLabel(widget, page) {
  const title = (widget.title || "").trim();
  const typeLabel = widget.type ? ` · ${widget.type}` : "";
  const pageTitle = (page && (page.title || page.id)) || "";
  const name = title.length ? title : (widget.id || widget.type);
  return pageTitle.length ? `${name}${typeLabel} — ${pageTitle}` : `${name}${typeLabel}`;
}

function renderTileLookCopyOptions(targetWidget) {
  const select = el.fTileCopySource;
  if (!select) return;
  const candidates = tileLookCopyCandidates(targetWidget);
  const previous = select.value;
  select.textContent = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = candidates.length
    ? t("layout.tile_look.copy_placeholder")
    : t("layout.tile_look.copy_empty");
  select.appendChild(placeholder);
  for (const { widget, page } of candidates) {
    const option = document.createElement("option");
    option.value = widget.id;
    option.textContent = tileLookCopyLabel(widget, page);
    select.appendChild(option);
  }
  if (previous && candidates.some(({ widget }) => widget.id === previous)) {
    select.value = previous;
  }
  select.disabled = !targetWidget || candidates.length === 0;
  if (el.tileLookCopyBtn) {
    el.tileLookCopyBtn.disabled = !targetWidget || candidates.length === 0;
  }
  if (el.tileLookCopyPageBtn) {
    el.tileLookCopyPageBtn.disabled = !targetWidget;
  }
}

function copyTileLookFromSource() {
  const target = selectedWidget();
  if (!target) return;
  const sourceId = el.fTileCopySource ? el.fTileCopySource.value : "";
  const source = tileLookCopyCandidates(target).find(({ widget }) => widget.id === sourceId);
  if (!source) {
    setStatus(t("layout.tile_look.copy_none"), true);
    return;
  }
  applyTileLookSnapshot(target, tileLookSnapshot(source.widget));
  renderTileLookInspector(target);
  if (autoApplyInspector({ softEntityValidation: true }) !== false) {
    setStatus(t("layout.tile_look.copy_done", { source: tileLookCopyLabel(source.widget, source.page) }));
  }
}

function applyTileLookToPage() {
  const target = selectedWidget();
  const page = selectedPage();
  if (!target || !page || !Array.isArray(page.widgets)) return;
  const snapshot = tileLookSnapshot(target);
  let count = 0;
  for (const widget of page.widgets) {
    if (!widget || widget.id === target.id) continue;
    applyTileLookSnapshot(widget, snapshot);
    count += 1;
  }
  renderAll();
  setStatus(t("layout.tile_look.copy_page_done", { count }));
}

function bindTileColorPair(textInput, colorInput) {
  if (!colorInput) return;
  if (!colorInput.dataset.autoColor) {
    colorInput.dataset.autoColor = colorInput.value;
  }
  if (textInput) {
    const syncFromText = () => {
      const value = normalizeTileColorValue(textInput.value);
      if (value) {
        colorInput.value = value;
      }
    };
    textInput.addEventListener("input", syncFromText);
    textInput.addEventListener("change", () => {
      const value = normalizeTileColorValue(textInput.value);
      textInput.value = value;
      colorInput.value = value || colorInput.dataset.autoColor;
    });
  }
  colorInput.addEventListener("input", () => {
    if (textInput) {
      textInput.value = colorInput.value.toUpperCase();
    }
  });
  colorInput.addEventListener("change", () => {
    if (textInput) {
      textInput.value = colorInput.value.toUpperCase();
    }
    autoApplyInspector({ softEntityValidation: true });
  });
}

const OTA_URL_STORAGE_KEY = "betta.ota.manualUrl";
function tileLookPreviewColor(widget, colorKey, fallback) {
  return normalizeTileColorValue(widget[colorKey]) || fallback;
}

function applyTileLookPreview(box, widget) {
  if (!box || !widget) return;
  const bg = normalizeTileColorValue(widget.tile_bg_color);
  const grad = normalizeTileColorValue(widget.tile_bg_grad_color);
  const gradDir = normalizeTileGradDir(widget.tile_bg_grad_dir);
  const opacity = normalizeTileIntField(widget.tile_opacity, 0, 100);
  const alpha = opacity === "" ? 1 : opacity / 100;
  const withAlpha = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  if (bg && grad && gradDir && gradDir !== "none") {
    const angle = gradDir === "hor" ? "90deg" : "180deg";
    box.style.background = `linear-gradient(${angle}, ${withAlpha(bg)}, ${withAlpha(grad)})`;
  } else if (bg) {
    box.style.background = withAlpha(bg);
  } else if (opacity !== "" && opacity < 100) {
    box.style.opacity = String(alpha);
  }
  const border = normalizeTileColorValue(widget.tile_border_color);
  const borderWidth = normalizeTileIntField(widget.tile_border_width, 0, 16);
  if (borderWidth !== "") box.style.borderWidth = `${borderWidth}px`;
  if (border) box.style.borderColor = border;
  const radius = normalizeTileIntField(widget.tile_radius, 0, 128);
  if (radius !== "") box.style.borderRadius = `${radius}px`;

  const textColor = normalizeTileColorValue(widget.tile_text_color);
  const roles = [
    [".w-title", tileLookPreviewColor(widget, "tile_title_color", textColor)],
    [".w-state", tileLookPreviewColor(widget, "tile_value_color", textColor)],
    [".w-type", tileLookPreviewColor(widget, "tile_label_color", textColor)],
  ];
  const fontScale = normalizeTileFontScale(widget.tile_font_scale);
  const scale = fontScale === "s" ? 0.85 : fontScale === "l" ? 1.2 : fontScale === "xl" ? 1.4 : 1;
  for (const [selector, color] of roles) {
    const node = box.querySelector(selector);
    if (!node) continue;
    if (color) node.style.color = color;
    if (scale !== 1) node.style.fontSize = `${scale}em`;
  }
  if (widget.tile_shadow === true) {
    box.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.55)";
  }
}

/* ---------------------------------------------------------------- page look */
/* Per-page background, stored on the page object itself:
 *   page_bg_color / page_bg_grad_color  "#RRGGBB" ("" = panel background)
 *   page_bg_grad_dir                    "none" | "hor" | "ver"
 *   page_wallpaper                      true = paint the panel wallpaper
 *   page_dim                            0..90 % darkening of that wallpaper */
const PAGE_LOOK_COLOR_KEYS = ["page_bg_color", "page_bg_grad_color"];
const PAGE_LOOK_KEYS = [...PAGE_LOOK_COLOR_KEYS, "page_bg_grad_dir", "page_wallpaper", "page_dim", "page_theme"];
const PAGE_LOOK_GRAD_DIRS = ["none", "hor", "ver"];
const PAGE_LOOK_DIM_MAX = 90;

const PAGE_LOOK_PRESETS = {
  auto: {},
  midnight: { page_bg_color: "#0d1826", page_bg_grad_color: "#1b2f45", page_bg_grad_dir: "ver" },
  deep_sea: { page_bg_color: "#062a3a", page_bg_grad_color: "#0f5c73", page_bg_grad_dir: "ver" },
  forest: { page_bg_color: "#0e2418", page_bg_grad_color: "#1d4a2e", page_bg_grad_dir: "ver" },
  sunset: { page_bg_color: "#3a1420", page_bg_grad_color: "#8a3a1f", page_bg_grad_dir: "hor" },
  plum: { page_bg_color: "#221331", page_bg_grad_color: "#4a2360", page_bg_grad_dir: "ver" },
  wallpaper: { page_wallpaper: true, page_dim: 0 },
  wallpaper_dim: { page_wallpaper: true, page_dim: 45 },
};

function normalizePageGradDir(value) {
  const source = (typeof value === "string" ? value : "").trim().toLowerCase();
  return PAGE_LOOK_GRAD_DIRS.includes(source) ? source : "none";
}

function normalizePageLook(page) {
  if (!page || typeof page !== "object") return;
  for (const key of PAGE_LOOK_COLOR_KEYS) {
    const value = normalizeTileColorValue(page[key]);
    if (value) {
      page[key] = value;
    } else {
      delete page[key];
    }
  }
  const gradDir = normalizePageGradDir(page.page_bg_grad_dir);
  if (gradDir !== "none") {
    page.page_bg_grad_dir = gradDir;
  } else {
    delete page.page_bg_grad_dir;
  }
  if (page.page_wallpaper === true) {
    page.page_wallpaper = true;
  } else {
    delete page.page_wallpaper;
  }
  const dim = normalizeTileIntField(page.page_dim, 0, PAGE_LOOK_DIM_MAX);
  if (dim === "" || dim <= 0) {
    delete page.page_dim;
  } else {
    page.page_dim = dim;
  }
  /* page_theme: built-in preset id or a saved custom theme id. */
  const pageTheme = typeof page.page_theme === "string" ? page.page_theme.trim() : "";
  if (pageTheme && /^[A-Za-z0-9_-]{1,31}$/.test(pageTheme)) {
    page.page_theme = pageTheme;
  } else {
    delete page.page_theme;
  }
}

function persistOtaUrl() {
  try {
    if (!el.settingsOtaUrl) return;
    const value = el.settingsOtaUrl.value.trim();
    if (value) {
      localStorage.setItem(OTA_URL_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(OTA_URL_STORAGE_KEY);
    }
  } catch (_) {
    /* storage unavailable */
  }
}

function restoreOtaUrl() {
  try {
    const saved = localStorage.getItem(OTA_URL_STORAGE_KEY) || "";
    if (el.settingsOtaUrl && saved && !el.settingsOtaUrl.value.trim()) {
      el.settingsOtaUrl.value = saved;
    }
  } catch (_) {
    /* storage unavailable */
  }
}

/* Everything the preview needs, or null when the page keeps the panel default. */
function pageLookStyle(page) {
  if (!page) return null;
  const bgColor = normalizeTileColorValue(page.page_bg_color);
  const gradColor = normalizeTileColorValue(page.page_bg_grad_color);
  const gradDir = normalizePageGradDir(page.page_bg_grad_dir);
  const wallpaper = page.page_wallpaper === true;
  if (!bgColor && !gradColor && !wallpaper) return null;
  const dim = normalizeTileIntField(page.page_dim, 0, PAGE_LOOK_DIM_MAX);
  return { bgColor, gradColor, gradDir, wallpaper, dim: dim === "" ? 0 : dim };
}

/* The panel keeps the wallpaper as a raw little endian RGB565 frame, so it is
   downloaded once, converted here and cached as a data URL for the preview. */
const pageLookWallpaper = { url: "", pending: false, failed: false };

function rgb565ToDataUrl(buffer, width, height) {
  const view = new DataView(buffer);
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, src = 0; i < pixels.length; i += 4, src += 2) {
    const value = view.getUint16(src, true);
    pixels[i] = (((value >> 11) & 0x1f) * 255 + 15) / 31;
    pixels[i + 1] = (((value >> 5) & 0x3f) * 255 + 31) / 63;
    pixels[i + 2] = ((value & 0x1f) * 255 + 15) / 31;
    pixels[i + 3] = 255;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").putImageData(new ImageData(pixels, width, height), 0, 0);
  return canvas.toDataURL("image/png");
}

async function loadPageLookWallpaper() {
  if (pageLookWallpaper.url || pageLookWallpaper.pending || pageLookWallpaper.failed) return;
  const screenW = editor.appScreenW || CANVAS_WIDTH;
  const screenH = editor.appScreenH || CANVAS_HEIGHT;
  pageLookWallpaper.pending = true;
  try {
    const response = await fetch("/api/display/wallpaper", { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status}`);
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength !== screenW * screenH * 2) throw new Error("unexpected wallpaper size");
    pageLookWallpaper.url = rgb565ToDataUrl(buffer, screenW, screenH);
  } catch (_) {
    pageLookWallpaper.failed = true;
  } finally {
    pageLookWallpaper.pending = false;
  }
  applyPageLookPreview(selectedPage());
}

function applyPageLookPreview(page) {
  if (!el.canvas) return;
  el.canvas.style.backgroundImage = "";
  el.canvas.style.backgroundColor = "";
  el.canvas.style.backgroundSize = "";
  el.canvas.style.backgroundPosition = "";
  el.canvas.style.backgroundRepeat = "";

  const style = pageLookStyle(page);
  if (!style) return;

  if (style.wallpaper) {
    const screenW = editor.appScreenW || CANVAS_WIDTH;
    const screenH = editor.appScreenH || CANVAS_HEIGHT;
    if (!pageLookWallpaper.url) {
      void loadPageLookWallpaper();
      el.canvas.style.backgroundColor = "#0d1826";
      el.canvas.style.backgroundImage =
        "repeating-linear-gradient(45deg, #14263a 0 12px, #10202e 12px 24px)";
      return;
    }
    /* The firmware crops the content box out of the middle of the screen. */
    const offsetY = Math.max(0, Math.round((screenH - CANVAS_HEIGHT) / 2));
    const shade = `rgba(0, 0, 0, ${style.dim / 100})`;
    el.canvas.style.backgroundColor = style.bgColor || "#000000";
    el.canvas.style.backgroundImage = `linear-gradient(${shade}, ${shade}), url("${pageLookWallpaper.url}")`;
    el.canvas.style.backgroundSize = `100% 100%, ${screenW}px ${screenH}px`;
    el.canvas.style.backgroundPosition = `0 0, 0 -${offsetY}px`;
    el.canvas.style.backgroundRepeat = "no-repeat, no-repeat";
    return;
  }

  const bg = style.bgColor || "#10202e";
  if (style.gradColor && style.gradDir !== "none") {
    const angle = style.gradDir === "hor" ? "90deg" : "180deg";
    el.canvas.style.backgroundImage = `linear-gradient(${angle}, ${bg}, ${style.gradColor})`;
  } else {
    el.canvas.style.backgroundColor = bg;
  }
}

function renderPageLookInspector(page) {
  if (!page) {
    clearPageLookInspector();
    return;
  }
  if (el.pageLookOptions) {
    el.pageLookOptions.classList.remove("hidden");
  }
  setTileColorField(el.fPageBgColor, el.fPageBgColorPick, page.page_bg_color);
  setTileColorField(el.fPageBgGradColor, el.fPageBgGradColorPick, page.page_bg_grad_color);
  if (el.fPageBgGradDir) {
    el.fPageBgGradDir.value = normalizePageGradDir(page.page_bg_grad_dir);
  }
  if (el.fPageWallpaper) {
    el.fPageWallpaper.checked = page.page_wallpaper === true;
  }
  if (el.fPageDim) {
    el.fPageDim.value = normalizeTileIntField(page.page_dim, 0, PAGE_LOOK_DIM_MAX);
  }
  if (el.fPageTheme) {
    pagePopulateThemeSelect();
    el.fPageTheme.value = typeof page.page_theme === "string" ? page.page_theme : "";
    if (el.fPageTheme.selectedIndex < 0) el.fPageTheme.value = "";
  }
  if (el.fPagePreset) {
    el.fPagePreset.value = "auto";
  }
}

function clearPageLookInspector() {
  if (el.pageLookOptions) {
    el.pageLookOptions.classList.add("hidden");
  }
  setTileColorField(el.fPageBgColor, el.fPageBgColorPick, "");
  setTileColorField(el.fPageBgGradColor, el.fPageBgGradColorPick, "");
  if (el.fPageBgGradDir) el.fPageBgGradDir.value = "none";
  if (el.fPageWallpaper) el.fPageWallpaper.checked = false;
  if (el.fPageDim) el.fPageDim.value = "";
  if (el.fPagePreset) el.fPagePreset.value = "auto";
}

/* Options for the per-page theme override: the theme list when it is already
 * loaded, otherwise just the "follow the global theme" entry. */
function pagePopulateThemeSelect() {
  const sel = el.fPageTheme;
  if (!sel) return;
  const wanted = sel.options.length > 0 ? sel.value || "" : "";
  sel.innerHTML = "";
  const none = document.createElement("option");
  none.value = "";
  none.textContent = t("layout.page_look.theme_none");
  sel.appendChild(none);
  for (const entry of themeState.list) {
    const opt = document.createElement("option");
    opt.value = entry.id;
    opt.textContent = themeAutoOptionLabel(entry);
    sel.appendChild(opt);
  }
  sel.value = wanted;
  if (sel.selectedIndex < 0) sel.value = "";
}

function applyPageLookFromInspector(page) {
  if (!page) return;
  for (const [key, textInput] of [
    ["page_bg_color", el.fPageBgColor],
    ["page_bg_grad_color", el.fPageBgGradColor],
  ]) {
    const value = normalizeTileColorValue(textInput?.value);
    if (value) {
      page[key] = value;
    } else {
      delete page[key];
    }
  }
  const gradDir = normalizePageGradDir(el.fPageBgGradDir?.value);
  if (gradDir !== "none") {
    page.page_bg_grad_dir = gradDir;
  } else {
    delete page.page_bg_grad_dir;
  }
  if (el.fPageWallpaper?.checked) {
    page.page_wallpaper = true;
  } else {
    delete page.page_wallpaper;
  }
  const dim = normalizeTileIntField(el.fPageDim?.value, 0, PAGE_LOOK_DIM_MAX);
  if (dim === "" || dim <= 0) {
    delete page.page_dim;
  } else {
    page.page_dim = dim;
  }
  const pageTheme = (el.fPageTheme?.value || "").trim();
  if (pageTheme) {
    page.page_theme = pageTheme;
  } else {
    delete page.page_theme;
  }
}

function applyPageLookPreset(presetKey) {
  const preset = PAGE_LOOK_PRESETS[presetKey];
  const page = selectedPage();
  if (!preset || !page) return;
  for (const key of PAGE_LOOK_KEYS) {
    delete page[key];
  }
  for (const [key, value] of Object.entries(preset)) {
    page[key] = value;
  }
  normalizePageLook(page);
  renderPageLookInspector(page);
  applyPageLookPreview(page);
}

function bindPageColorPair(textInput, colorInput) {
  if (!colorInput) return;
  if (!colorInput.dataset.autoColor) {
    colorInput.dataset.autoColor = colorInput.value;
  }
  const push = () => {
    const page = selectedPage();
    applyPageLookFromInspector(page);
    applyPageLookPreview(page);
  };
  if (textInput) {
    textInput.addEventListener("input", () => {
      const value = normalizeTileColorValue(textInput.value);
      if (value) colorInput.value = value;
      push();
    });
    textInput.addEventListener("change", () => {
      const value = normalizeTileColorValue(textInput.value);
      textInput.value = value;
      colorInput.value = value || colorInput.dataset.autoColor;
      push();
    });
  }
  colorInput.addEventListener("input", () => {
    if (textInput) textInput.value = colorInput.value.toUpperCase();
    push();
  });
}

function bindPageLookInputs() {
  bindPageColorPair(el.fPageBgColor, el.fPageBgColorPick);
  bindPageColorPair(el.fPageBgGradColor, el.fPageBgGradColorPick);
  const onSelectChange = (input) => input?.addEventListener("change", () => {
    const page = selectedPage();
    applyPageLookFromInspector(page);
    applyPageLookPreview(page);
  });
  onSelectChange(el.fPageBgGradDir);
  onSelectChange(el.fPageWallpaper);
  if (el.fPageDim) {
    const pushDim = () => {
      const page = selectedPage();
      applyPageLookFromInspector(page);
      applyPageLookPreview(page);
    };
    el.fPageDim.addEventListener("input", pushDim);
    el.fPageDim.addEventListener("change", () => {
      const page = selectedPage();
      applyPageLookFromInspector(page);
      renderPageLookInspector(page);
      applyPageLookPreview(page);
    });
  }
  if (el.fPagePreset) {
    el.fPagePreset.addEventListener("change", () => applyPageLookPreset(el.fPagePreset.value));
  }
  if (el.fPageTheme) {
    el.fPageTheme.addEventListener("change", () => {
      const page = selectedPage();
      applyPageLookFromInspector(page);
      applyPageLookPreview(page);
    });
  }
  if (el.pageLookResetBtn) {
    el.pageLookResetBtn.addEventListener("click", () => {
      const page = selectedPage();
      if (!page) return;
      for (const key of PAGE_LOOK_KEYS) {
        delete page[key];
      }
      renderPageLookInspector(page);
      applyPageLookPreview(page);
      setStatus(t("layout.page_look.reset_done"));
    });
  }
}

function normalizeSensorTileEntityIds(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(", ");
}

function sensorTilePreviewState(widget) {
  const rows = normalizeSensorTileEntityIds(widget.entity_ids).split(", ").filter(Boolean);
  let entityCount = 0;
  let firstState = "";
  for (const row of rows) {
    if (!row || row.startsWith("##")) continue;
    const eq = row.indexOf("=");
    const raw = eq >= 0 ? row.slice(eq + 1).trim() : "";
    if (!raw || raw.startsWith(":legend")) continue;
    const entity = raw.replace(/:[a-z0-9_]+$/i, "");
    if (!entity.includes(".")) continue;
    entityCount++;
    if (!firstState) {
      const state = editor.states.get(entity);
      if (state && state !== "unavailable" && state !== "unknown") {
        firstState = state;
      }
    }
  }
  if (firstState) return firstState;
  return entityCount > 0 ? `${entityCount} encji` : "brak encji";
}

function normalizeLayoutWidgets(layout) {
  if (!layout || !Array.isArray(layout.pages)) return;
  for (const page of layout.pages) {
    normalizePageLook(page);
    if (isEnergyPage(page)) {
      normalizeEnergyConfig(page);
      continue;
    }
    if (isMusicPage(page)) {
      normalizeMusicConfig(page);
      continue;
    }
    if (isRadioPage(page)) {
      normalizeRadioConfig(page);
      continue;
    }
    if (!page || !Array.isArray(page.widgets)) continue;
    for (const widget of page.widgets) {
      if (!widget || typeof widget !== "object") continue;
      if (widget.type === "button") {
        widget.button_accent_color = normalizeHexColor(widget.button_accent_color, DEFAULT_BUTTON_ACCENT_COLOR);
        const buttonMode = normalizeButtonMode(widget.button_mode);
        if (buttonModeRequiresMediaPlayer(buttonMode) && !String(widget.entity_id || "").startsWith("media_player.")) {
          widget.button_mode = DEFAULT_BUTTON_MODE;
        } else {
          widget.button_mode = buttonMode;
        }
        const buttonStyle = normalizeButtonStyle(widget.style_variant);
        if (buttonModeRequiresMediaPlayer(widget.button_mode) || buttonStyle === "") {
          delete widget.style_variant;
        } else {
          widget.style_variant = buttonStyle;
        }
      }
      if (widget.type === "slider") {
        widget.slider_direction = normalizeSliderDirection(widget.slider_direction);
        widget.slider_accent_color = normalizeHexColor(widget.slider_accent_color, DEFAULT_SLIDER_ACCENT_COLOR);
        widget.slider_entity_domain = normalizeSliderEntityDomain(widget.slider_entity_domain);
      }
      if (widget.type === "graph") {
        widget.graph_line_color = normalizeHexColor(widget.graph_line_color, DEFAULT_GRAPH_LINE_COLOR);
        widget.graph_time_window_min = normalizeGraphTimeWindowMin(widget.graph_time_window_min);
        widget.graph_display_mode = normalizeGraphDisplayMode(widget.graph_display_mode);
        widget.graph_bar_bucket_min = normalizeGraphBarBucketMin(widget.graph_bar_bucket_min);
        const normalizedGraphPoints = normalizeGraphPointCount(widget.graph_point_count);
        if (normalizedGraphPoints > 0) {
          widget.graph_point_count = normalizedGraphPoints;
        } else {
          delete widget.graph_point_count;
        }
      }
      if (widget.type === "binary_sensor") {
        widget.binary_show_title = normalizeBoolDefaultTrue(widget.binary_show_title);
        widget.binary_text_on = normalizeBinaryText(widget.binary_text_on);
        widget.binary_text_off = normalizeBinaryText(widget.binary_text_off);
        widget.binary_color_on = normalizeHexColor(widget.binary_color_on, "");
        widget.binary_color_off = normalizeHexColor(widget.binary_color_off, "");
      }
      if (widget.type === "alarm_tile") {
        widget.alarm_code = normalizeAlarmCode(widget.alarm_code);
        widget.alarm_modes = normalizeAlarmModes(widget.alarm_modes);
        widget.alarm_ask_code = widget.alarm_ask_code === true;
        widget.alarm_backend = normalizeAlarmBackend(widget.alarm_backend);
        const zoneLabel = normalizeAlarmZoneLabel(widget.alarm_zone_label);
        if (zoneLabel) {
          widget.alarm_zone_label = zoneLabel;
        } else {
          delete widget.alarm_zone_label;
        }
        widget.alarm_show_sensors = normalizeBoolDefaultTrue(widget.alarm_show_sensors);
        widget.alarm_show_bypassed = normalizeBoolDefaultTrue(widget.alarm_show_bypassed);
        widget.alarm_force_arm = normalizeBoolDefaultTrue(widget.alarm_force_arm);
        widget.alarm_skip_delay = widget.alarm_skip_delay === true;
      }
      if (widget.type === "clock_alarm") {
        delete widget.clock_alarm_enabled;
        delete widget.clock_alarm_hour;
        delete widget.clock_alarm_minute;
        delete widget.clock_alarm_days;
        delete widget.clock_alarm_snooze_min;
        delete widget.clock_alarm_action;
        delete widget.clock_alarm_tone;
        delete widget.clock_alarm_entity;
        widget.clock_show_seconds = widget.clock_show_seconds === true;
        widget.clock_show_date = normalizeBoolDefaultTrue(widget.clock_show_date);
      }
      if (widget.type === "sensor") {
        widget.sensor_value_color = normalizeHexColor(widget.sensor_value_color, "");
      }
      normalizeTileLook(widget);
    }
  }
}

function setStatus(text, isError = false) {
  el.status.textContent = text;
  el.status.style.color = isError ? "#ff8f94" : "#9db0c3";
}

function getWifiScanUi(scope = "settings") {
  if (scope === "provisioning") {
    return {
      scanButton: el.provScanWifiBtn,
      ssidInput: el.provWifiSsid,
      resultsSelect: el.provWifiScanResults,
      info: el.provWifiScanInfo,
    };
  }

  return {
    scanButton: el.scanWifiBtn,
    ssidInput: el.settingsWifiSsid,
    resultsSelect: el.settingsWifiScanResults,
    info: el.settingsWifiScanInfo,
  };
}

function setWifiScanInfo(text, isError = false, scope = "settings") {
  const ui = getWifiScanUi(scope);
  if (!ui.info) return;
  ui.info.textContent = text;
  ui.info.classList.toggle("error", isError);
}

function setProvisioningInfo(stage, text, isError = false) {
  const target = stage === "wifi" ? el.provWifiInfo : el.provHaInfo;
  if (!target) return;
  target.textContent = text;
  target.classList.toggle("error", isError);
}

function normalizeCountryCode(value) {
  const normalized = (value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : "";
}

function normalizeBssid(value) {
  const normalized = (value || "").trim().toUpperCase().replace(/-/g, ":");
  if (!normalized) return "";
  return /^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/.test(normalized) ? normalized : "";
}

function isValidIpv4(value) {
  const parts = String(value || "").trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

function normalizeLanguageCode(value, fallback = "") {
  const normalized = (typeof value === "string" ? value : "").trim().toLowerCase();
  if (!normalized) return fallback;
  return LANGUAGE_CODE_RE.test(normalized) ? normalized : fallback;
}

function normalizeUiLanguage(value) {
  return normalizeLanguageCode(value, DEFAULT_UI_LANGUAGE);
}

function templateString(text, vars = {}) {
  return String(text).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) return match;
    return String(vars[key]);
  });
}

function t(key, vars = {}, fallbackText = null) {
  const source = editor.i18nMap || {};
  const fallback = WEB_I18N_BUILTIN.en || {};
  const raw = source[key] ?? fallback[key] ?? fallbackText ?? key;
  return templateString(raw, vars);
}

function storageGet(key) {
  try {
    return window.localStorage?.getItem(key) || "";
  } catch (_) {
    return "";
  }
}

function storageSet(key, value) {
  try {
    window.localStorage?.setItem(key, value);
  } catch (_) {}
}

function storageRemove(key) {
  try {
    window.localStorage?.removeItem(key);
  } catch (_) {}
}

function flattenTranslationObject(obj, prefix = "", out = {}) {
  if (!obj || typeof obj !== "object") return out;
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenTranslationObject(value, path, out);
    } else if (typeof value === "string") {
      out[path] = value;
    }
  }
  return out;
}

function setTextById(id, key, vars) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = t(key, vars);
}

function setPlaceholderById(id, key, vars) {
  const node = document.getElementById(id);
  if (!node) return;
  node.placeholder = t(key, vars);
}

function renderAppVersion() {
  const version = typeof editor.appVersion === "string" ? editor.appVersion.trim() : "";
  if (el.appVersionLabel) {
    el.appVersionLabel.textContent = version;
    el.appVersionLabel.hidden = version.length === 0;
  }
  document.title = version
    ? `BETTA HA Panel - BETTA Editor ${version}`
    : "BETTA HA Panel - BETTA Editor";
}

async function loadAppVersion() {
  try {
    const payload = await apiGet("/api/version");
    editor.appVersion = typeof payload?.version === "string" ? payload.version : "";
    editor.appProject = typeof payload?.project === "string" ? payload.project : "";
    editor.appScreenW = Number(payload?.screen_w) || 0;
    editor.appScreenH = Number(payload?.screen_h) || 0;
    applyCanvasGeometry(payload);
  } catch (_) {
    editor.appVersion = "";
    editor.appProject = "";
    editor.appScreenW = 0;
    editor.appScreenH = 0;
  }
  renderAppVersion();
  void refreshLatestOtaUrl();
}

function otaPanelVariant() {
  const project = (editor.appProject || "").toLowerCase();
  if (project.includes("10.1") || project.includes("panel10") || editor.appScreenW >= 1000) {
    return "panel10";
  }
  return "panel4";
}

function otaCurrentVersionTag() {
  const version = (editor.appVersion || "").trim();
  return /^v\d+\.\d+\.\d+/.test(version) ? version : "";
}

function otaLatestFallbackUrl() {
  const version = otaCurrentVersionTag();
  if (!version) return "";
  const variant = otaPanelVariant();
  return `https://github.com/${OTA_RELEASE_REPO}/releases/latest/download/betta86-ha-panel-${version}-${variant}.ota.bin`;
}

function applyLatestOtaUrl(url) {
  if (!url) return;
  const previousAuto = editor.ota.autoFilledUrl || "";
  editor.ota.latestUrl = url;
  if (el.settingsOtaUrl) {
    el.settingsOtaUrl.placeholder = url;
    const current = el.settingsOtaUrl.value.trim();
    if (!current || current === previousAuto) {
      el.settingsOtaUrl.value = url;
      editor.ota.autoFilledUrl = url;
    }
  }
}

async function refreshLatestOtaUrl() {
  if (editor.ota.latestUrlLoading) return;

  const fallback = otaLatestFallbackUrl();
  if (fallback) {
    applyLatestOtaUrl(fallback);
  }

  editor.ota.latestUrlLoading = true;
  try {
    const response = await fetch(`https://api.github.com/repos/${OTA_RELEASE_REPO}/releases/latest`, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return;
    const payload = await response.json();
    const assets = Array.isArray(payload?.assets) ? payload.assets : [];
    const variant = otaPanelVariant();
    const suffix = `-${variant}.ota.bin`;
    const asset = assets.find((item) =>
      typeof item?.name === "string" &&
      item.name.startsWith("betta86-ha-panel-") &&
      item.name.endsWith(suffix)
    );
    if (asset?.name) {
      applyLatestOtaUrl(`https://github.com/${OTA_RELEASE_REPO}/releases/latest/download/${asset.name}`);
    } else if (typeof asset?.browser_download_url === "string") {
      applyLatestOtaUrl(asset.browser_download_url);
    }
  } catch (_) {
    /* Keep the firmware-version fallback URL. */
  } finally {
    editor.ota.latestUrlLoading = false;
  }
}

async function loadHaDiagnostics() {
  try {
    const payload = await apiGet("/api/ha/diagnostics");
    if (!payload || typeof payload !== "object") return;
    const names = Array.isArray(payload.missing_entities)
      ? payload.missing_entities.filter((n) => typeof n === "string")
      : [];
    editor.haDiagnostics.total = Number(payload.missing_total) || 0;
    editor.haDiagnostics.listed = Number(payload.missing_listed) || names.length;
    editor.haDiagnostics.updatedUnixMs = Number(payload.updated_unix_ms) || 0;
    editor.haDiagnostics.names = names;
  } catch (_) {
    /* keep previous state */
  }
  renderHaDiagnosticsBanner();
}

function haDiagnosticsSignature() {
  const d = editor.haDiagnostics;
  if (!d || !d.total) return "";
  const names = Array.isArray(d.names) ? [...d.names].sort().join("|") : "";
  return `${d.total}:${names}`;
}

function renderHaDiagnosticsBanner() {
  const banner = el.haDiagnosticsBanner;
  if (!banner) return;
  const d = editor.haDiagnostics;
  const signature = haDiagnosticsSignature();
  if (!d || !d.total || !signature) {
    banner.hidden = true;
    return;
  }
  if (d.dismissedSignature && d.dismissedSignature === signature) {
    banner.hidden = true;
    return;
  }
  if (el.haDiagnosticsTitle) {
    if (d.total > d.listed && d.listed > 0) {
      el.haDiagnosticsTitle.textContent = t("ha_diagnostics.missing_title_more", {
        total: d.total,
        listed: d.listed,
      });
    } else {
      el.haDiagnosticsTitle.textContent = t("ha_diagnostics.missing_title");
    }
  }
  if (el.haDiagnosticsHint) {
    el.haDiagnosticsHint.textContent = t("ha_diagnostics.missing_hint");
  }
  if (el.haDiagnosticsDismiss) {
    el.haDiagnosticsDismiss.setAttribute("aria-label", t("ha_diagnostics.dismiss"));
    el.haDiagnosticsDismiss.title = t("ha_diagnostics.dismiss");
  }
  if (el.haDiagnosticsList) {
    el.haDiagnosticsList.innerHTML = "";
    for (const name of Array.isArray(d.names) ? d.names : []) {
      const li = document.createElement("li");
      li.textContent = name;
      el.haDiagnosticsList.appendChild(li);
    }
  }
  banner.hidden = false;
}

function applyCanvasGeometry(payload) {
  if (!payload || typeof payload !== "object") return;
  const w = Number(payload.canvas_w);
  const h = Number(payload.canvas_h);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
  if (w === CANVAS_WIDTH && h === CANVAS_HEIGHT) return;
  CANVAS_WIDTH = Math.round(w);
  CANVAS_HEIGHT = Math.round(h);
  if (el.canvas) {
    el.canvas.style.width = `${CANVAS_WIDTH}px`;
    el.canvas.style.height = `${CANVAS_HEIGHT}px`;
    applyPageLookPreview(selectedPage());
  }
}

function setSelectOptionText(select, value, key, vars) {
  if (!select || !select.options) return;
  for (const option of select.options) {
    if (option.value === value) {
      option.textContent = t(key, vars);
      return;
    }
  }
}

function renderLanguageOptions() {
  if (!el.settingsLanguage) return;

  const optionCodes = new Set();
  optionCodes.add(DEFAULT_UI_LANGUAGE);
  optionCodes.add("en");
  optionCodes.add("de");
  optionCodes.add("es");
  optionCodes.add("fr");
  optionCodes.add("pl");
  optionCodes.add(editor.i18nLanguage || DEFAULT_UI_LANGUAGE);
  for (const language of editor.languageCatalog || []) {
    const code = normalizeLanguageCode(language?.code, "");
    if (code) optionCodes.add(code);
  }

  const current = normalizeUiLanguage(editor.i18nLanguage || el.settingsLanguage.value);
  const sorted = Array.from(optionCodes).sort((a, b) => a.localeCompare(b));
  el.settingsLanguage.innerHTML = "";
  for (const code of sorted) {
    const option = document.createElement("option");
    option.value = code;
    const optionKey = `settings.language.option_${code}`;
    option.textContent = (editor.i18nMap && editor.i18nMap[optionKey]) || code.toUpperCase();
    el.settingsLanguage.appendChild(option);
  }
  el.settingsLanguage.value = sorted.includes(current) ? current : (sorted[0] || DEFAULT_UI_LANGUAGE);

  if (el.uploadLanguageCode) {
    el.uploadLanguageCode.value = el.settingsLanguage.value;
  }
}

async function loadLanguageCatalog() {
  const payload = await apiGet("/api/i18n/languages");
  if (!payload || !Array.isArray(payload.languages)) {
    throw new Error("Invalid language catalog");
  }
  editor.languageCatalog = payload.languages;
  return payload;
}

async function loadEffectiveTranslation(language) {
  const lang = normalizeUiLanguage(language);
  const response = await fetch(`/api/i18n/effective?lang=${encodeURIComponent(lang)}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function loadI18nLanguage(language, refreshCatalog = false) {
  const lang = normalizeUiLanguage(language);

  if (refreshCatalog || !Array.isArray(editor.languageCatalog) || editor.languageCatalog.length === 0) {
    try {
      await loadLanguageCatalog();
    } catch (_) {}
  }

  let effective = {};
  try {
    effective = await loadEffectiveTranslation(lang);
  } catch (_) {
    effective = {};
  }

  const builtin = WEB_I18N_BUILTIN[lang] || {};
  const webCustom = flattenTranslationObject(effective?.web || {});
  editor.i18nMap = {
    ...(WEB_I18N_BUILTIN.en || {}),
    ...builtin,
    ...webCustom,
  };
  editor.i18nEffective = effective || {};
  editor.i18nLanguage = lang;
  document.documentElement.lang = lang;

  applyWebTranslations();
  renderLanguageOptions();
  if (editor.layout) {
    renderCanvas();
  }
}

function applyWebTranslations() {
  setTextById("layoutTabBtn", "tabs.layout");
  setTextById("settingsTabBtn", "tabs.settings");
  setTextById("sidebarTitleText", "sidebar.title");
  setTextById("sidebarSubtitle", "sidebar.subtitle");
  renderAppVersion();

  setTextById("pagesHeading", "layout.pages.heading");
  setTextById("addPageBtn", "layout.pages.add");
  setTextById("addEnergyPageBtn", "layout.pages.add_energy");
  setTextById("deletePageBtn", "layout.pages.delete");
  setTextById("pageTitleLabel", "layout.pages.title_label");
  setPlaceholderById("pageTitleInput", "layout.pages.title_placeholder");
  setTextById("applyPageBtn", "layout.pages.apply_title");
  setTextById("energyPageHeading", "layout.energy.heading");
  setTextById("energyPageHint", "layout.energy.hint");
  setTextById("energySourceLabel", "layout.energy.source");
  setTextById("energySourceHaOption", "layout.energy.source_ha");
  setTextById("energySourceManualOption", "layout.energy.source_manual");
  setTextById("energyHomePowerLabel", "layout.energy.home_power");
  setTextById("energySolarPowerLabel", "layout.energy.solar_power");
  setTextById("energyGridPowerLabel", "layout.energy.grid_power");
  setTextById("energyGridImportLabel", "layout.energy.grid_import");
  setTextById("energyGridExportLabel", "layout.energy.grid_export");
  setTextById("energyBatteryPowerLabel", "layout.energy.battery_power");
  setTextById("energyBatteryChargeLabel", "layout.energy.battery_charge");
  setTextById("energyBatteryDischargeLabel", "layout.energy.battery_discharge");
  setTextById("energyBatterySocLabel", "layout.energy.battery_soc");
  setTextById("applyEnergyPageBtn", "layout.energy.apply");
  setTextById("addMusicPageBtn", "layout.pages.add_music");
  setTextById("musicPageHeading", "layout.music.heading");
  setTextById("musicPageHint", "layout.music.hint");
  setTextById("musicPlayerEntityLabel", "layout.music.player_entity");
  setTextById("musicPlayersLabel", "layout.music.players");
  setTextById("applyMusicPageBtn", "layout.music.apply");
  setTextById("addPageMenuNormal", "layout.pages.menu_normal");
  setTextById("addPageMenuEnergy", "layout.pages.menu_energy");
  setTextById("addPageMenuXiaozhi", "layout.pages.menu_xiaozhi");
  setTextById("addPageMenuMusic", "layout.pages.menu_music");
  setTextById("addPageMenuRadio", "layout.pages.menu_radio");
  setTextById("addPageMenuWeather", "layout.pages.menu_weather");
  setTextById("addRadioPageBtn", "layout.pages.add_radio");
  setTextById("addWeatherPageBtn", "layout.pages.add_weather");
  setTextById("weatherPageHeading", "layout.pages.weather_title");
  setTextById("weatherPageHint", "layout.pages.weather_hint");
  setTextById("weatherPageChipHint", "layout.pages.weather_chip_hint");
  setTextById("radioPageHeading", "layout.radio.heading");
  setTextById("radioPageHint", "layout.radio.hint");
  setTextById("radioPlayerEntityLabel", "layout.radio.player_entity");
  setTextById("radioColumnsLabel", "layout.radio.columns");
  setTextById("radioStationsLabel", "layout.radio.stations");
  setTextById("radioStationsHint", "layout.radio.stations_hint");
  setTextById("radioAddStationBtn", "layout.radio.add_station");
  setTextById("applyRadioPageBtn", "layout.radio.apply");

  setTextById("widgetsHeading", "layout.widgets.heading");
  setTextById("addSensorBtn", "layout.widgets.add_sensor");
  setTextById("addBinarySensorBtn", "layout.widgets.add_binary");
  setTextById("addButtonBtn", "layout.widgets.add_button");
  setTextById("addSliderBtn", "layout.widgets.add_slider");
  setTextById("addGraphBtn", "layout.widgets.add_graph");
  setTextById("addEmptyTileBtn", "layout.widgets.add_empty_tile");
  setTextById("addLightTileBtn", "layout.widgets.add_light_tile");
  setTextById("openSetupWizardBtn", "layout.widgets.quick_setup");
  setTextById("addHeatingTileBtn", "layout.widgets.add_heating_tile");
  setTextById("addWeatherTileBtn", "layout.widgets.add_weather_tile");
  setTextById("addWeather3DayBtn", "layout.widgets.add_weather_3day");
  setTextById("addTodoListBtn", "layout.widgets.add_todo");
  setTextById("addMediaPlayerBtn", "layout.widgets.add_media_player");
  setTextById("addRoborockTileBtn", "layout.widgets.add_roborock");
  setTextById("addCoverBtn", "layout.widgets.add_cover");
  setTextById("addLockBtn", "layout.widgets.add_lock");
  setTextById("addFanBtn", "layout.widgets.add_fan");
  setTextById("addSelectBtn", "layout.widgets.add_select");
  setTextById("addNumberBtn", "layout.widgets.add_number");
  setTextById("addClockBtn", "layout.widgets.add_clock");
  setTextById("addClockMenuItem", "layout.widgets.add_clock");
  setTextById("deleteWidgetBtn", "layout.widgets.delete");
  setTextById("lightEntityPickerTitle", "entity_picker.title");
  setTextById("lightEntityPickerRefreshBtn", "entity_picker.refresh");
  setTextById("lightEntityPickerCloseBtn", "entity_picker.close");
  setTextById("lightEntityPickerBlankBtn", "entity_picker.blank");
  setPlaceholderById("lightEntityPickerSearch", "entity_picker.search_placeholder");

  setTextById("inspectorHeading", "layout.inspector.heading");
  setTextById("fTitleLabel", "layout.inspector.title");
  setTextById("fEntityLabel", "layout.inspector.entity");
  setTextById("fSecondaryEntityLabel", "layout.inspector.secondary_entity");
  setTextById("fButtonModeLabel", "layout.inspector.button_mode");
  setTextById("fButtonAccentColorLabel", "layout.inspector.button_accent_color");
  setTextById("fButtonStyleLabel", "layout.inspector.button_style");
  setTextById("fBinaryShowTitleLabel", "layout.inspector.binary_show_title");
  setTextById("fBinaryColorOnLabel", "layout.inspector.binary_color_on");
  setTextById("fBinaryColorOffLabel", "layout.inspector.binary_color_off");
  setTextById("fBinaryTextOnLabel", "layout.inspector.binary_text_on");
  setTextById("fBinaryTextOffLabel", "layout.inspector.binary_text_off");
  setTextById("fAlarmCodeLabel", "layout.inspector.alarm_code");
  setTextById("fAlarmAskCodeLabel", "layout.inspector.alarm_ask_code");
  setTextById("fAlarmBackendLabel", "layout.inspector.alarm_backend");
  setTextById("fAlarmZoneLabelText", "layout.inspector.alarm_zone_label");
  setTextById("fAlarmShowSensorsLabel", "layout.inspector.alarm_show_sensors");
  setTextById("fAlarmShowBypassedLabel", "layout.inspector.alarm_show_bypassed");
  setTextById("fAlarmForceArmLabel", "layout.inspector.alarm_force_arm");
  setTextById("fAlarmSkipDelayLabel", "layout.inspector.alarm_skip_delay");
  setTextById("fAlarmModesLabel", "layout.inspector.alarm_modes");
  setTextById("fAlarmModeAwayLabel", "layout.inspector.alarm_mode_away");
  setTextById("fAlarmModeHomeLabel", "layout.inspector.alarm_mode_home");
  setTextById("fAlarmModeNightLabel", "layout.inspector.alarm_mode_night");
  setTextById("fAlarmModeVacationLabel", "layout.inspector.alarm_mode_vacation");
  setTextById("fAlarmModeCustomLabel", "layout.inspector.alarm_mode_custom");
  setTextById("fAlarmModeDisarmLabel", "layout.inspector.alarm_mode_disarm");
  setTextById("fClockHint", "layout.inspector.clock_hint");
  setTextById("fClockShowSecondsLabel", "layout.inspector.clock_show_seconds");
  setTextById("fClockShowDateLabel", "layout.inspector.clock_show_date");
  setTextById("fSensorValueColorLabel", "layout.inspector.sensor_value_color");
  setTextById("inspectorGroupTileLookLabel", "layout.tile_look.group");
  setTextById("fTilePresetLabel", "layout.tile_look.preset");
  setTextById("fTileBgColorLabel", "layout.tile_look.bg_color");
  setTextById("fTileBgGradColorLabel", "layout.tile_look.bg_grad_color");
  setTextById("fTileBgGradDirLabel", "layout.tile_look.bg_grad_dir");
  setTextById("fTileBorderColorLabel", "layout.tile_look.border_color");
  setTextById("fTileBorderWidthLabel", "layout.tile_look.border_width");
  setTextById("fTileRadiusLabel", "layout.tile_look.radius");
  setTextById("fTileOpacityLabel", "layout.tile_look.opacity");
  setTextById("fTileFontScaleLabel", "layout.tile_look.font_scale");
  setTextById("fTileShadowLabel", "layout.tile_look.shadow");
  setTextById("fTileTextColorLabel", "layout.tile_look.text_color");
  setTextById("fTileTitleColorLabel", "layout.tile_look.title_color");
  setTextById("fTileLabelColorLabel", "layout.tile_look.label_color");
  setTextById("fTileValueColorLabel", "layout.tile_look.value_color");
  setTextById("fTileIconColorLabel", "layout.tile_look.icon_color");
  setTextById("tileLookResetBtn", "layout.tile_look.reset");
  setTextById("tileLookHint", "layout.tile_look.hint");
  setTextById("fTileCopySourceLabel", "layout.tile_look.copy_source");
  setTextById("tileLookCopyBtn", "layout.tile_look.copy_apply");
  setTextById("tileLookCopyPageBtn", "layout.tile_look.copy_apply_page");
  setTextById("tileLookCopyHint", "layout.tile_look.copy_hint");
  setTextById("fTileCornerShapeLabel", "layout.tile_look.corner_shape");
  setTextById("tileCornerShapeHint", "layout.tile_look.corner_hint");
  setTextById("inspectorGroupPageLookLabel", "layout.page_look.group");
  setTextById("pageLookHeading", "layout.page_look.heading");
  setTextById("fPagePresetLabel", "layout.page_look.preset");
  setTextById("fPageBgColorLabel", "layout.page_look.bg_color");
  setTextById("fPageBgGradColorLabel", "layout.page_look.bg_grad_color");
  setTextById("fPageBgGradDirLabel", "layout.page_look.bg_grad_dir");
  setTextById("fPageWallpaperLabel", "layout.page_look.wallpaper");
  setTextById("fPageDimLabel", "layout.page_look.dim");
  setTextById("fPageThemeLabel", "layout.page_look.page_theme");
  setTextById("fPageThemeHint", "layout.page_look.page_theme_hint");
  setTextById("pageLookResetBtn", "layout.page_look.reset");
  setTextById("pageLookHint", "layout.page_look.hint");
  setSelectOptionText(el.fPagePreset, "auto", "layout.option.page_preset.auto");
  setSelectOptionText(el.fPagePreset, "midnight", "layout.option.page_preset.midnight");
  setSelectOptionText(el.fPagePreset, "deep_sea", "layout.option.page_preset.deep_sea");
  setSelectOptionText(el.fPagePreset, "forest", "layout.option.page_preset.forest");
  setSelectOptionText(el.fPagePreset, "sunset", "layout.option.page_preset.sunset");
  setSelectOptionText(el.fPagePreset, "plum", "layout.option.page_preset.plum");
  setSelectOptionText(el.fPagePreset, "wallpaper", "layout.option.page_preset.wallpaper");
  setSelectOptionText(el.fPagePreset, "wallpaper_dim", "layout.option.page_preset.wallpaper_dim");
  setSelectOptionText(el.fPageBgGradDir, "none", "layout.option.page_grad_dir.none");
  setSelectOptionText(el.fPageBgGradDir, "hor", "layout.option.page_grad_dir.hor");
  setSelectOptionText(el.fPageBgGradDir, "ver", "layout.option.page_grad_dir.ver");
  setSelectOptionText(el.fTileBgGradDir, "none", "layout.option.tile_grad_dir.none");
  setSelectOptionText(el.fTileBgGradDir, "hor", "layout.option.tile_grad_dir.hor");
  setSelectOptionText(el.fTileBgGradDir, "ver", "layout.option.tile_grad_dir.ver");
  setSelectOptionText(el.fTileFontScale, "auto", "layout.option.tile_font_scale.auto");
  setSelectOptionText(el.fTileFontScale, "s", "layout.option.tile_font_scale.s");
  setSelectOptionText(el.fTileFontScale, "m", "layout.option.tile_font_scale.m");
  setSelectOptionText(el.fTileFontScale, "l", "layout.option.tile_font_scale.l");
  setSelectOptionText(el.fTileFontScale, "xl", "layout.option.tile_font_scale.xl");
  setSelectOptionText(el.fTilePreset, "auto", "layout.option.tile_preset.auto");
  setSelectOptionText(el.fTilePreset, "graphite", "layout.option.tile_preset.graphite");
  setSelectOptionText(el.fTilePreset, "emerald", "layout.option.tile_preset.emerald");
  setSelectOptionText(el.fTilePreset, "amber", "layout.option.tile_preset.amber");
  setSelectOptionText(el.fTilePreset, "violet", "layout.option.tile_preset.violet");
  setSelectOptionText(el.fTilePreset, "sky", "layout.option.tile_preset.sky");
  setSelectOptionText(el.fTilePreset, "glass", "layout.option.tile_preset.glass");
  setSelectOptionText(el.fTileCornerShape, "custom", "layout.option.tile_corner.custom");
  setSelectOptionText(el.fTileCornerShape, "square", "layout.option.tile_corner.square");
  setSelectOptionText(el.fTileCornerShape, "soft", "layout.option.tile_corner.soft");
  setSelectOptionText(el.fTileCornerShape, "rounded", "layout.option.tile_corner.rounded");
  setSelectOptionText(el.fTileCornerShape, "pill", "layout.option.tile_corner.pill");
  setSelectOptionText(el.fTileCornerShape, "circle", "layout.option.tile_corner.circle");
  setTextById("fSliderEntityDomainLabel", "layout.inspector.slider_entity_domain");
  setTextById("fSliderDirectionLabel", "layout.inspector.slider_direction");
  setTextById("fSliderAccentColorLabel", "layout.inspector.slider_accent_color");
  setTextById("fGraphLineColorLabel", "layout.inspector.graph_line_color");
  setTextById("fGraphTimeWindowMinLabel", "layout.inspector.graph_time_window_min");
  setTextById("fGraphPointCountLabel", "layout.inspector.graph_point_count");
  setTextById("fGraphDisplayModeLabel", "layout.inspector.graph_display_mode");
  setTextById("fGraphBarBucketMinLabel", "layout.inspector.graph_bar_bucket_min");
  setSelectOptionText(el.fGraphDisplayMode, "line", "layout.option.graph_display_mode.line");
  setSelectOptionText(el.fGraphDisplayMode, "line_smooth_points", "layout.option.graph_display_mode.line_smooth_points");
  setSelectOptionText(el.fGraphDisplayMode, "line_smooth", "layout.option.graph_display_mode.line_smooth");
  setSelectOptionText(el.fGraphDisplayMode, "bars", "layout.option.graph_display_mode.bars");
  setTextById("applyInspectorBtn", "layout.inspector.apply");
  setSelectOptionText(el.fButtonMode, "auto", "layout.option.button_mode.auto");
  setSelectOptionText(el.fButtonMode, "play_pause", "layout.option.button_mode.play_pause");
  setSelectOptionText(el.fButtonMode, "stop", "layout.option.button_mode.stop");
  setSelectOptionText(el.fButtonMode, "next", "layout.option.button_mode.next");
  setSelectOptionText(el.fButtonMode, "previous", "layout.option.button_mode.previous");
  setSelectOptionText(el.fButtonStyle, "", "layout.option.button_style.switch");
  setSelectOptionText(el.fButtonStyle, "power_toggle", "layout.option.button_style.power_toggle");
  setSelectOptionText(el.fButtonStyle, "power_status", "layout.option.button_style.power_status");
  setSelectOptionText(el.fButtonStyle, "plug_icon", "layout.option.button_style.plug_icon");
  setSelectOptionText(el.fButtonStyle, "lamp_icon", "layout.option.button_style.lamp_icon");
  setSelectOptionText(el.fButtonStyle, "highlight", "layout.option.button_style.highlight");
  setSelectOptionText(el.fButtonStyle, "status_text", "layout.option.button_style.status_text");
  setSelectOptionText(el.fSliderEntityDomain, "auto", "layout.option.slider_entity_domain.auto");
  setSelectOptionText(el.fSliderEntityDomain, "light", "layout.option.slider_entity_domain.light");
  setSelectOptionText(el.fSliderEntityDomain, "media_player", "layout.option.slider_entity_domain.media_player");
  setSelectOptionText(el.fSliderEntityDomain, "cover", "layout.option.slider_entity_domain.cover");
  setSelectOptionText(el.fSliderEntityDomain, "number", "layout.option.slider_entity_domain.number");
  setSelectOptionText(el.fSliderEntityDomain, "input_number", "layout.option.slider_entity_domain.input_number");
  setSelectOptionText(el.fSliderDirection, "auto", "layout.option.slider_direction.auto");
  setSelectOptionText(el.fSliderDirection, "left_to_right", "layout.option.slider_direction.left_to_right");
  setSelectOptionText(el.fSliderDirection, "right_to_left", "layout.option.slider_direction.right_to_left");
  setSelectOptionText(el.fSliderDirection, "bottom_to_top", "layout.option.slider_direction.bottom_to_top");
  setSelectOptionText(el.fSliderDirection, "top_to_bottom", "layout.option.slider_direction.top_to_bottom");

  setTextById("layoutActionsHeading", "layout.actions.heading");
  setTextById("reloadBtn", "layout.actions.reload");
  setTextById("saveBtn", "layout.actions.save");
  setTextById("exportBtn", "layout.actions.export");
  setTextById("importBtn", "layout.actions.import");
  setPlaceholderById("jsonPaste", "layout.actions.paste_placeholder");

  setTextById("provWifiTitle", "provision.wifi.title");
  setTextById("provWifiSubtitle", "provision.wifi.subtitle");
  setTextById("provWifiSsidLabel", "provision.wifi.ssid");
  setTextById("provWifiCountryCodeLabel", "provision.wifi.country_code");
  setTextById("provWifiPasswordLabel", "provision.wifi.password");
  setPlaceholderById("provWifiPassword", "provision.wifi.password_placeholder");
  setTextById("provWifiShowPasswordLabel", "provision.wifi.show_password");
  setTextById("provScanWifiBtn", "common.scan");
  setTextById("provHaTitle", "provision.ha.title");
  setTextById("provHaSubtitle", "provision.ha.subtitle");
  setTextById("provHaUrlLabel", "provision.ha.ws_url");
  setTextById("provHaTokenLabel", "provision.ha.token");
  setTextById("provHaShowTokenLabel", "provision.ha.show_token");
  setTextById("provWifiSaveBtn", "common.save_reboot");
  setTextById("provHaSaveBtn", "common.save_reboot");

  setTextById("settingsWifiHeading", "settings.wifi.heading");
  setTextById("settingsWifiSsidLabel", "settings.wifi.ssid");
  setTextById("settingsWifiCountryCodeLabel", "settings.wifi.country_code");
  setTextById("settingsWifiBssidLabel", "settings.wifi.bssid");
  setTextById("settingsWifiPasswordLabel", "settings.wifi.password");
  setPlaceholderById("settingsWifiPassword", "settings.wifi.password_placeholder");
  setTextById("settingsWifiStaticEnabledLabel", "settings.wifi.static_enabled");
  setTextById("settingsWifiStaticIpLabel", "settings.wifi.static_ip");
  setTextById("settingsWifiStaticNetmaskLabel", "settings.wifi.static_netmask");
  setTextById("settingsWifiStaticGatewayLabel", "settings.wifi.static_gateway");
  setTextById("settingsWifiStaticDnsLabel", "settings.wifi.static_dns");
  setTextById("scanWifiBtn", "common.scan_wifi");

  setTextById("settingsHaHeading", "settings.ha.heading");
  setTextById("settingsHaUrlLabel", "settings.ha.ws_url");
  setTextById("settingsHaTokenLabel", "settings.ha.token");
  setPlaceholderById("settingsHaToken", "settings.ha.token_placeholder");
  setTextById("settingsHaRestEnabledLabel", "settings.ha.rest_fallback");

  setTextById("settingsXiaozhiHeading", "settings.xiaozhi.heading");
  setTextById("settingsXiaozhiEnabledLabel", "settings.xiaozhi.enabled");
  setTextById("settingsXiaozhiServerLabel", "settings.xiaozhi.server");
  setTextById("settingsXiaozhiOtaUrlLabel", "settings.xiaozhi.ota_url");
  setTextById("settingsXiaozhiDeviceLabel", "settings.xiaozhi.device");
  setTextById("settingsXiaozhiTokenLabel", "settings.xiaozhi.token");
  setPlaceholderById("settingsXiaozhiToken", "settings.ha.token_placeholder");

  setTextById("settingsCamerasHeading", "settings.cameras.heading");
  setTextById("camerasHint", "settings.cameras.hint");
  setTextById("camerasAddBtn", "settings.cameras.add");
  setTextById("camerasNameLabel", "settings.cameras.name");
  setTextById("camerasSourceLabel", "settings.cameras.source");
  setTextById("camerasSourceHaOption", "settings.cameras.source_ha");
  setTextById("camerasSourceHttpOption", "settings.cameras.source_http");
  setTextById("camerasEntityLabel", "settings.cameras.entity");
  setTextById("camerasEntityHint", "settings.cameras.entity_hint");
  setTextById("camerasUrlLabel", "settings.cameras.url");
  setTextById("camerasUserLabel", "settings.cameras.username");
  setTextById("camerasPassLabel", "settings.cameras.password");
  setTextById("camerasRefreshLabel", "settings.cameras.refresh_ms");
  setTextById("camerasEnabledLabel", "settings.cameras.enabled");
  setTextById("camerasSaveBtn", "settings.cameras.save");
  setTextById("camerasDeleteBtn", "settings.cameras.delete");

  setTextById("settingsLocalCamHeading", "settings.localCam.heading");
  setTextById("settingsLocalCamHint", "settings.localCam.hint");
  setTextById("settingsLocalCamEnabledLabel", "settings.localCam.enabled");
  setTextById("settingsLocalCamStreamLabel", "settings.localCam.stream");
  setTextById("settingsLocalCamMotionLabel", "settings.localCam.motion");
  setTextById("settingsLocalCamThresholdLabel", "settings.localCam.threshold");
  setTextById("settingsLocalCamQualityLabel", "settings.localCam.quality");
  setTextById("settingsLocalCamResolutionLabel", "settings.localCam.resolution");
  setTextById("settingsLocalCamResolutionNativeOption", "settings.localCam.resolution_native");
  setTextById("settingsLocalCamResolutionHalfOption", "settings.localCam.resolution_half");
  setTextById("settingsLocalCamHflipLabel", "settings.localCam.hflip");
  setTextById("settingsLocalCamVflipLabel", "settings.localCam.vflip");
  setTextById("settingsLocalCamSaveBtn", "settings.localCam.save");
  setTextById("settingsLocalCamSnapshotBtn", "settings.localCam.refresh_preview");
  setTextById("settingsLocalCamSnapshotHint", "settings.localCam.preview_hint");
  setTextById("settingsLocalCamMotionHeading", "settings.localCam.motion_heading");
  setTextById("settingsLocalCamMotionHint", "settings.localCam.motion_hint");
  setTextById("settingsLocalCamMotionMinAreaLabel", "settings.localCam.motion_min_area");
  setTextById("settingsLocalCamMotionMinDurationLabel", "settings.localCam.motion_min_duration");
  setTextById("settingsLocalCamMotionCooldownLabel", "settings.localCam.motion_cooldown");
  setTextById("settingsLocalCamMotionStartDelayLabel", "settings.localCam.motion_start_delay");
  setTextById("settingsLocalCamMotionIgnoreLightingLabel", "settings.localCam.motion_ignore_lighting");
  setTextById("settingsLocalCamZonesHint", "settings.localCam.zones_hint");
  setTextById("settingsLocalCamZonesSnapshotBtn", "settings.localCam.zones_refresh");
  setTextById("settingsLocalCamZonesClearBtn", "settings.localCam.zones_clear");
  setTextById("settingsLocalCamMotionDiagBtn", "settings.localCam.motion_diag");

  setTextById("settingsTimeHeading", "settings.time.heading");
  setTextById("settingsNtpServerLabel", "settings.time.ntp_server");
  setTextById("settingsTimezoneLabel", "settings.time.timezone");

  setTextById("settingsDisplayHeading", "settings.display.heading");
  setTextById("settingsBrightnessLabel", "settings.display.brightness");
  setTextById("settingsScreensaverEnabledLabel", "settings.display.screensaver_enabled");
  setTextById("settingsScreensaverTimeoutLabel", "settings.display.screensaver_timeout");
  setTextById("settingsSaverBrightnessLabel", "settings.display.saver_brightness");
  setTextById("settingsSaverWallpaperDimLabel", "settings.display.saver_wallpaper_dim");
  setTextById("settingsSaverWallpaperDimHint", "settings.display.saver_wallpaper_dim_hint");
  setTextById("settingsScreenOffEnabledLabel", "settings.display.screen_off_enabled");
  setTextById("settingsScreenOffTimeoutLabel", "settings.display.screen_off_timeout");
  setTextById("settingsClockFormatLabel", "settings.display.clock_format");
  setTextById("settingsClockFormat24hOption", "settings.display.clock_format_h24");
  setTextById("settingsClockFormat12hOption", "settings.display.clock_format_h12");
  setTextById("settingsClockFormatHint", "settings.display.clock_format_hint");
  setTextById("settingsClockStyleLabel", "settings.display.clock_style");
  setTextById("settingsClockStyleClassicOption", "settings.display.clock_style_classic");
  setTextById("settingsClockStyleFlipOption", "settings.display.clock_style_flip");
  syncClockStyleUi();
  setTextById("settingsShowSecondsLabel", "settings.display.show_seconds");
  setTextById("settingsShowDateLabel", "settings.display.show_date");
  setTextById("settingsClockColorLabel", "settings.display.clock_color");
  setTextById("settingsDateColorLabel", "settings.display.date_color");
  setTextById("settingsWallpaperLabel", "settings.display.wallpaper");
  setTextById("settingsWallpaperHint", "settings.display.wallpaper_hint");
  setTextById("uploadWallpaperBtn", "settings.display.upload_wallpaper");
  setTextById("removeWallpaperBtn", "settings.display.remove_wallpaper");
  setTextById("applyDisplayBtn", "settings.display.apply");
  setTextById("settingsNightModeEnabledLabel", "settings.display.night_mode_enabled");
  setTextById("settingsNightStartLabel", "settings.display.night_start");
  setTextById("settingsNightEndLabel", "settings.display.night_end");
  setTextById("settingsNightBrightnessLabel", "settings.display.night_brightness");
  setTextById("settingsNightWakeLabel", "settings.display.night_wake");
  setTextById("settingsThemeAutoEnabledLabel", "settings.display.theme_auto_enabled");
  setTextById("settingsThemeDaySelectLabel", "settings.display.theme_day");
  setTextById("settingsThemeNightSelectLabel", "settings.display.theme_night");
  const themeAutoHint = document.getElementById("settingsThemeAutoHint");
  if (themeAutoHint) themeAutoHint.textContent = t("settings.display.theme_auto_hint");
  const nightHint = document.getElementById("settingsNightHint");
  if (nightHint) nightHint.textContent = t("settings.display.night_hint");
  setTextById("settingsTilePressFxLabel", "settings.display.press_fx");
  setTextById("settingsTilePressFxDimLabel", "settings.display.press_fx_dim");
  setTextById("settingsTilePressFxScaleLabel", "settings.display.press_fx_scale");
  setTextById("settingsTilePressFxNoneOption", "settings.display.press_fx_none");
  setTextById("settingsTilePressFxDimOption", "settings.display.press_fx_dim_mode");
  setTextById("settingsTilePressFxScaleOption", "settings.display.press_fx_scale_mode");
  setTextById("settingsTilePressFxBothOption", "settings.display.press_fx_both");
  setTextById("settingsTilePressFxPreviewLabel", "settings.display.press_fx_preview");
  const pressFxHint = document.getElementById("settingsTilePressFxHint");
  if (pressFxHint) pressFxHint.textContent = t("settings.display.press_fx_hint");

  setTextById("settingsValueAnimLabel", "settings.display.value_anim");
  setTextById("settingsValueAnimMsLabel", "settings.display.value_anim_ms");
  setTextById("settingsValueAnimNoneOption", "settings.display.value_anim_none");
  setTextById("settingsValueAnimFadeOption", "settings.display.value_anim_fade");
  setTextById("settingsValueAnimSlideOption", "settings.display.value_anim_slide");
  setTextById("settingsValueAnimCountOption", "settings.display.value_anim_count");
  setTextById("settingsValueAnimPreviewBtn", "settings.display.value_anim_preview");
  const valueAnimHint = document.getElementById("settingsValueAnimHint");
  if (valueAnimHint) valueAnimHint.textContent = t("settings.display.value_anim_hint");

  setTextById("settingsTopbarHeading", "settings.display.topbar");
  setTextById("settingsTopbarShowClockLabel", "settings.display.topbar_show_clock");
  setTextById("settingsTopbarShowDateLabel", "settings.display.topbar_show_date");
  setTextById("settingsTopbarShowGearLabel", "settings.display.topbar_show_gear");
  setTextById("settingsTopbarShowStatusLabel", "settings.display.topbar_show_status");
  setTextById("settingsTopbarIconTextLabel", "settings.display.topbar_icon_text");
  setTextById("settingsTopbarCustomColorsLabel", "settings.display.topbar_custom_colors");
  setTextById("settingsTopbarBgColorLabel", "settings.display.topbar_bg_color");
  setTextById("settingsTopbarClockColorLabel", "settings.display.topbar_clock_color");
  setTextById("settingsTopbarDateColorLabel", "settings.display.topbar_date_color");
  setTextById("settingsTopbarGearColorLabel", "settings.display.topbar_gear_color");
  setTextById("settingsTopbarHaColorLabel", "settings.display.topbar_ha_color");
  setTextById("settingsTopbarWifiColorLabel", "settings.display.topbar_wifi_color");
  const topbarHint = document.getElementById("settingsTopbarHint");
  if (topbarHint) topbarHint.textContent = t("settings.display.topbar_hint");
  const topbarColorHint = document.getElementById("settingsTopbarColorHint");
  if (topbarColorHint) topbarColorHint.textContent = t("settings.display.topbar_color_hint");

  setTextById("settingsNavHeading", "settings.display.navbar");
  setTextById("settingsNavCustomColorsLabel", "settings.display.nav_custom_colors");
  setTextById("settingsNavBarBgColorLabel", "settings.display.nav_bar_bg_color");
  setTextById("settingsNavBarBorderColorLabel", "settings.display.nav_bar_border_color");
  setTextById("settingsNavButtonBgColorLabel", "settings.display.nav_button_bg_color");
  setTextById("settingsNavButtonBorderColorLabel", "settings.display.nav_button_border_color");
  setTextById("settingsNavTabIdleColorLabel", "settings.display.nav_tab_idle_color");
  setTextById("settingsNavTabActiveColorLabel", "settings.display.nav_tab_active_color");
  setTextById("settingsNavHomeIdleColorLabel", "settings.display.nav_home_idle_color");
  setTextById("settingsNavHomeActiveColorLabel", "settings.display.nav_home_active_color");
  const navHint = document.getElementById("settingsNavHint");
  if (navHint) navHint.textContent = t("settings.display.nav_hint");
  const navColorHint = document.getElementById("settingsNavColorHint");
  if (navColorHint) navColorHint.textContent = t("settings.display.nav_color_hint");

  setTextById("settingsSdHeading", "settings.sd.heading");
  setTextById("settingsSdEnabledLabel", "settings.sd.enabled");
  setTextById("sdRefreshBtn", "settings.sd.refresh");
  setTextById("sdExportLogsBtn", "settings.sd.export_logs");
  setTextById("sdFormatBtn", "settings.sd.format");
  setTextById("sdUpBtn", "settings.sd.up");
  setTextById("sdRootBtn", "settings.sd.root");
  setTextById("sdLogsBtn", "settings.sd.logs");
  setTextById("sdPhotosBtn", "settings.sd.photos");

  setTextById("settingsPagesHeading", "settings.pages.heading");
  setTextById("settingsPageTransitionLabel", "settings.pages.transition");
  setTextById("settingsPageTransitionMsLabel", "settings.pages.transition_ms");
  const pageTransitionHint = document.getElementById("settingsPageTransitionHint");
  if (pageTransitionHint) pageTransitionHint.textContent = t("settings.pages.transition_hint");
  setTextById("settingsPageTransitionNoneOption", "settings.pages.option_none");
  setTextById("settingsPageTransitionFadeOption", "settings.pages.option_fade");
  setTextById("settingsPageTransitionSlideOption", "settings.pages.option_slide");
  setTextById("settingsPageTransitionSlideUpOption", "settings.pages.option_slide_up");
  setTextById("settingsPageTransitionFadeSlideOption", "settings.pages.option_fade_slide");
  setTextById("settingsPageTargetLabel", "settings.pages.target");
  setTextById("reloadPagesBtn", "settings.pages.reload");
  setTextById("showPageOnPanelBtn", "settings.pages.show");
  setTextById("applyPagesBtn", "settings.pages.apply");

  setTextById("settingsMqttHeading", "settings.mqtt.heading");
  setTextById("settingsMqttEnabledLabel", "settings.mqtt.enabled");
  setTextById("settingsMqttUseTlsLabel", "settings.mqtt.use_tls");
  setTextById("settingsMqttTlsHint", "settings.mqtt.tls_hint");
  setTextById("settingsMqttHostLabel", "settings.mqtt.host");
  setTextById("settingsMqttPortLabel", "settings.mqtt.port");
  setTextById("settingsMqttUsernameLabel", "settings.mqtt.username");
  setTextById("settingsMqttPasswordLabel", "settings.mqtt.password");
  setTextById("settingsMqttDiscoveryPrefixLabel", "settings.mqtt.discovery_prefix");
  setTextById("applyMqttBtn", "settings.mqtt.apply");

  setTextById("settingsUiHeading", "settings.ui.heading");
  setTextById("settingsLanguageLabel", "settings.ui.language");
  setTextById("reloadLanguagesBtn", "settings.ui.reload_languages");
  setTextById("downloadLanguageBtn", "settings.ui.download_json");
  setTextById("uploadLanguageCodeLabel", "settings.ui.upload_code");
  setTextById("uploadLanguageFileLabel", "settings.ui.upload_file");
  setTextById("uploadLanguageBtn", "settings.ui.upload_button");

  setTextById("settingsApHeading", "settings.ap.heading");
  const apHint = document.getElementById("settingsApHint");
  if (apHint) apHint.innerHTML = t("settings.ap.hint");

  setTextById("settingsOtaHeading", "settings.ota.heading");
  setTextById("settingsOtaUrlLabel", "settings.ota.url");
  setPlaceholderById("settingsOtaUrl", "settings.ota.url_placeholder");
  setTextById("startOtaUrlBtn", "settings.ota.flash_url");
  setTextById("refreshOtaStatusBtn", "settings.ota.refresh");
  setTextById("settingsOtaFileLabel", "settings.ota.file");
  setTextById("uploadOtaBtn", "settings.ota.upload");

  setTextById("settingsSystemHeading", "settings.system.heading");
  setTextById("settingsAutoRestartEnabledLabel", "settings.system.auto_restart_enabled");
  setTextById("settingsAutoRestartHoursLabel", "settings.system.auto_restart_hours");
  const systemHint = document.getElementById("settingsSystemInfo");
  if (systemHint) systemHint.textContent = t("settings.system.hint");

  setTextById("settingsBackupHeading", "settings.backup.heading");
  setTextById("downloadBackupBtn", "settings.backup.download");
  setTextById("settingsBackupFileLabel", "settings.backup.file");
  setTextById("restoreBackupBtn", "settings.backup.restore");
  const backupHint = document.getElementById("settingsBackupHint");
  if (backupHint) backupHint.textContent = t("settings.backup.hint");

  setTextById("settingsActionsHeading", "settings.actions.heading");
  setTextById("reloadSettingsBtn", "settings.actions.reload");
  setTextById("saveSettingsBtn", "settings.actions.save");
  setTextById("settingsActionsHint", "settings.actions.hint");
  setTextById("settingsLogsHeading", "settings.logs.heading");
  setTextById("logsRefreshBtn", "settings.logs.refresh");
  setTextById("logsClearBtn", "settings.logs.clear");
  setTextById("logsAutoScrollLabel", "settings.logs.auto_scroll");
  setTextById("logsDownloadLink", "settings.logs.download");
  setTextById("logsLevelLabel", "settings.logs.log_level");
  setTextById("logsLevelApplyBtn", "settings.logs.log_level_apply");
  if (el.logsLevel) {
    for (const [id, key] of [
      ["logsLevelOffOption", "settings.logs.log_level_0"],
      ["logsLevelErrorOption", "settings.logs.log_level_1"],
      ["logsLevelWarnOption", "settings.logs.log_level_2"],
      ["logsLevelInfoOption", "settings.logs.log_level_3"],
      ["logsLevelDebugOption", "settings.logs.log_level_4"],
      ["logsLevelVerboseOption", "settings.logs.log_level_5"],
    ]) {
      setTextById(id, key);
    }
  }
  renderLogLevelInfo();
  syncLogsPauseButtonText();
  setTextById("settingsDiagnosticsHeading", "settings.diagnostics.heading");
  setTextById("diagnosticsRefreshBtn", "settings.diagnostics.refresh");
  setTextById("diagnosticsAutoRefreshLabel", "settings.diagnostics.auto_refresh");
  setTextById("setupWizardTitle", "setup.title");
  setTextById("setupWizardCloseBtn", "setup.close");
  setTextById("setupWizardStepHa", "setup.step_ha");
  setTextById("setupWizardStepTiles", "setup.step_tiles");
  setTextById("setupWizardStepSave", "setup.step_save");
  setTextById("setupWizardSubtitle", "setup.subtitle");
  setTextById("setupWizardPageLabel", "setup.page_label");
  setPlaceholderById("setupWizardPageTitle", "setup.page_placeholder");
  setTextById("setupWizardAddLightBtn", "setup.add_light");
  setTextById("setupWizardAddHeatingBtn", "setup.add_heating");
  setTextById("setupWizardAddWeatherBtn", "setup.add_weather");
  setTextById("setupWizardAddButtonBtn", "setup.add_button");
  setTextById("setupWizardAddSensorBtn", "setup.add_sensor");
  setTextById("setupWizardSkipBtn", "setup.skip");
  setTextById("setupWizardDoneBtn", "setup.done");
  setTextById("setupWizardSaveBtn", "setup.save");
  applySettingsNavTranslations();

  if (el.settingsTranslationInfo && !el.settingsTranslationInfo.classList.contains("error")) {
    el.settingsTranslationInfo.textContent = t("settings.translation.info");
  }

  if (el.uploadLanguageCode) {
    el.uploadLanguageCode.placeholder = "fr";
  }
  if (editor.setupWizard.active) {
    renderSetupWizard();
  }
}

function downloadLanguageJson() {
  const lang = normalizeUiLanguage(el.settingsLanguage?.value || editor.i18nLanguage);
  const web = {};
  for (const [key, value] of Object.entries(editor.i18nMap || {})) {
    web[key] = value;
  }

  const payload = {
    meta: {
      code: lang,
      exported_at: new Date().toISOString(),
    },
    web,
    lvgl: editor.i18nEffective?.lvgl || {},
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `betta-i18n-${lang}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function uploadLanguageJson() {
  const lang = normalizeLanguageCode(el.uploadLanguageCode?.value, "");
  if (!lang) {
    throw new Error(t("settings.translation.invalid_code"));
  }
  const file = el.uploadLanguageFile?.files?.[0];
  if (!file) {
    throw new Error(t("settings.translation.no_file"));
  }

  const text = await file.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    throw new Error(t("settings.translation.invalid_json"));
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(t("settings.translation.object_required"));
  }

  const response = await fetch(`/api/i18n/custom?lang=${encodeURIComponent(lang)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed),
  });
  if (!response.ok) {
    let detail = await response.text();
    try {
      const json = JSON.parse(detail);
      detail = json.error || detail;
    } catch (_) {}
    throw new Error(detail);
  }
}

function setProvisioningVisible(visible) {
  if (el.provisioningRoot) {
    el.provisioningRoot.classList.toggle("hidden", !visible);
  }
  if (el.editorShell) {
    el.editorShell.classList.toggle("hidden", visible);
  }
}

function provisioningStageForSettings(settings) {
  const wifiConfigured = Boolean(settings?.wifi?.configured);
  const wifiSetupApActive = Boolean(settings?.wifi?.setup_ap_active);
  const haConfigured = Boolean(settings?.ha?.configured);
  if (wifiSetupApActive) return "wifi";
  if (!wifiConfigured) return "wifi";
  if (!haConfigured) return "ha";
  return null;
}

function showProvisioningStage(stage, settings) {
  if (!stage) {
    editor.provisioningStage = null;
    setProvisioningVisible(false);
    return false;
  }

  editor.provisioningStage = stage;
  const wifi = settings?.wifi || {};
  const ha = settings?.ha || {};
  editor.wifiScanSupported = wifi.scan_supported !== false;

  if (el.provisioningWifiPage) {
    el.provisioningWifiPage.classList.toggle("hidden", stage !== "wifi");
  }
  if (el.provisioningHaPage) {
    el.provisioningHaPage.classList.toggle("hidden", stage !== "ha");
  }
  setProvisioningVisible(true);

  if (el.provWifiSsid) {
    el.provWifiSsid.value = wifi.ssid || "";
  }
  if (el.provWifiCountryCode) {
    el.provWifiCountryCode.value = normalizeCountryCode(wifi.country_code) || "US";
  }
  if (el.provWifiPassword) {
    el.provWifiPassword.value = "";
    el.provWifiPassword.type = "password";
  }
  if (el.provWifiShowPassword) {
    el.provWifiShowPassword.checked = false;
  }
  if (el.provHaUrl) {
    el.provHaUrl.value = ha.ws_url || "";
  }
  if (el.provHaToken) {
    el.provHaToken.value = "";
    el.provHaToken.type = "password";
  }
  if (el.provHaShowToken) {
    el.provHaShowToken.checked = false;
  }

  if (el.provScanWifiBtn) {
    el.provScanWifiBtn.disabled = !editor.wifiScanSupported || editor.wifiScanInProgress;
  }
  renderWifiScanResults(editor.wifiScanItems, "provisioning");

  if (!editor.wifiScanSupported) {
    setWifiScanInfo(t("wifi.scan_unavailable"), false, "provisioning");
  } else if (!editor.wifiScanHasRun && !editor.wifiScanInProgress) {
    setWifiScanInfo(t("wifi.scan_click_short"), false, "provisioning");
  }

  setProvisioningInfo(
    stage,
    stage === "wifi"
      ? t("provision.wifi.hint", {}, "Save reboots the panel. After reboot, HA provisioning is shown.")
      : t("provision.ha.hint", {}, "Save reboots the panel. After reboot, the editor is unlocked.")
  );
  return true;
}

function setupSettingsWorkspace() {
  if (el.settingsContentPane || !el.settingsPane) return;

  const workspaceBody = document.querySelector(".workspace-body");
  el.canvasWrap = el.canvasWrap || document.querySelector(".canvas-wrap");
  el.actionsPanel = el.actionsPanel || document.querySelector("aside.actions-panel");
  if (!workspaceBody || !el.canvasWrap) return;

  const contentPane = document.createElement("div");
  contentPane.id = "settingsContentPane";
  contentPane.className = "settings-content hidden";
  workspaceBody.insertBefore(contentPane, el.canvasWrap);

  const navSection = document.createElement("section");
  navSection.className = "settings-nav-section";

  const navHeading = document.createElement("h2");
  navHeading.id = "settingsNavHeading";
  navHeading.textContent = t("tabs.settings");
  navSection.appendChild(navHeading);

  const nav = document.createElement("div");
  nav.id = "settingsNav";
  nav.className = "settings-nav";
  const actionsHeading = document.getElementById("settingsActionsHeading");
  const actionsSection = actionsHeading?.closest("section") || null;

  for (const item of SETTINGS_NAV_ITEMS) {
    const heading = document.getElementById(item.headingId);
    const section = heading?.closest("section");
    if (!section) continue;

    section.id = item.sectionId;
    section.classList.add("settings-content-section", "hidden");
    contentPane.appendChild(section);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "settings-nav-btn";
    button.dataset.settingsSection = item.sectionId;
    button.dataset.i18nKey = item.labelKey;
    button.textContent = t(item.labelKey);
    nav.appendChild(button);
  }

  navSection.appendChild(nav);
  if (actionsSection) {
    actionsSection.id = "settingsSidebarActions";
    actionsSection.classList.add("settings-sidebar-actions");
    actionsHeading.classList.add("hidden");
    el.settingsPane.replaceChildren(navSection, actionsSection);
  } else {
    el.settingsPane.replaceChildren(navSection);
  }
  el.settingsContentPane = contentPane;
  el.settingsNavButtons = Array.from(nav.querySelectorAll(".settings-nav-btn"));
  el.settingsContentSections = Array.from(contentPane.querySelectorAll(".settings-content-section"));
  setActiveSettingsSection(editor.activeSettingsSection);
}

function applySettingsNavTranslations() {
  setTextById("settingsNavHeading", "tabs.settings");
  for (const button of el.settingsNavButtons || []) {
    const key = button.dataset.i18nKey;
    if (key) {
      button.textContent = t(key);
    }
  }
  if (editor.activePane === "settings") {
    setActiveSettingsSection(editor.activeSettingsSection);
  }
}

function activeSettingsNavItem(sectionId = editor.activeSettingsSection) {
  return SETTINGS_NAV_ITEMS.find((item) => item.sectionId === sectionId) || SETTINGS_NAV_ITEMS[0];
}

function setActiveSettingsSection(sectionId) {
  setupSettingsWorkspace();
  const item = activeSettingsNavItem(sectionId);
  if (!item) return;

  const sectionChanged = editor.activeSettingsSection !== item.sectionId;
  editor.activeSettingsSection = item.sectionId;
  for (const section of el.settingsContentSections || []) {
    section.classList.toggle("hidden", section.id !== item.sectionId);
  }
  for (const button of el.settingsNavButtons || []) {
    const active = button.dataset.settingsSection === item.sectionId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  }
  if (editor.activePane === "settings" && el.canvasTitle) {
    el.canvasTitle.textContent = t(item.labelKey);
  }
  if (item.sectionId === "settingsLogsSection") {
    startLogsPoll();
  } else {
    clearLogsPoll();
  }
  if (item.sectionId === "settingsDiagnosticsSection") {
    void loadDiagnostics(true);
  } else {
    clearDiagnosticsPoll();
  }
  if (item.sectionId === "settingsCamerasSection" && sectionChanged) {
    void loadCameras();
  }
  if (item.sectionId === "settingsLocalCamSection" && sectionChanged) {
    void loadLocalCameraStatus();
    void refreshLocalCameraPreview();
  }
}

function setActivePane(pane) {
  setupSettingsWorkspace();
  editor.activePane = pane === "settings" ? "settings" : "layout";
  const showLayout = editor.activePane === "layout";
  el.layoutPane.classList.toggle("hidden", !showLayout);
  el.settingsPane.classList.toggle("hidden", showLayout);
  if (el.settingsContentPane) {
    el.settingsContentPane.classList.toggle("hidden", showLayout);
  }
  if (el.canvasWrap) {
    el.canvasWrap.classList.toggle("hidden", !showLayout);
  }
  if (el.actionsPanel) {
    el.actionsPanel.classList.toggle("hidden", !showLayout);
  }
  el.layoutTabBtn.classList.toggle("active", showLayout);
  el.settingsTabBtn.classList.toggle("active", !showLayout);
  if (showLayout) {
    clearOtaStatusPoll();
    clearLogsPoll();
    clearDiagnosticsPoll();
    renderCanvas();
  } else if (editor.ota.status?.running || editor.ota.status?.rebooting) {
    setActiveSettingsSection(editor.activeSettingsSection);
    scheduleOtaStatusPoll();
  } else {
    setActiveSettingsSection(editor.activeSettingsSection);
  }
}

// System log monitor (settings > Logs)
// ============================================================
const LOGS_POLL_MS = 2000;
const LOGS_MAX_LINES = 600;
// A manual refresh pulls the whole retained history (every rotated segment), so
// it renders more lines than the 2 s poll - an event that already rolled out of
// the active file can still be read without downloading it.
const LOGS_HISTORY_MAX_LINES = 2000;

function logsShouldPoll() {
  return (
    editor.activePane === "settings" &&
    editor.activeSettingsSection === "settingsLogsSection" &&
    !editor.logs.paused
  );
}

function syncLogsPauseButtonText() {
  if (!el.logsPauseBtn) return;
  el.logsPauseBtn.textContent = t(editor.logs.paused ? "settings.logs.resume" : "settings.logs.pause");
}

function clearLogsPoll() {
  if (editor.logs.pollTimerId) {
    window.clearTimeout(editor.logs.pollTimerId);
    editor.logs.pollTimerId = null;
  }
}

function scheduleLogsPoll() {
  clearLogsPoll();
  if (!logsShouldPoll()) return;
  editor.logs.pollTimerId = window.setTimeout(() => {
    editor.logs.pollTimerId = null;
    void loadLogs(false);
  }, LOGS_POLL_MS);
}

function startLogsPoll() {
  clearLogsPoll();
  if (!logsShouldPoll()) return;
  void loadLogs(false);
}

function setLogsPaused(paused) {
  editor.logs.paused = Boolean(paused);
  syncLogsPauseButtonText();
  if (editor.logs.paused) {
    clearLogsPoll();
  } else {
    startLogsPoll();
  }
}

function classifyLogLine(line) {
  if (/^!!! CRASH:/.test(line)) return "log-crash";
  if (/^=== boot /.test(line)) return "log-boot";
  if (/^E /i.test(line)) return "log-E";
  if (/^W /i.test(line)) return "log-W";
  if (/^I /i.test(line)) return "log-I";
  return "log-plain";
}

function renderLogLines(text, maxLines = LOGS_MAX_LINES) {
  const viewer = el.settingsLogsViewer;
  if (!viewer) return;
  if (typeof text !== "string" || text.length === 0) {
    viewer.textContent = t("settings.logs.empty");
    if (el.logsMeta) el.logsMeta.textContent = "";
    return;
  }

  const lines = text.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  if (lines.length === 0) {
    viewer.textContent = t("settings.logs.empty");
    if (el.logsMeta) el.logsMeta.textContent = "";
    return;
  }

  const start = Math.max(0, lines.length - maxLines);
  const fragment = document.createDocumentFragment();
  for (let i = start; i < lines.length; i++) {
    const line = document.createElement("div");
    line.className = "log-line " + classifyLogLine(lines[i]);
    line.textContent = lines[i];
    fragment.appendChild(line);
  }
  viewer.textContent = "";
  viewer.appendChild(fragment);
  if (el.logsMeta) {
    el.logsMeta.textContent = t("settings.logs.updated", { time: new Date().toLocaleTimeString() });
  }
}

async function loadLogs(manual = true) {
  if (!el.settingsLogsViewer) return;
  const seq = ++editor.logs.requestSeq;
  if (manual && el.logsMeta) {
    el.logsMeta.textContent = t("settings.logs.loading");
  }
  try {
    // The poll asks only for the active file (cheap, runs every 2 s); a manual
    // refresh asks for the retained history so nothing is missed.
    const response = await fetch(manual ? "/api/logs?all=1" : "/api/logs", { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const text = await response.text();
    if (seq !== editor.logs.requestSeq) return;
    renderLogLines(text, manual ? LOGS_HISTORY_MAX_LINES : LOGS_MAX_LINES);
    if (el.logsAutoScroll && el.logsAutoScroll.checked && el.settingsLogsViewer) {
      el.settingsLogsViewer.scrollTop = el.settingsLogsViewer.scrollHeight;
    }
  } catch (err) {
    if (seq !== editor.logs.requestSeq) return;
    if (el.logsMeta) {
      el.logsMeta.textContent = t("settings.logs.fetch_failed", {
        error: err?.message || String(err),
      });
    }
  } finally {
    if (seq === editor.logs.requestSeq) {
      scheduleLogsPoll();
    }
  }
}

async function clearLogs() {
  if (el.logsMeta) el.logsMeta.textContent = t("settings.logs.loading");
  try {
    const response = await fetch("/api/logs", { method: "DELETE", cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    if (el.logsMeta) el.logsMeta.textContent = t("settings.logs.cleared");
  } catch (err) {
    if (el.logsMeta) {
      el.logsMeta.textContent = t("settings.logs.clear_failed", {
        error: err?.message || String(err),
      });
    }
  }
  void loadLogs(false);
}

const DIAGNOSTICS_POLL_MS = 10000;

function formatDuration(ms) {
  const num = Number(ms);
  if (!Number.isFinite(num) || num <= 0) return "—";
  return formatUptimeMinutes(Math.round(num / 60000));
}

function formatUptimeMinutes(minutes) {
  const mins = Math.max(0, Math.round(Number(minutes) || 0));
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rest = mins % 60;
  if (days > 0) return `${days}d ${hours}h ${rest}m`;
  if (hours > 0) return `${hours}h ${rest}m`;
  return `${rest}m`;
}

function diagnosticsRow(key, value, tone) {
  const row = document.createElement("div");
  row.className = "diag-row";
  const keySpan = document.createElement("span");
  keySpan.className = "diag-key";
  keySpan.textContent = key;
  const valueSpan = document.createElement("span");
  valueSpan.className = "diag-value" + (tone ? ` diag-${tone}` : "");
  valueSpan.textContent = value === undefined || value === null || value === "" ? "—" : String(value);
  row.appendChild(keySpan);
  row.appendChild(valueSpan);
  return row;
}

function diagnosticsCard(title, rows, note) {
  const card = document.createElement("div");
  card.className = "diag-card";
  const heading = document.createElement("h3");
  heading.textContent = title;
  card.appendChild(heading);
  for (const row of rows) {
    if (row) card.appendChild(row);
  }
  if (note) {
    const noteEl = document.createElement("p");
    noteEl.className = "diag-note";
    noteEl.textContent = note;
    card.appendChild(noteEl);
  }
  return card;
}

function diagnosticsOtaStateLabel(state) {
  const table = {
    new: t("settings.diagnostics.ota_state.new"),
    pending_verify: t("settings.diagnostics.ota_state.pending_verify"),
    valid: t("settings.diagnostics.ota_state.valid"),
    invalid: t("settings.diagnostics.ota_state.invalid"),
    aborted: t("settings.diagnostics.ota_state.aborted"),
  };
  return table[state] || t("settings.diagnostics.ota_state.undefined");
}

function renderDiagnostics(data) {
  const grid = el.diagnosticsGrid;
  if (!grid) return;
  grid.textContent = "";
  if (!data || typeof data !== "object") {
    if (el.diagnosticsMeta) el.diagnosticsMeta.textContent = t("settings.diagnostics.empty");
    return;
  }

  const app = data.app || {};
  const chip = data.chip || {};
  const memory = data.memory || {};
  const wifi = data.wifi || {};
  const ha = data.ha || {};
  const haLink = ha.link || {};
  const mqtt = data.mqtt || {};
  const ota = data.ota || {};

  const statusCard = diagnosticsCard(t("settings.diagnostics.card_status"), [
    diagnosticsRow(t("settings.diagnostics.uptime"), formatUptimeMinutes((Number(data.uptime_ms) || 0) / 60000)),
    diagnosticsRow(t("settings.diagnostics.reset_reason"), ota.reset_reason),
    diagnosticsRow(t("settings.diagnostics.boot_count"), ota.boot_count),
    diagnosticsRow(
      t("settings.diagnostics.cpu_temp"),
      data.cpu_temp_c === undefined ? "—" : `${Number(data.cpu_temp_c).toFixed(1)} °C`,
      data.cpu_temp_c === undefined ? null : "ok"
    ),
  ]);

  const fwCard = diagnosticsCard(t("settings.diagnostics.card_firmware"), [
    diagnosticsRow(t("settings.diagnostics.version"), app.version),
    diagnosticsRow(t("settings.diagnostics.project"), app.project),
    diagnosticsRow(t("settings.diagnostics.idf"), app.idf_version),
    diagnosticsRow(t("settings.diagnostics.build_date"), `${app.build_date || ""} ${app.build_time || ""}`.trim()),
    diagnosticsRow(t("settings.diagnostics.panel"), `${chip.model || "—"} (${chip.cores || "?"} cores, r${chip.revision})`),
    diagnosticsRow(t("settings.diagnostics.screen"), `${chip.screen_w || "?"}x${chip.screen_h || "?"}`),
  ]);

  const memoryRegions = memory.regions || {};
  const internalRegion = memoryRegions.internal || {};
  const dmaRegion = memoryRegions.internal_dma || {};
  // The RGB panel bounce buffers need two DMA-capable blocks of roughly 15 kB
  // each, therefore a small largest block is the early warning that the driver
  // is about to fail its next allocation.
  const dmaLargest = Number(dmaRegion.largest_block);
  const dmaStatus = Number.isFinite(dmaLargest) ? (dmaLargest < 20480 ? "warn" : "ok") : null;
  const internalBlocks =
    internalRegion.alloc_blocks === undefined
      ? "n/a"
      : `${internalRegion.alloc_blocks} / ${internalRegion.free_blocks}`;

  const memoryCard = diagnosticsCard(t("settings.diagnostics.card_memory"), [
    diagnosticsRow(t("settings.diagnostics.heap_free"), formatBytes(memory.heap_free)),
    diagnosticsRow(t("settings.diagnostics.heap_min"), formatBytes(memory.heap_free_min)),
    diagnosticsRow(t("settings.diagnostics.heap_largest"), formatBytes(memory.heap_largest_block)),
    diagnosticsRow(
      t("settings.diagnostics.heap_fragmentation"),
      `${Number(memory.heap_fragmentation_pct || 0).toFixed(0)} %`,
      Number(memory.heap_fragmentation_pct || 0) >= 40 ? "warn" : "ok"
    ),
    diagnosticsRow(
      t("settings.diagnostics.heap_dma"),
      `${formatBytes(dmaRegion.free)} / ${formatBytes(dmaRegion.largest_block)}`,
      dmaStatus
    ),
    diagnosticsRow(t("settings.diagnostics.heap_blocks"), internalBlocks),
    diagnosticsRow(t("settings.diagnostics.iram_free"), formatBytes(memory.iram_free)),
    diagnosticsRow(t("settings.diagnostics.psram_free"), formatBytes(memory.psram_free)),
  ]);

  const wifiCard = diagnosticsCard(t("settings.diagnostics.card_wifi"), [
    diagnosticsRow(
      t("settings.diagnostics.connected"),
      wifi.connected ? t("settings.diagnostics.yes") : t("settings.diagnostics.no"),
      wifi.connected ? "ok" : "bad"
    ),
    diagnosticsRow(t("settings.diagnostics.ssid"), wifi.ssid),
    diagnosticsRow(t("settings.diagnostics.ip"), wifi.ip),
    diagnosticsRow(
      t("settings.diagnostics.rssi"),
      wifi.rssi === undefined ? "—" : `${wifi.rssi} dBm`,
      wifi.rssi === undefined ? null : Number(wifi.rssi) <= -75 ? "warn" : "ok"
    ),
    diagnosticsRow(t("settings.diagnostics.channel"), wifi.channel),
    diagnosticsRow(t("settings.diagnostics.wifi_drops"), wifi.disconnect_count),
    diagnosticsRow(t("settings.diagnostics.wifi_reconnects"), wifi.reconnect_count),
    diagnosticsRow(t("settings.diagnostics.wifi_recoveries"), wifi.hard_recover_count),
    diagnosticsRow(
      t("settings.diagnostics.wifi_last_drop"),
      wifi.disconnect_count ? `${wifi.last_disconnect_reason} (${wifiDisconnectReasonLabel(wifi.last_disconnect_reason)})` : "—"
    ),
    diagnosticsRow(t("settings.diagnostics.wifi_session"), formatDuration(wifi.last_session_ms)),
  ]);

  const haCard = diagnosticsCard(t("settings.diagnostics.card_ha"), [
    diagnosticsRow(
      t("settings.diagnostics.connected"),
      ha.connected ? t("settings.diagnostics.yes") : t("settings.diagnostics.no"),
      ha.connected ? "ok" : "bad"
    ),
    diagnosticsRow(
      t("settings.diagnostics.sync_done"),
      ha.initial_sync_done ? t("settings.diagnostics.yes") : t("settings.diagnostics.no"),
      ha.initial_sync_done ? "ok" : "warn"
    ),
    diagnosticsRow(t("settings.diagnostics.base_url"), ha.base_url),
    diagnosticsRow(t("settings.diagnostics.cert_cn"), ha.cert_common_name),
    diagnosticsRow(t("settings.diagnostics.ws_connects"), haLink.connect_count),
    diagnosticsRow(t("settings.diagnostics.ws_disconnects"), haLink.disconnect_count),
    diagnosticsRow(t("settings.diagnostics.ws_recoveries"), haLink.recover_count),
    diagnosticsRow(
      t("settings.diagnostics.ws_last_session"),
      formatDuration(haLink.last_session_ms)
    ),
    diagnosticsRow(
      t("settings.diagnostics.missing_entities"),
      ha.missing_entities ? String(ha.missing_entities) : "0",
      ha.missing_entities ? "warn" : "ok"
    ),
  ]);

  const mqttCard = diagnosticsCard(t("settings.diagnostics.card_mqtt"), [
    diagnosticsRow(
      t("settings.diagnostics.mqtt_enabled"),
      mqtt.enabled ? t("settings.diagnostics.yes") : t("settings.diagnostics.no")
    ),
    diagnosticsRow(
      t("settings.diagnostics.connected"),
      mqtt.connected ? t("settings.diagnostics.yes") : t("settings.diagnostics.no"),
      mqtt.connected ? "ok" : mqtt.enabled ? "warn" : null
    ),
    diagnosticsRow(t("settings.diagnostics.mqtt_tls"), mqtt.tls ? t("settings.diagnostics.yes") : t("settings.diagnostics.no")),
    diagnosticsRow(t("settings.diagnostics.broker"), mqtt.broker_uri),
  ]);

  const otaState = ota.image_state || "";
  const rollbackArmed = otaState === "pending_verify";
  const bootloaderNote =
    ota.rollback_enabled && (!otaState || otaState === "undefined")
      ? t("settings.diagnostics.bootloader_note")
      : null;

  const otaCard = diagnosticsCard(
    t("settings.diagnostics.card_ota"),
    [
      diagnosticsRow(t("settings.diagnostics.running_partition"), ota.running_partition),
      diagnosticsRow(t("settings.diagnostics.next_partition"), ota.next_update_partition),
      diagnosticsRow(
        t("settings.diagnostics.image_state"),
        otaState ? diagnosticsOtaStateLabel(otaState) : "—",
        rollbackArmed ? "warn" : otaState && otaState !== "undefined" ? "ok" : null
      ),
      diagnosticsRow(
        t("settings.diagnostics.rollback_enabled"),
        ota.rollback_enabled ? t("settings.diagnostics.yes") : t("settings.diagnostics.no"),
        ota.rollback_enabled ? "ok" : "warn"
      ),
      diagnosticsRow(
        t("settings.diagnostics.boot_confirmed"),
        rollbackArmed
          ? t("settings.diagnostics.no")
          : ota.boot_confirmed
            ? t("settings.diagnostics.yes")
            : "—",
        rollbackArmed ? "warn" : null
      ),
    ],
    bootloaderNote
  );

  grid.appendChild(statusCard);
  grid.appendChild(fwCard);
  grid.appendChild(memoryCard);
  grid.appendChild(wifiCard);
  grid.appendChild(haCard);
  grid.appendChild(mqttCard);
  grid.appendChild(otaCard);

  if (el.diagnosticsMeta) {
    el.diagnosticsMeta.textContent = t("settings.diagnostics.updated", { time: new Date().toLocaleTimeString() });
  }
}

function wifiDisconnectReasonLabel(reason) {
  const table = {
    1: "UNSPECIFIED",
    2: "AUTH_EXPIRE",
    3: "AUTH_LEAVE",
    4: "ASSOC_EXPIRE",
    5: "ASSOC_TOOMANY",
    6: "NOT_AUTHED",
    7: "NOT_ASSOCED",
    8: "ASSOC_LEAVE",
    9: "ASSOC_NOT_AUTHED",
    15: "4WAY_HANDSHAKE_TIMEOUT",
    16: "GROUP_KEY_UPDATE_TIMEOUT",
    17: "IE_IN_4WAY_DIFFERS",
    18: "GROUP_CIPHER_INVALID",
    19: "PAIRWISE_CIPHER_INVALID",
    20: "AKMP_INVALID",
    21: "UNSUPP_GROUP_CIPHER",
    22: "UNSUPP_PAIRWISE_CIPHER",
    23: "UNSUPP_AKMP",
    24: "UNSUPP_RSN_IE_VERSION",
    25: "INVALID_RSN_IE_CAP",
    26: "802_1X_AUTH_FAILED",
    27: "CIPHER_SUITE_REJECTED",
    200: "BEACON_TIMEOUT",
    201: "NO_AP_FOUND",
    202: "AUTH_FAIL",
    203: "ASSOC_FAIL",
    204: "HANDSHAKE_TIMEOUT",
    205: "CONNECTION_FAIL",
  };
  return table[Number(reason)] || "UNKNOWN";
}

function clearDiagnosticsPoll() {
  if (editor.diagnostics.pollTimerId) {
    window.clearTimeout(editor.diagnostics.pollTimerId);
    editor.diagnostics.pollTimerId = null;
  }
}

function scheduleDiagnosticsPoll() {
  clearDiagnosticsPoll();
  if (!el.diagnosticsAutoRefresh || !el.diagnosticsAutoRefresh.checked) return;
  editor.diagnostics.pollTimerId = window.setTimeout(() => {
    editor.diagnostics.pollTimerId = null;
    void loadDiagnostics(false);
  }, DIAGNOSTICS_POLL_MS);
}

async function loadDiagnostics(manual = true) {
  if (!el.diagnosticsGrid) return;
  const seq = ++editor.diagnostics.requestSeq;
  if (manual && el.diagnosticsMeta) {
    el.diagnosticsMeta.textContent = t("settings.diagnostics.loading");
  }
  try {
    const response = await fetch("/api/diagnostics", { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const data = await response.json();
    if (seq !== editor.diagnostics.requestSeq) return;
    editor.diagnostics.lastData = data;
    renderDiagnostics(data);
  } catch (err) {
    if (seq !== editor.diagnostics.requestSeq) return;
    if (el.diagnosticsMeta) {
      el.diagnosticsMeta.classList.add("error");
      el.diagnosticsMeta.textContent = t("settings.diagnostics.fetch_failed", {
        error: err?.message || String(err),
      });
    }
  } finally {
    if (seq === editor.diagnostics.requestSeq) {
      scheduleDiagnosticsPoll();
    }
  }
}

function setSectionCollapsed(sectionKey, collapsed) {
  const map = {
    pages: { section: el.pagesSection, toggle: el.togglePagesSection },
    widgets: { section: el.widgetsSection, toggle: el.toggleWidgetsSection },
    inspector: { section: el.inspectorSection, toggle: el.toggleInspectorSection },
  };
  const entry = map[sectionKey];
  if (!entry || !entry.section || !entry.toggle) return;

  const nextCollapsed = Boolean(collapsed);
  editor.sectionCollapsed[sectionKey] = nextCollapsed;
  entry.section.classList.toggle("collapsed", nextCollapsed);
  entry.toggle.textContent = nextCollapsed ? "+" : "-";
  entry.toggle.setAttribute("aria-expanded", nextCollapsed ? "false" : "true");
}

function toggleSection(sectionKey) {
  setSectionCollapsed(sectionKey, !editor.sectionCollapsed[sectionKey]);
}

function applySectionCollapseState() {
  setSectionCollapsed("pages", editor.sectionCollapsed.pages);
  setSectionCollapsed("widgets", editor.sectionCollapsed.widgets);
  setSectionCollapsed("inspector", editor.sectionCollapsed.inspector);
}

function rgbIntToHex(value) {
  const v = Number(value) || 0;
  const r = (v >> 16) & 0xff;
  const g = (v >> 8) & 0xff;
  const b = v & 0xff;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgbInt(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return 0xffffff;
  return parseInt(m[1], 16) & 0xffffff;
}

/* Flip mode has no seconds digit, so the option is disabled while it is picked. */
function syncClockStyleUi() {
  const flip = el.settingsClockStyle ? el.settingsClockStyle.value === "flip" : false;
  if (el.settingsShowSeconds) el.settingsShowSeconds.disabled = flip;
  const hint = document.getElementById("settingsClockStyleHint");
  if (hint) hint.textContent = flip ? t("settings.display.clock_style_hint") : "";
}

function renderSettings() {
  const settings = editor.settings || {};
  const wifi = settings.wifi || {};
  const ha = settings.ha || {};
  const time = settings.time || {};
  const ui = settings.ui || {};
  const display = settings.display || {};
  const mqtt = settings.mqtt || {};
  const system = settings.system || {};
  const scanSupported = wifi.scan_supported !== false;
  editor.wifiScanSupported = scanSupported;

  el.settingsWifiSsid.value = wifi.ssid || "";
  if (el.settingsWifiCountryCode) {
    el.settingsWifiCountryCode.value = normalizeCountryCode(wifi.country_code) || "US";
  }
  if (el.settingsWifiBssid) {
    el.settingsWifiBssid.value = normalizeBssid(wifi.bssid || "");
  }
  if (el.settingsWifiStaticEnabled) {
    el.settingsWifiStaticEnabled.checked = wifi.static_enabled === true;
  }
  if (el.settingsWifiStaticIp) {
    el.settingsWifiStaticIp.value = wifi.static_ip || "";
  }
  if (el.settingsWifiStaticNetmask) {
    el.settingsWifiStaticNetmask.value = wifi.static_netmask || "";
  }
  if (el.settingsWifiStaticGateway) {
    el.settingsWifiStaticGateway.value = wifi.static_gateway || "";
  }
  if (el.settingsWifiStaticDns) {
    el.settingsWifiStaticDns.value = wifi.static_dns || "";
  }
  el.settingsWifiPassword.value = "";
  el.settingsHaUrl.value = ha.ws_url || "";
  el.settingsHaToken.value = "";
  if (el.settingsHaRestEnabled) {
    el.settingsHaRestEnabled.checked = ha.rest_enabled === true;
  }

  const xiaozhi = settings.xiaozhi || {};
  if (el.settingsXiaozhiEnabled) {
    el.settingsXiaozhiEnabled.checked = xiaozhi.enabled === true;
  }
  if (el.settingsXiaozhiServer) {
    el.settingsXiaozhiServer.value = xiaozhi.server || "";
  }
  if (el.settingsXiaozhiOtaUrl) {
    el.settingsXiaozhiOtaUrl.value = xiaozhi.ota_url || "";
  }
  if (el.settingsXiaozhiDevice) {
    el.settingsXiaozhiDevice.value = xiaozhi.device || "";
  }
  if (el.settingsXiaozhiToken) {
    el.settingsXiaozhiToken.value = "";
  }

  const camera = (settings && settings.camera) || {};
  const cameraMotion = camera.motion && typeof camera.motion === "object" ? camera.motion : {};
  if (el.settingsLocalCamEnabled) {
    el.settingsLocalCamEnabled.checked = camera.enabled === true;
  }
  if (el.settingsLocalCamStream) {
    el.settingsLocalCamStream.checked = camera.stream_enabled === true;
  }
  if (el.settingsLocalCamMotion) {
    el.settingsLocalCamMotion.checked = camera.motion_wake === true;
  }
  if (el.settingsLocalCamThreshold) {
    el.settingsLocalCamThreshold.value = String(clampInt(camera.motion_threshold, 1, 64, 8));
  }
  if (el.settingsLocalCamQuality) {
    el.settingsLocalCamQuality.value = String(clampInt(camera.jpeg_quality, 10, 95, 55));
  }
  if (el.settingsLocalCamResolution) {
    el.settingsLocalCamResolution.value = clampInt(camera.resolution, 0, 1, 0) === 1 ? "1" : "0";
  }
  if (el.settingsLocalCamHflip) {
    el.settingsLocalCamHflip.checked = camera.hflip === true;
  }
  if (el.settingsLocalCamVflip) {
    el.settingsLocalCamVflip.checked = camera.vflip === true;
  }
  if (el.settingsLocalCamMotionMinArea) {
    el.settingsLocalCamMotionMinArea.value = String(clampInt(cameraMotion.min_area, 0, 100, 0));
  }
  if (el.settingsLocalCamMotionMinAreaVal) {
    el.settingsLocalCamMotionMinAreaVal.textContent = `${el.settingsLocalCamMotionMinArea.value}%`;
  }
  if (el.settingsLocalCamMotionMinDuration) {
    el.settingsLocalCamMotionMinDuration.value = String(clampInt(cameraMotion.min_duration_ms, 0, 1000, 0));
  }
  if (el.settingsLocalCamMotionCooldown) {
    el.settingsLocalCamMotionCooldown.value = String(clampInt(cameraMotion.cooldown_ms, 0, 30000, 1000));
  }
  if (el.settingsLocalCamMotionStartDelay) {
    el.settingsLocalCamMotionStartDelay.value = String(clampInt(cameraMotion.start_delay_ms, 0, 10000, 2000));
  }
  if (el.settingsLocalCamMotionIgnoreLighting) {
    el.settingsLocalCamMotionIgnoreLighting.checked = cameraMotion.ignore_lighting !== false;
  }

  editor.localCamZones = [];
  if (Array.isArray(cameraMotion.zones)) {
    editor.localCamZones = cameraMotion.zones
      .slice(0, 4)
      .map((zone) => ({
        x: clampInt(zone && zone.x, 0, 100, 0),
        y: clampInt(zone && zone.y, 0, 100, 0),
        w: clampInt(zone && zone.w, 0, 100, 0),
        h: clampInt(zone && zone.h, 0, 100, 0),
      }))
      .filter((zone) => zone.w > 0 && zone.h > 0);
  }
  editor.localCamZoneDraft = null;
  renderLocalCamZones();

  el.settingsNtpServer.value = time.ntp_server || "";
  el.settingsTimezone.value = time.timezone || "";
  if (el.settingsLanguage) {
    el.settingsLanguage.value = normalizeUiLanguage(ui.language);
  }
  renderLanguageOptions();

  const connectedRssiText = Number.isFinite(Number(wifi.rssi_dbm))
    ? `${Math.round(Number(wifi.rssi_dbm))} dBm`
    : "n/a";
  const connectedBssid = normalizeBssid(wifi.connected_bssid || "");
  const connectedChannel = Number.isFinite(Number(wifi.connected_channel))
    ? String(Math.round(Number(wifi.connected_channel)))
    : "n/a";

  el.settingsWifiInfo.textContent = [
    `${t("settings.info.configured")}: ${wifi.configured ? t("common.yes") : t("common.no")}`,
    `${t("settings.info.connected")}: ${wifi.connected ? t("common.yes") : t("common.no")}`,
    `${t("settings.info.password_stored")}: ${wifi.password_set ? t("common.yes") : t("common.no")}`,
    `${t("settings.info.country")}: ${normalizeCountryCode(wifi.country_code) || "US"}`,
    `${t("settings.info.rssi")}: ${connectedRssiText}`,
    `${t("settings.info.connected_bssid")}: ${connectedBssid || "n/a"}`,
    `${t("settings.info.channel")}: ${connectedChannel}`,
  ].join(" | ");

  el.settingsHaInfo.textContent = [
    `${t("settings.info.configured")}: ${ha.configured ? t("common.yes") : t("common.no")}`,
    `${t("settings.info.connected")}: ${ha.connected ? t("common.yes") : t("common.no")}`,
    `${t("settings.info.token_stored")}: ${ha.access_token_set ? t("common.yes") : t("common.no")}`,
    `${t("settings.info.rest_fallback")}: ${ha.rest_enabled ? t("common.yes") : t("common.no")}`,
  ].join(" | ");

  if (el.settingsXiaozhiInfo) {
    el.settingsXiaozhiInfo.textContent = [
      `${t("settings.info.configured")}: ${xiaozhi.configured ? t("common.yes") : t("common.no")}`,
      `${t("settings.info.token_stored")}: ${xiaozhi.access_token_set ? t("common.yes") : t("common.no")}`,
      `${t("settings.xiaozhi.cloud_activation")}: ${(xiaozhi.ota_url || "").length > 0 ? t("common.yes") : t("common.no")}`,
    ].join(" | ");
  }

  el.settingsTimeInfo.textContent = t("settings.time.info");

  if (el.settingsBrightness) {
    el.settingsBrightness.value = Math.round(clamp(Number(display.brightness) || 0, 1, 100));
  }
  if (el.settingsScreensaverEnabled) {
    el.settingsScreensaverEnabled.checked = display.screensaver_enabled === true;
  }
  if (el.settingsScreensaverTimeout) {
    el.settingsScreensaverTimeout.value = Math.round(clamp(Number(display.screensaver_timeout_sec) || 0, 5, 7200));
  }
  if (el.settingsSaverBrightness) {
    el.settingsSaverBrightness.value = Math.round(clamp(Number(display.saver_brightness) || 0, 1, 60));
  }
  if (el.settingsSaverWallpaperDim) {
    el.settingsSaverWallpaperDim.value = Math.round(clamp(Number(display.saver_wallpaper_dim) || 0, 0, 90));
  }
  if (el.settingsScreenOffEnabled) {
    el.settingsScreenOffEnabled.checked = display.screen_off_enabled === true;
  }
  if (el.settingsScreenOffTimeout) {
    el.settingsScreenOffTimeout.value = Math.round(clamp(Number(display.screen_off_timeout_sec) || 0, 5, 7200));
  }
  if (el.settingsClockFormat) {
    /* Anything but an explicit false is 24 hour, matching the firmware default. */
    el.settingsClockFormat.value = display.clock_24h === false ? "h12" : "h24";
  }
  if (el.settingsClockStyle) {
    el.settingsClockStyle.value = Number(display.saver_clock_style) === 1 ? "flip" : "classic";
    if (el.settingsClockStyle.dataset.clockStyleBound !== "1") {
      el.settingsClockStyle.dataset.clockStyleBound = "1";
      el.settingsClockStyle.addEventListener("change", syncClockStyleUi);
    }
    syncClockStyleUi();
  }
  if (el.settingsShowSeconds) {
    el.settingsShowSeconds.checked = display.saver_show_seconds === true;
  }
  if (el.settingsShowDate) {
    el.settingsShowDate.checked = display.saver_show_date !== false;
  }
  if (el.settingsClockColor) {
    el.settingsClockColor.value = rgbIntToHex(display.saver_clock_color);
  }
  if (el.settingsDateColor) {
    el.settingsDateColor.value = rgbIntToHex(display.saver_date_color);
  }
  if (el.settingsNightModeEnabled) {
    el.settingsNightModeEnabled.checked = display.night_mode_enabled === true;
  }
  if (el.settingsNightStart) {
    el.settingsNightStart.value = minutesToTimeString(clampInt(display.night_start_min, 0, 1439, 1320));
  }
  if (el.settingsNightEnd) {
    el.settingsNightEnd.value = minutesToTimeString(clampInt(display.night_end_min, 0, 1439, 360));
  }
  if (el.settingsNightBrightness) {
    el.settingsNightBrightness.value = clampInt(display.night_brightness, 0, 100, 0);
  }
  if (el.settingsNightWakeSec) {
    el.settingsNightWakeSec.value = clampInt(display.night_wake_sec, 0, 3600, 20);
  }
  if (el.settingsNightHint) {
    el.settingsNightHint.textContent =
      display.night_active === true
        ? `${t("settings.display.night_hint")} ${t("settings.display.night_currently_active")}`
        : t("settings.display.night_hint");
  }
  autoThemeState.enabled = display.theme_auto_enabled === true;
  autoThemeState.dayId = typeof display.theme_day_id === "string" ? display.theme_day_id : "";
  autoThemeState.nightId = typeof display.theme_night_id === "string" ? display.theme_night_id : "";
  if (el.settingsThemeAutoEnabled) {
    el.settingsThemeAutoEnabled.checked = autoThemeState.enabled;
  }
  themePopulateAutoSelects();
  if (el.settingsDisplayInfo) {
    el.settingsDisplayInfo.textContent = t("settings.display.info");
  }
  if (el.settingsPageTransition) {
    const mode = typeof display.page_transition === "string" ? display.page_transition : "fade";
    el.settingsPageTransition.value = PAGE_TRANSITION_MODES.indexOf(mode) >= 0 ? mode : "fade";
  }
  if (el.settingsPageTransitionMs) {
    el.settingsPageTransitionMs.value = clampInt(display.page_transition_ms, 0, 1200, 220);
  }
  if (el.settingsPageTransitionHint) {
    el.settingsPageTransitionHint.textContent = t("settings.pages.transition_hint");
  }
  if (el.settingsTilePressFx) {
    const mode = typeof display.tile_press_fx === "string" ? display.tile_press_fx : "both";
    el.settingsTilePressFx.value = TILE_PRESS_FX_MODES.indexOf(mode) >= 0 ? mode : "both";
  }
  if (el.settingsTilePressFxDim) {
    el.settingsTilePressFxDim.value = clampInt(display.tile_press_fx_dim, 0, 60, 15);
  }
  if (el.settingsTilePressFxScale) {
    el.settingsTilePressFxScale.value = clampInt(display.tile_press_fx_scale, 90, 100, 97);
  }
  if (el.settingsTilePressFxHint) {
    el.settingsTilePressFxHint.textContent = t("settings.display.press_fx_hint");
  }
  updatePressFxCss();
  if (el.settingsValueAnim) {
    const mode = typeof display.value_anim === "string" ? display.value_anim : "count";
    el.settingsValueAnim.value = VALUE_ANIM_MODES.indexOf(mode) >= 0 ? mode : "count";
  }
  if (el.settingsValueAnimMs) {
    el.settingsValueAnimMs.value = clampInt(display.value_anim_ms, 0, 1500, 320);
  }
  if (el.settingsValueAnimHint) {
    el.settingsValueAnimHint.textContent = t("settings.display.value_anim_hint");
  }
  updateValueAnimCss();

  if (el.settingsTopbarShowClock) {
    el.settingsTopbarShowClock.checked = display.topbar_show_clock !== false;
  }
  if (el.settingsTopbarShowDate) {
    el.settingsTopbarShowDate.checked = display.topbar_show_date !== false;
  }
  if (el.settingsTopbarShowGear) {
    el.settingsTopbarShowGear.checked = display.topbar_show_gear !== false;
  }
  if (el.settingsTopbarShowStatus) {
    el.settingsTopbarShowStatus.checked = display.topbar_show_status !== false;
  }
  if (el.settingsTopbarIconText) {
    el.settingsTopbarIconText.checked = display.topbar_icon_text === true;
  }
  if (el.settingsTopbarCustomColors) {
    el.settingsTopbarCustomColors.checked = display.topbar_custom_colors === true;
  }
  if (el.settingsTopbarBgColor) {
    el.settingsTopbarBgColor.value = rgbIntToHex(display.topbar_bg_color, "#0D1723");
  }
  if (el.settingsTopbarClockColor) {
    el.settingsTopbarClockColor.value = rgbIntToHex(display.topbar_clock_color, "#EAF2FA");
  }
  if (el.settingsTopbarDateColor) {
    el.settingsTopbarDateColor.value = rgbIntToHex(display.topbar_date_color, "#A1B1C1");
  }
  if (el.settingsTopbarGearColor) {
    el.settingsTopbarGearColor.value = rgbIntToHex(display.topbar_gear_color, "#A1B1C1");
  }
  if (el.settingsTopbarHaColor) {
    el.settingsTopbarHaColor.value = rgbIntToHex(display.topbar_ha_color, "#C7D1DB");
  }
  if (el.settingsTopbarWifiColor) {
    el.settingsTopbarWifiColor.value = rgbIntToHex(display.topbar_wifi_color, "#C7D1DB");
  }
  if (el.settingsTopbarHint) {
    el.settingsTopbarHint.textContent = t("settings.display.topbar_hint");
  }
  if (el.settingsTopbarColorHint) {
    el.settingsTopbarColorHint.textContent = t("settings.display.topbar_color_hint");
  }
  if (el.settingsNavCustomColors) {
    el.settingsNavCustomColors.checked = display.nav_custom_colors === true;
  }
  if (el.settingsNavBarBgColor) {
    el.settingsNavBarBgColor.value = rgbIntToHex(display.nav_bar_bg_color, "#0D1723");
  }
  if (el.settingsNavBarBorderColor) {
    el.settingsNavBarBorderColor.value = rgbIntToHex(display.nav_bar_border_color, "#2A3D50");
  }
  if (el.settingsNavButtonBgColor) {
    el.settingsNavButtonBgColor.value = rgbIntToHex(display.nav_button_bg_color, "#1B2A3A");
  }
  if (el.settingsNavButtonBorderColor) {
    el.settingsNavButtonBorderColor.value = rgbIntToHex(display.nav_button_border_color, "#385064");
  }
  if (el.settingsNavTabIdleColor) {
    el.settingsNavTabIdleColor.value = rgbIntToHex(display.nav_tab_idle_color, "#A9C3D0");
  }
  if (el.settingsNavTabActiveColor) {
    el.settingsNavTabActiveColor.value = rgbIntToHex(display.nav_tab_active_color, "#6FE8FF");
  }
  if (el.settingsNavHomeIdleColor) {
    el.settingsNavHomeIdleColor.value = rgbIntToHex(display.nav_home_idle_color, "#9EB8C7");
  }
  if (el.settingsNavHomeActiveColor) {
    el.settingsNavHomeActiveColor.value = rgbIntToHex(display.nav_home_active_color, "#53E5FF");
  }
  if (el.settingsNavColorHint) {
    el.settingsNavColorHint.textContent = t("settings.display.nav_color_hint");
  }
  updateTopbarCss();
  updateNavCss();

  if (el.settingsMqttEnabled) {
    el.settingsMqttEnabled.checked = mqtt.enabled === true;
  }
  if (el.settingsMqttUseTls) {
    el.settingsMqttUseTls.checked = mqtt.use_tls === true;
  }
  if (el.settingsMqttTlsHint) {
    el.settingsMqttTlsHint.textContent = t("settings.mqtt.tls_hint");
  }
  if (el.settingsMqttHost) {
    el.settingsMqttHost.value = mqtt.host || "";
  }
  if (el.settingsMqttPort) {
    el.settingsMqttPort.value = Math.round(clamp(Number(mqtt.port) || 0, 1, 65535));
  }
  if (el.settingsMqttUsername) {
    el.settingsMqttUsername.value = mqtt.username || "";
  }
  if (el.settingsMqttPassword) {
    el.settingsMqttPassword.value = "";
  }
  if (el.settingsMqttDiscoveryPrefix) {
    el.settingsMqttDiscoveryPrefix.value = mqtt.discovery_prefix || "homeassistant";
  }
  if (el.settingsMqttInfo) {
    el.settingsMqttInfo.textContent = [
      t("settings.mqtt.info"),
      `${t("settings.info.connected")}: ${mqtt.connected ? t("common.yes") : t("common.no")}`,
      `${t("settings.info.password_stored")}: ${mqtt.password_set ? t("common.yes") : t("common.no")}`,
    ].join(" | ");
  }

  if (el.settingsAutoRestartEnabled) {
    el.settingsAutoRestartEnabled.checked = system.auto_restart_enabled === true;
  }
  if (el.settingsAutoRestartHours) {
    el.settingsAutoRestartHours.value = Math.round(clamp(Number(system.auto_restart_hours) || 0, 1, 168));
  }
  if (el.settingsSystemInfo) {
    el.settingsSystemInfo.textContent = t("settings.system.hint");
  }
  // The log level lives in the Logs section but is stored under system.*.
  syncLogLevelFromSettings();

  if (el.settingsUiInfo) {
    el.settingsUiInfo.textContent = t("settings.ui.info");
  }
  if (el.settingsTranslationInfo && !el.settingsTranslationInfo.classList.contains("error")) {
    el.settingsTranslationInfo.textContent = t("settings.translation.info");
  }

  if (wifi.setup_ap_active) {
    const ssid = wifi.setup_ap_ssid || "(unknown)";
    el.settingsApInfo.textContent = t("settings.ap.active", { ssid });
  } else {
    el.settingsApInfo.textContent = t("settings.ap.inactive");
  }

  if (!scanSupported) {
    setWifiScanInfo(t("wifi.scan_unavailable"));
  } else if (!editor.wifiScanHasRun && !editor.wifiScanInProgress) {
    setWifiScanInfo(t("wifi.scan_click"));
  }
  if (el.scanWifiBtn) {
    el.scanWifiBtn.disabled = !scanSupported || editor.wifiScanInProgress;
  }
  renderOtaStatus(editor.ota.status);
  if (editor.ota.latestUrl) {
    applyLatestOtaUrl(editor.ota.latestUrl);
  } else {
    void refreshLatestOtaUrl();
  }
  restoreOtaUrl();
  renderWifiScanResults(editor.wifiScanItems);
  void loadPanelPages(false);
  void loadSdState(true);
  renderSdFiles();
}

function renderWifiScanResults(items, scope = "settings") {
  const ui = getWifiScanUi(scope);
  const select = ui.resultsSelect;
  if (!select) return;

  const currentSsid = ui.ssidInput ? ui.ssidInput.value.trim() : "";
  select.innerHTML = "";
  if (!editor.wifiScanSupported) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("wifi.scan.option_unavailable", {}, "Scan unavailable");
    select.appendChild(option);
    return;
  }

  if (editor.wifiScanInProgress) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("wifi.scan.option_scanning", {}, "Scanning...");
    select.appendChild(option);
    return;
  }

  if (!editor.wifiScanHasRun) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("wifi.scan.option_not_run", {}, "No scan yet");
    select.appendChild(option);
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("wifi.scan.option_no_networks", {}, "No networks found");
    select.appendChild(option);
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = t("wifi.scan.option_select", { count: items.length }, `Select network (${items.length} found)`);
  select.appendChild(placeholder);

  let firstMatchingSsidValue = "";
  for (let idx = 0; idx < items.length; idx++) {
    const net = items[idx];
    if (!net || typeof net.ssid !== "string" || !net.ssid.length) continue;

    const bssid = normalizeBssid(net.bssid || "");
    const rssiText = Number.isFinite(Number(net.rssi)) ? `${Math.round(Number(net.rssi))} dBm` : "n/a";
    const authmodeText = (typeof net.authmode === "string" && net.authmode.length) ? net.authmode : "unknown";
    const channelText = Number.isFinite(Number(net.channel)) ? `ch ${Math.round(Number(net.channel))}` : "ch ?";
    const details = [rssiText, authmodeText, channelText];
    if (bssid) {
      details.push(bssid);
    }
    if (net.connected === true) {
      details.push(t("wifi.scan.connected_tag", {}, "connected"));
    }

    const option = document.createElement("option");
    option.value = bssid || `${net.ssid}#${idx}`;
    option.dataset.ssid = net.ssid;
    option.dataset.bssid = bssid;
    option.textContent = `${net.ssid} (${details.join(", ")})`;
    select.appendChild(option);

    if (!firstMatchingSsidValue && currentSsid && net.ssid === currentSsid) {
      firstMatchingSsidValue = option.value;
    }
  }

  if (firstMatchingSsidValue) {
    select.value = firstMatchingSsidValue;
  }
}

async function scanWifiNetworks(scope = "settings") {
  const ui = getWifiScanUi(scope);
  if (!ui.scanButton) return;
  if (!editor.wifiScanSupported) {
    setWifiScanInfo(
      t("wifi.scan_unavailable"),
      false,
      scope
    );
    return;
  }
  if (editor.wifiScanInProgress) return;

  editor.wifiScanInProgress = true;
  ui.scanButton.disabled = true;
  renderWifiScanResults([], scope);
  setWifiScanInfo(t("status.wifi_scan_running"), false, scope);
  setStatus(t("status.wifi_scan_running"));

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("/api/wifi/scan", {
      cache: "no-store",
      signal: controller.signal,
    });
    const body = await response.text();
    let data = null;
    if (body) {
      try {
        data = JSON.parse(body);
      } catch (_) {
        data = null;
      }
    }

    if (!response.ok) {
      const detail = data?.message || data?.error || `${response.status} ${response.statusText}`;
      throw new Error(detail);
    }

    data = data || {};
    editor.wifiScanItems = Array.isArray(data.items) ? data.items : [];
    editor.wifiScanHasRun = true;
    renderWifiScanResults(editor.wifiScanItems, scope);

    if (editor.wifiScanItems.length > 0) {
      setWifiScanInfo(
        t("wifi.scan_found", { count: editor.wifiScanItems.length }),
        false,
        scope
      );
    } else {
      setWifiScanInfo(t("wifi.scan_no_networks"), false, scope);
    }
    setStatus(t("status.wifi_scan_complete", { count: editor.wifiScanItems.length }));
  } catch (err) {
    editor.wifiScanHasRun = true;
    renderWifiScanResults(editor.wifiScanItems, scope);
    const detail = err?.name === "AbortError"
      ? t("status.wifi_scan_timeout")
      : (err?.message || t("common.unknown_error"));
    setWifiScanInfo(detail, true, scope);
    setStatus(t("status.wifi_scan_failed", { error: detail }), true);
  } finally {
    window.clearTimeout(timeoutId);
    editor.wifiScanInProgress = false;
    renderWifiScanResults(editor.wifiScanItems, scope);
    ui.scanButton.disabled = false;
  }
}

async function loadSettings(silent = false) {
  if (!silent) {
    setStatus(t("status.loading_settings"));
  }
  try {
    editor.settings = await apiGet("/api/settings");
    await loadI18nLanguage(editor.settings?.ui?.language || DEFAULT_UI_LANGUAGE, true);
    renderSettings();
    if (!silent) {
      setStatus(t("status.settings_loaded"));
    }
    return editor.settings;
  } catch (err) {
    if (!silent) {
      setStatus(t("status.settings_load_failed", { error: err.message }), true);
    }
    return null;
  }
}

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "n/a";
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB"];
  let value = n;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = unitIndex === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

function parseJsonMaybe(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function otaProgressVars(status) {
  const written = Math.max(0, Number(status?.written) || 0);
  const total = Math.max(0, Number(status?.total) || 0);
  const rawProgress = Number(status?.progress);
  const progress = total > 0
    ? Math.min(100, Math.max(0, Number.isFinite(rawProgress) ? rawProgress : (written * 100) / total))
    : 0;
  return {
    progress: total > 0 ? String(Math.round(progress)) : "--",
    written: formatBytes(written),
    total: total > 0 ? formatBytes(total) : "n/a",
  };
}

function clearOtaStatusPoll() {
  if (editor.ota.pollTimerId) {
    window.clearTimeout(editor.ota.pollTimerId);
    editor.ota.pollTimerId = null;
  }
}

function scheduleOtaStatusPoll() {
  clearOtaStatusPoll();
  if (editor.activePane !== "settings") return;
  editor.ota.pollTimerId = window.setTimeout(() => {
    void loadOtaStatus(true);
  }, OTA_STATUS_POLL_MS);
}

function setOtaInfo(text, isError = false) {
  if (!el.settingsOtaInfo) return;
  el.settingsOtaInfo.textContent = text;
  el.settingsOtaInfo.classList.toggle("error", isError);
}

function setOtaProgress(percent) {
  if (!el.settingsOtaProgressBar) return;
  const n = Number(percent);
  const clamped = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
  el.settingsOtaProgressBar.style.width = `${clamped}%`;
}

function setOtaControlsDisabled(disabled) {
  const busy = Boolean(disabled);
  if (el.startOtaUrlBtn) {
    el.startOtaUrlBtn.disabled = busy;
  }
  if (el.uploadOtaBtn) {
    el.uploadOtaBtn.disabled = busy;
  }
  if (el.settingsOtaUrl) {
    el.settingsOtaUrl.disabled = busy;
  }
  if (el.settingsOtaFile) {
    el.settingsOtaFile.disabled = busy;
  }
}

function renderOtaStatus(status) {
  if (!el.settingsOtaInfo) return;

  const hasStatus = status && typeof status === "object";
  if (!hasStatus) {
    setOtaProgress(0);
    setOtaControlsDisabled(editor.ota.uploadInProgress);
    return;
  }

  const vars = otaProgressVars(status);
  const state = typeof status.state === "string" ? status.state : "idle";
  const running = Boolean(status.running);
  const rebooting = Boolean(status.rebooting);
  const progress = Number(vars.progress);
  setOtaProgress(Number.isFinite(progress) ? progress : 0);

  let text = "";
  let isError = false;
  if (state === "error") {
    text = t("settings.ota.error", { error: status.error || t("common.unknown_error") });
    isError = true;
  } else if (rebooting) {
    text = t("settings.ota.rebooting");
  } else if (state === "success") {
    text = t("settings.ota.success");
  } else if (running && state === "url") {
    text = t("settings.ota.downloading", vars);
  } else if (running && state === "upload") {
    text = t("settings.ota.uploading", vars);
  } else if (running) {
    text = t("settings.ota.running", vars);
  } else {
    text = t("settings.ota.idle", {
      running: status.running_partition || "n/a",
      next: status.next_partition || "n/a",
      size: status.slot_size ? formatBytes(status.slot_size) : "n/a",
    });
  }

  const imageInfo = [
    status.project_name || "",
    status.version || "",
  ].filter(Boolean).join(" ");
  if (imageInfo) {
    text += `\n${imageInfo}`;
  }
  const targetPartition = status.partition || (running ? status.next_partition : "");
  if (targetPartition) {
    text += `\n${t("settings.ota.target_slot", { partition: targetPartition })}`;
  }

  setOtaInfo(text, isError);
  setOtaControlsDisabled(editor.ota.uploadInProgress || running || rebooting);
}

async function loadOtaStatus(silent = false) {
  if (!silent && el.settingsOtaInfo) {
    setOtaInfo(t("settings.ota.refresh"));
  }
  try {
    const status = await apiGet("/api/ota/status");
    editor.ota.status = status;
    renderOtaStatus(status);
    if (status?.running || status?.rebooting) {
      scheduleOtaStatusPoll();
    } else {
      clearOtaStatusPoll();
    }
    return status;
  } catch (err) {
    const wasRebooting = Boolean(editor.ota.status?.rebooting);
    setOtaInfo(
      wasRebooting ? t("settings.ota.rebooting") : t("settings.ota.request_failed", { error: err.message }),
      !wasRebooting
    );
    if (!wasRebooting) {
      clearOtaStatusPoll();
    }
    return null;
  }
}

async function startOtaFromUrl() {
  const url = el.settingsOtaUrl?.value.trim() || "";
  if (!url) {
    setOtaInfo(t("settings.ota.no_url"), true);
    return;
  }

  clearOtaStatusPoll();
  setOtaProgress(0);
  setOtaControlsDisabled(true);
  setOtaInfo(t("settings.ota.starting_url"));

  try {
    const response = await fetch("/api/ota/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const body = await response.text();
    const payload = parseJsonMaybe(body) || {};
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || `${response.status} ${response.statusText}`);
    }
    editor.ota.status = payload;
    renderOtaStatus(payload);
    if (payload.running || payload.rebooting) {
      scheduleOtaStatusPoll();
    }
  } catch (err) {
    setOtaInfo(t("settings.ota.request_failed", { error: err.message }), true);
    setOtaControlsDisabled(false);
  }
}

async function uploadOtaFile() {
  const file = el.settingsOtaFile?.files?.[0];
  if (!file) {
    setOtaInfo(t("settings.ota.no_file"), true);
    return;
  }

  clearOtaStatusPoll();
  editor.ota.uploadInProgress = true;
  setOtaProgress(0);
  setOtaControlsDisabled(true);
  setOtaInfo(t("settings.ota.upload_progress", {
    progress: "0",
    written: "0 B",
    total: formatBytes(file.size),
  }));

  try {
    const payload = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/ota/upload");
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.min(100, Math.max(0, (event.loaded * 100) / event.total));
        setOtaProgress(progress);
        setOtaInfo(t("settings.ota.upload_progress", {
          progress: String(Math.round(progress)),
          written: formatBytes(event.loaded),
          total: formatBytes(event.total),
        }));
      };
      xhr.onload = () => {
        const data = parseJsonMaybe(xhr.responseText) || {};
        if (xhr.status < 200 || xhr.status >= 300 || data.ok === false) {
          reject(new Error(data.error || `${xhr.status} ${xhr.statusText}`));
          return;
        }
        resolve(data);
      };
      xhr.onerror = () => reject(new Error(t("common.unknown_error")));
      xhr.onabort = () => reject(new Error("aborted"));
      xhr.send(file);
    });

    editor.ota.status = payload;
    renderOtaStatus(payload);
    if (el.settingsOtaFile) {
      el.settingsOtaFile.value = "";
    }
    if (payload?.running || payload?.rebooting) {
      scheduleOtaStatusPoll();
    }
  } catch (err) {
    setOtaInfo(t("settings.ota.request_failed", { error: err.message }), true);
    setOtaProgress(0);
  } finally {
    editor.ota.uploadInProgress = false;
    setOtaControlsDisabled(Boolean(editor.ota.status?.running || editor.ota.status?.rebooting));
  }
}

async function putSettings(payload) {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let detail = await response.text();
    try {
      const json = JSON.parse(detail);
      detail = json.error || detail;
    } catch (_) {}
    throw new Error(detail);
  }
}

function setBackupInfo(text, isError = false) {
  if (!el.settingsBackupInfo) return;
  el.settingsBackupInfo.textContent = text;
  el.settingsBackupInfo.classList.toggle("error", isError);
}

async function downloadBackup() {
  setBackupInfo(t("settings.backup.downloading"));
  const response = await fetch("/api/backup");
  if (!response.ok) {
    let detail = await response.text();
    try {
      const json = JSON.parse(detail);
      detail = json.error || detail;
    } catch (_) {}
    throw new Error(detail || response.statusText);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "betta-ha-panel-backup.json";
  link.click();
  URL.revokeObjectURL(url);
  setBackupInfo(t("settings.backup.downloaded"));
}

async function restoreBackup() {
  const file = el.settingsBackupFile?.files?.[0];
  if (!file) {
    setBackupInfo(t("settings.backup.choose_file"), true);
    return;
  }
  setBackupInfo(t("settings.backup.restoring"));
  let body;
  try {
    body = await file.text();
  } catch (err) {
    throw new Error(String(err?.message || err));
  }
  const response = await fetch("/api/backup/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch (_) {}
  if (!response.ok || payload.ok !== true) {
    throw new Error(payload.error || response.statusText);
  }
  const summary = t("settings.backup.restored", {
    layout: payload.layout_restored ? t("common.yes") : t("common.no"),
    settings: payload.settings_restored ? t("common.yes") : t("common.no"),
    themes: payload.themes_restored ? t("common.yes") : t("common.no"),
  });
  setBackupInfo(payload.restart_required ? `${summary} ${t("settings.backup.restart_hint")}` : summary);
  await loadSettings(true);
  await loadLayout();
  if (typeof themeLoadAndRender === "function") {
    try {
      await themeLoadAndRender();
    } catch (_) {}
  }
}

async function saveWifiProvisioning() {
  const ssid = el.provWifiSsid?.value.trim() || "";
  const password = el.provWifiPassword?.value || "";
  const countryCode = normalizeCountryCode(el.provWifiCountryCode?.value) || "";

  if (!ssid) {
    setProvisioningInfo("wifi", t("provision.wifi.required_ssid"), true);
    return;
  }
  if (!countryCode) {
    setProvisioningInfo("wifi", t("provision.wifi.required_country"), true);
    return;
  }

  const payload = {
    wifi: {
      ssid,
      country_code: countryCode,
      bssid: null,
    },
    reboot: true,
  };
  if (password.length > 0) {
    payload.wifi.password = password;
  }

  setProvisioningInfo("wifi", t("provision.saving_reboot"));
  await putSettings(payload);
  setProvisioningInfo("wifi", t("provision.saved_reboot"));
}

async function saveHaProvisioning() {
  const wsUrl = el.provHaUrl?.value.trim() || "";
  const accessToken = el.provHaToken?.value.trim() || "";

  if (!wsUrl) {
    setProvisioningInfo("ha", t("provision.ha.required_url"), true);
    return;
  }
  if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
    setProvisioningInfo("ha", t("provision.ha.invalid_url"), true);
    return;
  }
  if (!accessToken) {
    setProvisioningInfo("ha", t("provision.ha.required_token"), true);
    return;
  }

  const payload = {
    ha: {
      ws_url: wsUrl,
      access_token: accessToken,
    },
    reboot: true,
  };

  setProvisioningInfo("ha", t("provision.saving_reboot"));
  markSetupWizardPending();
  try {
    await putSettings(payload);
  } catch (err) {
    storageRemove(SETUP_WIZARD_PENDING_STORAGE_KEY);
    throw err;
  }
  setProvisioningInfo("ha", t("provision.saved_reboot"));
}

async function saveSettings() {
  const wifiSsid = el.settingsWifiSsid.value.trim();
  const wifiPassword = el.settingsWifiPassword.value;
  const wifiCountryCode = normalizeCountryCode(el.settingsWifiCountryCode?.value) || "";
  const wifiBssidRaw = el.settingsWifiBssid?.value || "";
  const wifiBssid = normalizeBssid(wifiBssidRaw);
  const wifiStaticEnabled = Boolean(el.settingsWifiStaticEnabled?.checked);
  const wifiStaticIp = (el.settingsWifiStaticIp?.value || "").trim();
  const wifiStaticNetmask = (el.settingsWifiStaticNetmask?.value || "").trim();
  const wifiStaticGateway = (el.settingsWifiStaticGateway?.value || "").trim();
  const wifiStaticDns = (el.settingsWifiStaticDns?.value || "").trim();
  const haUrl = el.settingsHaUrl.value.trim();
  const haToken = el.settingsHaToken.value.trim();
  const haRestEnabled = Boolean(el.settingsHaRestEnabled?.checked);
  const xiaozhiServer = (el.settingsXiaozhiServer?.value || "").trim();
  const xiaozhiOtaUrl = (el.settingsXiaozhiOtaUrl?.value || "").trim();
  const xiaozhiDevice = (el.settingsXiaozhiDevice?.value || "").trim();
  const xiaozhiToken = (el.settingsXiaozhiToken?.value || "").trim();
  const xiaozhiEnabled = Boolean(el.settingsXiaozhiEnabled?.checked);
  const ntpServer = el.settingsNtpServer.value.trim();
  const timezone = el.settingsTimezone.value.trim();
  const language = normalizeUiLanguage(el.settingsLanguage?.value);

  if (!wifiCountryCode) {
    setStatus(t("settings.language.invalid_country"), true);
    return;
  }
  if (wifiBssidRaw.trim().length > 0 && !wifiBssid) {
    setStatus(t("settings.language.invalid_bssid"), true);
    return;
  }
  if (wifiStaticEnabled) {
    if (!isValidIpv4(wifiStaticIp) || !isValidIpv4(wifiStaticNetmask) || !isValidIpv4(wifiStaticGateway)) {
      setStatus(t("settings.wifi.invalid_static_ip"), true);
      return;
    }
  }
  if (wifiStaticDns && !isValidIpv4(wifiStaticDns)) {
    setStatus(t("settings.wifi.invalid_static_ip"), true);
    return;
  }
  if (haUrl && !haUrl.startsWith("ws://") && !haUrl.startsWith("wss://")) {
    setStatus(t("settings.language.invalid_ha_url"), true);
    return;
  }
  if (xiaozhiServer && !xiaozhiServer.startsWith("ws://") && !xiaozhiServer.startsWith("wss://")) {
    setStatus(t("settings.language.invalid_xiaozhi_url"), true);
    return;
  }
  if (xiaozhiOtaUrl && !xiaozhiOtaUrl.startsWith("https://") && !xiaozhiOtaUrl.startsWith("http://")) {
    setStatus(t("settings.language.invalid_ota_url"), true);
    return;
  }

  const payload = {
    wifi: {
      ssid: wifiSsid,
      country_code: wifiCountryCode,
      bssid: wifiBssid || null,
      static_enabled: wifiStaticEnabled,
      static_ip: wifiStaticIp || null,
      static_netmask: wifiStaticNetmask || null,
      static_gateway: wifiStaticGateway || null,
      static_dns: wifiStaticDns || null,
    },
    ha: {
      ws_url: haUrl,
      rest_enabled: haRestEnabled,
    },
    xiaozhi: {
      server: xiaozhiServer,
      ota_url: xiaozhiOtaUrl,
      device: xiaozhiDevice,
      enabled: xiaozhiEnabled,
    },
    time: {
      ntp_server: ntpServer,
      timezone,
    },
    ui: {
      language,
    },
    display: collectDisplayPayload(),
    mqtt: collectMqttPayload(),
    system: collectSystemPayload(),
    reboot: true,
  };
  if (wifiPassword.length > 0) {
    payload.wifi.password = wifiPassword;
  }
  if (haToken.length > 0) {
    payload.ha.access_token = haToken;
  }
  if (xiaozhiToken.length > 0) {
    payload.xiaozhi.access_token = xiaozhiToken;
  }

  setStatus(t("status.saving_settings"));
  await putSettings(payload);
  setStatus(t("status.settings_saved_reboot"));
}

async function saveLocalCamera() {
  const wasRunning = editor.localCameraRunning === true;
  const camera = {
    enabled: Boolean(el.settingsLocalCamEnabled?.checked),
    stream_enabled: Boolean(el.settingsLocalCamStream?.checked),
    motion_wake: Boolean(el.settingsLocalCamMotion?.checked),
    motion_threshold: clampInt(el.settingsLocalCamThreshold?.value, 1, 64, 8),
    jpeg_quality: clampInt(el.settingsLocalCamQuality?.value, 10, 95, 55),
    resolution: clampInt(el.settingsLocalCamResolution?.value, 0, 1, 0),
    hflip: Boolean(el.settingsLocalCamHflip?.checked),
    vflip: Boolean(el.settingsLocalCamVflip?.checked),
    motion: {
      min_area: clampInt(el.settingsLocalCamMotionMinArea?.value, 0, 100, 0),
      min_duration_ms: clampInt(el.settingsLocalCamMotionMinDuration?.value, 0, 1000, 0),
      cooldown_ms: clampInt(el.settingsLocalCamMotionCooldown?.value, 0, 30000, 1000),
      start_delay_ms: clampInt(el.settingsLocalCamMotionStartDelay?.value, 0, 10000, 2000),
      ignore_lighting: Boolean(el.settingsLocalCamMotionIgnoreLighting?.checked),
      zones: editor.localCamZones.slice(0, 4).map((z) => ({
        x: z.x,
        y: z.y,
        w: z.w,
        h: z.h,
      })),
    },
  };

  setStatus(t("status.saving_settings"));
  try {
    await putSettings({ camera, reboot: false });
    setStatus(t("settings.localCam.saved"));
    await loadLocalCameraStatus();
    if (!wasRunning && editor.localCameraRunning === true) {
      // Cold start: the sensor needs a moment before the snapshot endpoint
      // can return the first frame. Avoid firing a request that would 503.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await loadLocalCameraStatus();
    }
    await refreshLocalCameraPreview();
  } catch (err) {
    setStatus(t("settings.localCam.save_failed", { error: err.message }), true);
  }
}

async function loadLocalCameraStatus() {
  const statusEl = el.settingsLocalCamStatus;
  try {
    const data = await apiGet("/api/camera/status");
    editor.localCameraRunning = data.running === true;
    if (statusEl) {
      const resLabel = data.resolution === 1
        ? t("settings.localCam.resolution_half")
        : t("settings.localCam.resolution_native");
      statusEl.textContent = [
        `${t("settings.localCam.enabled")}: ${data.running ? t("common.yes") : t("common.no")}`,
        `${t("settings.localCam.resolution")}: ${resLabel}`,
        `${t("settings.localCam.motion")}: ${data.motion_wake ? t("common.yes") : t("common.no")}`,
      ].join(" | ");
      statusEl.classList.remove("error");
    }
  } catch (err) {
    editor.localCameraRunning = false;
    if (statusEl) {
      statusEl.textContent = t("settings.localCam.status_error", { error: err.message });
      statusEl.classList.add("error");
    }
  }
}

async function refreshLocalCameraPreview() {
  const img = el.settingsLocalCamSnapshot;
  const hint = el.settingsLocalCamSnapshotHint;
  if (!img) return;
  if (editor.localCameraRunning !== true) {
    img.hidden = true;
    if (hint) {
      hint.textContent = t("settings.localCam.preview_hint");
      hint.classList.remove("error");
    }
    return;
  }
  try {
    const response = await fetch("/api/camera/snapshot", { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const blob = await response.blob();
    if (!blob || blob.size === 0) throw new Error(t("common.unknown_error"));
    const objectUrl = URL.createObjectURL(blob);
    if (img.dataset.objectUrl) {
      URL.revokeObjectURL(img.dataset.objectUrl);
    }
    img.src = objectUrl;
    img.dataset.objectUrl = objectUrl;
    img.hidden = false;
    if (hint) {
      hint.textContent = t("settings.localCam.preview_hint");
      hint.classList.remove("error");
    }
  } catch (err) {
    img.hidden = true;
    if (hint) {
      hint.textContent = t("settings.localCam.snapshot_failed", { error: err.message });
      hint.classList.add("error");
    }
  }
}

function renderLocalCamZones() {
  const overlay = el.settingsLocalCamZonesOverlay;
  if (overlay) {
    overlay.querySelectorAll(".camera-zone").forEach((node) => node.remove());
    editor.localCamZones.forEach((z, i) => {
      const div = document.createElement("div");
      div.className = "camera-zone";
      div.style.left = `${z.x}%`;
      div.style.top = `${z.y}%`;
      div.style.width = `${z.w}%`;
      div.style.height = `${z.h}%`;
      const label = document.createElement("span");
      label.className = "camera-zone-label";
      label.textContent = String(i + 1);
      div.appendChild(label);
      overlay.appendChild(div);
    });
  }

  const list = el.settingsLocalCamZonesList;
  if (list) {
    list.innerHTML = "";
    editor.localCamZones.forEach((z, i) => {
      const item = document.createElement("span");
      item.className = "camera-zone-item";
      item.textContent = `${i + 1}: ${z.x}%,${z.y}% ${z.w}×${z.h}%`;
      const del = document.createElement("button");
      del.type = "button";
      del.className = "camera-zone-del";
      del.textContent = "×";
      del.title = t("settings.localCam.zones_remove");
      del.onclick = () => {
        editor.localCamZones.splice(i, 1);
        renderLocalCamZones();
      };
      item.appendChild(del);
      list.appendChild(item);
    });
  }
  if (el.settingsLocalCamZonesClearBtn) {
    el.settingsLocalCamZonesClearBtn.disabled = editor.localCamZones.length === 0;
  }
}

function localCamZoneDraftRect() {
  const d = editor.localCamZoneDraft;
  if (!d) return null;
  return {
    x: Math.min(d.x0, d.x1),
    y: Math.min(d.y0, d.y1),
    w: Math.abs(d.x1 - d.x0),
    h: Math.abs(d.y1 - d.y0),
  };
}

function renderLocalCamZoneDraft() {
  const overlay = el.settingsLocalCamZonesOverlay;
  if (!overlay) return;
  let draft = overlay.querySelector(".camera-zone-draft");
  const rect = localCamZoneDraftRect();
  if (!rect) {
    if (draft) draft.remove();
    return;
  }
  if (!draft) {
    draft = document.createElement("div");
    draft.className = "camera-zone camera-zone-draft";
    overlay.appendChild(draft);
  }
  draft.style.left = `${rect.x}%`;
  draft.style.top = `${rect.y}%`;
  draft.style.width = `${rect.w}%`;
  draft.style.height = `${rect.h}%`;
}

function localCamZonePercent(clientX, clientY) {
  const wrap = el.settingsLocalCamZonesWrap;
  if (!wrap) return { x: 0, y: 0 };
  const rect = wrap.getBoundingClientRect();
  const pct = (v, max) => clamp(Math.round((v / Math.max(max, 1)) * 100), 0, 100);
  return { x: pct(clientX - rect.left, rect.width), y: pct(clientY - rect.top, rect.height) };
}

function localCamZoneStart(clientX, clientY) {
  if (editor.localCamZones.length >= 4) return;
  const p = localCamZonePercent(clientX, clientY);
  editor.localCamZoneDraft = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
  renderLocalCamZoneDraft();
}

function localCamZoneMove(clientX, clientY) {
  if (!editor.localCamZoneDraft) return;
  const p = localCamZonePercent(clientX, clientY);
  editor.localCamZoneDraft.x1 = p.x;
  editor.localCamZoneDraft.y1 = p.y;
  renderLocalCamZoneDraft();
}

function localCamZoneEnd() {
  const d = editor.localCamZoneDraft;
  editor.localCamZoneDraft = null;
  const overlay = el.settingsLocalCamZonesOverlay;
  if (overlay) {
    const draft = overlay.querySelector(".camera-zone-draft");
    if (draft) draft.remove();
  }
  if (!d) return;
  const x = Math.min(d.x0, d.x1);
  const y = Math.min(d.y0, d.y1);
  const w = Math.abs(d.x1 - d.x0);
  const h = Math.abs(d.y1 - d.y0);
  if (w < 3 || h < 3) return;
  editor.localCamZones.push({ x, y, w, h });
  renderLocalCamZones();
}

function bindLocalCamZoneEditor() {
  const overlay = el.settingsLocalCamZonesOverlay;
  if (!overlay) return;
  overlay.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    localCamZoneStart(ev.clientX, ev.clientY);
  });
  window.addEventListener("pointermove", (ev) => {
    if (!editor.localCamZoneDraft) return;
    localCamZoneMove(ev.clientX, ev.clientY);
  });
  window.addEventListener("pointerup", () => {
    if (editor.localCamZoneDraft) localCamZoneEnd();
  });
}

async function refreshLocalCamZonesSnapshot() {
  const img = el.settingsLocalCamZonesSnapshot;
  const wrap = el.settingsLocalCamZonesWrap;
  if (!img || !wrap) return;
  if (editor.localCameraRunning !== true) {
    wrap.hidden = true;
    return;
  }
  try {
    const response = await fetch("/api/camera/snapshot", { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const blob = await response.blob();
    if (!blob || blob.size === 0) throw new Error(t("common.unknown_error"));
    const objectUrl = URL.createObjectURL(blob);
    if (img.dataset.objectUrl) {
      URL.revokeObjectURL(img.dataset.objectUrl);
    }
    img.src = objectUrl;
    img.dataset.objectUrl = objectUrl;
    wrap.hidden = false;
  } catch (_) {
    wrap.hidden = true;
  }
}

async function loadLocalCamMotionDiagnostics() {
  const diag = el.settingsLocalCamMotionDiag;
  await refreshLocalCamZonesSnapshot();
  try {
    const data = await apiGet("/api/camera/motion");
    if (diag) {
      diag.hidden = false;
      diag.classList.remove("error");
      const parts = [
        `${t("settings.localCam.motion_level")}: ${data.level}`,
        `${t("settings.localCam.motion_changed")}: ${data.changed_pct}%`,
        `${t("settings.localCam.motion_active")}: ${data.active ? t("common.yes") : t("common.no")}`,
        `${t("settings.localCam.motion_triggers")}: ${data.trigger_count}`,
      ];
      if (data.ignored_lighting === true) {
        parts.push(t("settings.localCam.motion_lighting"));
      }
      diag.textContent = parts.join(" | ");
    }
  } catch (err) {
    if (diag) {
      diag.hidden = false;
      diag.classList.add("error");
      diag.textContent = t("settings.localCam.motion_diag_failed", { error: err.message });
    }
  }
}

function collectDisplayPayload() {
  const num = (input, min, max) => {
    if (!input) return undefined;
    const n = Math.round(clamp(Number(input.value) || 0, min, max));
    return Number.isFinite(n) ? n : undefined;
  };

  const display = {};
  const brightness = num(el.settingsBrightness, 1, 100);
  if (brightness !== undefined) display.brightness = brightness;
  const saverTimeout = num(el.settingsScreensaverTimeout, 5, 7200);
  if (saverTimeout !== undefined) display.screensaver_timeout_sec = saverTimeout;
  const saverBrightness = num(el.settingsSaverBrightness, 1, 60);
  if (saverBrightness !== undefined) display.saver_brightness = saverBrightness;
  const saverWallpaperDim = num(el.settingsSaverWallpaperDim, 0, 90);
  if (saverWallpaperDim !== undefined) display.saver_wallpaper_dim = saverWallpaperDim;
  const offTimeout = num(el.settingsScreenOffTimeout, 5, 7200);
  if (offTimeout !== undefined) display.screen_off_timeout_sec = offTimeout;
  if (el.settingsScreensaverEnabled) display.screensaver_enabled = el.settingsScreensaverEnabled.checked;
  if (el.settingsScreenOffEnabled) display.screen_off_enabled = el.settingsScreenOffEnabled.checked;
  if (el.settingsClockFormat) display.clock_24h = el.settingsClockFormat.value !== "h12";
  if (el.settingsClockStyle) display.saver_clock_style = el.settingsClockStyle.value === "flip" ? 1 : 0;
  if (el.settingsShowSeconds) display.saver_show_seconds = el.settingsShowSeconds.checked;
  if (el.settingsShowDate) display.saver_show_date = el.settingsShowDate.checked;
  if (el.settingsClockColor) display.saver_clock_color = hexToRgbInt(el.settingsClockColor.value);
  if (el.settingsDateColor) display.saver_date_color = hexToRgbInt(el.settingsDateColor.value);
  if (el.settingsNightModeEnabled) display.night_mode_enabled = el.settingsNightModeEnabled.checked;
  if (el.settingsNightStart) {
    display.night_start_min = timeStringToMinutes(el.settingsNightStart.value, 22 * 60);
  }
  if (el.settingsNightEnd) {
    display.night_end_min = timeStringToMinutes(el.settingsNightEnd.value, 7 * 60);
  }
  const nightBrightness = num(el.settingsNightBrightness, 0, 100);
  if (nightBrightness !== undefined) display.night_brightness = nightBrightness;
  const nightWake = num(el.settingsNightWakeSec, 0, 3600);
  if (nightWake !== undefined) display.night_wake_sec = nightWake;
  if (el.settingsThemeAutoEnabled) display.theme_auto_enabled = el.settingsThemeAutoEnabled.checked;
  if (el.settingsThemeDaySelect) display.theme_day_id = el.settingsThemeDaySelect.value || "";
  if (el.settingsThemeNightSelect) display.theme_night_id = el.settingsThemeNightSelect.value || "";
  if (el.settingsPageTransition && PAGE_TRANSITION_MODES.indexOf(el.settingsPageTransition.value) >= 0) {
    display.page_transition = el.settingsPageTransition.value;
  }
  const transitionMs = num(el.settingsPageTransitionMs, 0, 1200);
  if (transitionMs !== undefined) display.page_transition_ms = transitionMs;
  if (el.settingsTilePressFx && TILE_PRESS_FX_MODES.indexOf(el.settingsTilePressFx.value) >= 0) {
    display.tile_press_fx = el.settingsTilePressFx.value;
  }
  const pressFxDim = num(el.settingsTilePressFxDim, 0, 60);
  if (pressFxDim !== undefined) display.tile_press_fx_dim = pressFxDim;
  const pressFxScale = num(el.settingsTilePressFxScale, 90, 100);
  if (pressFxScale !== undefined) display.tile_press_fx_scale = pressFxScale;
  if (el.settingsValueAnim && VALUE_ANIM_MODES.indexOf(el.settingsValueAnim.value) >= 0) {
    display.value_anim = el.settingsValueAnim.value;
  }
  const valueAnimMs = num(el.settingsValueAnimMs, 0, 1500);
  if (valueAnimMs !== undefined) display.value_anim_ms = valueAnimMs;
  if (el.settingsTopbarShowClock) display.topbar_show_clock = el.settingsTopbarShowClock.checked;
  if (el.settingsTopbarShowDate) display.topbar_show_date = el.settingsTopbarShowDate.checked;
  if (el.settingsTopbarShowGear) display.topbar_show_gear = el.settingsTopbarShowGear.checked;
  if (el.settingsTopbarShowStatus) display.topbar_show_status = el.settingsTopbarShowStatus.checked;
  if (el.settingsTopbarIconText) display.topbar_icon_text = el.settingsTopbarIconText.checked;
  if (el.settingsTopbarCustomColors) display.topbar_custom_colors = el.settingsTopbarCustomColors.checked;
  if (el.settingsTopbarBgColor) display.topbar_bg_color = hexToRgbInt(el.settingsTopbarBgColor.value);
  if (el.settingsTopbarClockColor) display.topbar_clock_color = hexToRgbInt(el.settingsTopbarClockColor.value);
  if (el.settingsTopbarDateColor) display.topbar_date_color = hexToRgbInt(el.settingsTopbarDateColor.value);
  if (el.settingsTopbarGearColor) display.topbar_gear_color = hexToRgbInt(el.settingsTopbarGearColor.value);
  if (el.settingsTopbarHaColor) display.topbar_ha_color = hexToRgbInt(el.settingsTopbarHaColor.value);
  if (el.settingsTopbarWifiColor) display.topbar_wifi_color = hexToRgbInt(el.settingsTopbarWifiColor.value);
  if (el.settingsNavCustomColors) display.nav_custom_colors = el.settingsNavCustomColors.checked;
  if (el.settingsNavBarBgColor) display.nav_bar_bg_color = hexToRgbInt(el.settingsNavBarBgColor.value);
  if (el.settingsNavBarBorderColor) display.nav_bar_border_color = hexToRgbInt(el.settingsNavBarBorderColor.value);
  if (el.settingsNavButtonBgColor) display.nav_button_bg_color = hexToRgbInt(el.settingsNavButtonBgColor.value);
  if (el.settingsNavButtonBorderColor) display.nav_button_border_color = hexToRgbInt(el.settingsNavButtonBorderColor.value);
  if (el.settingsNavTabIdleColor) display.nav_tab_idle_color = hexToRgbInt(el.settingsNavTabIdleColor.value);
  if (el.settingsNavTabActiveColor) display.nav_tab_active_color = hexToRgbInt(el.settingsNavTabActiveColor.value);
  if (el.settingsNavHomeIdleColor) display.nav_home_idle_color = hexToRgbInt(el.settingsNavHomeIdleColor.value);
  if (el.settingsNavHomeActiveColor) display.nav_home_active_color = hexToRgbInt(el.settingsNavHomeActiveColor.value);
  return display;
}

async function applyDisplaySettings(statusEl, appliedKey = "settings.display.applied") {
  const display = collectDisplayPayload();
  if (!Object.keys(display).length) return;
  const info = statusEl || el.settingsDisplayInfo;
  if (info) {
    info.textContent = t("status.saving_settings");
    info.classList.remove("error");
  }
  await putSettings({ display, reboot: false });
  await loadSettings(true);
  if (info) {
    info.textContent = t(appliedKey);
    info.classList.remove("error");
  }
}

const SD_MAX_UPLOAD_BYTES = 512 * 1024;

function setSdInfo(text, isError = false) {
  if (!el.settingsSdInfo) return;
  el.settingsSdInfo.textContent = text;
  el.settingsSdInfo.classList.toggle("error", isError);
}

function formatMib(bytes) {
  const value = Number(bytes) || 0;
  if (value <= 0) return "0";
  return String(Math.round((value / (1024 * 1024)) * 10) / 10);
}

function setSdStatus(text, isError = false) {
  if (!el.settingsSdStatus) return;
  el.settingsSdStatus.textContent = text;
  el.settingsSdStatus.classList.toggle("error", isError);
}

function formatKib(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round((value / 1024) * 10) / 10} kB`;
  return `${Math.round((value / (1024 * 1024)) * 10) / 10} MB`;
}

/* The panel answers a failed microSD request with a short code ("no_card",
 * "no_filesystem", "off", "unsupported") instead of a bare HTTP status, so the
 * user learns what to do next. */
function sdErrorMessage(message, fallbackKey) {
  const code = String(message || "").trim();
  if (code && !/^\d{3}\b/.test(code)) {
    const key = `settings.sd.${code}`;
    const text = t(key);
    return text === key ? code : text;
  }
  return t(fallbackKey);
}

function renderSdSettings() {
  const state = editor.sd.state || {};
  const supported = state.supported === true;
  const enabled = state.enabled === true;
  const mounted = state.mounted === true;
  const detected = state.detected === true;
  if (el.settingsSdEnabled) {
    el.settingsSdEnabled.checked = enabled;
    el.settingsSdEnabled.disabled = !supported || editor.sd.busy;
  }
  for (const button of [el.sdRefreshBtn, el.sdExportLogsBtn, el.sdFormatBtn, el.sdLogsBtn, el.sdPhotosBtn]) {
    if (button) button.disabled = editor.sd.busy;
  }
  /* Formatting is exactly what an unmounted card needs - a card without a FAT
   * filesystem cannot be mounted before it is formatted. */
  if (el.sdFormatBtn) el.sdFormatBtn.disabled = !supported || !enabled || editor.sd.busy;
  if (el.sdExportLogsBtn) el.sdExportLogsBtn.disabled = !mounted || editor.sd.busy;
  if (el.sdUpBtn) el.sdUpBtn.disabled = !mounted || editor.sd.busy || editor.sd.dir.length === 0;
  if (el.sdRootBtn) el.sdRootBtn.disabled = !mounted || editor.sd.busy;
  if (el.sdLogsBtn) el.sdLogsBtn.disabled = !mounted || editor.sd.busy;
  if (el.sdPhotosBtn) el.sdPhotosBtn.disabled = !mounted || editor.sd.busy;
  const vars = { name: state.card_name || "SD" };
  /* The panel sends a machine-readable state; older builds only send the flags,
   * so fall back to deriving it here. */
  let stateCode = typeof state.state === "string" ? state.state : "";
  if (!stateCode) {
    stateCode = !supported ? "unsupported" : !enabled ? "off" : mounted ? "ok" : detected ? "no_filesystem" : "no_card";
  }
  if (stateCode === "unsupported") {
    setSdStatus(t("settings.sd.unsupported"), true);
  } else if (stateCode === "off") {
    setSdStatus(t("settings.sd.disabled"));
  } else if (stateCode === "ok") {
    setSdStatus(
      t("settings.sd.mounted", {
        name: vars.name,
        total: formatMib(state.capacity_bytes),
        free: formatMib(state.free_bytes),
      }),
    );
  } else if (stateCode === "no_filesystem" || stateCode === "exfat" || stateCode === "ntfs") {
    setSdStatus(t(`settings.sd.${stateCode}`, vars), true);
  } else {
    setSdStatus(t("settings.sd.no_card"), true);
  }

  /* Where the screensaver picture lives right now.  The panel reports the store
   * itself; older builds do not send it, in which case the line stays hidden. */
  if (el.sdWallpaperStore) {
    const store = state.wallpaper_store;
    if (store === "sd" || store === "flash" || store === "none") {
      el.sdWallpaperStore.textContent = t(`settings.sd.wallpaper_${store}`);
      el.sdWallpaperStore.style.display = "";
    } else {
      el.sdWallpaperStore.textContent = "";
      el.sdWallpaperStore.style.display = "none";
    }
  }
}

function sdDirJoin(base, name) {
  return base ? `${base}/${name}` : name;
}

function sdDirParent(dir) {
  const index = dir.lastIndexOf("/");
  return index < 0 ? "" : dir.slice(0, index);
}

function renderSdFiles() {
  if (el.sdPath) el.sdPath.textContent = `/${editor.sd.dir}`;
  if (!el.sdFileList) return;
  el.sdFileList.textContent = "";
  const entries = editor.sd.entries || [];
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "meta";
    empty.textContent = t("settings.sd.empty");
    el.sdFileList.appendChild(empty);
    return;
  }
  for (const entry of entries) {
    const row = document.createElement("div");
    row.className = "sd-file-row";
    const full = sdDirJoin(editor.sd.dir, entry.name);
    const isDir = entry.dir === true;
    const icon = document.createElement("span");
    icon.className = "sd-file-icon";
    icon.textContent = isDir ? "📁" : "📄";
    row.appendChild(icon);
    const label = document.createElement("button");
    label.type = "button";
    label.className = "sd-file-name";
    label.textContent = entry.name;
    if (isDir) {
      label.onclick = () => {
        void loadSdFiles(full);
      };
    } else {
      label.onclick = () => {
        window.open(`/api/sd/file?path=${encodeURIComponent(full)}`, "_blank");
      };
    }
    row.appendChild(label);
    const size = document.createElement("span");
    size.className = "meta sd-file-size";
    size.textContent = isDir ? t("settings.sd.type_dir") : formatKib(entry.size);
    row.appendChild(size);
    if (!isDir && isWallpaperCandidate(entry.name)) {
      const wallpaper = document.createElement("button");
      wallpaper.type = "button";
      wallpaper.className = "btn small";
      wallpaper.textContent = t("settings.sd.use_wallpaper");
      wallpaper.onclick = () => {
        void setWallpaperFromSdFile(full);
      };
      row.appendChild(wallpaper);
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn small danger";
    remove.textContent = t("settings.sd.delete");
    remove.onclick = () => {
      void deleteSdEntry(full, entry.name);
    };
    row.appendChild(remove);
    el.sdFileList.appendChild(row);
  }
}

function isWallpaperCandidate(name) {
  const lower = String(name || "").toLowerCase();
  return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".bmp");
}

async function sdApiRequest(path, method, body) {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_) {
      payload = null;
    }
  }
  if (!response.ok) {
    throw new Error(payload?.error || `${response.status} ${response.statusText}`);
  }
  return payload;
}

async function loadSdState(silent = true) {
  try {
    const state = await apiGet("/api/sd");
    editor.sd.state = state;
    renderSdSettings();
    if (state?.mounted === true) {
      await loadSdFiles(editor.sd.dir, true);
    } else {
      editor.sd.entries = [];
      renderSdFiles();
    }
    return state;
  } catch (err) {
    if (!silent) {
      setSdInfo(String(err?.message || err), true);
    }
    return null;
  }
}

async function loadSdFiles(dir, silent = false) {
  if (editor.sd.busy) return;
  editor.sd.busy = true;
  renderSdSettings();
  if (!silent) setSdInfo(t("settings.sd.loading"));
  try {
    const payload = await apiGet(`/api/sd/files?dir=${encodeURIComponent(dir || "")}`);
    editor.sd.dir = typeof payload?.dir === "string" ? payload.dir : dir || "";
    editor.sd.entries = Array.isArray(payload?.entries) ? payload.entries : [];
    renderSdFiles();
    renderSdSettings();
    if (!silent) setSdInfo("");
  } catch (err) {
    setSdInfo(String(err?.message || err), true);
  } finally {
    editor.sd.busy = false;
    renderSdSettings();
  }
}

async function setSdEnabled(enabled) {
  if (editor.sd.busy) return;
  editor.sd.busy = true;
  renderSdSettings();
  try {
    const state = await sdApiRequest("/api/sd", "PUT", { enabled: enabled === true });
    editor.sd.state = state;
    renderSdSettings();
    if (state?.mounted === true) {
      await loadSdFiles(editor.sd.dir, true);
    } else {
      editor.sd.entries = [];
      renderSdFiles();
    }
    setSdInfo(t(state?.enabled === true ? "settings.sd.status_enabled" : "settings.sd.status_disabled"));
  } catch (err) {
    setSdInfo(sdErrorMessage(err?.message, "settings.sd.apply_failed"), true);
    await loadSdState(true);
  } finally {
    editor.sd.busy = false;
    renderSdSettings();
  }
}

async function formatSdCard() {
  if (editor.sd.busy) return;
  if (!window.confirm(t("settings.sd.format_confirm"))) return;
  editor.sd.busy = true;
  renderSdSettings();
  setSdInfo(t("settings.sd.formatting"));
  try {
    await sdApiRequest("/api/sd/format", "POST");
    editor.sd.dir = "";
    editor.sd.entries = [];
    setSdInfo(t("settings.sd.formatted"));
  } catch (err) {
    setSdInfo(sdErrorMessage(err?.message, "settings.sd.format_failed"), true);
  } finally {
    editor.sd.busy = false;
    renderSdSettings();
    await loadSdState(true);
  }
}

async function exportSdLogs() {
  if (editor.sd.busy) return;
  editor.sd.busy = true;
  renderSdSettings();
  setSdInfo(t("settings.sd.exporting"));
  try {
    const payload = await sdApiRequest("/api/sd/logs/export", "POST");
    setSdInfo(t("settings.sd.exported", { path: `/sd/${payload?.dir || "logs"}/${payload?.file || ""}` }));
  } catch (err) {
    setSdInfo(sdErrorMessage(err?.message, "settings.sd.export_failed"), true);
  } finally {
    editor.sd.busy = false;
    renderSdSettings();
    if (editor.sd.dir === "logs") {
      await loadSdFiles("logs", true);
    }
  }
}

async function deleteSdEntry(path, name) {
  if (editor.sd.busy) return;
  if (!window.confirm(t("settings.sd.delete_confirm", { name }))) return;
  editor.sd.busy = true;
  renderSdSettings();
  try {
    await sdApiRequest(`/api/sd/file?path=${encodeURIComponent(path)}`, "DELETE");
    setSdInfo(t("settings.sd.deleted"));
  } catch (err) {
    setSdInfo(sdErrorMessage(err?.message, "settings.sd.delete_failed"), true);
  } finally {
    editor.sd.busy = false;
    renderSdSettings();
    await loadSdFiles(editor.sd.dir, true);
  }
}

async function setWallpaperFromSdFile(path) {
  try {
    const response = await fetch(`/api/sd/file?path=${encodeURIComponent(path)}`);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const blob = await response.blob();
    const frame = await imageFileToRgb565(blob, Number(editor.appScreenW) || 480, Number(editor.appScreenH) || 480);
    if (!frame) throw new Error(t("settings.sd.wallpaper_failed"));
    const upload = await fetch("/api/display/wallpaper", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: frame,
    });
    if (!upload.ok) throw new Error(`${upload.status} ${upload.statusText}`);
    setSdInfo(t("settings.sd.wallpaper_ok"));
  } catch (err) {
    setSdInfo(String(err?.message || err) || t("settings.sd.wallpaper_failed"), true);
  }
}

function bindSdSettings() {
  if (el.settingsSdEnabled) {
    el.settingsSdEnabled.onchange = () => {
      void setSdEnabled(el.settingsSdEnabled.checked === true);
    };
  }
  if (el.sdRefreshBtn) {
    el.sdRefreshBtn.onclick = () => {
      void loadSdState(false).then(() => {
        if (editor.sd.state?.mounted === true) void loadSdFiles(editor.sd.dir, false);
      });
    };
  }
  if (el.sdExportLogsBtn) {
    el.sdExportLogsBtn.onclick = () => {
      void exportSdLogs();
    };
  }
  if (el.sdFormatBtn) {
    el.sdFormatBtn.onclick = () => {
      void formatSdCard();
    };
  }
  if (el.sdUpBtn) {
    el.sdUpBtn.onclick = () => {
      void loadSdFiles(sdDirParent(editor.sd.dir));
    };
  }
  if (el.sdRootBtn) {
    el.sdRootBtn.onclick = () => {
      void loadSdFiles("");
    };
  }
  if (el.sdLogsBtn) {
    el.sdLogsBtn.onclick = () => {
      void loadSdFiles("logs");
    };
  }
  if (el.sdPhotosBtn) {
    el.sdPhotosBtn.onclick = () => {
      void loadSdFiles("photos");
    };
  }
}

const PAGE_TRANSITION_MODES = ["none", "fade", "slide", "slide_up", "fade_slide"];
const TILE_PRESS_FX_MODES = ["none", "dim", "scale", "both"];

function pressFxIntOrFallback(input, min, max, fallback) {
  if (!input || String(input.value).trim() === "") return fallback;
  return clampInt(input.value, min, max, fallback);
}

/* Mirrors the on-panel effect in the sample tile so the numbers can be judged
 * without flashing the firmware. */
function updatePressFxCss() {
  const host = el.settingsTilePressFxPreviewTile;
  if (!host) return;
  const mode =
    el.settingsTilePressFx && TILE_PRESS_FX_MODES.indexOf(el.settingsTilePressFx.value) >= 0
      ? el.settingsTilePressFx.value
      : "both";
  const dim = pressFxIntOrFallback(el.settingsTilePressFxDim, 0, 60, 15);
  const scale = pressFxIntOrFallback(el.settingsTilePressFxScale, 90, 100, 97);
  const useDim = (mode === "dim" || mode === "both") && dim > 0;
  const useScale = (mode === "scale" || mode === "both") && scale < 100;
  host.style.setProperty("--press-fx-opa", useDim ? String(Math.max(0, 100 - dim) / 100) : "1");
  host.style.setProperty("--press-fx-scale", useScale ? String(scale / 100) : "1");
  if (!useDim && !useScale) host.classList.remove("is-pressed");
}

function bindPressFxPreview() {
  const host = el.settingsTilePressFxPreviewTile;
  if (!host || host.dataset.pressFxBound === "1") return;
  host.dataset.pressFxBound = "1";
  const press = () => host.classList.add("is-pressed");
  const release = () => host.classList.remove("is-pressed");
  host.addEventListener("pointerdown", press);
  host.addEventListener("pointerup", release);
  host.addEventListener("pointerleave", release);
  host.addEventListener("pointercancel", release);
  for (const input of [el.settingsTilePressFx, el.settingsTilePressFxDim, el.settingsTilePressFxScale]) {
    if (!input) continue;
    input.addEventListener("input", updatePressFxCss);
    input.addEventListener("change", updatePressFxCss);
  }
  updatePressFxCss();
}

const VALUE_ANIM_MODES = ["none", "fade", "slide", "count"];
/* Two sample readings the preview counts between. */
const VALUE_ANIM_PREVIEW_VALUES = [21.4, 23.8];
const VALUE_ANIM_PREVIEW_SUFFIX = " °C";
let valueAnimPreviewIndex = 0;

function valueAnimModeFromControls() {
  const mode = el.settingsValueAnim ? el.settingsValueAnim.value : "count";
  return VALUE_ANIM_MODES.indexOf(mode) >= 0 ? mode : "count";
}

function valueAnimMsFromControls() {
  return pressFxIntOrFallback(el.settingsValueAnimMs, 0, 1500, 320);
}

function valueAnimPreviewText(value) {
  return `${value.toFixed(1)}${VALUE_ANIM_PREVIEW_SUFFIX}`;
}

function updateValueAnimCss() {
  const host = el.settingsValueAnimPreview;
  if (!host) return;
  host.style.setProperty("--value-anim-ms", `${Math.max(1, valueAnimMsFromControls())}ms`);
}

/* Replays the selected effect on a sample value so the mode and the duration
 * can be judged without waiting for a sensor to change. */
function playValueAnimPreview() {
  const host = el.settingsValueAnimPreview;
  if (!host) return;

  const mode = valueAnimModeFromControls();
  const duration = valueAnimMsFromControls();
  const from = VALUE_ANIM_PREVIEW_VALUES[valueAnimPreviewIndex];
  const to = VALUE_ANIM_PREVIEW_VALUES[1 - valueAnimPreviewIndex];
  valueAnimPreviewIndex = 1 - valueAnimPreviewIndex;

  if (host.dataset.animRaf) {
    cancelAnimationFrame(Number(host.dataset.animRaf));
    host.dataset.animRaf = "";
  }
  host.classList.remove("is-fading", "is-sliding");

  if (mode === "none" || duration === 0) {
    host.textContent = valueAnimPreviewText(to);
    return;
  }

  if (mode === "count") {
    const started = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      host.textContent = valueAnimPreviewText(from + (to - from) * eased);
      if (progress < 1) {
        host.dataset.animRaf = String(requestAnimationFrame(step));
      } else {
        host.dataset.animRaf = "";
        host.textContent = valueAnimPreviewText(to);
      }
    };
    host.dataset.animRaf = String(requestAnimationFrame(step));
    return;
  }

  // Restart the CSS animation even when the same class is already applied.
  void host.offsetWidth;
  host.textContent = valueAnimPreviewText(to);
  host.classList.add(mode === "slide" ? "is-sliding" : "is-fading");
}

function bindValueAnimPreview() {
  const host = el.settingsValueAnimPreview;
  if (!host || host.dataset.valueAnimBound === "1") return;
  host.dataset.valueAnimBound = "1";
  host.textContent = valueAnimPreviewText(VALUE_ANIM_PREVIEW_VALUES[0]);
  if (el.settingsValueAnimPreviewBtn) {
    el.settingsValueAnimPreviewBtn.addEventListener("click", playValueAnimPreview);
  }
  for (const input of [el.settingsValueAnim, el.settingsValueAnimMs]) {
    if (!input) continue;
    input.addEventListener("change", () => {
      updateValueAnimCss();
      playValueAnimPreview();
    });
  }
  updateValueAnimCss();
}

/* Colour pickers for the top bar. They stay on screen even while the theme owns
 * the colours - only dimmed - so the options can be found without having to tick
 * "Own colours" first. */
const TOPBAR_COLOR_INPUTS = [
  "settingsTopbarBg",
  "settingsTopbarClockColor",
  "settingsTopbarDateColor",
  "settingsTopbarGearColor",
  "settingsTopbarHaColor",
  "settingsTopbarWifiColor",
];

function topbarCustomColorsOn() {
  return Boolean(el.settingsTopbarCustomColors && el.settingsTopbarCustomColors.checked);
}

function updateTopbarCss() {
  const on = topbarCustomColorsOn();
  if (el.settingsTopbarColors) {
    el.settingsTopbarColors.classList.remove("hidden");
    el.settingsTopbarColors.classList.toggle("grid-dimmed", !on);
  }
}

/* Same treatment for the bottom bar. */
const NAV_COLOR_INPUTS = [
  "settingsNavBarBgColor",
  "settingsNavBarBorderColor",
  "settingsNavButtonBgColor",
  "settingsNavButtonBorderColor",
  "settingsNavTabIdleColor",
  "settingsNavTabActiveColor",
  "settingsNavHomeIdleColor",
  "settingsNavHomeActiveColor",
];

function navCustomColorsOn() {
  return Boolean(el.settingsNavCustomColors && el.settingsNavCustomColors.checked);
}

function updateNavCss() {
  if (el.settingsNavColors) {
    el.settingsNavColors.classList.remove("hidden");
    el.settingsNavColors.classList.toggle("grid-dimmed", !navCustomColorsOn());
  }
}

function bindNav() {
  if (el.settingsNavCustomColors) {
    el.settingsNavCustomColors.addEventListener("change", updateNavCss);
  }
  for (const key of NAV_COLOR_INPUTS) {
    const input = el[key];
    if (!input || input.dataset.navBound === "1") continue;
    input.dataset.navBound = "1";
    // Picking a colour implies the user wants the bottom bar to own its palette.
    input.addEventListener("change", () => {
      if (el.settingsNavCustomColors) el.settingsNavCustomColors.checked = true;
      updateNavCss();
    });
  }
  updateNavCss();
}

function bindTopbar() {
  if (el.settingsTopbarCustomColors) {
    el.settingsTopbarCustomColors.addEventListener("change", updateTopbarCss);
  }
  for (const key of TOPBAR_COLOR_INPUTS) {
    const input = el[key];
    if (!input || input.dataset.topbarBound === "1") continue;
    input.dataset.topbarBound = "1";
    // Picking a colour implies the user wants the top bar to own its palette.
    input.addEventListener("change", () => {
      if (el.settingsTopbarCustomColors) el.settingsTopbarCustomColors.checked = true;
      updateTopbarCss();
    });
  }
  updateTopbarCss();
}

function renderPanelPages(pages) {
  if (!el.settingsPageTarget) return;
  const previous = el.settingsPageTarget.value;
  el.settingsPageTarget.innerHTML = "";
  for (const page of pages) {
    if (!page || typeof page.id !== "string" || !page.id.length) continue;
    const option = document.createElement("option");
    option.value = page.id;
    option.textContent = page.title ? `${page.title} (${page.id})` : page.id;
    el.settingsPageTarget.appendChild(option);
  }
  const target = pages.some((page) => page && page.id === previous && page.active !== true)
    ? previous
    : pages.find((page) => page && typeof page.id === "string" && !page.active)?.id;
  if (target) {
    el.settingsPageTarget.value = target;
  }
}

/* The page list is owned by the firmware; the editor only mirrors it. */
async function loadPanelPages(showStatus) {
  if (!el.settingsPageTarget) return;
  if (showStatus && el.settingsPageActivateInfo) {
    el.settingsPageActivateInfo.textContent = t("status.loading_settings");
    el.settingsPageActivateInfo.classList.remove("error");
  }
  try {
    const data = await apiGet("/api/pages");
    const pages = Array.isArray(data.pages) ? data.pages : [];
    renderPanelPages(pages);
    if (el.settingsPageActivateInfo) {
      const active = pages.find((page) => page && page.active === true);
      el.settingsPageActivateInfo.textContent = t("settings.pages.current", {
        page: active ? active.title || active.id : "-",
      });
      el.settingsPageActivateInfo.classList.remove("error");
    }
  } catch (err) {
    if (el.settingsPageActivateInfo) {
      el.settingsPageActivateInfo.textContent = String(err?.message || err);
      el.settingsPageActivateInfo.classList.add("error");
    }
  }
}

async function activatePanelPage(pageId) {
  const response = await fetch("/api/pages/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: pageId }),
  });
  if (!response.ok) {
    let detail = await response.text();
    try {
      const json = JSON.parse(detail);
      detail = json.error || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return response.json();
}

/* A camera entry must look like one; older firmware exposed the list inside an
 * envelope ({"value":[…],"Count":n}) and such an object must never be edited and
 * written back as if it were a camera. */
function cameraEntryList(value) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    if (value.length === 1 && value[0] && !Array.isArray(value[0]) && typeof value[0] === "object") {
      const inner = cameraEntryList(value[0]);
      if (inner) return inner;
    }
    return value;
  }
  for (const key of ["value", "cameras", "items", "entries", "list"]) {
    if (Array.isArray(value[key])) return value[key];
  }
  return null;
}

function isCameraEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (typeof value.snapshot_url === "string" && value.snapshot_url.length > 0) return true;
  return typeof value.entity_id === "string" && /^camera\./.test(value.entity_id);
}

function normalizeCamerasPayload(data) {
  const list = cameraEntryList(data);
  if (!Array.isArray(list)) return [];
  return list.filter(isCameraEntry);
}

async function loadCameras() {
  if (!el.camerasList) return;
  try {
    const data = await apiGet("/api/cameras");
    editor.cameras.list = normalizeCamerasPayload(data);
    editor.cameras.loaded = true;
    if (editor.cameras.selectedIndex < 0 && editor.cameras.list.length > 0) {
      editor.cameras.selectedIndex = 0;
    }
    if (editor.cameras.selectedIndex >= editor.cameras.list.length) {
      editor.cameras.selectedIndex = editor.cameras.list.length > 0 ? 0 : -1;
    }
    renderCamerasList();
    showCamerasEditor(editor.cameras.selectedIndex >= 0);
    if (editor.cameras.selectedIndex >= 0) {
      fillCamerasForm(editor.cameras.list[editor.cameras.selectedIndex]);
    }
    setCamerasInfo("");
  } catch (err) {
    setCamerasInfo(t("settings.cameras.load_failed", { error: err.message }), true);
  }
}

function setCamerasInfo(text, isError = false) {
  if (!el.camerasInfo) return;
  el.camerasInfo.textContent = text || "";
  el.camerasInfo.classList.toggle("error", Boolean(isError));
}

function cameraSourceValue() {
  return el.camerasSource?.value === "ha" ? "ha" : "http";
}

function applyCamerasEntityOptions(items, selectedId) {
  if (!el.camerasEntity) return;
  const current = selectedId || el.camerasEntity.value || "";
  el.camerasEntity.innerHTML = "";
  if (!Array.isArray(items) || items.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("settings.cameras.entity_hint");
    el.camerasEntity.appendChild(option);
  } else {
    setEntityOptionsList(el.camerasEntity, items);
  }
  if (current && Array.from(el.camerasEntity.options).some((o) => o.value === current)) {
    el.camerasEntity.value = current;
  }
  if (el.camerasEntityHint) {
    const empty = !Array.isArray(items) || items.length === 0;
    el.camerasEntityHint.textContent = empty ? t("settings.cameras.entity_hint") : "";
  }
}

async function fetchCamerasEntityOptions(selectedId = "") {
  if (!el.camerasEntity) return;
  const requestSeq = ++editor.cameras.entityRequestSeq;
  const current = selectedId || el.camerasEntity.value || "";
  let pollCount = 0;
  while (pollCount < CAMERA_ENTITY_DISCOVERY_MAX_POLLS) {
    const params = new URLSearchParams();
    params.set("domain", "camera");
    if (pollCount === 0) params.set("refresh", "1");
    let data = null;
    try {
      data = await apiGet(`/api/ha/light_entities?${params.toString()}`);
    } catch (_) {
      data = null;
    }
    if (requestSeq !== editor.cameras.entityRequestSeq) return;
    if (data && data.pending !== true) {
      applyCamerasEntityOptions(Array.isArray(data.items) ? data.items : [], current);
      return;
    }
    pollCount += 1;
    await new Promise((resolve) => {
      window.setTimeout(resolve, CAMERA_ENTITY_DISCOVERY_POLL_MS);
    });
    if (requestSeq !== editor.cameras.entityRequestSeq) return;
  }
  applyCamerasEntityOptions([], current);
}

function populateCamerasEntityOptions(selectedId = "") {
  if (!el.camerasEntity) return;
  const current = selectedId || el.camerasEntity.value || "";
  const local = listEntitiesByDomain("camera");
  if (local.length > 0) {
    applyCamerasEntityOptions(local, current);
  } else {
    el.camerasEntity.innerHTML = "";
    const option = document.createElement("option");
    option.value = current;
    option.textContent = t("settings.cameras.entity_loading");
    el.camerasEntity.appendChild(option);
    if (el.camerasEntityHint) el.camerasEntityHint.textContent = "";
  }
  if (editor.cameras.entityTimerId !== null) {
    window.clearTimeout(editor.cameras.entityTimerId);
    editor.cameras.entityTimerId = null;
  }
  editor.cameras.entityTimerId = window.setTimeout(() => {
    editor.cameras.entityTimerId = null;
    void fetchCamerasEntityOptions(current);
  }, 0);
}

function updateCamerasFieldsVisibility() {
  const isHa = cameraSourceValue() === "ha";
  if (el.camerasHaFields) el.camerasHaFields.classList.toggle("hidden", !isHa);
  if (el.camerasHttpFields) el.camerasHttpFields.classList.toggle("hidden", isHa);
}

function renderCamerasList() {
  if (!el.camerasList) return;
  el.camerasList.innerHTML = "";
  const list = editor.cameras.list || [];
  if (list.length === 0) {
    const hint = document.createElement("div");
    hint.className = "meta";
    hint.textContent = t("settings.cameras.none");
    el.camerasList.appendChild(hint);
    return;
  }
  list.forEach((cam, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cameras-list-item";
    button.dataset.cameraIndex = String(index);
    if (index === editor.cameras.selectedIndex) {
      button.classList.add("active");
    }

    const head = document.createElement("span");
    head.className = "cameras-item-head";

    const name = document.createElement("span");
    name.className = "cameras-item-name";
    name.textContent = cam.name || `Kamera ${index + 1}`;

    const badge = document.createElement("span");
    badge.className = `cameras-item-badge ${cam.source === "ha" ? "badge-ha" : "badge-http"}`;
    badge.textContent = cam.source === "ha" ? "HA" : "HTTP";

    head.appendChild(name);
    head.appendChild(badge);
    button.appendChild(head);

    const detail = document.createElement("span");
    detail.className = "cameras-item-detail";
    detail.textContent = cam.source === "ha" ? (cam.entity_id || "") : (cam.snapshot_url || "");
    if (detail.textContent) {
      button.appendChild(detail);
    }

    const meta = document.createElement("span");
    meta.className = "cameras-item-meta";
    const refresh = Number(cam.refresh_ms);
    const refreshText = Number.isFinite(refresh) && refresh > 0
      ? t("settings.cameras.item_refresh", { ms: String(refresh) })
      : "";
    const stateText = cam.enabled === false
      ? t("settings.cameras.disabled")
      : t("settings.cameras.enabled");
    meta.textContent = [refreshText, stateText].filter(Boolean).join(" · ");
    button.appendChild(meta);

    button.addEventListener("click", () => {
      editor.cameras.selectedIndex = index;
      fillCamerasForm(cam);
      showCamerasEditor(true);
      renderCamerasList();
    });
    el.camerasList.appendChild(button);
  });
}

function showCamerasEditor(show) {
  if (!el.camerasEditor) return;
  el.camerasEditor.classList.toggle("hidden", !show);
}

function fillCamerasForm(cam) {
  if (!cam) return;
  if (el.camerasName) el.camerasName.value = cam.name || "";
  const source = cam.source === "ha" ? "ha" : "http";
  if (el.camerasSource) el.camerasSource.value = source;
  if (el.camerasUrl) el.camerasUrl.value = cam.snapshot_url || "";
  if (el.camerasUser) el.camerasUser.value = cam.username || "";
  if (el.camerasPass) el.camerasPass.value = cam.password || "";
  populateCamerasEntityOptions(cam.entity_id || "");
  if (el.camerasEntity) el.camerasEntity.value = cam.entity_id || "";
  const refresh = Number(cam.refresh_ms);
  if (el.camerasRefresh) el.camerasRefresh.value = Number.isFinite(refresh) && refresh > 0 ? String(refresh) : "2000";
  if (el.camerasEnabled) el.camerasEnabled.checked = cam.enabled !== false;
  updateCamerasFieldsVisibility();
}

function camerasFromForm() {
  const name = (el.camerasName?.value || "").trim();
  const source = cameraSourceValue();
  const snapshotUrl = (el.camerasUrl?.value || "").trim();
  const entityId = (el.camerasEntity?.value || "").trim();
  const username = (el.camerasUser?.value || "").trim();
  const password = el.camerasPass?.value || "";
  let refresh = Number(el.camerasRefresh?.value);
  if (!Number.isFinite(refresh) || refresh < 1000) refresh = 2000;
  if (refresh > 60000) refresh = 60000;
  const enabled = el.camerasEnabled ? el.camerasEnabled.checked : true;

  if (source === "ha") {
    if (!/^camera\./.test(entityId)) {
      throw new Error(t("settings.cameras.invalid_entity"));
    }
  } else if (!/^https?:\/\//i.test(snapshotUrl)) {
    throw new Error(t("settings.cameras.invalid_url"));
  }

  return {
    id: "",
    name,
    source,
    entity_id: source === "ha" ? entityId : "",
    snapshot_url: source === "ha" ? "" : snapshotUrl,
    username: source === "ha" ? "" : username,
    password: source === "ha" ? "" : password,
    refresh_ms: refresh,
    enabled,
  };
}

async function saveCameras() {
  const index = editor.cameras.selectedIndex;
  if (index < 0 || !el.camerasList) return;
  let camera;
  try {
    camera = camerasFromForm();
  } catch (err) {
    setCamerasInfo(err.message, true);
    return;
  }

  const previous = editor.cameras.list[index];
  if (previous && previous.id) {
    camera.id = previous.id;
  }
  editor.cameras.list[index] = camera;

  try {
    await putCameras(editor.cameras.list);
    setCamerasInfo(t("settings.cameras.saved"));
    await loadCameras();
  } catch (err) {
    setCamerasInfo(t("settings.cameras.save_failed", { error: err.message }), true);
  }
}

function addCamerasEntry() {
  const list = editor.cameras.list || [];
  if (list.length >= 4) {
    setCamerasInfo(t("settings.cameras.hint"), true);
    return;
  }
  const blank = {
    id: "",
    name: "",
    source: "ha",
    entity_id: "",
    snapshot_url: "",
    username: "",
    password: "",
    refresh_ms: 2000,
    enabled: true,
  };
  list.push(blank);
  editor.cameras.list = list;
  editor.cameras.selectedIndex = list.length - 1;
  renderCamerasList();
  fillCamerasForm(blank);
  showCamerasEditor(true);
  setCamerasInfo("");
}

async function deleteCamerasEntry() {
  const index = editor.cameras.selectedIndex;
  if (index < 0) return;
  const camera = editor.cameras.list[index];
  if (!camera) return;
  if (!window.confirm(t("settings.cameras.delete_confirm", { name: camera.name || `Kamera ${index + 1}` }))) {
    return;
  }
  editor.cameras.list.splice(index, 1);
  editor.cameras.selectedIndex = -1;
  renderCamerasList();
  showCamerasEditor(false);
  setCamerasInfo("");
  try {
    await putCameras(editor.cameras.list);
    setCamerasInfo(t("settings.cameras.saved"));
    await loadCameras();
  } catch (err) {
    setCamerasInfo(t("settings.cameras.save_failed", { error: err.message }), true);
  }
}

async function putCameras(list) {
  const response = await fetch("/api/cameras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(list || []),
  });
  if (!response.ok) {
    let detail = await response.text();
    try {
      const json = JSON.parse(detail);
      detail = json.error || detail;
    } catch (_) {}
    throw new Error(detail);
  }
}

/* Keeps the port field in step with the TLS checkbox without ever overriding a
 * custom port the user typed in: only the well-known 1883/8883 pair is swapped. */
function syncMqttPortForTls() {
  if (!el.settingsMqttPort || !el.settingsMqttUseTls) return;
  const current = Number(el.settingsMqttPort.value) || 0;
  if (el.settingsMqttUseTls.checked) {
    if (current === 0 || current === 1883) el.settingsMqttPort.value = 8883;
  } else if (current === 8883) {
    el.settingsMqttPort.value = 1883;
  }
}

function collectMqttPayload() {
  const mqtt = {};
  if (el.settingsMqttEnabled) mqtt.enabled = el.settingsMqttEnabled.checked;
  if (el.settingsMqttUseTls) mqtt.use_tls = el.settingsMqttUseTls.checked;
  if (el.settingsMqttHost) mqtt.host = el.settingsMqttHost.value.trim();
  if (el.settingsMqttPort) {
    const port = Math.round(clamp(Number(el.settingsMqttPort.value) || 0, 1, 65535));
    if (Number.isFinite(port)) mqtt.port = port;
  }
  if (el.settingsMqttUsername) mqtt.username = el.settingsMqttUsername.value.trim();
  if (el.settingsMqttPassword && el.settingsMqttPassword.value.length > 0) {
    mqtt.password = el.settingsMqttPassword.value;
  }
  if (el.settingsMqttDiscoveryPrefix) {
    const prefix = el.settingsMqttDiscoveryPrefix.value.trim().replace(/^\/+|\/+$/g, "");
    if (prefix) mqtt.discovery_prefix = prefix;
  }
  return mqtt;
}

function collectSystemPayload() {
  const system = {};
  if (el.settingsAutoRestartEnabled) {
    system.auto_restart_enabled = el.settingsAutoRestartEnabled.checked;
  }
  if (el.settingsAutoRestartHours) {
    const hours = Math.round(clamp(Number(el.settingsAutoRestartHours.value) || 0, 1, 168));
    if (Number.isFinite(hours)) system.auto_restart_hours = hours;
  }
  const logVerbosity = selectedLogLevel();
  if (logVerbosity !== null) {
    system.log_verbosity = logVerbosity;
  }
  return system;
}

function selectedLogLevel() {
  if (!el.logsLevel) return null;
  const raw = el.logsLevel.value;
  if (raw === "") return null;
  const level = Number(raw);
  return LOG_VERBOSITY_LEVELS.has(level) ? level : null;
}

function renderLogLevelInfo() {
  if (!el.logsLevelInfo) return;
  const system = editor.settings?.system || {};
  const stored = Number(system.log_verbosity);
  if (!Number.isFinite(stored)) {
    el.logsLevelInfo.textContent = "";
    return;
  }
  if (LOG_VERBOSITY_LEVELS.has(stored)) {
    el.logsLevelInfo.textContent = t("settings.logs.log_level_hint", {
      level: t(`settings.logs.log_level_${stored}`),
    });
  } else {
    el.logsLevelInfo.textContent = t("settings.logs.log_level_unknown", { level: stored });
  }
  el.logsLevelInfo.classList.remove("error");
}

function syncLogLevelFromSettings() {
  if (!el.logsLevel) return;
  const stored = Number(editor.settings?.system?.log_verbosity);
  el.logsLevel.value = LOG_VERBOSITY_LEVELS.has(stored) ? String(stored) : "";
  renderLogLevelInfo();
}

async function applyLogLevel() {
  const level = selectedLogLevel();
  if (level === null) {
    if (el.logsLevelInfo) {
      const stored = Number(editor.settings?.system?.log_verbosity);
      el.logsLevelInfo.textContent = Number.isFinite(stored)
        ? t("settings.logs.log_level_unknown", { level: stored })
        : t("settings.logs.log_level_hint", { level: "?" });
      el.logsLevelInfo.classList.add("error");
    }
    return;
  }
  if (el.logsLevelInfo) {
    el.logsLevelInfo.textContent = t("status.saving_settings");
    el.logsLevelInfo.classList.remove("error");
  }
  try {
    await putSettings({ system: { log_verbosity: level }, reboot: false });
    await loadSettings(true);
    if (el.logsLevelInfo) {
      el.logsLevelInfo.textContent = t("settings.logs.log_level_applied");
      el.logsLevelInfo.classList.remove("error");
    }
  } catch (err) {
    if (el.logsLevelInfo) {
      el.logsLevelInfo.textContent = t("status.settings_save_failed", { error: err.message });
      el.logsLevelInfo.classList.add("error");
    }
  }
}

async function applyMqttSettings() {
  const mqtt = collectMqttPayload();
  if (!Object.keys(mqtt).length) return;
  if (el.settingsMqttInfo) {
    el.settingsMqttInfo.textContent = t("status.saving_settings");
    el.settingsMqttInfo.classList.remove("error");
  }
  await putSettings({ mqtt, reboot: false });
  await loadSettings(true);
  if (el.settingsMqttInfo) {
    el.settingsMqttInfo.textContent = t("settings.mqtt.applied");
    el.settingsMqttInfo.classList.remove("error");
  }
}

function imageFileToRgb565(file, w, h) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, dx, dy, dw, dh);
        const imageData = ctx.getImageData(0, 0, w, h);
        const px = imageData.data;
        const bytes = new Uint8Array(w * h * 2);
        let o = 0;
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i] >> 3;
          const g = px[i + 1] >> 2;
          const b = px[i + 2] >> 3;
          const v = (r << 11) | (g << 5) | b;
          bytes[o++] = v & 0xff;
          bytes[o++] = (v >> 8) & 0xff;
        }
        resolve(bytes);
      } catch (_) {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

async function uploadWallpaper() {
  const file = el.settingsWallpaperFile?.files?.[0];
  if (!file) {
    if (el.settingsWallpaperInfo) {
      el.settingsWallpaperInfo.textContent = t("settings.display.no_wallpaper_file");
      el.settingsWallpaperInfo.classList.add("error");
    }
    return;
  }

  const w = Number(editor.appScreenW) || 480;
  const h = Number(editor.appScreenH) || 480;
  if (el.settingsWallpaperInfo) {
    el.settingsWallpaperInfo.textContent = t("settings.display.converting");
    el.settingsWallpaperInfo.classList.remove("error");
  }
  const data = await imageFileToRgb565(file, w, h);
  if (!data) {
    if (el.settingsWallpaperInfo) {
      el.settingsWallpaperInfo.textContent = t("settings.display.convert_failed");
      el.settingsWallpaperInfo.classList.add("error");
    }
    return;
  }
  if (el.settingsWallpaperInfo) {
    el.settingsWallpaperInfo.textContent = t("settings.display.uploading");
  }
  const response = await fetch("/api/display/wallpaper", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: data,
  });
  if (!response.ok) {
    let detail = await response.text();
    try {
      const json = JSON.parse(detail);
      detail = json.error || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  if (el.settingsWallpaperInfo) {
    el.settingsWallpaperInfo.textContent = t("settings.display.wallpaper_uploaded");
    el.settingsWallpaperInfo.classList.remove("error");
  }
}

async function removeWallpaper() {
  if (el.settingsWallpaperInfo) {
    el.settingsWallpaperInfo.textContent = t("settings.display.removing");
    el.settingsWallpaperInfo.classList.remove("error");
  }
  const response = await fetch("/api/display/wallpaper", { method: "DELETE" });
  if (!response.ok) {
    let detail = await response.text();
    try {
      const json = JSON.parse(detail);
      detail = json.error || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  if (el.settingsWallpaperInfo) {
    el.settingsWallpaperInfo.textContent = t("settings.display.wallpaper_removed");
    el.settingsWallpaperInfo.classList.remove("error");
  }
}

function defaultLayout() {
  return {
    version: 1,
    pages: [
      {
        id: "living",
        title: t("layout.default_page.title"),
        widgets: [],
      },
    ],
  };
}

function defaultEnergyConfig() {
  return ENERGY_ENTITY_KEYS.reduce((config, key) => {
    config[key] = "";
    return config;
  }, { source: ENERGY_SOURCE_HA });
}

function isEnergyPage(page) {
  return page?.type === ENERGY_PAGE_TYPE;
}

function isXiaozhiPage(page) {
  return page?.type === XIAOZHI_PAGE_TYPE;
}

function pageAcceptsWidgets(page) {
  return !isEnergyPage(page) && !isXiaozhiPage(page);
}

function energyPageUsesHaSource(page) {
  if (!isEnergyPage(page)) return false;
  const source = typeof page.energy?.source === "string" ? page.energy.source.trim() : "";
  return source !== ENERGY_SOURCE_MANUAL;
}

function layoutHasHaEnergyPage() {
  return (editor.layout?.pages || []).some((page) => energyPageUsesHaSource(page));
}

function normalizeEnergyConfig(page) {
  if (!page || !isEnergyPage(page)) return;
  if (!page.energy || typeof page.energy !== "object" || Array.isArray(page.energy)) {
    page.energy = defaultEnergyConfig();
  }
  const source = typeof page.energy.source === "string" ? page.energy.source.trim() : "";
  const hasManualSensors = ENERGY_ENTITY_KEYS.some((key) => typeof page.energy[key] === "string" && page.energy[key].trim());
  page.energy.source = ENERGY_SOURCES.has(source) ? source : (hasManualSensors ? ENERGY_SOURCE_MANUAL : ENERGY_SOURCE_HA);
  for (const key of ENERGY_ENTITY_KEYS) {
    page.energy[key] = typeof page.energy[key] === "string" ? page.energy[key].trim() : "";
  }
  page.widgets = [];
}

function getEnergyInputs() {
  return {
    home_power_entity_id: el.energyHomePower,
    solar_power_entity_id: el.energySolarPower,
    grid_power_entity_id: el.energyGridPower,
    grid_import_power_entity_id: el.energyGridImport,
    grid_export_power_entity_id: el.energyGridExport,
    battery_power_entity_id: el.energyBatteryPower,
    battery_charge_power_entity_id: el.energyBatteryCharge,
    battery_discharge_power_entity_id: el.energyBatteryDischarge,
    battery_soc_entity_id: el.energyBatterySoc,
  };
}

function defaultMusicConfig() {
  return {
    player_entity_id: "",
    players: [],
  };
}

function isMusicPage(page) {
  return page?.type === MUSIC_PAGE_TYPE;
}

function normalizeMusicConfig(page) {
  if (!page || !isMusicPage(page)) return;
  if (!page.music || typeof page.music !== "object" || Array.isArray(page.music)) {
    page.music = defaultMusicConfig();
  }
  page.music.player_entity_id =
    typeof page.music.player_entity_id === "string" ? page.music.player_entity_id.trim() : "";
  const players = Array.isArray(page.music.players) ? page.music.players : [];
  page.music.players = players
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
  page.widgets = [];
}

function musicPlayersFromText(text) {
  return String(text || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function applyMusicPageConfig(options = {}) {
  const page = selectedPage();
  if (!page || !isMusicPage(page)) return false;
  normalizeMusicConfig(page);
  page.music.player_entity_id = (el.musicPlayerEntity?.value || "").trim();
  page.music.players = musicPlayersFromText(el.musicPlayers?.value);
  if (options.render !== false) {
    renderAll();
  }
  return true;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampInt(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.round(clamp(num, min, max));
}

function defaultRadioConfig() {
  return {
    entity: "",
    columns: RADIO_COLUMNS_DEFAULT,
    stations: [],
  };
}

function isRadioPage(page) {
  return page?.type === RADIO_PAGE_TYPE;
}

/* The weather page is a plain page identified by its id, so the firmware can
   replace its own built-in default and keep the top-bar chip linked to it. */
function isWeatherPage(page) {
  return page?.id === WEATHER_PAGE_ID;
}

function normalizeRadioStation(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const name = typeof entry.name === "string" ? entry.name.trim() : "";
  const url = typeof entry.url === "string" ? entry.url.trim() : "";
  const entity = typeof entry.entity === "string" ? entry.entity.trim() : "";
  if (!name && !url) return null;
  const station = { name, url };
  if (entity) station.entity = entity;
  return station;
}

function normalizeRadioConfig(page) {
  if (!page || !isRadioPage(page)) return;
  if (!page.radio || typeof page.radio !== "object" || Array.isArray(page.radio)) {
    page.radio = defaultRadioConfig();
  }
  page.radio.entity = typeof page.radio.entity === "string" ? page.radio.entity.trim() : "";
  page.radio.columns = clampInt(page.radio.columns, RADIO_COLUMNS_MIN, RADIO_COLUMNS_MAX, RADIO_COLUMNS_DEFAULT);
  const stations = Array.isArray(page.radio.stations) ? page.radio.stations : [];
  page.radio.stations = stations
    .map((entry) => normalizeRadioStation(entry))
    .filter((entry) => entry && (entry.name || entry.url))
    .slice(0, RADIO_MAX_STATIONS);
  page.widgets = [];
}

function radioStationsSignature(page) {
  const stations = Array.isArray(page?.radio?.stations) ? page.radio.stations : [];
  return JSON.stringify(
    stations.map((station) => [station.name || "", station.url || "", station.entity || ""]),
  );
}

function radioRowInput(row, key) {
  return row?.querySelector(`input[data-radio-field="${key}"]`) || null;
}

function syncRadioStationRows(page) {
  if (!page || !isRadioPage(page) || !el.radioStationsList) return;
  if (!page.radio || typeof page.radio !== "object" || Array.isArray(page.radio)) {
    page.radio = defaultRadioConfig();
  }
  const rows = Array.from(el.radioStationsList.querySelectorAll(".radio-station-row"));
  const stations = [];
  for (const row of rows) {
    const name = (radioRowInput(row, "name")?.value || "").trim();
    const url = (radioRowInput(row, "url")?.value || "").trim();
    const entity = (radioRowInput(row, "entity")?.value || "").trim();
    if (!name && !url) continue;
    const station = { name, url };
    if (entity) station.entity = entity;
    stations.push(station);
  }
  page.radio.stations = stations.slice(0, RADIO_MAX_STATIONS);
}

function buildRadioStationRow(page, station, index, total) {
  const row = document.createElement("div");
  row.className = "radio-station-row";
  row.dataset.radioIndex = String(index);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.dataset.radioField = "name";
  nameInput.placeholder = t("layout.radio.station_name");
  nameInput.value = station.name || "";
  nameInput.maxLength = 48;

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.dataset.radioField = "url";
  urlInput.placeholder = t("layout.radio.station_url");
  urlInput.value = station.url || "";
  urlInput.maxLength = 160;

  const entityInput = document.createElement("input");
  entityInput.type = "text";
  entityInput.dataset.radioField = "entity";
  entityInput.placeholder = t("layout.radio.station_entity");
  entityInput.value = station.entity || "";
  entityInput.setAttribute("list", "musicEntityOptions");

  const makeButton = (label, title, disabled, onClick) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row-icon-btn";
    btn.textContent = label;
    btn.title = title;
    btn.setAttribute("aria-label", title);
    btn.disabled = !!disabled;
    btn.addEventListener("click", onClick);
    return btn;
  };

  const commit = () => {
    if (editor.radioRowsSignature) {
      // The DOM is the source of truth while a user edits a row; refresh only
      // the derived parts of the UI.
      syncRadioStationRows(page);
      refreshRadioPreviewForPage(page);
    }
  };
  for (const input of [nameInput, urlInput, entityInput]) {
    input.addEventListener("change", commit);
    input.addEventListener("blur", commit);
  }
  urlInput.addEventListener("input", () => refreshRadioPreviewForPage(page));

  row.appendChild(nameInput);
  row.appendChild(urlInput);
  row.appendChild(entityInput);
  row.appendChild(
    makeButton("\u2191", t("layout.radio.station_up"), index === 0, () => moveRadioStationRow(page, index, -1)),
  );
  row.appendChild(
    makeButton("\u2193", t("layout.radio.station_down"), index >= total - 1, () => moveRadioStationRow(page, index, 1)),
  );
  row.appendChild(makeButton("\u2715", t("layout.radio.station_remove"), false, () => removeRadioStationRow(page, index)));
  return row;
}

function renderRadioStationRows(page, force = false) {
  if (!page || !isRadioPage(page) || !el.radioStationsList) return;
  normalizeRadioConfig(page);
  const signature = `${page.id}|${radioStationsSignature(page)}`;
  if (!force && signature === editor.radioRowsSignature) return;
  editor.radioRowsSignature = signature;
  const list = el.radioStationsList;
  list.textContent = "";
  const stations = page.radio.stations;
  if (!stations.length) {
    const empty = document.createElement("div");
    empty.className = "radio-station-empty";
    empty.textContent = t("layout.radio.empty_list");
    list.appendChild(empty);
    return;
  }
  stations.forEach((station, index) => {
    list.appendChild(buildRadioStationRow(page, station, index, stations.length));
  });
}

function addRadioStationRow() {
  const page = selectedPage();
  if (!page || !isRadioPage(page)) return;
  normalizeRadioConfig(page);
  syncRadioStationRows(page);
  if (page.radio.stations.length >= RADIO_MAX_STATIONS) {
    setStatus(t("layout.radio.limit_reached", { count: RADIO_MAX_STATIONS }), true);
    return;
  }
  page.radio.stations.push({ name: "", url: "" });
  renderRadioStationRows(page, true);
  const rows = el.radioStationsList?.querySelectorAll(".radio-station-row");
  const last = rows && rows.length ? rows[rows.length - 1] : null;
  radioRowInput(last, "name")?.focus();
  refreshRadioPreviewForPage(page);
}

function removeRadioStationRow(page, index) {
  if (!page || !isRadioPage(page)) return;
  syncRadioStationRows(page);
  page.radio.stations.splice(index, 1);
  renderRadioStationRows(page, true);
  refreshRadioPreviewForPage(page);
}

function moveRadioStationRow(page, index, delta) {
  if (!page || !isRadioPage(page)) return;
  syncRadioStationRows(page);
  const stations = page.radio.stations;
  const target = index + delta;
  if (index < 0 || index >= stations.length || target < 0 || target >= stations.length) return;
  const [moved] = stations.splice(index, 1);
  stations.splice(target, 0, moved);
  renderRadioStationRows(page, true);
  refreshRadioPreviewForPage(page);
}

function applyRadioPageConfig(options = {}) {
  const page = selectedPage();
  if (!page || !isRadioPage(page)) return false;
  normalizeRadioConfig(page);
  page.radio.entity = (el.radioPlayerEntity?.value || "").trim();
  page.radio.columns = clampInt(el.radioColumns?.value, RADIO_COLUMNS_MIN, RADIO_COLUMNS_MAX, RADIO_COLUMNS_DEFAULT);
  syncRadioStationRows(page);
  if (options.render !== false) {
    renderAll();
  }
  return true;
}

function minutesToTimeString(minutes) {
  const total = clampInt(minutes, 0, 1439, 0);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function timeStringToMinutes(value, fallback) {
  if (typeof value !== "string") return fallback;
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim());
  if (!match) return fallback;
  return clampInt(Number(match[1]) * 60 + Number(match[2]), 0, 1439, fallback);
}

function snap(value) {
  return Math.round(value / GRID) * GRID;
}

function selectedPage() {
  if (!editor.layout) return null;
  return editor.layout.pages.find((p) => p.id === editor.selectedPageId) || null;
}

function selectedWidget() {
  const page = selectedPage();
  if (!page) return null;
  if (!Array.isArray(page.widgets)) return null;
  return page.widgets.find((w) => w.id === editor.selectedWidgetId) || null;
}

function inspectorWidgetType() {
  return selectedWidget()?.type || el.fType?.value || "sensor";
}

function inspectorSliderEntityDomain() {
  if (el.fSliderEntityDomain) {
    return normalizeSliderEntityDomain(el.fSliderEntityDomain.value);
  }
  return normalizeSliderEntityDomain(selectedWidget()?.slider_entity_domain);
}

function inspectorButtonMode() {
  if (el.fButtonMode) {
    return normalizeButtonMode(el.fButtonMode.value);
  }
  return normalizeButtonMode(selectedWidget()?.button_mode);
}

function allowedEntityDomainsForWidgetType(
  type,
  sliderDomain = DEFAULT_SLIDER_ENTITY_DOMAIN,
  buttonMode = DEFAULT_BUTTON_MODE,
) {
  if (type === "empty_tile") return [];
  if (type === "clock_alarm") return [];
  if (type === "sensor_tile") return [];
  if (type === "sensor" || type === "graph") return ["sensor"];
  if (type === "binary_sensor") return ["binary_sensor"];
  if (type === "presence") return ["device_tracker", "person"];
  if (type === "binary_sensor") return ["binary_sensor"];
  if (type === "alarm_tile") return ["alarm_control_panel"];
  if (type === "button") {
    const normalizedMode = normalizeButtonMode(buttonMode);
    return buttonModeRequiresMediaPlayer(normalizedMode)
      ? ["media_player"]
      : ["switch", "media_player", "button", "scene", "script", "automation", "input_boolean"];
  }
  if (type === "light_tile") return ["light"];
  if (type === "heating_tile") return ["climate"];
  if (type === "weather_tile" || type === "weather_3day") return ["weather"];
  if (type === "todo_list") return ["todo"];
  if (type === "media_player") return ["media_player"];
  if (type === "roborock_tile") return ["vacuum"];
  if (type === "cover") return ["cover"];
  if (type === "lock") return ["lock"];
  if (type === "fan") return ["fan"];
  if (type === "select") return ["select", "input_select"];
  if (type === "number") return ["number", "input_number"];
  if (type === "cover_tile") return ["cover"];
  if (type === "scene_tile") return ["scene"];
  if (type === "person_tile") return ["person"];
  if (type === "timer_tile") return ["timer"];
  if (type === "slider") {
    const normalized = normalizeSliderEntityDomain(sliderDomain);
    if (normalized === "auto") {
      return ["light", "media_player", "cover", "number", "input_number"];
    }
    return [normalized];
  }
  return [];
}

function expectedDomainForWidgetType(
  type,
  sliderDomain = DEFAULT_SLIDER_ENTITY_DOMAIN,
  buttonMode = DEFAULT_BUTTON_MODE,
) {
  const domains = allowedEntityDomainsForWidgetType(type, sliderDomain, buttonMode);
  return domains.length === 1 ? domains[0] : "";
}

function secondaryEntityConfigForWidgetType(type) {
  if (type === "heating_tile") {
    return {
      enabled: true,
      domain: "sensor",
      optional: false,
      labelKey: "layout.inspector.secondary_entity",
      labelFallback: "Actual entity (sensor)",
      invalidStatusKey: "layout.status.secondary_sensor_required",
    };
  }
  if (type === "roborock_tile") {
    return {
      enabled: true,
      domain: "image",
      optional: true,
      labelKey: "layout.inspector.secondary_entity_roborock",
      labelFallback: "Map entity (image, optional)",
      invalidStatusKey: "layout.status.secondary_image_required",
    };
  }
  return {
    enabled: false,
    domain: "",
    optional: true,
    labelKey: "layout.inspector.secondary_entity",
    labelFallback: "Actual entity (sensor)",
    invalidStatusKey: "layout.status.secondary_sensor_required",
  };
}

function listEntitiesByDomain(domain) {
  if (!domain) return editor.entities;
  return editor.entities.filter((entity) => typeof entity.id === "string" && entity.id.startsWith(`${domain}.`));
}

function entityMatchesWidgetType(
  entity,
  type,
  sliderDomain = DEFAULT_SLIDER_ENTITY_DOMAIN,
  buttonMode = DEFAULT_BUTTON_MODE,
) {
  if (type === "empty_tile") return true;
  if (type === "clock_alarm") return true;

  const id = typeof entity?.id === "string" ? entity.id : "";
  /* These tiles also work without an entity and bind one when it is set. */
  if (!id) return ENTITY_OPTIONAL_WIDGET_TYPES.includes(type);

  const allowedDomains = allowedEntityDomainsForWidgetType(type, sliderDomain, buttonMode);
  if (!allowedDomains.length) return true;
  const matchesDomain = allowedDomains.some((domain) => id.startsWith(`${domain}.`));
  if (!matchesDomain) return false;
  const modelEntity = entity?.capabilities
    ? entity
    : editor.entities.find((candidate) => candidate?.id === id);
  if (type === "slider" && id.startsWith("light.") && modelEntity?.capabilities?.dimming === false) {
    return false;
  }
  return true;
}

function listEntitiesForWidgetType(
  type,
  sliderDomain = DEFAULT_SLIDER_ENTITY_DOMAIN,
  buttonMode = DEFAULT_BUTTON_MODE,
) {
  if (type === "empty_tile") return [];
  if (type === "clock_alarm") return [];
  if (type === "sensor_tile") return [];
  return editor.entities.filter((entity) => entityMatchesWidgetType(entity, type, sliderDomain, buttonMode));
}

function pickDefaultEntityForWidgetType(
  type,
  sliderDomain = DEFAULT_SLIDER_ENTITY_DOMAIN,
  buttonMode = DEFAULT_BUTTON_MODE,
) {
  if (type === "empty_tile") return "";
  if (type === "clock_alarm") return "";
  /* A timer tile is standalone (local countdown) unless an entity is picked. */
  if (type === "timer_tile") return "";
  const matching = listEntitiesForWidgetType(type, sliderDomain, buttonMode);
  if (matching.length > 0) return matching[0].id;
  return "";
}

function uniqueId(prefix, list, accessor = (x) => x.id) {
  let i = 1;
  while (true) {
    const candidate = `${prefix}_${i}`;
    if (!list.some((entry) => accessor(entry) === candidate)) return candidate;
    i += 1;
  }
}

function sanitizeIdPart(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "item";
}

function createWidgetIdForPage(page, type) {
  const pagePart = sanitizeIdPart(page?.id || page?.title || "page");
  const typePart = sanitizeIdPart(type || "widget");
  const allWidgets = editor.layout?.pages?.flatMap((p) => (Array.isArray(p.widgets) ? p.widgets : [])) || [];

  let i = 1;
  while (true) {
    const candidate = `${pagePart}_${typePart}_${i}`;
    if (!allWidgets.some((widget) => widget?.id === candidate)) {
      return candidate;
    }
    i += 1;
  }
}

async function apiGet(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function setEntityOptionsList(target, entities) {
  target.innerHTML = "";
  for (const entity of entities) {
    if (!entity || typeof entity.id !== "string" || !entity.id.length) continue;
    const option = document.createElement("option");
    option.value = entity.id;
    option.label = `${entity.id} (${entity.name || entity.id})`;
    target.appendChild(option);
  }
}

function normalizeEntitySearchTerm(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const wildcardIndex = trimmed.indexOf("*");
  if (wildcardIndex < 0) return trimmed;
  return trimmed.slice(wildcardIndex + 1).trim();
}

function parseEntitySearchInput(rawValue, fallbackDomain = "") {
  const value = typeof rawValue === "string" ? rawValue.trim() : "";
  let domain = typeof fallbackDomain === "string" ? fallbackDomain.trim().toLowerCase() : "";
  let search = value;

  const dotIndex = value.indexOf(".");
  if (dotIndex > 0) {
    const candidateDomain = value.slice(0, dotIndex).trim().toLowerCase();
    if (/^[a-z0-9_]+$/.test(candidateDomain)) {
      domain = candidateDomain;
      search = value.slice(dotIndex + 1);
    }
  }

  search = normalizeEntitySearchTerm(search);
  return { domain, search };
}

function entityContainsSearch(entity, search) {
  if (!search) return true;
  const needle = search.toLowerCase();
  const id = String(entity?.id || "").toLowerCase();
  const name = String(entity?.name || "").toLowerCase();
  return id.includes(needle) || name.includes(needle);
}

function filterLocalEntitySuggestions(source, domain, search, maxItems) {
  const results = [];
  for (const entity of source) {
    if (!entity || typeof entity.id !== "string" || entity.id.length === 0) continue;
    if (domain && !entity.id.startsWith(`${domain}.`)) continue;
    if (!entityContainsSearch(entity, search)) continue;
    results.push(entity);
    if (results.length >= maxItems) break;
  }
  return results;
}

async function fetchEntitySuggestions(domain, search, limit) {
  const params = new URLSearchParams();
  if (domain) params.set("domain", domain);
  if (search) params.set("search", search);
  params.set("limit", String(limit));
  const data = await apiGet(`/api/entities?${params.toString()}`);
  return Array.isArray(data.items) ? data.items : [];
}

function primaryEntitySource() {
  const inspectorType = inspectorWidgetType();
  const sliderDomain = inspectorSliderEntityDomain();
  const buttonMode = inspectorButtonMode();
  const typedOptions = listEntitiesForWidgetType(inspectorType, sliderDomain, buttonMode);
  return typedOptions.length > 0 ? typedOptions : editor.entities;
}

function defaultPrimaryEntityDomain() {
  return expectedDomainForWidgetType(inspectorWidgetType(), inspectorSliderEntityDomain(), inspectorButtonMode());
}

function scheduleEntityAutocomplete(kind, immediate = false) {
  const isSecondary = kind === "secondary";
  const state = isSecondary ? entityAutocomplete.secondary : entityAutocomplete.primary;
  const input = isSecondary ? el.fSecondaryEntity : el.fEntity;
  const options = isSecondary ? el.sensorEntityOptions : el.entityOptions;
  const secondaryConfig = secondaryEntityConfigForWidgetType(inspectorWidgetType());
  if (!input || !options) return;
  if (!isSecondary && input.disabled) return;
  if (isSecondary && input.disabled) return;
  if (isSecondary && !secondaryConfig.enabled) return;

  if (state.timerId !== null) {
    window.clearTimeout(state.timerId);
    state.timerId = null;
  }

  const run = async () => {
    const requestSeq = ++state.requestSeq;
    const raw = input.value || "";
    const fallbackDomain = isSecondary ? secondaryConfig.domain : defaultPrimaryEntityDomain();
    const { domain, search } = parseEntitySearchInput(raw, fallbackDomain);
    const source = isSecondary ? listEntitiesByDomain(secondaryConfig.domain) : primaryEntitySource();
    const allowedDomains = isSecondary
      ? [secondaryConfig.domain]
      : allowedEntityDomainsForWidgetType(inspectorWidgetType(), inspectorSliderEntityDomain(), inspectorButtonMode());

    if (domain && allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
      setEntityOptionsList(options, []);
      return;
    }

    const localResults = filterLocalEntitySuggestions(source, domain, search, ENTITY_AUTOCOMPLETE_MAX_ITEMS);
    setEntityOptionsList(options, localResults);

    const shouldQueryApi = domain.length > 0 || search.length >= 2;
    if (!shouldQueryApi) return;

    try {
      const remoteResults = await fetchEntitySuggestions(domain, search, ENTITY_AUTOCOMPLETE_MAX_ITEMS);
      if (requestSeq !== state.requestSeq) return;
      if (remoteResults.length > 0) {
        setEntityOptionsList(options, remoteResults);
      }
    } catch (_) {
      // Keep local fallback options.
    }
  };

  if (immediate) {
    void run();
    return;
  }

  state.timerId = window.setTimeout(() => {
    state.timerId = null;
    void run();
  }, ENTITY_AUTOCOMPLETE_DEBOUNCE_MS);
}

async function loadLayout() {
  setStatus(t("layout.status.loading"));
  try {
    editor.layout = await apiGet("/api/layout");
    if (!editor.layout || !Array.isArray(editor.layout.pages)) {
      editor.layout = defaultLayout();
    }
  } catch (err) {
    editor.layout = defaultLayout();
    setStatus(t("layout.status.load_failed", { error: err.message }), true);
  }

  if (!editor.layout.pages.length) {
    editor.layout.pages.push(defaultLayout().pages[0]);
  }
  normalizeLayoutWidgets(editor.layout);
  editor.layoutSignature = layoutSignatureOf(editor.layout);
  editor.selectedPageId = editor.layout.pages[0].id;
  editor.selectedWidgetId = null;
  renderAll();
  setStatus(t("layout.status.loaded"));
}

async function loadEntities() {
  try {
    const data = await apiGet("/api/entities");
    editor.entities = Array.isArray(data.items) ? data.items : [];
    renderEntityOptions();
  } catch (err) {
    setStatus(t("layout.status.entity_fetch_failed", { error: err.message }), true);
  }
}

async function refreshStates() {
  try {
    const data = await apiGet("/api/state");
    editor.states = new Map();
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        editor.states.set(item.entity_id, item.state);
      }
    }
    renderCanvas();
  } catch (_) {
    // Keep previous preview values.
  }
}

async function loadEnergyPreview() {
  if (!layoutHasHaEnergyPage()) {
    if (editor.energySnapshot !== null) {
      editor.energySnapshot = null;
      renderCanvas();
    }
    return;
  }
  try {
    editor.energySnapshot = await apiGet("/api/ha/energy");
    renderCanvas();
  } catch (_) {
    if (editor.energySnapshot !== null) {
      editor.energySnapshot = null;
      renderCanvas();
    }
  }
}

function clearLightEntityPickerPoll() {
  if (editor.lightPicker.pollTimerId !== null) {
    window.clearTimeout(editor.lightPicker.pollTimerId);
    editor.lightPicker.pollTimerId = null;
  }
}

function clearLightEntityPickerSearchDebounce() {
  if (editor.lightPicker.searchDebounceId !== null) {
    window.clearTimeout(editor.lightPicker.searchDebounceId);
    editor.lightPicker.searchDebounceId = null;
  }
}

function cancelLightEntityPickerRequest() {
  const config = entityPickerConfig();
  const params = new URLSearchParams();
  params.set("domain", config.domain);
  const search = entityPickerSearchValue();
  if (search) params.set("search", search);
  fetch(`/api/ha/light_entities?${params.toString()}`, { method: "DELETE", cache: "no-store" }).catch(() => {});
}

function entityPickerConfig(widgetType = editor.lightPicker.widgetType) {
  const normalizedWidgetType = ENTITY_PICKER_CONFIGS[widgetType] ? widgetType : "light_tile";
  return {
    widgetType: normalizedWidgetType,
    ...ENTITY_PICKER_CONFIGS[normalizedWidgetType],
  };
}

function entityPickerItemsLabel(config = entityPickerConfig()) {
  return t(config.itemsKey, {}, config.itemsFallback);
}

function entityPickerSearchValue() {
  return String(editor.lightPicker.search || "").trim();
}

function entityPickerSearchReady(config = entityPickerConfig()) {
  const minSearch = Number(config.minSearch || 0);
  return minSearch <= 0 || entityPickerSearchValue().length >= minSearch;
}

function entityPickerLiveSearchEnabled(config = entityPickerConfig()) {
  return config.liveSearch !== false;
}

function entityPickerCacheKey(domain, search = entityPickerSearchValue()) {
  return `${domain}|${String(search || "").trim().toLowerCase()}`;
}

function normalizeEntityPickerItems(items, domain) {
  if (!Array.isArray(items)) return [];
  const prefix = `${domain}.`;
  return items
    .filter((item) => item && typeof item.id === "string" && item.id.startsWith(prefix))
    .map((item) => ({
      id: item.id,
      name: String(item.name || item.id),
      room: String(item.room || ""),
      area_id: String(item.area_id || ""),
      icon: String(item.icon || ""),
    }));
}

function entityPickerRoomLabel(item) {
  return item.room || t("entity_picker.unassigned_room");
}

function mergeEntityPickerItemsIntoEntities(items, domain) {
  if (!Array.isArray(items) || !items.length) return;
  const byId = new Map(editor.entities.map((entity) => [entity.id, entity]));
  for (const item of items) {
    if (!item?.id || byId.has(item.id)) continue;
    const entity = {
      id: item.id,
      name: item.name || item.id,
      domain,
      icon: item.icon || "",
      capabilities: {},
    };
    editor.entities.push(entity);
    byId.set(item.id, entity);
  }
  renderEntityOptions();
}

function groupEntityPickerItemsByRoom(items) {
  const groups = new Map();
  for (const item of items) {
    const label = entityPickerRoomLabel(item);
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label).push(item);
  }
  return [...groups.entries()]
    .map(([room, entries]) => ({
      room,
      entries: entries.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    }))
    .sort((a, b) => {
      const unassigned = t("entity_picker.unassigned_room");
      if (a.room === unassigned && b.room !== unassigned) return 1;
      if (b.room === unassigned && a.room !== unassigned) return -1;
      return a.room.localeCompare(b.room);
    });
}

function renderLightEntityPicker(data = {}) {
  if (!el.lightEntityPickerRooms || !el.lightEntityPickerStatus) return;

  const config = entityPickerConfig();
  const domain = config.domain;
  const search = entityPickerSearchValue();
  const cacheKey = entityPickerCacheKey(domain, search);
  const widgetLabel = t(config.widgetKey, {}, config.widgetFallback);
  const itemsLabel = entityPickerItemsLabel(config);
  const searchReady = entityPickerSearchReady(config);
  const liveSearch = entityPickerLiveSearchEnabled(config);
  const sourceItems = Object.prototype.hasOwnProperty.call(data, "items")
    ? data.items
    : editor.lightPicker.items;
  const items = normalizeEntityPickerItems(sourceItems, domain);

  if (el.lightEntityPickerTitle) {
    el.lightEntityPickerTitle.textContent = t(config.titleKey, {}, config.titleFallback);
  }
  if (el.lightEntityPickerBlankBtn) {
    el.lightEntityPickerBlankBtn.textContent = t(config.blankKey, {}, config.blankFallback);
  }
  if (el.lightEntityPickerRefreshBtn) {
    el.lightEntityPickerRefreshBtn.textContent = liveSearch ? t("entity_picker.refresh") : t("entity_picker.search");
  }
  if (el.lightEntityPickerSearch && el.lightEntityPickerSearch.value !== editor.lightPicker.search) {
    el.lightEntityPickerSearch.value = editor.lightPicker.search;
  }

  if (items.length > 0 || data.status === "ready" || data.status === "refreshing") {
    editor.lightPicker.items = items;
    editor.lightPicker.itemsByDomain[cacheKey] = items;
    editor.lightPicker.hasLoaded = true;
    editor.lightPicker.loadedByDomain[cacheKey] = true;
    mergeEntityPickerItemsIntoEntities(items, domain);
  }
  editor.lightPicker.lastStatus = data.status || editor.lightPicker.lastStatus;

  const pending = data.pending === true || editor.lightPicker.loading;
  let statusText = "";
  if (data.status === "disconnected") {
    statusText = t("entity_picker.disconnected");
  } else if (!searchReady && !editor.lightPicker.items.length) {
    statusText = t("entity_picker.search_hint", { count: config.minSearch, items: itemsLabel });
  } else if (!liveSearch && searchReady && !editor.lightPicker.hasLoaded && !pending && !editor.lightPicker.items.length) {
    statusText = t("entity_picker.search_ready", { items: itemsLabel });
  } else if (data.status === "refreshing") {
    statusText = t("entity_picker.refreshing_items", { items: itemsLabel });
  } else if (pending && !editor.lightPicker.items.length) {
    statusText = t("entity_picker.pending");
  } else if (!editor.lightPicker.items.length) {
    statusText = t("entity_picker.empty_items", { items: itemsLabel });
  }
  if (data.truncated) {
    statusText = statusText ? `${statusText}\n${t("entity_picker.truncated")}` : t("entity_picker.truncated");
  }
  el.lightEntityPickerStatus.textContent = statusText;

  const loaded = Number.isFinite(Number(data.loaded)) ? Number(data.loaded) : editor.lightPicker.items.length;
  const rawTotal = Number.isFinite(Number(data.total)) ? Number(data.total) : 0;
  const limit = Number.isFinite(Number(data.limit)) && Number(data.limit) > 0 ? Number(data.limit) : loaded;
  const target = rawTotal > 0 ? Math.min(rawTotal, limit) : limit;
  const progressVisible = searchReady && (pending || rawTotal > 0 || data.truncated === true);
  if (el.lightEntityPickerProgress && el.lightEntityPickerProgressBar && el.lightEntityPickerProgressText) {
    el.lightEntityPickerProgress.classList.toggle("hidden", !progressVisible);
    const pct = target > 0 ? Math.min(100, Math.max(0, (loaded * 100) / target)) : (pending ? 8 : 0);
    el.lightEntityPickerProgressBar.style.width = `${pct}%`;
    el.lightEntityPickerProgressText.textContent = rawTotal > 0
      ? t("entity_picker.progress_total", {
        loaded: Math.min(loaded, target),
        target,
        total: rawTotal,
      })
      : t("entity_picker.progress", { loaded, target: target || "..." });
  }

  const groups = groupEntityPickerItemsByRoom(editor.lightPicker.items);
  el.lightEntityPickerRooms.innerHTML = "";
  for (const group of groups) {
    const details = document.createElement("details");
    details.className = "light-picker-room";
    details.open = groups.length <= 3 || group.entries.length <= 8;

    const summary = document.createElement("summary");
    summary.textContent = `${group.room} (${group.entries.length})`;
    details.appendChild(summary);

    const list = document.createElement("div");
    list.className = "light-picker-room-list";
    for (const item of group.entries) {
      const button = document.createElement("button");
      button.className = "light-picker-entity";
      button.type = "button";
      button.title = item.id;
      button.innerHTML = `<strong></strong><span></span>`;
      button.querySelector("strong").textContent = item.name || item.id;
      button.querySelector("span").textContent = item.id;
      button.onclick = () => {
        addWidget(config.widgetType || editor.lightPicker.widgetType, {
          entityId: item.id,
          title: item.name || item.id,
        });
        closeLightEntityPicker();
        setStatus(t("entity_picker.added_widget", { widget: widgetLabel, entity: item.id }));
      };
      list.appendChild(button);
    }
    details.appendChild(list);
    el.lightEntityPickerRooms.appendChild(details);
  }
}

async function fetchLightEntityPicker(options = {}) {
  const refresh = options.refresh === true;
  const pollCount = Number(options.pollCount || 0);
  const config = entityPickerConfig();
  const domain = config.domain;
  const search = entityPickerSearchValue();
  const itemsLabel = entityPickerItemsLabel(config);
  if (!entityPickerSearchReady(config)) {
    editor.lightPicker.loading = false;
    renderLightEntityPicker({
      status: "idle",
      pending: false,
      items: editor.lightPicker.items,
    });
    return;
  }
  const requestSeq = ++editor.lightPicker.requestSeq;
  editor.lightPicker.loading = true;
  if (pollCount === 0 || refresh) {
    const startStatus = refresh && editor.lightPicker.items.length > 0 ? "refreshing" : "pending";
    renderLightEntityPicker({
      status: startStatus,
      pending: true,
      items: editor.lightPicker.items,
    });
  }

  const params = new URLSearchParams();
  params.set("domain", domain);
  if (search) params.set("search", search);
  if (refresh) params.set("refresh", "1");

  try {
    const data = await apiGet(`/api/ha/light_entities${params.toString() ? `?${params.toString()}` : ""}`);
    if (requestSeq !== editor.lightPicker.requestSeq) return;
    editor.lightPicker.loading = data.pending === true;
    renderLightEntityPicker(data);

    if (data.pending === true && pollCount < LIGHT_ENTITY_PICKER_MAX_POLLS) {
      clearLightEntityPickerPoll();
      editor.lightPicker.pollTimerId = window.setTimeout(() => {
        editor.lightPicker.pollTimerId = null;
        void fetchLightEntityPicker({ refresh: false, pollCount: pollCount + 1 });
      }, LIGHT_ENTITY_PICKER_POLL_MS);
    }
  } catch (err) {
    if (requestSeq !== editor.lightPicker.requestSeq) return;
    editor.lightPicker.loading = false;
    const message = t("entity_picker.fetch_failed_items", { items: itemsLabel, error: err.message });
    el.lightEntityPickerStatus.textContent = message;
    setStatus(message, true);
  }
}

function openLightEntityPicker(widgetType = "light_tile") {
  const config = entityPickerConfig(widgetType);
  if (!el.lightEntityPickerOverlay) {
    addWidget(config.widgetType || widgetType);
    return;
  }
  editor.lightPicker.widgetType = widgetType;
  editor.lightPicker.domain = config.domain;
  editor.lightPicker.search = editor.lightPicker.searchByDomain[config.domain] || "";
  if (el.lightEntityPickerSearch) {
    el.lightEntityPickerSearch.value = editor.lightPicker.search;
  }
  const cacheKey = entityPickerCacheKey(config.domain);
  editor.lightPicker.items = editor.lightPicker.itemsByDomain[cacheKey] || [];
  editor.lightPicker.hasLoaded = editor.lightPicker.loadedByDomain[cacheKey] === true;
  const shouldAutoFetch =
    !editor.lightPicker.hasLoaded && entityPickerSearchReady(config) && entityPickerLiveSearchEnabled(config);
  el.lightEntityPickerOverlay.classList.remove("hidden");
  renderLightEntityPicker({
    status: editor.lightPicker.hasLoaded ? "ready" : (shouldAutoFetch ? "pending" : "idle"),
    pending: shouldAutoFetch,
    items: editor.lightPicker.items,
  });
  if (shouldAutoFetch) {
    void fetchLightEntityPicker();
  }
}

function closeLightEntityPicker() {
  clearLightEntityPickerPoll();
  clearLightEntityPickerSearchDebounce();
  editor.lightPicker.requestSeq += 1;
  cancelLightEntityPickerRequest();
  editor.lightPicker.loading = false;
  if (el.lightEntityPickerOverlay) {
    el.lightEntityPickerOverlay.classList.add("hidden");
  }
}

function layoutWidgetCount() {
  return (editor.layout?.pages || []).reduce((count, page) => (
    count + (Array.isArray(page.widgets) ? page.widgets.length : 0)
  ), 0);
}

function setupWizardPending() {
  return storageGet(SETUP_WIZARD_PENDING_STORAGE_KEY) === "1";
}

function markSetupWizardPending() {
  storageSet(SETUP_WIZARD_PENDING_STORAGE_KEY, "1");
  storageRemove(SETUP_WIZARD_DISMISSED_STORAGE_KEY);
}

function markSetupWizardDismissed() {
  storageRemove(SETUP_WIZARD_PENDING_STORAGE_KEY);
  storageSet(SETUP_WIZARD_DISMISSED_STORAGE_KEY, "1");
}

function setupWizardShouldAutoOpen() {
  if (!el.setupWizardOverlay || !editor.layout) return false;
  if (setupWizardPending()) return true;
  if (storageGet(SETUP_WIZARD_DISMISSED_STORAGE_KEY) === "1") return false;
  return Boolean(editor.settings?.ha?.configured) && layoutWidgetCount() === 0;
}

function setupWizardCountText() {
  const count = selectedPage()?.widgets?.length || 0;
  if (count <= 0) return t("setup.count_none");
  if (count === 1) return t("setup.count_one");
  return t("setup.count_many", { count });
}

function applySetupWizardPageTitle() {
  const page = selectedPage();
  if (!page || !el.setupWizardPageTitle) return;
  const title = el.setupWizardPageTitle.value.trim();
  if (title) {
    page.title = title;
    renderAll();
  }
}

function renderSetupWizard() {
  if (!el.setupWizardOverlay) return;
  if (el.setupWizardPageTitle && document.activeElement !== el.setupWizardPageTitle) {
    el.setupWizardPageTitle.value = selectedPage()?.title || t("layout.default_page.title");
  }
  if (el.setupWizardCount) {
    el.setupWizardCount.textContent = setupWizardCountText();
  }
}

function openSetupWizard(options = {}) {
  if (!el.setupWizardOverlay || !editor.layout) return;
  editor.setupWizard.active = true;
  editor.setupWizard.openedManually = options.manual === true;
  editor.setupWizard.addedSinceOpen = 0;
  if (el.setupWizardStatus) {
    el.setupWizardStatus.textContent = "";
    el.setupWizardStatus.classList.remove("error");
  }
  renderSetupWizard();
  el.setupWizardOverlay.classList.remove("hidden");
}

function closeSetupWizard(dismiss = true) {
  editor.setupWizard.active = false;
  if (dismiss) {
    markSetupWizardDismissed();
  }
  if (el.setupWizardOverlay) {
    el.setupWizardOverlay.classList.add("hidden");
  }
}

function openSetupWizardEntityPicker(widgetType) {
  applySetupWizardPageTitle();
  openLightEntityPicker(widgetType);
}

function onSetupWizardWidgetAdded(widget) {
  if (!editor.setupWizard.active || !widget) return;
  editor.setupWizard.addedSinceOpen += 1;
  if (el.setupWizardStatus) {
    el.setupWizardStatus.textContent = t("setup.added", { title: widget.title || widget.id });
    el.setupWizardStatus.classList.remove("error");
  }
  renderSetupWizard();
}

async function saveSetupWizardLayout(options = {}) {
  applySetupWizardPageTitle();
  if (el.setupWizardStatus) {
    el.setupWizardStatus.textContent = t("setup.saving");
    el.setupWizardStatus.classList.remove("error");
  }
  try {
    await saveLayout();
    if (el.setupWizardStatus) {
      el.setupWizardStatus.textContent = t("setup.saved");
      el.setupWizardStatus.classList.remove("error");
    }
    markSetupWizardDismissed();
    if (options.closeOnSuccess === true) {
      closeSetupWizard(false);
    }
    return true;
  } catch (err) {
    if (el.setupWizardStatus) {
      el.setupWizardStatus.textContent = t("setup.save_failed", { error: err.message });
      el.setupWizardStatus.classList.add("error");
    }
    return false;
  }
}

function renderEntityOptions() {
  const inspectorType = inspectorWidgetType();
  const sliderDomain = inspectorSliderEntityDomain();
  const buttonMode = inspectorButtonMode();
  const secondaryConfig = secondaryEntityConfigForWidgetType(inspectorType);
  const inspectorOptions = listEntitiesForWidgetType(inspectorType, sliderDomain, buttonMode);
  const primaryOptions = inspectorOptions.length > 0 ? inspectorOptions : editor.entities;
  setEntityOptionsList(el.entityOptions, primaryOptions.slice(0, ENTITY_AUTOCOMPLETE_MAX_ITEMS));

  setEntityOptionsList(
    el.sensorEntityOptions,
    secondaryConfig.domain
      ? listEntitiesByDomain(secondaryConfig.domain).slice(0, ENTITY_AUTOCOMPLETE_MAX_ITEMS)
      : [],
  );
  if (el.energyEntityOptions) {
    setEntityOptionsList(el.energyEntityOptions, listEntitiesByDomain("sensor").slice(0, ENTITY_AUTOCOMPLETE_MAX_ITEMS));
  }
  if (el.musicEntityOptions) {
    setEntityOptionsList(el.musicEntityOptions, listEntitiesByDomain("media_player").slice(0, ENTITY_AUTOCOMPLETE_MAX_ITEMS));
  }
  if (el.clockEntityOptions) {
    setEntityOptionsList(
      el.clockEntityOptions,
      listEntitiesByDomain("script")
        .concat(listEntitiesByDomain("media_player"))
        .slice(0, ENTITY_AUTOCOMPLETE_MAX_ITEMS),
    );
  }

  if (el.fSecondaryEntityLabel) {
    el.fSecondaryEntityLabel.textContent = t(secondaryConfig.labelKey, {}, secondaryConfig.labelFallback);
  }

  const secondaryEnabled = secondaryConfig.enabled;
  if (el.fSecondaryEntityWrap) {
    el.fSecondaryEntityWrap.classList.toggle("hidden", !secondaryEnabled);
  }
  el.fSecondaryEntity.disabled = !secondaryEnabled;
  if (!secondaryEnabled) {
    el.fSecondaryEntity.value = "";
  }

  const primaryEnabled = inspectorType !== "empty_tile" && inspectorType !== "clock_alarm" && inspectorType !== "sensor_tile";
  if (el.fEntityWrap) {
    el.fEntityWrap.classList.toggle("hidden", !primaryEnabled);
  }
  if (el.fEntity) {
    el.fEntity.disabled = !primaryEnabled;
    if (!primaryEnabled) {
      el.fEntity.value = "";
    }
  }
}

function renderPages() {
  el.pagesList.innerHTML = "";
  for (const page of editor.layout.pages) {
    const li = document.createElement("li");
    li.className = `list-item ${page.id === editor.selectedPageId ? "active selected" : ""}`;

    const label = document.createElement("span");
    const badge = isEnergyPage(page)
      ? " ⚡"
      : isXiaozhiPage(page)
        ? " 🎤"
        : isRadioPage(page)
          ? " 📻"
          : isMusicPage(page)
            ? " 🎵"
            : "";
    label.textContent = `${page.title || page.id}${badge}`;
    const typeTag = isEnergyPage(page)
      ? "energy"
      : isXiaozhiPage(page)
        ? "xiaozhi"
        : isRadioPage(page)
          ? "radio"
          : isMusicPage(page)
            ? "music"
            : "page";
    label.title = `[${page.id}] ${typeTag}`;
    label.className = "list-item-label";
    li.appendChild(label);
    li.onclick = () => {
      editor.selectedPageId = page.id;
      editor.selectedWidgetId = null;
      renderAll();
    };

    const actions = document.createElement("span");
    actions.className = "row-actions";

    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "row-icon-btn";
    renameBtn.title = t("layout.pages.rename") || "Rename";
    renameBtn.textContent = "✎";
    renameBtn.onclick = (ev) => {
      ev.stopPropagation();
      startInlinePageRename(li, label, page);
    };
    actions.appendChild(renameBtn);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "row-icon-btn row-delete-btn";
    delBtn.title = t("layout.pages.delete") || "Delete";
    delBtn.textContent = "✕";
    delBtn.setAttribute("aria-label", t("layout.pages.delete") || "Delete");
    delBtn.onclick = (ev) => {
      ev.stopPropagation();
      editor.selectedPageId = page.id;
      deletePage();
    };
    actions.appendChild(delBtn);

    li.appendChild(actions);
    el.pagesList.appendChild(li);
  }
  renderPagesMini();
}

function startInlinePageRename(li, labelSpan, page) {
  if (!li || !page) return;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "row-rename-input";
  input.value = page.title || page.id;
  input.maxLength = 63;

  const commit = (save) => {
    if (save) {
      const next = input.value.trim();
      page.title = next || page.id;
      if (isEnergyPage(page)) {
        applyEnergyPageConfig({ render: false });
      } else if (isMusicPage(page)) {
        normalizeMusicConfig(page);
      } else if (isRadioPage(page)) {
        normalizeRadioConfig(page);
      }
    }
    renderAll();
  };

  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      commit(false);
    }
  };
  input.onblur = () => commit(true);

  li.replaceChild(input, labelSpan);
  input.focus();
  input.select();
}

function renderPagesMini() {
  if (!el.pagesMiniList) return;
  el.pagesMiniList.innerHTML = "";
  for (const page of editor.layout.pages) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mini-page-btn ${page.id === editor.selectedPageId ? "active" : ""}`;
    button.textContent = `${isEnergyPage(page) ? "E " : isXiaozhiPage(page) ? "X " : isRadioPage(page) ? "R " : isMusicPage(page) ? "M " : isWeatherPage(page) ? "W " : ""}${page.title || page.id}`;
    button.title = `${page.title || page.id} [${page.id}]`;
    button.onclick = () => {
      editor.selectedPageId = page.id;
      editor.selectedWidgetId = null;
      renderAll();
    };
    el.pagesMiniList.appendChild(button);
  }
}

function renderPageEditor() {
  const page = selectedPage();
  if (!page) {
    el.pageTitleInput.value = "";
    el.pageTitleInput.disabled = true;
    el.applyPageBtn.disabled = true;
    if (el.energyPageOptions) {
      el.energyPageOptions.classList.add("hidden");
    }
    if (el.musicPageOptions) {
      el.musicPageOptions.classList.add("hidden");
    }
    if (el.radioPageOptions) {
      el.radioPageOptions.classList.add("hidden");
    }
    if (el.weatherPageOptions) {
      el.weatherPageOptions.classList.add("hidden");
    }
    clearPageLookInspector();
    return;
  }
  el.pageTitleInput.disabled = false;
  el.applyPageBtn.disabled = false;
  el.pageTitleInput.value = page.title || page.id;

  const energyPage = isEnergyPage(page);
  const musicPage = isMusicPage(page);
  const radioPage = isRadioPage(page);
  if (el.energyPageOptions) {
    el.energyPageOptions.classList.toggle("hidden", !energyPage);
  }
  if (el.musicPageOptions) {
    el.musicPageOptions.classList.toggle("hidden", !musicPage);
  }
  if (el.radioPageOptions) {
    el.radioPageOptions.classList.toggle("hidden", !radioPage);
  }
  if (el.weatherPageOptions) {
    el.weatherPageOptions.classList.toggle("hidden", !isWeatherPage(page));
  }
  renderPageLookInspector(page);
  if (energyPage) {
    normalizeEnergyConfig(page);
    if (el.energySource) {
      el.energySource.value = page.energy.source || ENERGY_SOURCE_HA;
    }
    updateEnergySourceUi(page.energy.source);
    const inputs = getEnergyInputs();
    for (const key of ENERGY_ENTITY_KEYS) {
      if (inputs[key]) {
        inputs[key].value = page.energy[key] || "";
      }
    }
  }
  if (musicPage) {
    normalizeMusicConfig(page);
    if (el.musicPlayerEntity) {
      el.musicPlayerEntity.value = page.music.player_entity_id || "";
    }
    if (el.musicPlayers) {
      el.musicPlayers.value = (page.music.players || []).join(", ");
    }
  }
  if (radioPage) {
    normalizeRadioConfig(page);
    if (el.radioPlayerEntity) {
      el.radioPlayerEntity.value = page.radio.entity || "";
    }
    if (el.radioColumns) {
      el.radioColumns.value = String(page.radio.columns || RADIO_COLUMNS_DEFAULT);
    }
    renderRadioStationRows(page, true);
  }
}

function updateEnergySourceUi(source) {
  const checkedSource = ENERGY_SOURCES.has(source) ? source : ENERGY_SOURCE_HA;
  const isManual = checkedSource === ENERGY_SOURCE_MANUAL;
  if (el.energyManualOptions) {
    el.energyManualOptions.classList.toggle("hidden", !isManual);
  }
  if (el.energySourceHint) {
    el.energySourceHint.textContent = t(isManual ? "layout.energy.source_hint_manual" : "layout.energy.source_hint_ha");
  }
}

function renderWidgets() {
  const page = selectedPage();
  el.widgetsList.innerHTML = "";
  if (!page) return;

  const energyPage = isEnergyPage(page);
  const musicPage = isMusicPage(page);
  const radioPage = isRadioPage(page);
  const dedicatedPage = energyPage || musicPage || radioPage || !pageAcceptsWidgets(page);
  const addButtons = [
    el.addSensorBtn,
    el.addBinarySensorBtn,
    el.addButtonBtn,
    el.addSliderBtn,
    el.addGraphBtn,
    el.addEmptyTileBtn,
    el.addLightTileBtn,
    el.addHeatingTileBtn,
    el.addWeatherTileBtn,
    el.addWeather3DayBtn,
    el.addTodoListBtn,
    el.addMediaPlayerBtn,
    el.addCoverBtn,
    el.addLockBtn,
    el.addFanBtn,
    el.addSelectBtn,
    el.addNumberBtn,
    el.addClockBtn,
  ];
  for (const button of addButtons) {
    if (button) button.disabled = dedicatedPage;
  }
  if (el.openSetupWizardBtn) {
    el.openSetupWizardBtn.disabled = dedicatedPage;
  }
  if (el.deleteWidgetBtn) {
    el.deleteWidgetBtn.disabled = dedicatedPage || !editor.selectedWidgetId;
  }

  if (dedicatedPage) {
    const li = document.createElement("li");
    li.className = "list-item muted";
    li.textContent = t(
      isXiaozhiPage(page)
        ? "layout.status.xiaozhi_page_only"
        : radioPage
          ? "layout.radio.no_widgets"
          : musicPage
            ? "layout.music.no_widgets"
            : "layout.energy.no_widgets",
    );
    el.widgetsList.appendChild(li);
    return;
  }

  for (const widget of page.widgets) {
    const li = document.createElement("li");
    li.className = `list-item ${widget.id === editor.selectedWidgetId ? "active selected" : ""}`;

    const label = document.createElement("span");
    label.className = "list-item-label";
    label.textContent = `${widgetDisplayLabel(widget)}`;
    label.title = `[${widget.id}] ${widget.type}`;
    li.appendChild(label);
    li.onclick = () => {
      editor.selectedWidgetId = widget.id;
      renderAll();
    };

    const actions = document.createElement("span");
    actions.className = "row-actions";
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "row-icon-btn row-delete-btn";
    delBtn.title = t("layout.widgets.delete") || "Delete";
    delBtn.textContent = "✕";
    delBtn.setAttribute("aria-label", t("layout.widgets.delete") || "Delete");
    delBtn.onclick = (ev) => {
      ev.stopPropagation();
      editor.selectedWidgetId = widget.id;
      if (typeof el.deleteWidgetBtn?.click === "function") {
        el.deleteWidgetBtn.click();
      }
    };
    actions.appendChild(delBtn);
    li.appendChild(actions);

    el.widgetsList.appendChild(li);
  }
}

function widgetDisplayLabel(widget) {
  const title = (widget.title || "").trim();
  if (title) return `${title} · ${widget.type}`;
  return `${widget.type} [${widget.id}]`;
}

function geometryStyle(node, rect) {
  node.style.left = `${rect.x}px`;
  node.style.top = `${rect.y}px`;
  node.style.width = `${rect.w}px`;
  node.style.height = `${rect.h}px`;
}

function selectWidgetLive(widgetId, selectedBox) {
  editor.selectedWidgetId = widgetId;
  document.querySelectorAll(".widget-box.selected").forEach((node) => node.classList.remove("selected"));
  if (selectedBox) {
    selectedBox.classList.add("selected");
  }
  renderWidgets();
  renderInspector();
}

function attachDragAndResize(box, widget) {
  const startMove = (mode, downEvent, captureTarget) => {
    downEvent.preventDefault();
    downEvent.stopPropagation();
    const startX = downEvent.clientX;
    const startY = downEvent.clientY;
    const startRect = { ...widget.rect };
    const pointerId = downEvent.pointerId;
    let moved = false;
    let finished = false;

    // Capture all subsequent pointer events on this element so they don't get
    // hijacked by native drag, hover over iframes/images, or focus changes.
    try { captureTarget.setPointerCapture(pointerId); } catch (_) { /* ignore */ }

    // Suppress full canvas re-renders triggered by HA state pushes / other
    // async events while the user is interacting with the tile.
    editor.canvasInteractionActive = true;
    editor.canvasRenderPending = false;

    box.classList.add(mode === "drag" ? "dragging" : "resizing");

    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const limits = widgetSizeLimits(widget.type);
      const maxW = Math.min(limits.maxW, CANVAS_WIDTH);
      const maxH = Math.min(limits.maxH, CANVAS_HEIGHT);
      const minW = Math.min(limits.minW, maxW);
      const minH = Math.min(limits.minH, maxH);
      let nextX = widget.rect.x;
      let nextY = widget.rect.y;
      let nextW = widget.rect.w;
      let nextH = widget.rect.h;

      if (mode === "drag") {
        nextX = clamp(snap(startRect.x + dx), 0, CANVAS_WIDTH - startRect.w);
        nextY = clamp(snap(startRect.y + dy), 0, CANVAS_HEIGHT - startRect.h);
      } else {
        nextW = clamp(snap(startRect.w + dx), minW, Math.min(maxW, CANVAS_WIDTH - startRect.x));
        nextH = clamp(snap(startRect.h + dy), minH, Math.min(maxH, CANVAS_HEIGHT - startRect.y));
      }

      if (nextX !== widget.rect.x || nextY !== widget.rect.y || nextW !== widget.rect.w || nextH !== widget.rect.h) {
        moved = true;
        widget.rect.x = nextX;
        widget.rect.y = nextY;
        widget.rect.w = nextW;
        widget.rect.h = nextH;
        geometryStyle(box, widget.rect);
        renderInspector();
      }
    };

    const cleanup = () => {
      if (finished) return;
      finished = true;
      captureTarget.removeEventListener("pointermove", onMove);
      captureTarget.removeEventListener("pointerup", onUp);
      captureTarget.removeEventListener("pointercancel", onUp);
      captureTarget.removeEventListener("lostpointercapture", onUp);
      try { captureTarget.releasePointerCapture(pointerId); } catch (_) { /* ignore */ }
      box.classList.remove("dragging");
      box.classList.remove("resizing");
      editor.canvasInteractionActive = false;
      const hadPendingRender = editor.canvasRenderPending;
      editor.canvasRenderPending = false;
      if (moved) {
        renderWidgets();
        renderInspector();
      }
      if (hadPendingRender) {
        // Flush any canvas updates that async events requested while we were
        // dragging (e.g. HA state pushes). The geometry is already live via
        // geometryStyle(), so this only matters for content changes.
        renderCanvas();
      }
    };

    const onUp = (upEvent) => {
      if (upEvent && upEvent.pointerId !== undefined && upEvent.pointerId !== pointerId) return;
      cleanup();
    };

    captureTarget.addEventListener("pointermove", onMove);
    captureTarget.addEventListener("pointerup", onUp);
    captureTarget.addEventListener("pointercancel", onUp);
    captureTarget.addEventListener("lostpointercapture", onUp);
  };

  box.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.target.classList.contains("resize-handle")) return;
    selectWidgetLive(widget.id, box);
    startMove("drag", event, box);
  });

  const resizeHandle = box.querySelector(".resize-handle");
  resizeHandle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    selectWidgetLive(widget.id, box);
    startMove("resize", event, resizeHandle);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function energyPreviewSensorCount(count) {
  return t(count === 1 ? "layout.energy.sensor_count_one" : "layout.energy.sensor_count_many", { count });
}

function energyPreviewEntityLabel(entityId) {
  return escapeHtml(entityId || t("layout.energy.no_sensor"));
}

function energyPreviewNodeMarkup(id, label, value, style = "") {
  const styleAttr = style ? ` style="${escapeHtml(style)}"` : "";
  return `<div class="energy-preview-node ${id}"${styleAttr}><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function energyPreviewLabelMarkup(id, title, detail) {
  return `<div class="energy-preview-label ${id}"><strong>${escapeHtml(title)}</strong><small>${energyPreviewEntityLabel(detail)}</small></div>`;
}

function energyPreviewNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function energyPreviewPositive(value) {
  const n = energyPreviewNumber(value);
  return n === null ? 0 : Math.max(n, 0);
}

function energyPreviewFormatValue(value, unit = "") {
  const n = energyPreviewNumber(value);
  const suffix = String(unit || "").trim();
  if (n === null) return suffix ? `-- ${suffix}` : "--";
  const abs = Math.abs(n);
  const decimals = abs === 0 || abs >= 100 ? 0 : 1;
  const text = n.toFixed(decimals);
  return suffix ? `${text} ${suffix}` : text;
}

function energyPreviewFormatKwh(value) {
  return energyPreviewFormatValue(value, "kWh");
}

function energyPreviewComputeFlows(snapshot) {
  let fromGrid = energyPreviewPositive(snapshot?.from_grid_kwh);
  let toGrid = energyPreviewPositive(snapshot?.to_grid_kwh);
  let solar = energyPreviewPositive(snapshot?.solar_kwh);
  let toBattery = energyPreviewPositive(snapshot?.to_battery_kwh);
  let fromBattery = energyPreviewPositive(snapshot?.from_battery_kwh);
  const out = {
    usedSolar: 0,
    usedGrid: 0,
    usedBattery: 0,
    usedTotal: fromGrid + solar + fromBattery - toGrid - toBattery,
    gridToBattery: 0,
    batteryToGrid: 0,
    solarToBattery: 0,
    solarToGrid: 0,
  };
  let remaining = Math.max(out.usedTotal, 0);

  const gridToBattery = Math.max(0, Math.min(toBattery, fromGrid - remaining));
  out.gridToBattery += gridToBattery;
  toBattery -= gridToBattery;
  fromGrid -= gridToBattery;

  out.solarToBattery = Math.min(solar, toBattery);
  toBattery -= out.solarToBattery;
  solar -= out.solarToBattery;

  out.solarToGrid = Math.min(solar, toGrid);
  toGrid -= out.solarToGrid;
  solar -= out.solarToGrid;

  out.batteryToGrid = Math.min(fromBattery, toGrid);
  fromBattery -= out.batteryToGrid;
  toGrid -= out.batteryToGrid;

  const secondGridToBattery = Math.min(fromGrid, toBattery);
  out.gridToBattery += secondGridToBattery;
  fromGrid -= secondGridToBattery;
  toBattery -= secondGridToBattery;

  out.usedSolar = Math.min(remaining, solar);
  remaining -= out.usedSolar;
  out.usedBattery = Math.min(fromBattery, remaining);
  remaining -= out.usedBattery;
  out.usedGrid = Math.min(remaining, fromGrid);
  return out;
}

function energyPreviewHomeRingStyle(flows) {
  const parts = [
    { color: ENERGY_PREVIEW_COLORS.solar, value: energyPreviewPositive(flows?.usedSolar) },
    { color: ENERGY_PREVIEW_COLORS.battery, value: energyPreviewPositive(flows?.usedBattery) },
    { color: ENERGY_PREVIEW_COLORS.grid, value: energyPreviewPositive(flows?.usedGrid) },
  ].filter((part) => part.value > 0.001);
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (total <= 0.001 || parts.length === 0) {
    return `--energy-home-ring: ${ENERGY_PREVIEW_COLORS.idle} 0deg 360deg;`;
  }

  let start = 0;
  const segments = parts.map((part, index) => {
    if (index === parts.length - 1) {
      return `${part.color} ${start}deg 360deg`;
    }
    const remainingSegments = parts.length - index - 1;
    const maxEnd = 360 - remainingSegments;
    let end = Math.round(start + (part.value / total) * 360);
    end = Math.max(start + 1, Math.min(maxEnd, end));
    const segment = `${part.color} ${start}deg ${end}deg`;
    start = end;
    return segment;
  });
  return `--energy-home-ring: ${segments.join(", ")};`;
}

function energyPreviewFlowMarkup(id, visible, path, dot) {
  if (!visible) return "";
  const dotMarkup = dot ? `<circle class="dot ${id}" cx="${dot[0]}" cy="${dot[1]}" r="5" />` : "";
  return `<path class="flow ${id}" d="${path}" />${dotMarkup}`;
}

function renderEnergyCanvasPreview(page) {
  const compact = isCompactCanvas();
  const energy = page.energy || {};
  const source = energy.source === ENERGY_SOURCE_MANUAL ? ENERGY_SOURCE_MANUAL : ENERGY_SOURCE_HA;
  const isManual = source === ENERGY_SOURCE_MANUAL;
  const configured = ENERGY_ENTITY_KEYS.filter((key) => energy[key]).length;
  const autoLabel = t("layout.energy.preview_auto");
  const headerBadge = isManual ? energyPreviewSensorCount(configured) : t("layout.energy.preview_source_ha");
  const snapshot = !isManual && editor.energySnapshot?.available === true ? editor.energySnapshot : null;
  const snapshotFlows = snapshot ? energyPreviewComputeFlows(snapshot) : null;
  const solarEntity = isManual ? energy.solar_power_entity_id : autoLabel;
  const gridEntity = isManual
    ? (energy.grid_power_entity_id || energy.grid_import_power_entity_id || energy.grid_export_power_entity_id)
    : autoLabel;
  const homeEntity = isManual ? energy.home_power_entity_id : autoLabel;
  const batteryEntity = isManual
    ? (energy.battery_power_entity_id || energy.battery_charge_power_entity_id ||
      energy.battery_discharge_power_entity_id || energy.battery_soc_entity_id)
    : autoLabel;
  const nodes = isManual ? {
    lowCarbon: false,
    solar: !!solarEntity,
    gas: false,
    grid: !!gridEntity,
    home: !!homeEntity || configured > 0,
    battery: !!batteryEntity,
    water: false,
  } : {
    lowCarbon: false,
    solar: snapshot?.has_solar === true,
    gas: snapshot?.has_gas === true,
    grid: snapshot?.has_grid === true,
    home: true,
    battery: snapshot?.has_battery === true,
    water: snapshot?.has_water === true,
  };
  if (isManual && configured === 0) {
    nodes.home = true;
  }
  const homeValue = snapshot ? energyPreviewFormatKwh(Math.max(snapshotFlows?.usedTotal || 0, 0)) : (isManual ? "-- W" : "-- kWh");
  const solarValue = snapshot ? energyPreviewFormatKwh(snapshot.solar_kwh) : (isManual ? "-- W" : "-- kWh");
  const gridImport = energyPreviewPositive(snapshot?.from_grid_kwh);
  const gridExport = energyPreviewPositive(snapshot?.to_grid_kwh);
  const gridValue = snapshot
    ? `${gridExport > gridImport && gridExport > 0.01 ? "out" : "in"} ${energyPreviewFormatKwh(Math.max(gridImport, gridExport))}`
    : (isManual ? "-- W" : "-- kWh");
  const batteryCharge = energyPreviewPositive(snapshot?.to_battery_kwh);
  const batteryDischarge = energyPreviewPositive(snapshot?.from_battery_kwh);
  const batteryValue = snapshot
    ? `${batteryCharge > batteryDischarge && batteryCharge > 0.01 ? "chg" : "out"} ${energyPreviewFormatKwh(Math.max(batteryCharge, batteryDischarge))}`
    : (isManual ? "--%" : "-- kWh");
  const gasValue = snapshot ? energyPreviewFormatValue(snapshot.gas_value, snapshot.gas_unit) : "--";
  const waterValue = snapshot ? energyPreviewFormatValue(snapshot.water_value, snapshot.water_unit) : "--";
  const homeRingStyle = energyPreviewHomeRingStyle(snapshotFlows);
  const flows = (compact ? [
    energyPreviewFlowMarkup("low-carbon", nodes.lowCarbon && nodes.grid, "M76 126 V162", [76, 150]),
    energyPreviewFlowMarkup("solar-return", nodes.solar && nodes.grid, "M225 125 V169 A24 24 0 0 1 201 193 H119", [174, 193]),
    energyPreviewFlowMarkup("solar", nodes.solar && nodes.home, "M255 125 V169 A24 24 0 0 0 279 193 H356", [318, 193]),
    energyPreviewFlowMarkup("battery-in", nodes.solar && nodes.battery, "M240 125 V247", [240, 186]),
    energyPreviewFlowMarkup("grid", nodes.grid && nodes.home, "M119 205 H356", [238, 205]),
    energyPreviewFlowMarkup("battery-out", nodes.battery && nodes.home, "M255 247 V241 A24 24 0 0 0 279 217 H356", [310, 217]),
    energyPreviewFlowMarkup("return", nodes.grid && nodes.battery, "M119 217 H201 A24 24 0 0 1 225 241 V247", [176, 217]),
    energyPreviewFlowMarkup("gas", nodes.gas && nodes.home, "M404 125 V157", [404, 145]),
    energyPreviewFlowMarkup("water", nodes.water && nodes.home, "M404 247 V253", [404, 250]),
  ] : [
    energyPreviewFlowMarkup("low-carbon", nodes.lowCarbon && nodes.grid, "M96 190 V282", [96, 254]),
    energyPreviewFlowMarkup("solar-return", nodes.solar && nodes.grid, "M312 190 V286 A40 40 0 0 1 272 326 H150", [250, 326]),
    energyPreviewFlowMarkup("solar", nodes.solar && nodes.home, "M312 190 V286 A40 40 0 0 0 352 326 H522", [402, 326]),
    energyPreviewFlowMarkup("battery-in", nodes.solar && nodes.battery, "M312 190 V452", [312, 312]),
    energyPreviewFlowMarkup("grid", nodes.grid && nodes.home, "M150 346 H522", [244, 346]),
    energyPreviewFlowMarkup("battery-out", nodes.battery && nodes.home, "M336 452 V386 A40 40 0 0 1 376 346 H522", [394, 346]),
    energyPreviewFlowMarkup("return", nodes.grid && nodes.battery, "M150 368 H272 A40 40 0 0 1 312 408 V452", [216, 368]),
    energyPreviewFlowMarkup("gas", nodes.gas && nodes.home, "M528 190 V282", [528, 254]),
    energyPreviewFlowMarkup("water", nodes.water && nodes.home, "M528 452 V402", [528, 426]),
  ]).join("");
  const nodeMarkup = [
    nodes.lowCarbon ? energyPreviewNodeMarkup("low-carbon", "LC", "-- kWh") : "",
    nodes.solar ? energyPreviewNodeMarkup("solar", "PV", solarValue) : "",
    nodes.gas ? energyPreviewNodeMarkup("gas", "GAS", gasValue) : "",
    nodes.grid ? energyPreviewNodeMarkup("grid", "GRID", gridValue) : "",
    nodes.home ? energyPreviewNodeMarkup("home", "HOME", homeValue, homeRingStyle) : "",
    nodes.battery ? energyPreviewNodeMarkup("battery", "BAT", batteryValue) : "",
    nodes.water ? energyPreviewNodeMarkup("water", "H2O", waterValue) : "",
  ].join("");
  const labelMarkup = [
    nodes.lowCarbon ? energyPreviewLabelMarkup("low-carbon", t("layout.energy.low_carbon"), autoLabel) : "",
    nodes.solar ? energyPreviewLabelMarkup("solar", t("layout.energy.solar"), solarEntity) : "",
    nodes.gas ? energyPreviewLabelMarkup("gas", t("layout.energy.gas"), autoLabel) : "",
    nodes.grid ? energyPreviewLabelMarkup("grid", t("layout.energy.grid"), gridEntity) : "",
    nodes.home ? energyPreviewLabelMarkup("home", t("layout.energy.home"), homeEntity) : "",
    nodes.battery ? energyPreviewLabelMarkup("battery", t("layout.energy.battery"), batteryEntity) : "",
    nodes.water ? energyPreviewLabelMarkup("water", t("layout.energy.water"), autoLabel) : "",
  ].join("");
  const node = document.createElement("div");
  node.className = compact ? "energy-page-preview compact" : "energy-page-preview";
  const viewBox = compact ? "0 0 480 360" : "0 0 720 600";
  node.innerHTML = `
    <div class="energy-preview-card">
      <div class="energy-preview-heading">
        <strong>${escapeHtml(t("layout.energy.preview_title"))}</strong>
        <span>${escapeHtml(headerBadge)}</span>
      </div>
      <svg class="energy-preview-flow" viewBox="${viewBox}" aria-hidden="true">
        ${flows}
      </svg>
      ${nodeMarkup}
      ${labelMarkup}
    </div>
  `;
  el.canvas.appendChild(node);
}

function renderMusicCanvasPreview(page) {
  normalizeMusicConfig(page);
  const music = page.music || defaultMusicConfig();
  const player = music.player_entity_id || "";
  const playersText = music.players && music.players.length
    ? music.players.join(", ")
    : t("layout.music.preview_auto", {}, "auto-discover");
  const compact = isCompactCanvas();
  const node = document.createElement("div");
  node.className = compact ? "music-page-preview compact" : "music-page-preview";
  node.innerHTML = `
    <div class="music-preview-card">
      <div class="music-preview-heading">
        <strong>${escapeHtml(t("layout.music.preview_title"))}</strong>
        <span>${escapeHtml(t("layout.music.preview_subtitle"))}</span>
      </div>
      <div class="music-preview-player">${escapeHtml(player || playersText)}</div>
      <div class="music-preview-art">
        <div class="music-preview-cover">♪</div>
        <div class="music-preview-lines">
          <div class="music-preview-title">${escapeHtml(t("layout.music.preview_title"))}</div>
          <div class="music-preview-artist">Music Assistant</div>
          <div class="music-preview-controls"><span>⏮</span><span class="play">▶</span><span>⏭</span></div>
        </div>
      </div>
      <div class="music-preview-progress"><div class="music-preview-fill"></div></div>
      <div class="music-preview-times"><span>0:00</span><span>0:00</span></div>
      <div class="music-preview-volume"><span>🔊</span><div class="music-preview-track"><div class="music-preview-trackfill"></div></div></div>
    </div>
  `;
  el.canvas.appendChild(node);
}

function buildRadioPreviewNode(page) {
  normalizeRadioConfig(page);
  const radio = page.radio || defaultRadioConfig();
  const stations = radio.stations || [];
  const columns = clampInt(radio.columns, RADIO_COLUMNS_MIN, RADIO_COLUMNS_MAX, RADIO_COLUMNS_DEFAULT);
  const compact = isCompactCanvas();
  const node = document.createElement("div");
  node.className = compact ? "radio-page-preview compact" : "radio-page-preview";

  const header = document.createElement("div");
  header.className = "radio-preview-header";
  const now = document.createElement("div");
  now.className = "radio-preview-now";
  const nowTitle = document.createElement("strong");
  nowTitle.textContent = t("layout.radio.preview_title");
  const nowState = document.createElement("span");
  nowState.textContent = t("layout.radio.preview_subtitle");
  now.appendChild(nowTitle);
  now.appendChild(nowState);
  const entity = document.createElement("div");
  entity.className = "radio-preview-entity";
  entity.textContent = radio.entity || t("layout.radio.preview_defaults");
  header.appendChild(now);
  header.appendChild(entity);

  const card = document.createElement("div");
  card.className = "radio-preview-card";
  card.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "radio-preview-grid";
  grid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  if (stations.length) {
    const shown = stations.slice(0, RADIO_MAX_PREVIEW_TILES);
    shown.forEach((station, index) => {
      const tile = document.createElement("div");
      tile.className = index === 0 ? "radio-preview-tile active" : "radio-preview-tile";
      tile.textContent = station.name || station.url || "";
      grid.appendChild(tile);
    });
    const hidden = stations.length - shown.length;
    if (hidden > 0) {
      const more = document.createElement("div");
      more.className = "radio-preview-tile more";
      more.textContent = t("layout.radio.preview_more", { count: hidden });
      grid.appendChild(more);
    }
  } else {
    const empty = document.createElement("div");
    empty.className = "radio-preview-empty";
    empty.textContent = t("layout.radio.preview_defaults");
    grid.appendChild(empty);
  }
  card.appendChild(grid);

  const footer = document.createElement("div");
  footer.className = "radio-preview-footer";
  const volIcon = document.createElement("span");
  volIcon.className = "radio-preview-vol-icon";
  volIcon.textContent = "\u{1F50A}";
  const track = document.createElement("div");
  track.className = "radio-preview-track";
  const fill = document.createElement("div");
  fill.className = "radio-preview-trackfill";
  track.appendChild(fill);
  const vol = document.createElement("span");
  vol.className = "radio-preview-vol";
  vol.textContent = "45%";
  const stop = document.createElement("span");
  stop.className = "radio-preview-stop";
  stop.textContent = "STOP";
  footer.appendChild(volIcon);
  footer.appendChild(track);
  footer.appendChild(vol);
  footer.appendChild(stop);
  card.appendChild(footer);

  node.appendChild(card);
  return node;
}

function renderRadioCanvasPreview(page) {
  el.canvas.appendChild(buildRadioPreviewNode(page));
}

function refreshRadioPreviewForPage(page) {
  if (!page || !isRadioPage(page)) return;
  const preview = el.canvas?.querySelector(".radio-page-preview");
  if (!preview) return;
  if (selectedPage()?.id !== page.id || editor.activePane === "settings") return;
  syncRadioStationRows(page);
  preview.replaceWith(buildRadioPreviewNode(page));
}

function renderCanvas() {
  if (editor.activePane === "settings") {
    setActiveSettingsSection(editor.activeSettingsSection);
    return;
  }
  // While the user is actively dragging or resizing a tile we must not rebuild
  // the canvas DOM — doing so would destroy the element that owns the pointer
  // capture and cause the drag to "let go" mid-motion. Remember that a render
  // was requested and replay it once the interaction ends.
  if (editor.canvasInteractionActive) {
    editor.canvasRenderPending = true;
    return;
  }
  const page = selectedPage();
  el.canvas.innerHTML = "";
  if (!page) {
    el.canvasTitle.textContent = t("layout.canvas.title");
    applyPageLookPreview(null);
    return;
  }

  el.canvasTitle.textContent = `${t("layout.canvas.title")}: ${page.title || page.id}`;
  applyPageLookPreview(page);

  if (isEnergyPage(page)) {
    renderEnergyCanvasPreview(page);
    return;
  }

  if (isXiaozhiPage(page)) {
    const note = document.createElement("div");
    note.className = "canvas-empty-note";
    note.textContent = t("layout.status.xiaozhi_page_locked");
    el.canvas.appendChild(note);
    return;
  }

  if (isMusicPage(page)) {
    renderMusicCanvasPreview(page);
    return;
  }

  if (isRadioPage(page)) {
    renderRadioCanvasPreview(page);
    return;
  }

  for (const widget of page.widgets) {
    const box = document.createElement("div");
    const isEmptyTile = widget.type === "empty_tile";
    const isBinarySensor = widget.type === "binary_sensor";
    const isPresence = widget.type === "presence";
    const isClockAlarmTile = widget.type === "clock_alarm";
    const isTimerTile = widget.type === "timer_tile";
    const isSensorTile = widget.type === "sensor_tile";
    const isMediaPlayerButton = widget.type === "button" && String(widget.entity_id || "").startsWith("media_player.");
    let previewTitle = (isMediaPlayerButton && !String(widget.title || "").trim()) ? "" : (widget.title || widget.id);
    if (isBinarySensor && !normalizeBoolDefaultTrue(widget.binary_show_title)) {
      previewTitle = "";
    }
    box.className = `widget-box ${isEmptyTile ? "empty-tile" : ""} ${widget.id === editor.selectedWidgetId ? "selected" : ""}`;
    box.dataset.widgetId = widget.id;
    box.style.zIndex = isEmptyTile ? "1" : "10";
    let previewState = isEmptyTile
      ? "design"
      : isClockAlarmTile
        ? clockPreviewState()
        : (isTimerTile && !String(widget.entity_id || "").trim())
          ? "timer"
          : isSensorTile
            ? sensorTilePreviewState(widget)
            : (editor.states.get(widget.entity_id) || "unavailable");
    let previewStateColor = "";
    if (isBinarySensor) {
      const rawState = editor.states.get(widget.entity_id);
      if (rawState === "on") {
        previewState = normalizeBinaryText(widget.binary_text_on) || "ON";
        previewStateColor = normalizeHexColor(widget.binary_color_on, "");
      } else if (rawState === "off") {
        previewState = normalizeBinaryText(widget.binary_text_off) || "OFF";
        previewStateColor = normalizeHexColor(widget.binary_color_off, "");
      } else {
        previewState = rawState || "unavailable";
      }
    }
    if (isPresence) {
      const rawState = editor.states.get(widget.entity_id);
      if (rawState === "home") {
        previewState = t("layout.widgets.presence_home", {}, "HOME");
      } else if (rawState === "not_home") {
        previewState = t("layout.widgets.presence_away", {}, "AWAY");
      } else {
        previewState = rawState || "unavailable";
      }
    }
    let extraHint = "";
    if (widget.type === "weather_3day") {
      /* Mirrors the firmware layout in w_weather_tile.c:
       *   compact/panels3: ROWS_TOP=108, BOTTOM_PAD=12, ROW_HEIGHT=36, ROW_GAP=2
       *   default:         ROWS_TOP=150, BOTTOM_PAD=12, ROW_HEIGHT=44, ROW_GAP=4
       *   visible rows = clamp(floor((h-162+4)/48), 2, 6)
       *   forecast days = visible rows - 1 (the "Now" row).
       * Keep these constants in sync when the tile layout changes. */
      const h = Number(widget.rect && widget.rect.h) || 0;
      const compactForecast = isCompactCanvas();
      const rowsTop = compactForecast ? 108 : 150;
      const rowHeight = compactForecast ? 36 : 44;
      const rowGap = compactForecast ? 2 : 4;
      const avail = h - rowsTop - 12;
      let rows = 2;
      if (avail > rowHeight) {
        rows = Math.floor((avail + rowGap) / (rowHeight + rowGap));
      }
      if (rows < 2) rows = 2;
      if (rows > 6) rows = 6;
      const days = rows - 1;
      extraHint = `<div class="w-hint">forecast days ${days}/5</div>`;
    }
    box.innerHTML = `
      <div class="w-type">${widget.type}</div>
      <div class="w-title">${previewTitle}</div>
      <div class="w-state"${previewStateColor ? ` style="color:${previewStateColor}"` : ""}>${previewState}</div>
      ${extraHint}
      <div class="resize-handle"></div>
    `;
    geometryStyle(box, widget.rect);
    applyTileLookPreview(box, widget);
    attachDragAndResize(box, widget);
    el.canvas.appendChild(box);
  }
}

function renderInspector() {
  const widget = selectedWidget();
  if (!widget) {
    el.fTitle.value = "";
    el.fType.value = "sensor";
    el.fEntity.value = "";
    el.fSecondaryEntity.value = "";
    el.fX.value = "";
    el.fY.value = "";
    el.fW.value = "";
    el.fH.value = "";
    if (el.buttonOptions) {
      el.buttonOptions.classList.add("hidden");
    }
    if (el.sliderOptions) {
      el.sliderOptions.classList.add("hidden");
    }
    if (el.graphOptions) {
      el.graphOptions.classList.add("hidden");
    }
    if (el.fSliderDirection) {
      el.fSliderDirection.value = DEFAULT_SLIDER_DIRECTION;
    }
    if (el.fSliderEntityDomain) {
      el.fSliderEntityDomain.value = DEFAULT_SLIDER_ENTITY_DOMAIN;
    }
    if (el.fButtonAccentColor) {
      el.fButtonAccentColor.value = DEFAULT_BUTTON_ACCENT_COLOR;
    }
    if (el.fButtonMode) {
      el.fButtonMode.value = DEFAULT_BUTTON_MODE;
    }
    if (el.fButtonStyle) {
      el.fButtonStyle.value = "";
    }
    if (el.fSliderAccentColor) {
      el.fSliderAccentColor.value = DEFAULT_SLIDER_ACCENT_COLOR;
    }
    if (el.fGraphLineColor) {
      el.fGraphLineColor.value = DEFAULT_GRAPH_LINE_COLOR;
    }
    if (el.fGraphTimeWindowMin) {
      el.fGraphTimeWindowMin.value = String(DEFAULT_GRAPH_TIME_WINDOW_MIN);
    }
    if (el.fGraphPointCount) {
      el.fGraphPointCount.value = "";
    }
    if (el.fGraphDisplayMode) {
      el.fGraphDisplayMode.value = DEFAULT_GRAPH_DISPLAY_MODE;
    }
    if (el.fGraphBarBucketMin) {
      el.fGraphBarBucketMin.value = String(DEFAULT_GRAPH_BAR_BUCKET_MIN);
    }
    if (el.fGraphBarBucketMinWrap) {
      el.fGraphBarBucketMinWrap.classList.add("hidden");
    }
    if (el.heatingOptions) {
      el.heatingOptions.classList.add("hidden");
    }
    if (el.fHeatingStyleVariant) {
      el.fHeatingStyleVariant.value = "default";
    }
    if (el.fHeatingArcOpening) {
      el.fHeatingArcOpening.value = "left";
    }
    if (el.fHeatingArcOpeningWrap) {
      el.fHeatingArcOpeningWrap.classList.add("hidden");
    }
    if (el.binaryOptions) {
      el.binaryOptions.classList.add("hidden");
    }
    if (el.fBinaryShowTitle) {
      el.fBinaryShowTitle.checked = true;
    }
    if (el.fBinaryColorOn) {
      el.fBinaryColorOn.value = "";
    }
    if (el.fBinaryColorOff) {
      el.fBinaryColorOff.value = "";
    }
    if (el.fBinaryTextOn) {
      el.fBinaryTextOn.value = "";
    }
    if (el.fBinaryTextOff) {
      el.fBinaryTextOff.value = "";
    }
    if (el.sensorOptions) {
      el.sensorOptions.classList.add("hidden");
    }
    if (el.fSensorValueColor) {
      el.fSensorValueColor.value = "";
    }
    if (el.sensorTileOptions) {
      el.sensorTileOptions.classList.add("hidden");
    }
    if (el.fSensorTileEntityIds) {
      el.fSensorTileEntityIds.value = "";
    }
    if (el.clockOptions) {
      el.clockOptions.classList.add("hidden");
    }
    resetClockInspectorFields();
    clearTileLookInspector();
    renderEntityOptions();
    return;
  }
  el.fTitle.value = widget.title || "";
  el.fType.value = widget.type;
  el.fEntity.value = widget.entity_id || "";
  el.fSecondaryEntity.value = widget.secondary_entity_id || "";
  el.fX.value = widget.rect.x;
  el.fY.value = widget.rect.y;
  el.fW.value = widget.rect.w;
  el.fH.value = widget.rect.h;

  const isButton = widget.type === "button";
  const isSlider = widget.type === "slider";
  const isGraph = widget.type === "graph";
  const isHeating = widget.type === "heating_tile";
  const isBinary = widget.type === "binary_sensor";
  const isAlarm = widget.type === "alarm_tile";
  const isClockAlarm = widget.type === "clock_alarm";
  const isSensor = widget.type === "sensor";
  const isSensorTile = widget.type === "sensor_tile";
  if (el.buttonOptions) {
    el.buttonOptions.classList.toggle("hidden", !isButton);
  }
  if (el.sliderOptions) {
    el.sliderOptions.classList.toggle("hidden", !isSlider);
  }
  if (el.graphOptions) {
    el.graphOptions.classList.toggle("hidden", !isGraph);
  }
  if (el.heatingOptions) {
    el.heatingOptions.classList.toggle("hidden", !isHeating);
  }
  if (el.binaryOptions) {
    el.binaryOptions.classList.toggle("hidden", !isBinary);
  }
  if (el.alarmOptions) {
    el.alarmOptions.classList.toggle("hidden", !isAlarm);
  }
  if (el.clockOptions) {
    el.clockOptions.classList.toggle("hidden", !isClockAlarm);
  }
  if (el.sensorOptions) {
    el.sensorOptions.classList.toggle("hidden", !isSensor);
  }
  if (el.sensorTileOptions) {
    el.sensorTileOptions.classList.toggle("hidden", !isSensorTile);
  }
  if (isSensorTile && el.fSensorTileEntityIds) {
    el.fSensorTileEntityIds.value = widget.entity_ids || "";
  }
  if (isButton) {
    const accent = normalizeHexColor(widget.button_accent_color, DEFAULT_BUTTON_ACCENT_COLOR);
    const buttonMode = normalizeButtonMode(widget.button_mode);
    widget.button_accent_color = accent;
    widget.button_mode = buttonMode;
    if (el.fButtonAccentColor) {
      el.fButtonAccentColor.value = accent;
    }
    if (el.fButtonMode) {
      el.fButtonMode.value = buttonMode;
    }
    if (el.fButtonStyle) {
      el.fButtonStyle.value = normalizeButtonStyle(widget.style_variant);
    }
  } else {
    if (el.fButtonAccentColor) {
      el.fButtonAccentColor.value = DEFAULT_BUTTON_ACCENT_COLOR;
    }
    if (el.fButtonMode) {
      el.fButtonMode.value = DEFAULT_BUTTON_MODE;
    }
    if (el.fButtonStyle) {
      el.fButtonStyle.value = DEFAULT_BUTTON_STYLE;
    }
  }
  if (isSlider) {
    const sliderEntityDomain = normalizeSliderEntityDomain(widget.slider_entity_domain);
    const direction = normalizeSliderDirection(widget.slider_direction);
    const accent = normalizeHexColor(widget.slider_accent_color, DEFAULT_SLIDER_ACCENT_COLOR);
    widget.slider_entity_domain = sliderEntityDomain;
    widget.slider_direction = direction;
    widget.slider_accent_color = accent;
    if (el.fSliderEntityDomain) {
      el.fSliderEntityDomain.value = sliderEntityDomain;
    }
    if (el.fSliderDirection) {
      el.fSliderDirection.value = direction;
    }
    if (el.fSliderAccentColor) {
      el.fSliderAccentColor.value = accent;
    }
  } else {
    if (el.fSliderEntityDomain) {
      el.fSliderEntityDomain.value = DEFAULT_SLIDER_ENTITY_DOMAIN;
    }
    if (el.fSliderDirection) {
      el.fSliderDirection.value = DEFAULT_SLIDER_DIRECTION;
    }
    if (el.fSliderAccentColor) {
      el.fSliderAccentColor.value = DEFAULT_SLIDER_ACCENT_COLOR;
    }
  }
  if (isGraph) {
    const lineColor = normalizeHexColor(widget.graph_line_color, DEFAULT_GRAPH_LINE_COLOR);
    const timeWindowMin = normalizeGraphTimeWindowMin(widget.graph_time_window_min);
    const pointCount = normalizeGraphPointCount(widget.graph_point_count);
    const displayMode = normalizeGraphDisplayMode(widget.graph_display_mode);
    const barBucketMin = normalizeGraphBarBucketMin(widget.graph_bar_bucket_min);
    widget.graph_line_color = lineColor;
    widget.graph_time_window_min = timeWindowMin;
    widget.graph_display_mode = displayMode;
    widget.graph_bar_bucket_min = barBucketMin;
    if (pointCount > 0) {
      widget.graph_point_count = pointCount;
    } else {
      delete widget.graph_point_count;
    }
    if (el.fGraphLineColor) {
      el.fGraphLineColor.value = lineColor;
    }
    if (el.fGraphTimeWindowMin) {
      el.fGraphTimeWindowMin.value = String(widget.graph_time_window_min);
    }
    if (el.fGraphPointCount) {
      el.fGraphPointCount.value = pointCount > 0 ? String(pointCount) : "";
    }
    if (el.fGraphDisplayMode) {
      el.fGraphDisplayMode.value = displayMode;
    }
    if (el.fGraphBarBucketMin) {
      el.fGraphBarBucketMin.value = String(barBucketMin);
    }
    if (el.fGraphBarBucketMinWrap) {
      el.fGraphBarBucketMinWrap.classList.toggle("hidden", displayMode !== "bars");
    }
    if (el.fGraphPointCountWrap) {
      el.fGraphPointCountWrap.classList.toggle("hidden", displayMode !== "line");
    }
  } else {
    if (el.fGraphLineColor) {
      el.fGraphLineColor.value = DEFAULT_GRAPH_LINE_COLOR;
    }
    if (el.fGraphTimeWindowMin) {
      el.fGraphTimeWindowMin.value = String(DEFAULT_GRAPH_TIME_WINDOW_MIN);
    }
    if (el.fGraphPointCount) {
      el.fGraphPointCount.value = "";
    }
    if (el.fGraphDisplayMode) {
      el.fGraphDisplayMode.value = DEFAULT_GRAPH_DISPLAY_MODE;
    }
    if (el.fGraphBarBucketMin) {
      el.fGraphBarBucketMin.value = String(DEFAULT_GRAPH_BAR_BUCKET_MIN);
    }
    if (el.fGraphBarBucketMinWrap) {
      el.fGraphBarBucketMinWrap.classList.add("hidden");
    }
  }

  if (isHeating) {
    const styleVariant = widget.style_variant === "arc_semi" ? "arc_semi" : "default";
    const arcOpening = ["left", "right", "top", "bottom"].includes(widget.arc_opening) ? widget.arc_opening : "left";
    widget.style_variant = styleVariant;
    widget.arc_opening = arcOpening;
    if (el.fHeatingStyleVariant) {
      el.fHeatingStyleVariant.value = styleVariant;
    }
    if (el.fHeatingArcOpening) {
      el.fHeatingArcOpening.value = arcOpening;
    }
    if (el.fHeatingArcOpeningWrap) {
      el.fHeatingArcOpeningWrap.classList.toggle("hidden", styleVariant !== "arc_semi");
    }
  } else {
    if (el.fHeatingStyleVariant) {
      el.fHeatingStyleVariant.value = "default";
    }
    if (el.fHeatingArcOpening) {
      el.fHeatingArcOpening.value = "left";
    }
    if (el.fHeatingArcOpeningWrap) {
      el.fHeatingArcOpeningWrap.classList.add("hidden");
    }
  }

  if (isBinary) {
    const showTitle = normalizeBoolDefaultTrue(widget.binary_show_title);
    const colorOn = normalizeHexColor(widget.binary_color_on, "");
    const colorOff = normalizeHexColor(widget.binary_color_off, "");
    const textOn = normalizeBinaryText(widget.binary_text_on);
    const textOff = normalizeBinaryText(widget.binary_text_off);
    widget.binary_show_title = showTitle;
    widget.binary_color_on = colorOn;
    widget.binary_color_off = colorOff;
    widget.binary_text_on = textOn;
    widget.binary_text_off = textOff;
    if (el.fBinaryShowTitle) {
      el.fBinaryShowTitle.checked = showTitle;
    }
    if (el.fBinaryColorOn) {
      el.fBinaryColorOn.value = colorOn;
    }
    if (el.fBinaryColorOff) {
      el.fBinaryColorOff.value = colorOff;
    }
    if (el.fBinaryTextOn) {
      el.fBinaryTextOn.value = textOn;
    }
    if (el.fBinaryTextOff) {
      el.fBinaryTextOff.value = textOff;
    }
  } else {
    if (el.fBinaryShowTitle) {
      el.fBinaryShowTitle.checked = true;
    }
    if (el.fBinaryColorOn) {
      el.fBinaryColorOn.value = "";
    }
    if (el.fBinaryColorOff) {
      el.fBinaryColorOff.value = "";
    }
    if (el.fBinaryTextOn) {
      el.fBinaryTextOn.value = "";
    }
    if (el.fBinaryTextOff) {
      el.fBinaryTextOff.value = "";
    }
  }

  if (isAlarm) {
    const alarmCode = normalizeAlarmCode(widget.alarm_code);
    const alarmModes = normalizeAlarmModes(widget.alarm_modes).split(",");
    const askCode = widget.alarm_ask_code === true;
    const backend = normalizeAlarmBackend(widget.alarm_backend);
    const zoneLabel = normalizeAlarmZoneLabel(widget.alarm_zone_label);
    const showSensors = normalizeBoolDefaultTrue(widget.alarm_show_sensors);
    const showBypassed = normalizeBoolDefaultTrue(widget.alarm_show_bypassed);
    const forceArm = normalizeBoolDefaultTrue(widget.alarm_force_arm);
    const skipDelay = widget.alarm_skip_delay === true;
    widget.alarm_code = alarmCode;
    widget.alarm_modes = alarmModes.join(",");
    widget.alarm_ask_code = askCode;
    widget.alarm_backend = backend;
    widget.alarm_show_sensors = showSensors;
    widget.alarm_show_bypassed = showBypassed;
    widget.alarm_force_arm = forceArm;
    widget.alarm_skip_delay = skipDelay;
    if (zoneLabel) {
      widget.alarm_zone_label = zoneLabel;
    } else {
      delete widget.alarm_zone_label;
    }
    if (el.fAlarmCode) {
      el.fAlarmCode.value = alarmCode;
    }
    if (el.fAlarmAskCode) {
      el.fAlarmAskCode.checked = askCode;
    }
    if (el.fAlarmBackend) {
      el.fAlarmBackend.value = backend;
    }
    if (el.fAlarmZoneLabel) {
      el.fAlarmZoneLabel.value = zoneLabel;
    }
    if (el.fAlarmShowSensors) {
      el.fAlarmShowSensors.checked = showSensors;
    }
    if (el.fAlarmShowBypassed) {
      el.fAlarmShowBypassed.checked = showBypassed;
    }
    if (el.fAlarmForceArm) {
      el.fAlarmForceArm.checked = forceArm;
    }
    if (el.fAlarmSkipDelay) {
      el.fAlarmSkipDelay.checked = skipDelay;
    }
    for (const input of alarmModeInputs()) {
      input.checked = alarmModes.includes(input.dataset.alarmMode);
    }
  } else {
    if (el.fAlarmCode) {
      el.fAlarmCode.value = "";
    }
    if (el.fAlarmAskCode) {
      el.fAlarmAskCode.checked = false;
    }
    if (el.fAlarmBackend) {
      el.fAlarmBackend.value = "auto";
    }
    if (el.fAlarmZoneLabel) {
      el.fAlarmZoneLabel.value = "";
    }
    if (el.fAlarmShowSensors) {
      el.fAlarmShowSensors.checked = true;
    }
    if (el.fAlarmShowBypassed) {
      el.fAlarmShowBypassed.checked = true;
    }
    if (el.fAlarmForceArm) {
      el.fAlarmForceArm.checked = true;
    }
    if (el.fAlarmSkipDelay) {
      el.fAlarmSkipDelay.checked = false;
    }
    const defaultModes = DEFAULT_ALARM_MODES.split(",");
    for (const input of alarmModeInputs()) {
      input.checked = defaultModes.includes(input.dataset.alarmMode);
    }
  }

  if (isClockAlarm) {
    const showSeconds = widget.clock_show_seconds === true;
    const showDate = widget.clock_show_date !== false;
    widget.clock_show_seconds = showSeconds;
    widget.clock_show_date = showDate;
    if (el.fClockShowSeconds) {
      el.fClockShowSeconds.checked = showSeconds;
    }
    if (el.fClockShowDate) {
      el.fClockShowDate.checked = showDate;
    }
  } else {
    resetClockInspectorFields();
  }

  if (isSensor) {
    const valueColor = normalizeHexColor(widget.sensor_value_color, "");
    widget.sensor_value_color = valueColor;
    if (el.fSensorValueColor) {
      el.fSensorValueColor.value = valueColor;
    }
  } else {
    if (el.fSensorValueColor) {
      el.fSensorValueColor.value = "";
    }
  }

  renderTileLookInspector(widget);
  renderEntityOptions();
}

function renderAll() {
  normalizeLayoutWidgets(editor.layout);
  renderPages();
  renderPageEditor();
  renderWidgets();
  renderInspector();
  renderCanvas();
}

function addPage() {
  const pageId = uniqueId("page", editor.layout.pages);
  const pageNumber = editor.layout.pages.length + 1;
  editor.layout.pages.push({
    id: pageId,
    title: t("layout.pages.new_title", { number: pageNumber }),
    widgets: [],
  });
  editor.selectedPageId = pageId;
  editor.selectedWidgetId = null;
  renderAll();
}

function addEnergyPage() {
  const pageId = uniqueId("energy", editor.layout.pages);
  editor.layout.pages.push({
    id: pageId,
    type: ENERGY_PAGE_TYPE,
    title: t("layout.pages.energy_title"),
    energy: defaultEnergyConfig(),
    widgets: [],
  });
  editor.selectedPageId = pageId;
  editor.selectedWidgetId = null;
  renderAll();
  void loadEnergyPreview();
}

function addXiaozhiPage() {
  const pageId = uniqueId("xiaozhi", editor.layout.pages);
  editor.layout.pages.push({
    id: pageId,
    type: XIAOZHI_PAGE_TYPE,
    title: t("layout.pages.xiaozhi_title"),
    widgets: [],
  });
  editor.selectedPageId = pageId;
  editor.selectedWidgetId = null;
  renderAll();
}

function addMusicPage() {
  const pageId = uniqueId("music", editor.layout.pages);
  editor.layout.pages.push({
    id: pageId,
    type: MUSIC_PAGE_TYPE,
    title: t("layout.pages.music_title"),
    music: defaultMusicConfig(),
    widgets: [],
  });
  editor.selectedPageId = pageId;
  editor.selectedWidgetId = null;
  renderAll();
}

function addRadioPage() {
  const pageId = uniqueId("radio", editor.layout.pages);
  editor.layout.pages.push({
    id: pageId,
    type: RADIO_PAGE_TYPE,
    title: t("layout.pages.radio_title"),
    radio: defaultRadioConfig(),
    widgets: [],
  });
  editor.selectedPageId = pageId;
  editor.selectedWidgetId = null;
  renderAll();
}

/* Weather page: the same tiles the firmware uses for its built-in page. The id
   is fixed (WEATHER_PAGE_ID), so the firmware keeps only one weather page and
   hides it from the bottom bar - the top-bar weather chip opens it instead. */
function addWeatherPage() {
  const existing = editor.layout.pages.find((page) => isWeatherPage(page));
  if (existing) {
    editor.selectedPageId = existing.id;
    editor.selectedWidgetId = null;
    renderAll();
    setStatus(t("layout.status.weather_page_exists"), true);
    return existing;
  }

  const page = {
    id: WEATHER_PAGE_ID,
    title: t("layout.pages.weather_title"),
    widgets: [],
  };
  editor.layout.pages.push(page);
  editor.selectedPageId = page.id;
  editor.selectedWidgetId = null;

  const templates = [
    { type: "weather_tile", entity: "weather.dom", titleKey: "layout.widgets.weather_now_title",
      preset: "sky", rect: { x: 0, y: 0, w: 390, h: 230 } },
    { type: "weather_3day", entity: "weather.dom", titleKey: "layout.widgets.weather_forecast_title",
      preset: "sky", rect: { x: 0, y: 240, w: 390, h: 230 } },
    { type: "sensor", entity: "sensor.temperatura_salon_temperatura", titleKey: "layout.widgets.weather_temp_title",
      preset: "emerald", rect: { x: 400, y: 0, w: 624, h: 230 } },
    { type: "sensor", entity: "sensor.temperatura_salon_wilgotnosc", titleKey: "layout.widgets.weather_hum_title",
      preset: "emerald", rect: { x: 400, y: 240, w: 624, h: 230 } },
  ];
  for (const template of templates) {
    page.widgets.push({
      ...TILE_LOOK_PRESETS[template.preset],
      id: createWidgetIdForPage(page, template.type),
      type: template.type,
      title: t(template.titleKey),
      entity_id: template.entity,
      secondary_entity_id: "",
      rect: clampRectToCanvas(template.rect, template.type),
    });
  }

  renderAll();
  setStatus(t("layout.status.weather_page_added"));
  return page;
}

function deletePage() {
  if (!editor.layout.pages.length || !editor.selectedPageId) return;
  if (editor.layout.pages.length === 1) {
    setStatus(t("layout.status.at_least_one_page"), true);
    return;
  }
  const page = editor.layout.pages.find((p) => p.id === editor.selectedPageId);
  if (!page) return;
  const name = page.title || page.id;
  if (!window.confirm(t("layout.pages.confirm_delete", { name }))) return;
  editor.layout.pages = editor.layout.pages.filter((p) => p.id !== editor.selectedPageId);
  editor.selectedPageId = editor.layout.pages[0].id;
  editor.selectedWidgetId = null;
  renderAll();
}

function applyPageName() {
  const page = selectedPage();
  if (!page) return;
  const nextTitle = el.pageTitleInput.value.trim();
  page.title = nextTitle || page.id;
  if (isEnergyPage(page)) {
    applyEnergyPageConfig({ render: false });
  } else if (isMusicPage(page)) {
    normalizeMusicConfig(page);
  } else if (isRadioPage(page)) {
    normalizeRadioConfig(page);
  }
  renderAll();
}

function applyEnergyPageConfig(options = {}) {
  const page = selectedPage();
  if (!isEnergyPage(page)) return false;
  normalizeEnergyConfig(page);
  const selectedSource = (el.energySource?.value || page.energy.source || ENERGY_SOURCE_HA).trim();
  page.energy.source = ENERGY_SOURCES.has(selectedSource) ? selectedSource : ENERGY_SOURCE_HA;
  const inputs = getEnergyInputs();
  for (const key of ENERGY_ENTITY_KEYS) {
    page.energy[key] = (inputs[key]?.value || "").trim();
  }
  updateEnergySourceUi(page.energy.source);
  if (options.render !== false) {
    renderAll();
  }
  if (page.energy.source === ENERGY_SOURCE_HA) {
    void loadEnergyPreview();
  }
  return true;
}

function addWidget(type, options = {}) {
  const page = selectedPage();
  if (!page) return;
  if (!pageAcceptsWidgets(page)) {
    setStatus(t(isXiaozhiPage(page) ? "layout.status.xiaozhi_page_only" : "layout.status.energy_page_only"), true);
    return null;
  }
  if (isMusicPage(page)) {
    setStatus(t("layout.status.music_page_only"), true);
    return null;
  }
  if (isRadioPage(page)) {
    setStatus(t("layout.status.radio_page_only"), true);
    return null;
  }
  const sliderDomain = DEFAULT_SLIDER_ENTITY_DOMAIN;
  const id = createWidgetIdForPage(page, type);
  const entityId = typeof options.entityId === "string" ? options.entityId : pickDefaultEntityForWidgetType(type, sliderDomain);
  const secondaryEntityId = type === "heating_tile" ? pickDefaultEntityForWidgetType("sensor") : "";
  const compact = isCompactCanvas();
  const defaultW = compact
    ? type === "weather_3day" ? 420
      : type === "todo_list" ? 300
      : type === "media_player" ? 300
      : type === "roborock_tile" ? 460
      : type === "weather_tile" ? 220
      : type === "alarm_tile" ? 220
      : type === "clock_alarm" ? 220
      : type === "cover_tile" ? 180
      : type === "scene_tile" ? 140
      : type === "person_tile" ? 150
      : type === "timer_tile" ? 150
      : (type === "light_tile" || type === "empty_tile") ? 140
      : type === "heating_tile" ? 150
      : (type === "cover" || type === "lock" || type === "fan" || type === "number") ? 160
      : type === "select" ? 200
      : type === "sensor_tile" ? 220
      : 180
    : type === "weather_3day" ? 360
      : type === "todo_list" ? 360
      : type === "media_player" ? 360
      : type === "roborock_tile" ? 360
      : type === "alarm_tile" ? 300
      : type === "clock_alarm" ? 300
      : type === "cover_tile" ? 220
      : type === "scene_tile" ? 160
      : type === "person_tile" ? 180
      : type === "timer_tile" ? 180
      : (type === "light_tile" || type === "heating_tile" || type === "weather_tile" || type === "empty_tile") ? 300
      : (type === "cover" || type === "lock" || type === "fan" || type === "number") ? 220
      : type === "select" ? 260
      : type === "sensor_tile" ? 300
      : 220;
  const defaultH = compact
    ? type === "weather_3day" ? 240
      : type === "todo_list" ? 220
      : type === "media_player" ? 220
      : type === "roborock_tile" ? 300
      : type === "weather_tile" ? 180
      : type === "alarm_tile" ? 220
      : type === "clock_alarm" ? 220
      : type === "cover_tile" ? 150
      : type === "scene_tile" ? 130
      : type === "person_tile" ? 100
      : type === "timer_tile" ? 120
      : (type === "light_tile" || type === "empty_tile") ? 140
      : type === "heating_tile" ? 150
      : (type === "cover" || type === "lock" || type === "fan" || type === "number") ? 130
      : type === "select" ? 110
      : type === "sensor_tile" ? 180
      : 110
    : type === "weather_3day" ? 260
      : type === "todo_list" ? 360
      : type === "media_player" ? 280
      : type === "roborock_tile" ? 300
      : type === "alarm_tile" ? 260
      : type === "clock_alarm" ? 260
      : type === "cover_tile" ? 180
      : type === "scene_tile" ? 150
      : type === "person_tile" ? 120
      : type === "timer_tile" ? 140
      : (type === "light_tile" || type === "heating_tile" || type === "weather_tile" || type === "empty_tile") ? 260
      : (type === "cover" || type === "lock" || type === "fan" || type === "number") ? 150
      : type === "select" ? 140
      : type === "sensor_tile" ? 200
      : 120;
  const rect = clampRectToCanvas({ x: 20, y: 20, w: defaultW, h: defaultH }, type);

  const widget = {
    id,
    type,
    title: typeof options.title === "string" && options.title.trim() ? options.title.trim() : id,
    entity_id: entityId,
    secondary_entity_id: secondaryEntityId,
    rect,
  };
  if (type === "slider") {
    widget.slider_entity_domain = DEFAULT_SLIDER_ENTITY_DOMAIN;
    widget.slider_direction = DEFAULT_SLIDER_DIRECTION;
    widget.slider_accent_color = DEFAULT_SLIDER_ACCENT_COLOR;
  }
  if (type === "button") {
    widget.button_mode = DEFAULT_BUTTON_MODE;
    widget.button_accent_color = DEFAULT_BUTTON_ACCENT_COLOR;
  }
  if (type === "graph") {
    widget.graph_line_color = DEFAULT_GRAPH_LINE_COLOR;
    widget.graph_time_window_min = DEFAULT_GRAPH_TIME_WINDOW_MIN;
  }
  if (type === "binary_sensor") {
    widget.binary_show_title = true;
    widget.binary_text_on = "";
    widget.binary_text_off = "";
    widget.binary_color_on = "";
    widget.binary_color_off = "";
  }
  if (type === "alarm_tile") {
    widget.alarm_code = "";
    widget.alarm_modes = DEFAULT_ALARM_MODES;
    widget.alarm_ask_code = false;
    widget.alarm_backend = "auto";
    widget.alarm_show_sensors = true;
    widget.alarm_show_bypassed = true;
    widget.alarm_force_arm = true;
    widget.alarm_skip_delay = false;
  }

  if (type === "clock_alarm") {
    widget.clock_show_seconds = false;
    widget.clock_show_date = true;
  }

  if (type === "sensor_tile") {
    widget.entity_id = "";
    widget.secondary_entity_id = "";
    widget.entity_ids = "";
  }

  page.widgets.push(widget);
  editor.selectedWidgetId = id;
  renderAll();
  onSetupWizardWidgetAdded(widget);
  return widget;
}

function deleteWidget() {
  const page = selectedPage();
  if (!page || !editor.selectedWidgetId) return;
  const widget = page.widgets.find((w) => w.id === editor.selectedWidgetId);
  if (!widget) return;
  const name = widgetDisplayLabel(widget);
  if (!window.confirm(t("layout.widgets.confirm_delete", { name }))) return;
  page.widgets = page.widgets.filter((w) => w.id !== editor.selectedWidgetId);
  editor.selectedWidgetId = null;
  renderAll();
}

function renderInspectorChange(refreshInspector) {
  if (refreshInspector) {
    renderAll();
    return;
  }
  renderWidgets();
  renderCanvas();
}

function applyInspector(options = {}) {
  const widget = selectedWidget();
  if (!widget) return false;

  const refreshInspector = options.refreshInspector !== false;
  const softEntityValidation = options.softEntityValidation === true;

  const widgetType = widget.type;
  const sliderDomain = widgetType === "slider"
    ? normalizeSliderEntityDomain(el.fSliderEntityDomain?.value)
    : DEFAULT_SLIDER_ENTITY_DOMAIN;
  const buttonMode = widgetType === "button"
    ? normalizeButtonMode(el.fButtonMode?.value)
    : DEFAULT_BUTTON_MODE;
  const secondaryConfig = secondaryEntityConfigForWidgetType(widgetType);
  const nextEntityId = el.fEntity.value.trim() || pickDefaultEntityForWidgetType(widgetType, sliderDomain, buttonMode);

  const primaryEntityValid = entityMatchesWidgetType({ id: nextEntityId }, widgetType, sliderDomain, buttonMode);
  if (!primaryEntityValid && !softEntityValidation) {
    const allowedDomains = allowedEntityDomainsForWidgetType(widgetType, sliderDomain, buttonMode);
    const allowedHint = allowedDomains.length ? allowedDomains.join(", ") : t("layout.status.expected_domain");
    setStatus(t("layout.status.entity_domain_required", { domains: allowedHint }), true);
    return false;
  }

  widget.title = el.fTitle.value.trim();
  if (primaryEntityValid) {
    widget.entity_id = nextEntityId;
  }
  if (secondaryConfig.enabled) {
    const typedSecondaryEntityId = el.fSecondaryEntity.value.trim();
    const secondaryEntityId = secondaryConfig.optional
      ? typedSecondaryEntityId
      : (typedSecondaryEntityId || pickDefaultEntityForWidgetType(secondaryConfig.domain));
    if (secondaryEntityId.length > 0 && !secondaryEntityId.startsWith(`${secondaryConfig.domain}.`)) {
      if (!softEntityValidation) {
        setStatus(t(secondaryConfig.invalidStatusKey), true);
        return false;
      }
    } else {
      widget.secondary_entity_id = secondaryEntityId;
    }
  } else {
    widget.secondary_entity_id = "";
  }
  if (widgetType === "button") {
    widget.button_mode = buttonMode;
    widget.button_accent_color = normalizeHexColor(el.fButtonAccentColor?.value, DEFAULT_BUTTON_ACCENT_COLOR);
  } else {
    delete widget.button_mode;
    delete widget.button_accent_color;
  }
  if (widgetType === "slider") {
    widget.slider_entity_domain = sliderDomain;
    widget.slider_direction = normalizeSliderDirection(el.fSliderDirection?.value);
    widget.slider_accent_color = normalizeHexColor(el.fSliderAccentColor?.value, DEFAULT_SLIDER_ACCENT_COLOR);
  } else {
    delete widget.slider_entity_domain;
    delete widget.slider_direction;
    delete widget.slider_accent_color;
  }
  if (widgetType === "graph") {
    widget.graph_line_color = normalizeHexColor(el.fGraphLineColor?.value, DEFAULT_GRAPH_LINE_COLOR);
    widget.graph_time_window_min = normalizeGraphTimeWindowMin(el.fGraphTimeWindowMin?.value);
    widget.graph_display_mode = normalizeGraphDisplayMode(el.fGraphDisplayMode?.value);
    widget.graph_bar_bucket_min = normalizeGraphBarBucketMin(el.fGraphBarBucketMin?.value);
    const graphPointCount = normalizeGraphPointCount(el.fGraphPointCount?.value);
    if (graphPointCount > 0) {
      widget.graph_point_count = graphPointCount;
    } else {
      delete widget.graph_point_count;
    }
  } else {
    delete widget.graph_line_color;
    delete widget.graph_time_window_min;
    delete widget.graph_point_count;
    delete widget.graph_display_mode;
    delete widget.graph_bar_bucket_min;
  }
  if (widgetType === "binary_sensor") {
    widget.binary_show_title = el.fBinaryShowTitle ? !!el.fBinaryShowTitle.checked : true;
    widget.binary_text_on = normalizeBinaryText(el.fBinaryTextOn?.value);
    widget.binary_text_off = normalizeBinaryText(el.fBinaryTextOff?.value);
    widget.binary_color_on = normalizeHexColor(el.fBinaryColorOn?.value, "");
    widget.binary_color_off = normalizeHexColor(el.fBinaryColorOff?.value, "");
  } else {
    delete widget.binary_show_title;
    delete widget.binary_text_on;
    delete widget.binary_text_off;
    delete widget.binary_color_on;
    delete widget.binary_color_off;
  }
  if (widgetType === "heating_tile") {
    const variant = el.fHeatingStyleVariant?.value === "arc_semi" ? "arc_semi" : "default";
    widget.style_variant = variant;
    if (variant === "arc_semi") {
      const opening = el.fHeatingArcOpening?.value;
      widget.arc_opening = ["left", "right", "top", "bottom"].includes(opening) ? opening : "left";
    } else {
      delete widget.arc_opening;
    }
  } else if (widgetType === "button") {
    const variant = normalizeButtonStyle(el.fButtonStyle?.value);
    if (!buttonModeRequiresMediaPlayer(buttonMode) && variant !== "") {
      widget.style_variant = variant;
    } else {
      delete widget.style_variant;
    }
    delete widget.arc_opening;
  } else {
    delete widget.style_variant;
    delete widget.arc_opening;
  }
  if (widgetType === "binary_sensor") {
    widget.binary_show_title = el.fBinaryShowTitle ? !!el.fBinaryShowTitle.checked : true;
    widget.binary_text_on = normalizeBinaryText(el.fBinaryTextOn?.value);
    widget.binary_text_off = normalizeBinaryText(el.fBinaryTextOff?.value);
    widget.binary_color_on = normalizeHexColor(el.fBinaryColorOn?.value, "");
    widget.binary_color_off = normalizeHexColor(el.fBinaryColorOff?.value, "");
  } else {
    delete widget.binary_show_title;
    delete widget.binary_text_on;
    delete widget.binary_text_off;
    delete widget.binary_color_on;
    delete widget.binary_color_off;
  }
  if (widgetType === "alarm_tile") {
    widget.alarm_code = normalizeAlarmCode(el.fAlarmCode?.value);
    widget.alarm_modes = normalizeAlarmModes(
      alarmModeInputs()
        .filter((input) => input.checked)
        .map((input) => input.dataset.alarmMode)
        .join(","),
    );
    widget.alarm_ask_code = el.fAlarmAskCode ? !!el.fAlarmAskCode.checked : false;
    widget.alarm_backend = normalizeAlarmBackend(el.fAlarmBackend?.value);
    const alarmZoneLabel = normalizeAlarmZoneLabel(el.fAlarmZoneLabel?.value);
    if (alarmZoneLabel) {
      widget.alarm_zone_label = alarmZoneLabel;
    } else {
      delete widget.alarm_zone_label;
    }
    widget.alarm_show_sensors = el.fAlarmShowSensors ? !!el.fAlarmShowSensors.checked : true;
    widget.alarm_show_bypassed = el.fAlarmShowBypassed ? !!el.fAlarmShowBypassed.checked : true;
    widget.alarm_force_arm = el.fAlarmForceArm ? !!el.fAlarmForceArm.checked : true;
    widget.alarm_skip_delay = el.fAlarmSkipDelay ? !!el.fAlarmSkipDelay.checked : false;
  } else {
    delete widget.alarm_code;
    delete widget.alarm_modes;
    delete widget.alarm_ask_code;
    delete widget.alarm_backend;
    delete widget.alarm_zone_label;
    delete widget.alarm_show_sensors;
    delete widget.alarm_show_bypassed;
    delete widget.alarm_force_arm;
    delete widget.alarm_skip_delay;
  }
  if (widgetType === "clock_alarm") {
    widget.clock_show_seconds = el.fClockShowSeconds ? !!el.fClockShowSeconds.checked : false;
    widget.clock_show_date = el.fClockShowDate ? !!el.fClockShowDate.checked : true;
  } else {
    delete widget.clock_show_seconds;
    delete widget.clock_show_date;
  }
  if (widgetType === "sensor") {
    widget.sensor_value_color = normalizeHexColor(el.fSensorValueColor?.value, "");
  } else {
    delete widget.sensor_value_color;
  }
  if (widgetType === "sensor_tile") {
    const sensorTileIds = normalizeSensorTileEntityIds(el.fSensorTileEntityIds?.value);
    if (sensorTileIds) {
      widget.entity_ids = sensorTileIds;
    } else {
      delete widget.entity_ids;
    }
  }
  applyTileLookFromInspector(widget);
  widget.rect = clampRectToCanvas(
    {
      x: Number(el.fX.value || 0),
      y: Number(el.fY.value || 0),
      w: Number(el.fW.value || widget.rect.w),
      h: Number(el.fH.value || widget.rect.h),
    },
    widgetType
  );
  editor.selectedWidgetId = widget.id;
  renderInspectorChange(refreshInspector);
  return true;
}

function autoApplyInspector(options = {}) {
  return applyInspector({
    refreshInspector: false,
    ...options,
  });
}

function bindInspectorAutoApply(input, events = ["change"], options = {}) {
  if (!input) return;
  const handler = () => autoApplyInspector(options);
  for (const eventName of events) {
    input.addEventListener(eventName, handler);
  }
}

/* Key order independent JSON text, used to detect that the layout on the panel
   changed (another tab, the API or a restore) since this editor loaded it. */
function canonicalLayoutJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalLayoutJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalLayoutJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

function layoutSignatureOf(layout) {
  return layout ? canonicalLayoutJson(layout) : "";
}

async function confirmLayoutSaveOverConflict() {
  if (!editor.layoutSignature) return true;
  let remoteSignature = "";
  try {
    const remote = await apiGet("/api/layout");
    if (!remote || !Array.isArray(remote.pages)) return true;
    normalizeLayoutWidgets(remote);
    remoteSignature = layoutSignatureOf(remote);
  } catch (_) {
    return true;
  }
  if (!remoteSignature || remoteSignature === editor.layoutSignature) return true;
  if (window.confirm(t("layout.status.conflict_confirm"))) {
    setStatus(t("layout.status.conflict_overridden"));
    return true;
  }
  setStatus(t("layout.status.conflict_title"), true);
  return false;
}

async function saveLayout() {
  if (isEnergyPage(selectedPage())) {
    applyEnergyPageConfig({ render: false });
  }
  normalizeLayoutWidgets(editor.layout);
  if (!(await confirmLayoutSaveOverConflict())) {
    return;
  }
  setStatus(t("layout.status.saving"));
  const response = await fetch("/api/layout", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(editor.layout),
  });
  if (!response.ok) {
    let detail = await response.text();
    try {
      const json = JSON.parse(detail);
      detail = (json.errors || []).join(", ") || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  editor.layoutSignature = layoutSignatureOf(editor.layout);
  setStatus(t("layout.status.saved"));
}

function exportLayout() {
  if (isEnergyPage(selectedPage())) {
    applyEnergyPageConfig({ render: false });
  }
  normalizeLayoutWidgets(editor.layout);
  const blob = new Blob([JSON.stringify(editor.layout, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "betta-layout.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importLayoutFromText(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.pages)) {
    throw new Error(t("layout.status.invalid_json"));
  }
  normalizeLayoutWidgets(parsed);
  editor.layout = parsed;
  editor.selectedPageId = parsed.pages[0]?.id || null;
  editor.selectedWidgetId = null;
  renderAll();
  setStatus(t("layout.status.imported"));
}

function bindUi() {
  setupSettingsWorkspace();
  for (const button of el.settingsNavButtons || []) {
    button.onclick = () => setActiveSettingsSection(button.dataset.settingsSection);
  }
  if (el.toggleWidgetsSection) {
    el.toggleWidgetsSection.onclick = () => toggleSection("widgets");
  }
  if (el.toggleInspectorSection) {
    el.toggleInspectorSection.onclick = () => toggleSection("inspector");
  }
  applySectionCollapseState();

  if (el.logsRefreshBtn) {
    el.logsRefreshBtn.onclick = () => loadLogs(true);
  }
  if (el.logsPauseBtn) {
    el.logsPauseBtn.onclick = () => setLogsPaused(!editor.logs.paused);
  }
  if (el.logsClearBtn) {
    el.logsClearBtn.onclick = () => clearLogs();
  }
  if (el.logsLevelApplyBtn) {
    el.logsLevelApplyBtn.onclick = () => {
      void applyLogLevel();
    };
  }
  if (el.diagnosticsRefreshBtn) {
    el.diagnosticsRefreshBtn.onclick = () => {
      void loadDiagnostics(true);
    };
  }
  if (el.diagnosticsAutoRefresh) {
    el.diagnosticsAutoRefresh.onchange = () => {
      if (el.diagnosticsAutoRefresh.checked) {
        void loadDiagnostics(true);
      } else {
        clearDiagnosticsPoll();
      }
    };
  }
  if (el.logsAutoScroll) {
    el.logsAutoScroll.onchange = () => {
      if (el.logsAutoScroll.checked && el.settingsLogsViewer) {
        el.settingsLogsViewer.scrollTop = el.settingsLogsViewer.scrollHeight;
      }
    };
  }

  el.layoutTabBtn.onclick = () => setActivePane("layout");
  el.settingsTabBtn.onclick = async () => {
    setActivePane("settings");
    await loadSettings(true);
    await loadOtaStatus(true);
  };
  if (el.camerasAddBtn) {
    el.camerasAddBtn.onclick = addCamerasEntry;
  }
  if (el.camerasSaveBtn) {
    el.camerasSaveBtn.onclick = saveCameras;
  }
  if (el.camerasDeleteBtn) {
    el.camerasDeleteBtn.onclick = deleteCamerasEntry;
  }
  if (el.settingsLocalCamSaveBtn) {
    el.settingsLocalCamSaveBtn.onclick = () => {
      void saveLocalCamera();
    };
  }
  if (el.settingsLocalCamSnapshotBtn) {
    el.settingsLocalCamSnapshotBtn.onclick = () => {
      void refreshLocalCameraPreview();
    };
  }
  if (el.settingsLocalCamMotionMinArea) {
    el.settingsLocalCamMotionMinArea.addEventListener("input", () => {
      const v = clampInt(el.settingsLocalCamMotionMinArea.value, 0, 100, 0);
      if (el.settingsLocalCamMotionMinAreaVal) {
        el.settingsLocalCamMotionMinAreaVal.textContent = `${v}%`;
      }
    });
  }
  if (el.settingsLocalCamZonesSnapshotBtn) {
    el.settingsLocalCamZonesSnapshotBtn.onclick = () => {
      void refreshLocalCamZonesSnapshot();
    };
  }
  if (el.settingsLocalCamZonesClearBtn) {
    el.settingsLocalCamZonesClearBtn.onclick = () => {
      editor.localCamZones = [];
      editor.localCamZoneDraft = null;
      renderLocalCamZones();
    };
  }
  if (el.settingsLocalCamMotionDiagBtn) {
    el.settingsLocalCamMotionDiagBtn.onclick = () => {
      void loadLocalCamMotionDiagnostics();
    };
  }
  bindLocalCamZoneEditor();
  if (el.camerasSource) {
    el.camerasSource.onchange = () => {
      populateCamerasEntityOptions();
      updateCamerasFieldsVisibility();
    };
  }
  el.addPageBtn.onclick = addPage;
  if (el.addWeatherPageBtn) {
    el.addWeatherPageBtn.onclick = addWeatherPage;
  }
  if (el.addEnergyPageBtn) {
    el.addEnergyPageBtn.onclick = addEnergyPage;
  }
  if (el.addXiaozhiPageBtn) {
    el.addXiaozhiPageBtn.onclick = addXiaozhiPage;
  }
  if (el.addMusicPageBtn) {
    el.addMusicPageBtn.onclick = addMusicPage;
  }
  if (el.addRadioPageBtn) {
    el.addRadioPageBtn.onclick = addRadioPage;
  }
  el.deletePageBtn.onclick = deletePage;
  el.applyPageBtn.onclick = applyPageName;
  initSimpleUiMenus();
  if (el.applyEnergyPageBtn) {
    el.applyEnergyPageBtn.onclick = () => applyEnergyPageConfig();
  }
  if (el.energySource) {
    el.energySource.onchange = () => applyEnergyPageConfig();
  }
  for (const input of Object.values(getEnergyInputs())) {
    if (!input) continue;
    input.onchange = () => applyEnergyPageConfig();
    input.onblur = () => applyEnergyPageConfig();
  }
  if (el.applyMusicPageBtn) {
    el.applyMusicPageBtn.onclick = () => applyMusicPageConfig();
  }
  for (const input of [el.musicPlayerEntity, el.musicPlayers]) {
    if (!input) continue;
    input.onchange = () => applyMusicPageConfig();
    input.onblur = () => applyMusicPageConfig();
  }
  if (el.applyRadioPageBtn) {
    el.applyRadioPageBtn.onclick = () => applyRadioPageConfig();
  }
  if (el.radioColumns) {
    el.radioColumns.onchange = () => applyRadioPageConfig();
  }
  for (const input of [el.radioPlayerEntity]) {
    if (!input) continue;
    input.onchange = () => applyRadioPageConfig();
    input.onblur = () => applyRadioPageConfig();
  }
  if (el.radioAddStationBtn) {
    el.radioAddStationBtn.onclick = () => addRadioStationRow();
  }
  el.addSensorBtn.onclick = () => openLightEntityPicker("sensor");
  if (el.addBinarySensorBtn) {
    el.addBinarySensorBtn.onclick = () => openLightEntityPicker("binary_sensor");
  }
  if (el.addPresenceBtn) {
    el.addPresenceBtn.onclick = () => addWidget("presence");
  }
  el.addButtonBtn.onclick = () => openLightEntityPicker("button");
  if (el.addBinarySensorBtn) {
    el.addBinarySensorBtn.onclick = () => openLightEntityPicker("binary_sensor");
  }
  if (el.addAlarmTileBtn) {
    el.addAlarmTileBtn.onclick = () => openLightEntityPicker("alarm_tile");
  }
  if (el.addCoverTileBtn) {
    el.addCoverTileBtn.onclick = () => openLightEntityPicker("cover_tile");
  }
  if (el.addSceneTileBtn) {
    el.addSceneTileBtn.onclick = () => openLightEntityPicker("scene_tile");
  }
  if (el.addPersonTileBtn) {
    el.addPersonTileBtn.onclick = () => openLightEntityPicker("person_tile");
  }
  if (el.addTimerTileBtn) {
    /* The timer tile also works standalone, so its picker offers a blank option too. */
    el.addTimerTileBtn.onclick = () => openLightEntityPicker("timer_tile");
  }
  if (el.addClockBtn) {
    el.addClockBtn.onclick = () => addWidget("clock_alarm");
  }
  el.addSliderBtn.onclick = () => addWidget("slider");
  el.addGraphBtn.onclick = () => openLightEntityPicker("graph");
  el.addEmptyTileBtn.onclick = () => addWidget("empty_tile");
  el.addLightTileBtn.onclick = () => openLightEntityPicker("light_tile");
  if (el.openSetupWizardBtn) {
    el.openSetupWizardBtn.onclick = () => openSetupWizard({ manual: true });
  }
  el.addHeatingTileBtn.onclick = () => openLightEntityPicker("heating_tile");
  el.addWeatherTileBtn.onclick = () => openLightEntityPicker("weather_tile");
  el.addWeather3DayBtn.onclick = () => openLightEntityPicker("weather_3day");
  if (el.addTodoListBtn) {
    el.addTodoListBtn.onclick = () => openLightEntityPicker("todo_list");
  }
  if (el.addMediaPlayerBtn) {
    el.addMediaPlayerBtn.onclick = () => openLightEntityPicker("media_player");
  }
  if (el.addRoborockTileBtn) {
    el.addRoborockTileBtn.onclick = () => openLightEntityPicker("roborock_tile");
  }
  if (el.addCoverBtn) {
    el.addCoverBtn.onclick = () => openLightEntityPicker("cover");
  }
  if (el.addLockBtn) {
    el.addLockBtn.onclick = () => openLightEntityPicker("lock");
  }
  if (el.addFanBtn) {
    el.addFanBtn.onclick = () => openLightEntityPicker("fan");
  }
  if (el.addSelectBtn) {
    el.addSelectBtn.onclick = () => openLightEntityPicker("select");
  }
  if (el.addNumberBtn) {
    el.addNumberBtn.onclick = () => openLightEntityPicker("number");
  }
  if (el.lightEntityPickerRefreshBtn) {
    el.lightEntityPickerRefreshBtn.onclick = () => {
      const config = entityPickerConfig();
      const cacheKey = entityPickerCacheKey(config.domain);
      editor.lightPicker.hasLoaded = false;
      editor.lightPicker.loadedByDomain[cacheKey] = false;
      clearLightEntityPickerPoll();
      clearLightEntityPickerSearchDebounce();
      void fetchLightEntityPicker({ refresh: true });
    };
  }
  if (el.lightEntityPickerSearch) {
    el.lightEntityPickerSearch.oninput = () => {
      const config = entityPickerConfig();
      const search = el.lightEntityPickerSearch.value || "";
      editor.lightPicker.search = search;
      editor.lightPicker.searchByDomain[config.domain] = search;
      const cacheKey = entityPickerCacheKey(config.domain, search);
      editor.lightPicker.items = editor.lightPicker.itemsByDomain[cacheKey] || [];
      editor.lightPicker.hasLoaded = editor.lightPicker.loadedByDomain[cacheKey] === true;
      clearLightEntityPickerPoll();
      clearLightEntityPickerSearchDebounce();
      const shouldAutoFetch =
        !editor.lightPicker.hasLoaded && entityPickerSearchReady(config) && entityPickerLiveSearchEnabled(config);
      editor.lightPicker.requestSeq += 1;
      editor.lightPicker.loading = shouldAutoFetch;
      renderLightEntityPicker({
        status: editor.lightPicker.hasLoaded ? "ready" : (shouldAutoFetch ? "pending" : "idle"),
        pending: shouldAutoFetch,
        items: editor.lightPicker.items,
      });
      if (shouldAutoFetch) {
        editor.lightPicker.searchDebounceId = window.setTimeout(() => {
          editor.lightPicker.searchDebounceId = null;
          void fetchLightEntityPicker({ refresh: true });
        }, ENTITY_PICKER_SEARCH_DEBOUNCE_MS);
      }
    };
    el.lightEntityPickerSearch.onkeydown = (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const config = entityPickerConfig();
      const cacheKey = entityPickerCacheKey(config.domain);
      editor.lightPicker.hasLoaded = false;
      editor.lightPicker.loadedByDomain[cacheKey] = false;
      clearLightEntityPickerPoll();
      clearLightEntityPickerSearchDebounce();
      void fetchLightEntityPicker({ refresh: true });
    };
  }
  if (el.lightEntityPickerCloseBtn) {
    el.lightEntityPickerCloseBtn.onclick = closeLightEntityPicker;
  }
  if (el.lightEntityPickerBlankBtn) {
    el.lightEntityPickerBlankBtn.onclick = () => {
      addWidget(editor.lightPicker.widgetType || "light_tile");
      closeLightEntityPicker();
    };
  }
  if (el.lightEntityPickerOverlay) {
    el.lightEntityPickerOverlay.addEventListener("click", (event) => {
      if (event.target === el.lightEntityPickerOverlay) {
        closeLightEntityPicker();
      }
    });
  }
  if (el.setupWizardAddLightBtn) {
    el.setupWizardAddLightBtn.onclick = () => openSetupWizardEntityPicker("light_tile");
  }
  if (el.setupWizardAddHeatingBtn) {
    el.setupWizardAddHeatingBtn.onclick = () => openSetupWizardEntityPicker("heating_tile");
  }
  if (el.setupWizardAddWeatherBtn) {
    el.setupWizardAddWeatherBtn.onclick = () => openSetupWizardEntityPicker("weather_tile");
  }
  if (el.setupWizardAddButtonBtn) {
    el.setupWizardAddButtonBtn.onclick = () => openSetupWizardEntityPicker("button");
  }
  if (el.setupWizardAddSensorBtn) {
    el.setupWizardAddSensorBtn.onclick = () => openSetupWizardEntityPicker("sensor");
  }
  if (el.setupWizardPageTitle) {
    el.setupWizardPageTitle.onchange = applySetupWizardPageTitle;
    el.setupWizardPageTitle.onblur = applySetupWizardPageTitle;
  }
  if (el.setupWizardCloseBtn) {
    el.setupWizardCloseBtn.onclick = () => closeSetupWizard(true);
  }
  if (el.setupWizardSkipBtn) {
    el.setupWizardSkipBtn.onclick = () => closeSetupWizard(true);
  }
  if (el.setupWizardDoneBtn) {
    el.setupWizardDoneBtn.onclick = () => {
      void saveSetupWizardLayout({ closeOnSuccess: true });
    };
  }
  if (el.setupWizardSaveBtn) {
    el.setupWizardSaveBtn.onclick = () => {
      void saveSetupWizardLayout();
    };
  }
  if (el.setupWizardOverlay) {
    el.setupWizardOverlay.addEventListener("click", (event) => {
      if (event.target === el.setupWizardOverlay) {
        closeSetupWizard(true);
      }
    });
  }
  el.deleteWidgetBtn.onclick = deleteWidget;
  if (el.applyInspectorBtn) {
    el.applyInspectorBtn.onclick = () => applyInspector();
  }
  el.reloadBtn.onclick = () => loadLayout();
  el.fType.onchange = () => {
    const sliderDomain = normalizeSliderEntityDomain(el.fSliderEntityDomain?.value);
    const buttonMode = normalizeButtonMode(el.fButtonMode?.value);
    if (el.buttonOptions) {
      el.buttonOptions.classList.toggle("hidden", el.fType.value !== "button");
    }
    if (el.sliderOptions) {
      el.sliderOptions.classList.toggle("hidden", el.fType.value !== "slider");
    }
    if (el.graphOptions) {
      el.graphOptions.classList.toggle("hidden", el.fType.value !== "graph");
    }
    if (el.binaryOptions) {
      el.binaryOptions.classList.toggle("hidden", el.fType.value !== "binary_sensor");
    }
    if (el.alarmOptions) {
      el.alarmOptions.classList.toggle("hidden", el.fType.value !== "alarm_tile");
    }
    if (el.clockOptions) {
      el.clockOptions.classList.toggle("hidden", el.fType.value !== "clock_alarm");
    }
    if (el.sensorOptions) {
      el.sensorOptions.classList.toggle("hidden", el.fType.value !== "sensor");
    }
    if (el.fType.value === "button") {
      if (el.fButtonMode) {
        el.fButtonMode.value = buttonMode;
      }
      if (el.fButtonAccentColor) {
        el.fButtonAccentColor.value = normalizeHexColor(el.fButtonAccentColor.value, DEFAULT_BUTTON_ACCENT_COLOR);
      }
      if (el.fButtonStyle) {
        el.fButtonStyle.value = normalizeButtonStyle(el.fButtonStyle.value);
      }
    } else {
      if (el.fButtonMode) {
        el.fButtonMode.value = DEFAULT_BUTTON_MODE;
      }
      if (el.fButtonAccentColor) {
        el.fButtonAccentColor.value = DEFAULT_BUTTON_ACCENT_COLOR;
      }
      if (el.fButtonStyle) {
        el.fButtonStyle.value = DEFAULT_BUTTON_STYLE;
      }
    }
    if (el.fType.value === "slider") {
      if (el.fSliderEntityDomain) {
        el.fSliderEntityDomain.value = sliderDomain;
      }
      if (el.fSliderDirection) {
        el.fSliderDirection.value = normalizeSliderDirection(el.fSliderDirection.value);
      }
      if (el.fSliderAccentColor) {
        el.fSliderAccentColor.value = normalizeHexColor(el.fSliderAccentColor.value, DEFAULT_SLIDER_ACCENT_COLOR);
      }
    }
    if (el.fType.value === "graph") {
      if (el.fGraphLineColor) {
        el.fGraphLineColor.value = normalizeHexColor(el.fGraphLineColor.value, DEFAULT_GRAPH_LINE_COLOR);
      }
      if (el.fGraphTimeWindowMin) {
        el.fGraphTimeWindowMin.value = String(normalizeGraphTimeWindowMin(el.fGraphTimeWindowMin.value));
      }
      if (el.fGraphPointCount) {
        const normalizedGraphPoints = normalizeGraphPointCount(el.fGraphPointCount.value);
        el.fGraphPointCount.value = normalizedGraphPoints > 0 ? String(normalizedGraphPoints) : "";
      }
      if (el.fGraphDisplayMode) {
        el.fGraphDisplayMode.value = normalizeGraphDisplayMode(el.fGraphDisplayMode.value);
      }
      if (el.fGraphBarBucketMin) {
        el.fGraphBarBucketMin.value = String(normalizeGraphBarBucketMin(el.fGraphBarBucketMin.value));
      }
    } else {
      if (el.fGraphLineColor) {
        el.fGraphLineColor.value = DEFAULT_GRAPH_LINE_COLOR;
      }
      if (el.fGraphTimeWindowMin) {
        el.fGraphTimeWindowMin.value = String(DEFAULT_GRAPH_TIME_WINDOW_MIN);
      }
      if (el.fGraphPointCount) {
        el.fGraphPointCount.value = "";
      }
      if (el.fGraphDisplayMode) {
        el.fGraphDisplayMode.value = DEFAULT_GRAPH_DISPLAY_MODE;
      }
      if (el.fGraphBarBucketMin) {
        el.fGraphBarBucketMin.value = String(DEFAULT_GRAPH_BAR_BUCKET_MIN);
      }
    }
    if (el.fType.value === "binary_sensor") {
      if (el.fBinaryColorOn) {
        el.fBinaryColorOn.value = normalizeHexColor(el.fBinaryColorOn.value, "");
      }
      if (el.fBinaryColorOff) {
        el.fBinaryColorOff.value = normalizeHexColor(el.fBinaryColorOff.value, "");
      }
      if (el.fBinaryTextOn) {
        el.fBinaryTextOn.value = normalizeBinaryText(el.fBinaryTextOn.value);
      }
      if (el.fBinaryTextOff) {
        el.fBinaryTextOff.value = normalizeBinaryText(el.fBinaryTextOff.value);
      }
    } else {
      if (el.fBinaryShowTitle) {
        el.fBinaryShowTitle.checked = true;
      }
      if (el.fBinaryColorOn) {
        el.fBinaryColorOn.value = "";
      }
      if (el.fBinaryColorOff) {
        el.fBinaryColorOff.value = "";
      }
      if (el.fBinaryTextOn) {
        el.fBinaryTextOn.value = "";
      }
      if (el.fBinaryTextOff) {
        el.fBinaryTextOff.value = "";
      }
    }
    if (el.fType.value === "sensor") {
      if (el.fSensorValueColor) {
        el.fSensorValueColor.value = normalizeHexColor(el.fSensorValueColor.value, "");
      }
    } else {
      if (el.fSensorValueColor) {
        el.fSensorValueColor.value = "";
      }
    }
    renderEntityOptions();
    const currentEntity = el.fEntity.value.trim();
    const effectiveButtonMode = el.fType.value === "button"
      ? normalizeButtonMode(el.fButtonMode?.value)
      : DEFAULT_BUTTON_MODE;
    if (!entityMatchesWidgetType({ id: currentEntity }, el.fType.value, sliderDomain, effectiveButtonMode)) {
      el.fEntity.value = pickDefaultEntityForWidgetType(el.fType.value, sliderDomain, effectiveButtonMode);
    }
    if (el.fType.value === "heating_tile") {
      const sensorEntity = el.fSecondaryEntity.value.trim();
      if (!sensorEntity.startsWith("sensor.")) {
        el.fSecondaryEntity.value = pickDefaultEntityForWidgetType("sensor");
      }
    } else {
      el.fSecondaryEntity.value = "";
    }
  };
  if (el.fEntity) {
    el.fEntity.oninput = () => scheduleEntityAutocomplete("primary");
    el.fEntity.onfocus = () => scheduleEntityAutocomplete("primary", true);
    el.fEntity.onchange = () => autoApplyInspector();
    el.fEntity.onblur = () => autoApplyInspector();
  }
  if (el.fButtonMode) {
    el.fButtonMode.onchange = () => {
      el.fButtonMode.value = normalizeButtonMode(el.fButtonMode.value);
      if (inspectorWidgetType() !== "button") return;
      if (buttonModeRequiresMediaPlayer(el.fButtonMode.value) && el.fButtonStyle) {
        el.fButtonStyle.value = DEFAULT_BUTTON_STYLE;
      }
      renderEntityOptions();
      scheduleEntityAutocomplete("primary", true);
      const currentEntity = el.fEntity.value.trim();
      const buttonMode = inspectorButtonMode();
      if (!entityMatchesWidgetType({ id: currentEntity }, "button", DEFAULT_SLIDER_ENTITY_DOMAIN, buttonMode)) {
        el.fEntity.value = pickDefaultEntityForWidgetType("button", DEFAULT_SLIDER_ENTITY_DOMAIN, buttonMode);
      }
      autoApplyInspector();
    };
  }
  if (el.fSliderEntityDomain) {
    el.fSliderEntityDomain.onchange = () => {
      el.fSliderEntityDomain.value = normalizeSliderEntityDomain(el.fSliderEntityDomain.value);
      if (inspectorWidgetType() !== "slider") return;
      scheduleEntityAutocomplete("primary", true);
      const currentEntity = el.fEntity.value.trim();
      const sliderDomain = inspectorSliderEntityDomain();
      if (!entityMatchesWidgetType({ id: currentEntity }, "slider", sliderDomain)) {
        el.fEntity.value = pickDefaultEntityForWidgetType("slider", sliderDomain);
      }
      autoApplyInspector();
    };
  }
  if (el.fSecondaryEntity) {
    el.fSecondaryEntity.oninput = () => scheduleEntityAutocomplete("secondary");
    el.fSecondaryEntity.onfocus = () => scheduleEntityAutocomplete("secondary", true);
    el.fSecondaryEntity.onchange = () => autoApplyInspector();
    el.fSecondaryEntity.onblur = () => autoApplyInspector();
  }
  bindInspectorAutoApply(el.fTitle, ["input"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fButtonAccentColor, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fButtonStyle, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fBinaryShowTitle, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fBinaryColorOn, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fBinaryColorOff, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fBinaryTextOn, ["input"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fBinaryTextOff, ["input"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fSensorValueColor, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fClockShowSeconds, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fClockShowDate, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fAlarmCode, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fAlarmAskCode, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fAlarmBackend, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fAlarmZoneLabel, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fAlarmShowSensors, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fAlarmShowBypassed, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fAlarmForceArm, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fAlarmSkipDelay, ["change"], { softEntityValidation: true });
  for (const alarmModeInput of alarmModeInputs()) {
    bindInspectorAutoApply(alarmModeInput, ["change"], { softEntityValidation: true });
  }
  for (const [key, textInput, colorInput] of tileLookColorFields()) {
    bindTileColorPair(textInput, colorInput);
    bindInspectorAutoApply(textInput, ["input", "change"], { softEntityValidation: true });
  }
  bindInspectorAutoApply(el.fTileBgGradDir, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fTileFontScale, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fTileBorderWidth, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fTileRadius, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fTileOpacity, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fTileShadow, ["change"], { softEntityValidation: true });
  if (el.fTilePreset) {
    el.fTilePreset.addEventListener("change", () => applyTileLookPreset(el.fTilePreset.value));
  }
  if (el.fTileCornerShape) {
    el.fTileCornerShape.addEventListener("change", () => applyTileCornerShape(el.fTileCornerShape.value));
  }
  if (el.fTileRadius) {
    el.fTileRadius.addEventListener("change", syncTileCornerShapeSelect);
  }
  if (el.fTileResetBtn) {
    el.fTileResetBtn.addEventListener("click", () => {
      clearTileLookInspector();
      applyTileLookFromInspector(selectedWidget());
      renderInspectorChange(false);
    });
  }
  if (el.tileLookCopyBtn) {
    el.tileLookCopyBtn.addEventListener("click", () => copyTileLookFromSource());
  }
  if (el.tileLookCopyPageBtn) {
    el.tileLookCopyPageBtn.addEventListener("click", () => applyTileLookToPage());
  }
  bindPageLookInputs();
  bindInspectorAutoApply(el.fSliderDirection, ["change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fSliderAccentColor, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fGraphLineColor, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fGraphTimeWindowMin, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fGraphPointCount, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fGraphDisplayMode, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fGraphBarBucketMin, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fHeatingStyleVariant, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fHeatingArcOpening, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fButtonStyle, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fBinaryShowTitle, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fBinaryColorOn, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fBinaryColorOff, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fBinaryTextOn, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fBinaryTextOff, ["input", "change"], { softEntityValidation: true });
  bindInspectorAutoApply(el.fX, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fY, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fW, ["change"], { refreshInspector: true, softEntityValidation: true });
  bindInspectorAutoApply(el.fH, ["change"], { refreshInspector: true, softEntityValidation: true });
  el.reloadSettingsBtn.onclick = async () => {
    await loadSettings();
    await loadOtaStatus(true);
  };
  if (el.startOtaUrlBtn) {
    el.startOtaUrlBtn.onclick = () => {
      void startOtaFromUrl();
    };
  }
  if (el.settingsOtaUrl) {
    el.settingsOtaUrl.addEventListener("input", persistOtaUrl);
  }
  if (el.refreshOtaStatusBtn) {
    el.refreshOtaStatusBtn.onclick = () => {
      void loadOtaStatus();
    };
  }
  if (el.uploadOtaBtn) {
    el.uploadOtaBtn.onclick = () => {
      void uploadOtaFile();
    };
  }
  el.scanWifiBtn.onclick = () => scanWifiNetworks("settings");
  el.settingsWifiScanResults.onchange = () => {
    const option = el.settingsWifiScanResults.selectedOptions?.[0];
    const ssid = option?.dataset?.ssid || "";
    if (ssid) {
      el.settingsWifiSsid.value = ssid;
    }
    const bssid = normalizeBssid(option?.dataset?.bssid || "");
    if (bssid && el.settingsWifiBssid) {
      el.settingsWifiBssid.value = bssid;
    }
  };
  if (el.settingsWifiCountryCode) {
    el.settingsWifiCountryCode.oninput = () => {
      const cleaned = (el.settingsWifiCountryCode.value || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 2);
      el.settingsWifiCountryCode.value = cleaned;
    };
  }
  if (el.settingsWifiBssid) {
    el.settingsWifiBssid.oninput = () => {
      const cleaned = (el.settingsWifiBssid.value || "")
        .toUpperCase()
        .replace(/[^0-9A-F:-]/g, "")
        .slice(0, 17);
      el.settingsWifiBssid.value = cleaned;
    };
  }
  if (el.uploadLanguageCode) {
    el.uploadLanguageCode.oninput = () => {
      const cleaned = (el.uploadLanguageCode.value || "")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "")
        .slice(0, 15);
      el.uploadLanguageCode.value = cleaned;
    };
  }
  if (el.settingsLanguage) {
    el.settingsLanguage.onchange = async () => {
      const lang = normalizeUiLanguage(el.settingsLanguage.value);
      if (!editor.settings) editor.settings = {};
      if (!editor.settings.ui) editor.settings.ui = {};
      editor.settings.ui.language = lang;
      await loadI18nLanguage(lang);
      if (el.uploadLanguageCode) {
        el.uploadLanguageCode.value = lang;
      }
      renderSettings();
    };
  }
  if (el.reloadLanguagesBtn) {
    el.reloadLanguagesBtn.onclick = async () => {
      try {
        await loadLanguageCatalog();
        renderLanguageOptions();
        if (el.settingsTranslationInfo) {
          el.settingsTranslationInfo.textContent = t("settings.translation.info");
        }
      } catch (err) {
        if (el.settingsTranslationInfo) {
          el.settingsTranslationInfo.textContent = t("settings.translation.upload_fail", { error: err.message });
          el.settingsTranslationInfo.classList.add("error");
        }
      }
    };
  }
  if (el.downloadLanguageBtn) {
    el.downloadLanguageBtn.onclick = async () => {
      const lang = normalizeUiLanguage(el.settingsLanguage?.value || editor.i18nLanguage);
      await loadI18nLanguage(lang);
      downloadLanguageJson();
    };
  }
  if (el.uploadLanguageBtn) {
    el.uploadLanguageBtn.onclick = async () => {
      if (el.settingsTranslationInfo) {
        el.settingsTranslationInfo.classList.remove("error");
      }
      try {
        const targetLang = normalizeLanguageCode(el.uploadLanguageCode?.value, "");
        await uploadLanguageJson();
        if (el.settingsTranslationInfo) {
          el.settingsTranslationInfo.textContent = t("settings.translation.upload_ok", { lang: targetLang });
          el.settingsTranslationInfo.classList.remove("error");
        }
        if (el.uploadLanguageFile) {
          el.uploadLanguageFile.value = "";
        }
        await loadI18nLanguage(targetLang || editor.i18nLanguage, true);
        renderSettings();
      } catch (err) {
        if (el.settingsTranslationInfo) {
          el.settingsTranslationInfo.textContent = t("settings.translation.upload_fail", { error: err.message });
          el.settingsTranslationInfo.classList.add("error");
        }
      }
    };
  }
  if (el.provScanWifiBtn) {
    el.provScanWifiBtn.onclick = () => scanWifiNetworks("provisioning");
  }
  if (el.provWifiScanResults) {
    el.provWifiScanResults.onchange = () => {
      const option = el.provWifiScanResults.selectedOptions?.[0];
      const ssid = option?.dataset?.ssid || "";
      if (ssid && el.provWifiSsid) {
        el.provWifiSsid.value = ssid;
      }
    };
  }
  if (el.provWifiCountryCode) {
    el.provWifiCountryCode.oninput = () => {
      const cleaned = (el.provWifiCountryCode.value || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 2);
      el.provWifiCountryCode.value = cleaned;
    };
  }
  if (el.provWifiShowPassword && el.provWifiPassword) {
    el.provWifiShowPassword.onchange = () => {
      el.provWifiPassword.type = el.provWifiShowPassword.checked ? "text" : "password";
    };
  }
  if (el.provHaShowToken && el.provHaToken) {
    el.provHaShowToken.onchange = () => {
      el.provHaToken.type = el.provHaShowToken.checked ? "text" : "password";
    };
  }
  if (el.provWifiSaveBtn) {
    el.provWifiSaveBtn.onclick = async () => {
      try {
        await saveWifiProvisioning();
      } catch (err) {
        setProvisioningInfo("wifi", t("provision.save_failed", { error: err.message }), true);
      }
    };
  }
  if (el.provHaSaveBtn) {
    el.provHaSaveBtn.onclick = async () => {
      try {
        await saveHaProvisioning();
      } catch (err) {
        setProvisioningInfo("ha", t("provision.save_failed", { error: err.message }), true);
      }
    };
  }
  el.saveSettingsBtn.onclick = async () => {
    try {
      await saveSettings();
    } catch (err) {
      setStatus(t("status.settings_save_failed", { error: err.message }), true);
    }
  };
  if (el.applyDisplayBtn) {
    el.applyDisplayBtn.onclick = async () => {
      try {
        await applyDisplaySettings();
      } catch (err) {
        if (el.settingsDisplayInfo) {
          el.settingsDisplayInfo.textContent = String(err?.message || err);
          el.settingsDisplayInfo.classList.add("error");
        }
      }
    };
  }
  bindPressFxPreview();
  bindValueAnimPreview();
  bindSdSettings();
  bindTopbar();
  bindNav();
  if (el.applyPagesBtn) {
    el.applyPagesBtn.onclick = async () => {
      try {
        await applyDisplaySettings(el.settingsPagesInfo, "settings.pages.applied");
      } catch (err) {
        if (el.settingsPagesInfo) {
          el.settingsPagesInfo.textContent = String(err?.message || err);
          el.settingsPagesInfo.classList.add("error");
        }
      }
    };
  }
  if (el.reloadPagesBtn) {
    el.reloadPagesBtn.onclick = () => {
      loadPanelPages(true);
    };
  }
  if (el.showPageOnPanelBtn) {
    el.showPageOnPanelBtn.onclick = async () => {
      const page = el.settingsPageTarget?.value;
      if (!page) return;
      if (el.settingsPageActivateInfo) {
        el.settingsPageActivateInfo.textContent = t("status.saving_settings");
        el.settingsPageActivateInfo.classList.remove("error");
      }
      try {
        await activatePanelPage(page);
        if (el.settingsPageActivateInfo) {
          el.settingsPageActivateInfo.textContent = t("settings.pages.activated", { page });
        }
        loadPanelPages(false);
      } catch (err) {
        if (el.settingsPageActivateInfo) {
          el.settingsPageActivateInfo.textContent = String(err?.message || err);
          el.settingsPageActivateInfo.classList.add("error");
        }
      }
    };
  }
  if (el.applyMqttBtn) {
    el.applyMqttBtn.onclick = async () => {
      try {
        await applyMqttSettings();
      } catch (err) {
        if (el.settingsMqttInfo) {
          el.settingsMqttInfo.textContent = String(err?.message || err);
          el.settingsMqttInfo.classList.add("error");
        }
      }
    };
  }
  if (el.settingsMqttUseTls) {
    el.settingsMqttUseTls.onchange = () => {
      syncMqttPortForTls();
      if (el.settingsMqttInfo) {
        el.settingsMqttInfo.classList.remove("error");
        el.settingsMqttInfo.textContent = t("settings.mqtt.reapply_hint");
      }
    };
  }
  if (el.settingsMqttEnabled) {
    el.settingsMqttEnabled.onchange = () => {
      if (el.settingsMqttInfo) {
        el.settingsMqttInfo.classList.remove("error");
        el.settingsMqttInfo.textContent = t("settings.mqtt.reapply_hint");
      }
    };
  }
  if (el.uploadWallpaperBtn) {
    el.uploadWallpaperBtn.onclick = async () => {
      try {
        await uploadWallpaper();
      } catch (err) {
        if (el.settingsWallpaperInfo) {
          el.settingsWallpaperInfo.textContent = String(err?.message || err);
          el.settingsWallpaperInfo.classList.add("error");
        }
      }
    };
  }
  if (el.removeWallpaperBtn) {
    el.removeWallpaperBtn.onclick = async () => {
      try {
        await removeWallpaper();
      } catch (err) {
        if (el.settingsWallpaperInfo) {
          el.settingsWallpaperInfo.textContent = String(err?.message || err);
          el.settingsWallpaperInfo.classList.add("error");
        }
      }
    };
  }
  if (el.downloadBackupBtn) {
    el.downloadBackupBtn.onclick = async () => {
      try {
        await downloadBackup();
      } catch (err) {
        setBackupInfo(t("settings.backup.download_failed", { error: String(err?.message || err) }), true);
      }
    };
  }
  if (el.restoreBackupBtn) {
    el.restoreBackupBtn.onclick = async () => {
      try {
        await restoreBackup();
      } catch (err) {
        setBackupInfo(t("settings.backup.restore_failed", { error: String(err?.message || err) }), true);
      }
    };
  }
  el.saveBtn.onclick = async () => {
    try {
      await saveLayout();
    } catch (err) {
      setStatus(t("layout.status.save_failed", { error: err.message }), true);
    }
  };
  el.exportBtn.onclick = exportLayout;
  el.importBtn.onclick = () => {
    const text = el.jsonPaste.value.trim();
    if (!text) return;
    try {
      importLayoutFromText(text);
    } catch (err) {
      setStatus(t("layout.status.import_failed", { error: err.message }), true);
    }
  };
  el.importFile.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      importLayoutFromText(text);
    } catch (err) {
      setStatus(t("layout.status.file_import_failed", { error: err.message }), true);
    }
  };
}

async function startEditor() {
  if (editor.editorStarted) return;
  editor.editorStarted = true;
  setProvisioningVisible(false);
  setActivePane("layout");
  await Promise.all([loadLayout(), loadEntities(), refreshStates()]);
  await loadEnergyPreview();
  await loadHaDiagnostics();
  if (setupWizardShouldAutoOpen()) {
    openSetupWizard();
  }
  /* Poll diagnostics again shortly after startup so the banner appears automatically
   * once the ha_client watchdog has classified the missing entities (typically ~5-8 s
   * after WebSocket auth). Further refreshes are less frequent. */
  window.setTimeout(loadHaDiagnostics, 3000);
  window.setTimeout(loadHaDiagnostics, 8000);
  window.setTimeout(loadHaDiagnostics, 15000);
  window.setInterval(refreshStates, 5000);
  window.setInterval(loadEnergyPreview, 15000);
  window.setInterval(loadHaDiagnostics, 30000);
}

async function bootstrap() {
  bindUi();
  initThemeSection();
  setStatus(t("status.idle"));
  await loadAppVersion();
  const settings = await loadSettings(true);
  const stage = provisioningStageForSettings(settings);
  if (stage) {
    showProvisioningStage(stage, settings);
    return;
  }
  await startEditor();
}


// ============================================================
// Theme management (appended)
// ============================================================
const themeState = {
  list: [],
  activeId: "",
  editing: null,
  baseId: "",
};

/* Day/night automatic theme, mirrored from /api/settings and kept here because
 * the theme list is loaded separately from the display settings. */
const autoThemeState = {
  enabled: false,
  dayId: "",
  nightId: "",
};

function themeAutoOptionLabel(entry) {
  return (entry.builtin ? "[built-in] " : "[custom] ") + (entry.name || entry.id);
}

/* Fills both day/night dropdowns from the loaded theme list. The current
 * selection is preserved, an id that no longer exists shows as unset. */
function themePopulateAutoSelects() {
  const daySel = themeEl("settingsThemeDaySelect");
  const nightSel = themeEl("settingsThemeNightSelect");
  if (!daySel || !nightSel) return;

  const fill = (sel, current) => {
    /* Keep what the user picked in this session; the passed value is only used
     * for the very first fill, before any option exists. */
    const wanted = sel.options.length > 0 ? sel.value || "" : current || "";
    sel.innerHTML = "";
    const none = document.createElement("option");
    none.value = "";
    none.textContent = t("settings.display.theme_auto_none");
    sel.appendChild(none);
    for (const entry of themeState.list) {
      const opt = document.createElement("option");
      opt.value = entry.id;
      opt.textContent = themeAutoOptionLabel(entry);
      sel.appendChild(opt);
    }
    sel.value = wanted;
    if (sel.selectedIndex < 0) sel.value = "";
  };

  fill(daySel, autoThemeState.dayId);
  fill(nightSel, autoThemeState.nightId);
  autoThemeState.dayId = daySel.value || "";
  autoThemeState.nightId = nightSel.value || "";
}

function themeEl(id) {
  return document.getElementById(id);
}

function themeSetInfo(msg, isError) {
  const info = themeEl("settingsThemeInfo");
  if (info) {
    info.textContent = msg || "";
    info.style.color = isError ? "#ff6b6b" : "";
  }
}

async function themeFetchList() {
  const resp = await fetch("/api/themes");
  if (!resp.ok) throw new Error("themes list failed");
  const data = await resp.json();
  if (Array.isArray(data)) {
    return { themes: data, active_id: "" };
  }
  return {
    themes: Array.isArray(data && data.themes) ? data.themes : [],
    active_id: (data && data.active_id) || "",
  };
}

async function themeFetchActive() {
  const resp = await fetch("/api/themes/active");
  if (!resp.ok) throw new Error("themes active failed");
  return resp.json();
}

async function themeFetchById(id) {
  const resp = await fetch("/api/themes/get?id=" + encodeURIComponent(id));
  if (!resp.ok) throw new Error("theme get failed");
  return resp.json();
}

function themePopulateSelect() {
  const sel = themeEl("settingsThemeSelect");
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = "";
  for (const entry of themeState.list) {
    const opt = document.createElement("option");
    opt.value = entry.id;
    opt.textContent = (entry.builtin ? "[built-in] " : "[custom] ") + (entry.name || entry.id);
    sel.appendChild(opt);
  }
  if (themeState.activeId) {
    sel.value = themeState.activeId;
  } else if (prev) {
    sel.value = prev;
  }
}

function themeSnapTo565(hex) {
  if (typeof hex !== "string") return hex;
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const v = parseInt(m[1], 16);
  let r = (v >> 16) & 0xff;
  let g = (v >> 8) & 0xff;
  let b = v & 0xff;
  const r5 = Math.round((r * 31) / 255);
  const g6 = Math.round((g * 63) / 255);
  const b5 = Math.round((b * 31) / 255);
  r = (r5 << 3) | (r5 >> 2);
  g = (g6 << 2) | (g6 >> 4);
  b = (b5 << 3) | (b5 >> 2);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

const THEME_COLOR_GROUPS = [
  {
    id: "screen",
    label: "Screen & Content",
    keys: ["screen_bg", "screen_bg_grad", "content_bg", "content_border"],
  },
  {
    id: "topbar",
    label: "Top Bar",
    keys: [
      "topbar_bg",
      "topbar_border",
      "topbar_text",
      "topbar_muted",
      "topbar_chip_bg",
      "topbar_chip_border",
      "topbar_status_on",
      "topbar_status_off",
    ],
  },
  {
    id: "text",
    label: "Text",
    keys: ["text_primary", "text_soft", "text_muted"],
  },
  {
    id: "nav",
    label: "Navigation",
    keys: [
      "nav_bg",
      "nav_border",
      "nav_btn_bg_idle",
      "nav_btn_bg_active",
      "nav_tab_idle",
      "nav_tab_active",
      "nav_home_idle",
      "nav_home_active",
    ],
  },
  {
    id: "status",
    label: "Status & Connectivity",
    keys: ["ok", "error", "wifi_off"],
  },
  {
    id: "cards",
    label: "Cards (generic tiles)",
    keys: [
      "card_bg_off",
      "card_bg_on",
      "card_border",
      "card_icon_off",
      "card_icon_on",
      "state_on",
      "state_off",
    ],
  },
  {
    id: "light",
    label: "Light Tiles",
    keys: [
      "light_icon_on",
      "light_track_on",
      "light_track_off",
      "light_ind_on",
      "light_ind_off",
      "light_knob_on",
      "light_knob_off",
    ],
  },
  {
    id: "heat",
    label: "Heating Tiles",
    keys: [
      "heat_icon_on",
      "heat_track_on",
      "heat_track_off",
      "heat_ind_on",
      "heat_ind_off",
      "heat_knob_on",
      "heat_knob_off",
    ],
  },
  {
    id: "weather",
    label: "Weather",
    keys: ["weather_icon"],
  },
];

function themeHumanizeKey(key) {
  if (!key) return "";
  return key
    .replace(/_/g, " ")
    .replace(/\bbg\b/gi, "background")
    .replace(/\bind\b/gi, "indicator")
    .replace(/\bbtn\b/gi, "button")
    .replace(/\btxt\b/gi, "text")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function themeRenderColorGrid(palette) {
  const grid = themeEl("settingsThemeColors");
  if (!grid) return;
  grid.innerHTML = "";
  const colors = (palette && palette.colors) || {};
  const seen = new Set();

  const renderInput = (container, key) => {
    if (!(key in colors)) return;
    seen.add(key);
    const lbl = document.createElement("label");
    const span = document.createElement("span");
    span.textContent = themeHumanizeKey(key);
    span.title = key;
    const input = document.createElement("input");
    input.type = "color";
    input.dataset.key = key;
    const snapped = themeSnapTo565(colors[key]);
    input.value = snapped;
    if (themeState.editing && themeState.editing.colors) {
      themeState.editing.colors[key] = snapped;
    }
    input.addEventListener("input", () => {
      const snappedLive = themeSnapTo565(input.value);
      if (snappedLive !== input.value) {
        input.value = snappedLive;
      }
      themeState.editing.colors[key] = snappedLive;
      themeRenderPreview();
    });
    lbl.appendChild(span);
    lbl.appendChild(input);
    container.appendChild(lbl);
  };

  const appendGroup = (label, keys, { open = true } = {}) => {
    const available = keys.filter((k) => k in colors && !seen.has(k));
    if (available.length === 0) return;
    const group = document.createElement("details");
    group.className = "theme-color-group";
    if (open) group.open = true;
    const summary = document.createElement("summary");
    summary.textContent = label;
    group.appendChild(summary);
    const body = document.createElement("div");
    body.className = "theme-color-group-body";
    for (const key of available) renderInput(body, key);
    group.appendChild(body);
    grid.appendChild(group);
  };

  for (const g of THEME_COLOR_GROUPS) {
    appendGroup(g.label, g.keys, { open: true });
  }

  // Any keys not covered by a known group — render as "Other" collapsed.
  const leftover = Object.keys(colors)
    .filter((k) => !seen.has(k))
    .sort();
  if (leftover.length > 0) {
    appendGroup("Other", leftover, { open: false });
  }
}

function themeRenderPreview() {
  const canvas = themeEl("settingsThemePreviewCanvas");
  if (!canvas || !themeState.editing) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const c = themeState.editing.colors || {};
  const bg = c.screen_bg || "#121212";
  const cardOff = c.card_bg_off || "#2a2a2a";
  const cardOn = c.card_bg_on || "#3a3a3a";
  const text = c.text_primary || "#ffffff";
  const soft = c.text_soft || "#cccccc";
  const accent = c.nav_tab_active || "#6fe8ff";
  const heatInd = c.heat_ind_on || accent;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Tile 1 (off)
  ctx.fillStyle = cardOff;
  themeRoundRect(ctx, 10, 10, 100, 90, 12, true);
  ctx.fillStyle = text;
  ctx.font = "11px sans-serif";
  ctx.fillText("Sensor", 18, 28);
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("21.5°", 18, 60);
  ctx.font = "10px sans-serif";
  ctx.fillStyle = soft;
  ctx.fillText("off", 18, 88);

  // Tile 2 (on)
  ctx.fillStyle = cardOn;
  themeRoundRect(ctx, 120, 10, 100, 90, 12, true);
  ctx.fillStyle = text;
  ctx.font = "11px sans-serif";
  ctx.fillText("Light", 128, 28);
  ctx.fillStyle = accent;
  ctx.fillRect(128, 40, 80, 8);
  ctx.fillStyle = text;
  ctx.font = "10px sans-serif";
  ctx.fillText("on", 128, 88);

  // Tile 3 (heating arc)
  ctx.fillStyle = cardOn;
  themeRoundRect(ctx, 230, 10, 120, 200, 12, true);
  ctx.strokeStyle = c.heat_track_on || "#555";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(290, 110, 45, Math.PI * 0.8, Math.PI * 0.2, false);
  ctx.stroke();
  ctx.strokeStyle = heatInd;
  ctx.beginPath();
  ctx.arc(290, 110, 45, Math.PI * 0.8, Math.PI * 1.4, false);
  ctx.stroke();
  ctx.fillStyle = text;
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("22.5°", 272, 115);
  ctx.fillStyle = soft;
  ctx.font = "10px sans-serif";
  ctx.fillText("Target 22.5", 270, 170);

  // Bottom nav area
  ctx.fillStyle = c.topbar_bg || "#1a1a1a";
  ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
  ctx.fillStyle = accent;
  ctx.fillRect(10, canvas.height - 26, 40, 22);
  ctx.fillStyle = text;
  ctx.font = "11px sans-serif";
  ctx.fillText("Home", 14, canvas.height - 12);
}

function themeRoundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  else ctx.stroke();
}

async function themeLoadAndRender() {
  try {
    const listResp = await themeFetchList();
    themeState.list = listResp.themes;
    const active = await themeFetchActive();
    themeState.activeId = (active && active.id) || listResp.active_id || "";
    themeState.baseId = themeState.activeId;
    themeState.editing = JSON.parse(JSON.stringify(active));
    themePopulateSelect();
    themePopulateAutoSelects();
    if (el.fPageTheme) pagePopulateThemeSelect();
    themeRenderColorGrid(themeState.editing);
    themeRenderPreview();
    themeSyncEditFields();
    themeSetInfo("");
  } catch (e) {
    themeSetInfo("Load failed: " + (e && e.message ? e.message : e), true);
  }
}

/* Prefill the "Custom theme ID / name" inputs based on what's in the
 * dropdown + the currently loaded palette, so that selecting an existing
 * custom theme makes it immediately editable (Save overwrites the same id).
 * For built-in themes we clear the inputs so the user has to pick a new id. */
function themeSyncEditFields() {
  const idInput = themeEl("settingsThemeNewId");
  const nameInput = themeEl("settingsThemeNewName");
  const baseMeta = themeEl("settingsThemeBase");
  if (!idInput || !nameInput) return;

  const editing = themeState.editing || {};
  const entry = themeState.list.find((e) => e.id === editing.id);
  const isCustom = entry && !entry.builtin;

  if (isCustom) {
    idInput.value = editing.id || "";
    nameInput.value = editing.name || entry.name || "";
    idInput.readOnly = true;
    idInput.title = "Editing existing custom theme. Clear to save as a new one.";
    if (baseMeta) {
      baseMeta.textContent =
        "Editing custom theme \"" + (editing.name || editing.id) +
        "\". Changes are saved back to id \"" + editing.id + "\".";
    }
  } else {
    idInput.value = "";
    nameInput.value = "";
    idInput.readOnly = false;
    idInput.title = "";
    if (baseMeta) {
      baseMeta.textContent =
        "Base palette: " + (editing.name || editing.id || "active theme") +
        ". Edit colors below, then \"Save as custom\".";
    }
  }

  const saveBtn = themeEl("settingsThemeSaveCustomBtn");
  if (saveBtn) {
    saveBtn.textContent = isCustom ? "Save changes" : "Save as custom";
  }
}

async function themeApplyActive() {
  const sel = themeEl("settingsThemeSelect");
  if (!sel || !sel.value) return;
  try {
    const resp = await fetch("/api/themes/active", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sel.value }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    themeSetInfo("Active theme set to " + sel.value);
    await themeLoadAndRender();
  } catch (e) {
    themeSetInfo("Apply failed: " + e.message, true);
  }
}

async function themeExportActive() {
  const sel = themeEl("settingsThemeSelect");
  const id = (sel && sel.value) || themeState.activeId;
  if (!id) return;
  try {
    const theme = await themeFetchById(id);
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "theme-" + id + ".json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    themeSetInfo("Export failed: " + e.message, true);
  }
}

async function themeImportFile() {
  const input = themeEl("settingsThemeImportFile");
  if (!input || !input.files || !input.files[0]) {
    themeSetInfo("Choose a JSON file first", true);
    return;
  }
  try {
    const text = await input.files[0].text();
    const theme = JSON.parse(text);
    if (!theme || !theme.id) throw new Error("invalid theme JSON: missing id");
    const resp = await fetch("/api/themes/custom", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(theme),
    });
    if (!resp.ok) throw new Error(await resp.text());
    themeSetInfo("Imported theme " + theme.id);
    await themeLoadAndRender();
  } catch (e) {
    themeSetInfo("Import failed: " + e.message, true);
  }
}

async function themeSaveCustom() {
  const idInput = themeEl("settingsThemeNewId");
  const nameInput = themeEl("settingsThemeNewName");
  let id = (idInput && idInput.value || "").trim();
  let name = (nameInput && nameInput.value || "").trim();
  // If the inputs are empty but we are editing an existing custom theme,
  // reuse its id/name so "Save" overwrites the same theme.
  const editing = themeState.editing || {};
  const editingEntry = themeState.list.find((e) => e.id === editing.id);
  if (!id && editingEntry && !editingEntry.builtin) {
    id = editing.id || "";
    if (!name) name = editing.name || editing.id || "";
  }
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    themeSetInfo("Custom theme ID must be alphanumeric (_-) only", true);
    return;
  }
  if (!themeState.editing || !themeState.editing.colors) {
    themeSetInfo("No palette to save", true);
    return;
  }
  const payload = {
    id,
    name: name || id,
    builtin: false,
    colors: themeState.editing.colors,
  };
  try {
    const resp = await fetch("/api/themes/custom", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(await resp.text());
    themeSetInfo("Saved custom theme " + id);
    await themeLoadAndRender();
    // Re-select the just-saved theme so editing continues on it.
    const selAfter = themeEl("settingsThemeSelect");
    if (selAfter) {
      selAfter.value = id;
      if (typeof selAfter.onchange === "function") {
        await selAfter.onchange();
      }
    }
  } catch (e) {
    themeSetInfo("Save failed: " + e.message, true);
  }
}

async function themeDeleteCustom() {
  const sel = themeEl("settingsThemeSelect");
  if (!sel || !sel.value) return;
  const entry = themeState.list.find((e) => e.id === sel.value);
  if (!entry) return;
  if (entry.builtin) {
    themeSetInfo("Cannot delete built-in themes", true);
    return;
  }
  if (!window.confirm("Delete theme " + entry.id + "?")) return;
  try {
    const resp = await fetch("/api/themes/custom?id=" + encodeURIComponent(entry.id), { method: "DELETE" });
    if (!resp.ok) throw new Error(await resp.text());
    themeSetInfo("Deleted " + entry.id);
    await themeLoadAndRender();
  } catch (e) {
    themeSetInfo("Delete failed: " + e.message, true);
  }
}

function themeResetToActive() {
  void themeLoadAndRender();
}

function initThemeSection() {
  const applyBtn = themeEl("settingsThemeApplyBtn");
  if (applyBtn) applyBtn.onclick = () => void themeApplyActive();
  const exportBtn = themeEl("settingsThemeExportBtn");
  if (exportBtn) exportBtn.onclick = () => void themeExportActive();
  const importBtn = themeEl("settingsThemeImportBtn");
  if (importBtn) importBtn.onclick = () => void themeImportFile();
  const delBtn = themeEl("settingsThemeDeleteBtn");
  if (delBtn) delBtn.onclick = () => void themeDeleteCustom();
  const saveBtn = themeEl("settingsThemeSaveCustomBtn");
  if (saveBtn) saveBtn.onclick = () => void themeSaveCustom();
  const resetBtn = themeEl("settingsThemeResetBtn");
  if (resetBtn) resetBtn.onclick = () => themeResetToActive();
  const sel = themeEl("settingsThemeSelect");
  if (sel) {
    sel.onchange = async () => {
      try {
        const theme = await themeFetchById(sel.value);
        themeState.editing = theme;
        themeState.baseId = theme.id;
        themeRenderColorGrid(themeState.editing);
        themeRenderPreview();
        themeSyncEditFields();
      } catch (e) {
        themeSetInfo("Load failed: " + e.message, true);
      }
    };
  }
  void themeLoadAndRender();
}

// ============================================================
// Simplified layout UI: + Add dropdowns for Pages / Widgets.
// The original buttons are kept hidden (.legacy-hidden) so every
// existing handler keeps working — menu items just click them.
// ============================================================
function initSimpleUiMenus() {
  bindDropdown("addPageMenuBtn", "addPageMenu");
  bindDropdown("addWidgetMenuBtn", "addWidgetMenu");

  const pageNormal = document.getElementById("addPageMenuNormal");
  if (pageNormal) {
    pageNormal.onclick = () => {
      closeAllDropdowns();
      if (el.addPageBtn) el.addPageBtn.click();
    };
  }
  const pageEnergy = document.getElementById("addPageMenuEnergy");
  if (pageEnergy) {
    pageEnergy.onclick = () => {
      closeAllDropdowns();
      if (el.addEnergyPageBtn) el.addEnergyPageBtn.click();
    };
  }
  const pageXiaozhi = document.getElementById("addPageMenuXiaozhi");
  if (pageXiaozhi) {
    pageXiaozhi.onclick = () => {
      closeAllDropdowns();
      if (el.addXiaozhiPageBtn) el.addXiaozhiPageBtn.click();
    };
  }
  const pageMusic = document.getElementById("addPageMenuMusic");
  if (pageMusic) {
    pageMusic.onclick = () => {
      closeAllDropdowns();
      if (el.addMusicPageBtn) el.addMusicPageBtn.click();
    };
  }
  const pageRadio = document.getElementById("addPageMenuRadio");
  if (pageRadio) {
    pageRadio.onclick = () => {
      closeAllDropdowns();
      if (el.addRadioPageBtn) el.addRadioPageBtn.click();
    };
  }
  const pageWeather = document.getElementById("addPageMenuWeather");
  if (pageWeather) {
    pageWeather.onclick = () => {
      closeAllDropdowns();
      if (el.addWeatherPageBtn) el.addWeatherPageBtn.click();
    };
  }

  const widgetMenu = document.getElementById("addWidgetMenu");
  if (widgetMenu) {
    widgetMenu.querySelectorAll("[data-add-target]").forEach((item) => {
      item.onclick = () => {
        closeAllDropdowns();
        const targetId = item.getAttribute("data-add-target");
        const btn = document.getElementById(targetId);
        if (btn) btn.click();
      };
    });
  }

  document.addEventListener("click", (ev) => {
    const target = ev.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".dropdown")) return;
    closeAllDropdowns();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeAllDropdowns();
  });
}

function bindDropdown(toggleId, menuId) {
  const toggle = document.getElementById(toggleId);
  const menu = document.getElementById(menuId);
  if (!toggle || !menu) return;
  toggle.onclick = (ev) => {
    ev.stopPropagation();
    const willOpen = menu.classList.contains("hidden");
    closeAllDropdowns();
    if (willOpen) {
      menu.classList.remove("hidden");
      toggle.setAttribute("aria-expanded", "true");
    }
  };
}

function closeAllDropdowns() {
  for (const menu of document.querySelectorAll(".dropdown-menu")) {
    menu.classList.add("hidden");
  }
  for (const toggle of document.querySelectorAll(".dropdown-toggle")) {
    toggle.setAttribute("aria-expanded", "false");
  }
}

bootstrap();

