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
};
const SETTINGS_NAV_ITEMS = [
  { sectionId: "settingsWifiSection", headingId: "settingsWifiHeading", labelKey: "settings.wifi.heading" },
  { sectionId: "settingsHaSection", headingId: "settingsHaHeading", labelKey: "settings.ha.heading" },
  { sectionId: "settingsXiaozhiSection", headingId: "settingsXiaozhiHeading", labelKey: "settings.xiaozhi.heading" },
  { sectionId: "settingsCamerasSection", headingId: "settingsCamerasHeading", labelKey: "settings.cameras.heading" },
  { sectionId: "settingsTimeSection", headingId: "settingsTimeHeading", labelKey: "settings.time.heading" },
  { sectionId: "settingsUiSection", headingId: "settingsUiHeading", labelKey: "settings.ui.heading" },
  { sectionId: "settingsThemeSection", headingId: "settingsThemeHeading", labelKey: "settings.theme.heading" },
  { sectionId: "settingsApSection", headingId: "settingsApHeading", labelKey: "settings.ap.heading" },
  { sectionId: "settingsOtaSection", headingId: "settingsOtaHeading", labelKey: "settings.ota.heading" },
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
const BUTTON_STYLES = new Set(["power_toggle", "power_status", "plug_icon", "lamp_icon", "highlight", "status_text"]);
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
    "layout.pages.delete": "Delete",
    "layout.pages.confirm_delete": "Delete page \"{name}\"? This removes all of its widgets.",
    "layout.pages.title_label": "Page title",
    "layout.pages.title_placeholder": "Page name on the display",
    "layout.pages.apply_title": "Apply page title",
    "layout.pages.new_title": "Page {number}",
    "layout.pages.energy_title": "Energy",
    "layout.pages.xiaozhi_title": "Xiaozhi",
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
    "layout.status.energy_page_only": "Energy pages do not accept widgets.",
    "layout.status.xiaozhi_page_only": "Xiaozhi pages are dedicated to the voice assistant and do not accept widgets.",
    "layout.status.xiaozhi_page_locked": "This page is managed by the Xiaozhi AI voice assistant built into the firmware. Configure it in Settings → Xiaozhi AI.",
    "layout.widgets.heading": "Widgets",
    "layout.widgets.add_sensor": "+ Sensor",
    "layout.widgets.add_binary": "+ Binary Sensor",
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
    "entity_picker.widget_cover": "Cover tile",
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
    "layout.inspector.heading": "Inspector",
    "layout.inspector.title": "Title",
    "layout.inspector.entity": "Entity",
    "layout.inspector.secondary_entity": "Actual entity (sensor)",
    "layout.inspector.secondary_entity_roborock": "Map entity (image, optional)",
    "layout.inspector.button_mode": "Button mode",
    "layout.inspector.button_accent_color": "Button accent color",
    "layout.inspector.button_style": "Button style",
    "layout.inspector.slider_entity_domain": "Slider entity type",
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
  },
  de: {
    "tabs.layout": "Layout",
    "tabs.settings": "Einstellungen",
    "sidebar.title": "BETTA Editor",
    "sidebar.subtitle": "Layout Quelle: JSON",
    "layout.pages.heading": "Seiten",
    "layout.pages.add": "+ Seite",
    "layout.pages.add_energy": "+ Energie-Seite",
    "layout.pages.delete": "Loeschen",
    "layout.pages.confirm_delete": "Seite \"{name}\" wirklich loeschen? Alle zugehoerigen Widgets werden entfernt.",
    "layout.pages.title_label": "Seitentitel",
    "layout.pages.title_placeholder": "Seitenname auf dem Display",
    "layout.pages.apply_title": "Seitentitel uebernehmen",
    "layout.pages.new_title": "Seite {number}",
    "layout.pages.energy_title": "Energie",
    "layout.pages.xiaozhi_title": "Xiaozhi",
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
    "layout.status.energy_page_only": "Energie-Seiten akzeptieren keine Widgets.",
    "layout.status.xiaozhi_page_only": "Xiaozhi-Seiten sind dem Sprachassistenten vorbehalten und akzeptieren keine Widgets.",
    "layout.status.xiaozhi_page_locked": "Diese Seite wird vom integrierten Xiaozhi-KI-Sprachassistenten verwaltet. Konfiguration unter Einstellungen → Xiaozhi-KI.",
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
      return compact
        ? { minW: 90, minH: 60, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 120, minH: 80, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
    case "binary_sensor":
    case "presence":
      return compact
        ? { minW: 90, minH: 60, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT }
        : { minW: 120, minH: 80, maxW: CANVAS_WIDTH, maxH: CANVAS_HEIGHT };
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
  entities: [],
  states: new Map(),
  energySnapshot: null,
  selectedPageId: null,
  selectedWidgetId: null,
  activePane: "layout",
  activeSettingsSection: "settingsWifiSection",
  provisioningStage: null,
  editorStarted: false,
  settings: null,
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
  languageCatalog: [],
  i18nLanguage: DEFAULT_UI_LANGUAGE,
  i18nMap: { ...(WEB_I18N_BUILTIN.en || {}) },
  i18nEffective: {},
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
  addSensorBtn: document.getElementById("addSensorBtn"),
  addBinarySensorBtn: document.getElementById("addBinarySensorBtn"),
  addButtonBtn: document.getElementById("addButtonBtn"),
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
  fX: document.getElementById("fX"),
  fY: document.getElementById("fY"),
  fW: document.getElementById("fW"),
  fH: document.getElementById("fH"),
  applyInspectorBtn: document.getElementById("applyInspectorBtn"),
  entityOptions: document.getElementById("entityOptions"),
  energyEntityOptions: document.getElementById("energyEntityOptions"),
  sensorEntityOptions: document.getElementById("sensorEntityOptions"),
  settingsWifiSsid: document.getElementById("settingsWifiSsid"),
  settingsWifiCountryCode: document.getElementById("settingsWifiCountryCode"),
  settingsWifiBssid: document.getElementById("settingsWifiBssid"),
  scanWifiBtn: document.getElementById("scanWifiBtn"),
  settingsWifiScanResults: document.getElementById("settingsWifiScanResults"),
  settingsWifiScanInfo: document.getElementById("settingsWifiScanInfo"),
  settingsWifiPassword: document.getElementById("settingsWifiPassword"),
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
  return BUTTON_STYLES.has(value) ? value : "";
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

function normalizeBinaryText(value) {
  return typeof value === "string" ? value : "";
}

function normalizeBoolDefaultTrue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "false" || value === "0") return false;
    if (value === "true" || value === "1") return true;
  }
  if (value === 0 || value === false) return false;
  return true;
}

function normalizeLayoutWidgets(layout) {
  if (!layout || !Array.isArray(layout.pages)) return;
  for (const page of layout.pages) {
    if (isEnergyPage(page)) {
      normalizeEnergyConfig(page);
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
        if (buttonModeRequiresMediaPlayer(widget.button_mode) || normalizeButtonStyle(widget.style_variant) === "") {
          delete widget.style_variant;
        } else {
          widget.style_variant = normalizeButtonStyle(widget.style_variant);
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
}

const OTA_URL_STORAGE_KEY = "betta.ota.manualUrl";
const OTA_URL_PLACEHOLDER = "https://example.com/betta-ha-panel-7b.ota.bin";

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
  setTextById("fSliderEntityDomainLabel", "layout.inspector.slider_entity_domain");
  setTextById("fSliderDirectionLabel", "layout.inspector.slider_direction");
  setTextById("fSliderAccentColorLabel", "layout.inspector.slider_accent_color");
  setTextById("fGraphLineColorLabel", "layout.inspector.graph_line_color");
  setTextById("fGraphTimeWindowMinLabel", "layout.inspector.graph_time_window_min");
  setTextById("fGraphPointCountLabel", "layout.inspector.graph_point_count");
  setTextById("fGraphDisplayModeLabel", "layout.inspector.graph_display_mode");
  setTextById("fGraphBarBucketMinLabel", "layout.inspector.graph_bar_bucket_min");
  setTextById("fBinaryShowTitleLabel", "layout.inspector.binary_show_title");
  setTextById("fBinaryColorOnLabel", "layout.inspector.binary_color_on");
  setTextById("fBinaryColorOffLabel", "layout.inspector.binary_color_off");
  setTextById("fBinaryTextOnLabel", "layout.inspector.binary_text_on");
  setTextById("fBinaryTextOffLabel", "layout.inspector.binary_text_off");
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

  setTextById("settingsTimeHeading", "settings.time.heading");
  setTextById("settingsNtpServerLabel", "settings.time.ntp_server");
  setTextById("settingsTimezoneLabel", "settings.time.timezone");

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
  if (el.settingsOtaUrl) {
    el.settingsOtaUrl.placeholder = OTA_URL_PLACEHOLDER;
  }
  setTextById("startOtaUrlBtn", "settings.ota.flash_url");
  setTextById("refreshOtaStatusBtn", "settings.ota.refresh");
  setTextById("settingsOtaFileLabel", "settings.ota.file");
  setTextById("uploadOtaBtn", "settings.ota.upload");

  setTextById("settingsActionsHeading", "settings.actions.heading");
  setTextById("reloadSettingsBtn", "settings.actions.reload");
  setTextById("saveSettingsBtn", "settings.actions.save");
  setTextById("settingsActionsHint", "settings.actions.hint");
  setTextById("settingsLogsHeading", "settings.logs.heading");
  setTextById("logsRefreshBtn", "settings.logs.refresh");
  setTextById("logsClearBtn", "settings.logs.clear");
  setTextById("logsAutoScrollLabel", "settings.logs.auto_scroll");
  setTextById("logsDownloadLink", "settings.logs.download");
  syncLogsPauseButtonText();
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
  if (item.sectionId === "settingsCamerasSection" && sectionChanged) {
    void loadCameras();
  }
  if (item.sectionId === "settingsLogsSection") {
    startLogsPoll();
  } else {
    clearLogsPoll();
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
    renderCanvas();
  } else if (editor.ota.status?.running || editor.ota.status?.rebooting) {
    setActiveSettingsSection(editor.activeSettingsSection);
    scheduleOtaStatusPoll();
  } else {
    setActiveSettingsSection(editor.activeSettingsSection);
  }
}

// ============================================================
// System log monitor (settings > Logs)
// ============================================================
const LOGS_POLL_MS = 2000;
const LOGS_MAX_LINES = 600;

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

function renderLogLines(text) {
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

  const start = Math.max(0, lines.length - LOGS_MAX_LINES);
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
    const response = await fetch("/api/logs", { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const text = await response.text();
    if (seq !== editor.logs.requestSeq) return;
    renderLogLines(text);
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

function renderSettings() {
  const settings = editor.settings || {};
  const wifi = settings.wifi || {};
  const ha = settings.ha || {};
  const time = settings.time || {};
  const ui = settings.ui || {};
  const scanSupported = wifi.scan_supported !== false;
  editor.wifiScanSupported = scanSupported;

  el.settingsWifiSsid.value = wifi.ssid || "";
  if (el.settingsWifiCountryCode) {
    el.settingsWifiCountryCode.value = normalizeCountryCode(wifi.country_code) || "US";
  }
  if (el.settingsWifiBssid) {
    el.settingsWifiBssid.value = normalizeBssid(wifi.bssid || "");
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
  el.settingsXiaozhiToken.value = "";
  el.settingsNtpServer.value = time.ntp_server || "";
  el.settingsTimezone.value = time.timezone || "";  if (el.settingsLanguage) {
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
  restoreOtaUrl();
  renderWifiScanResults(editor.wifiScanItems);
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

async function loadCameras() {
  if (!el.camerasList) return;
  try {
    const data = await apiGet("/api/cameras");
    editor.cameras.list = Array.isArray(data) ? data : [];
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
  const haUrl = el.settingsHaUrl.value.trim();
  const haToken = el.settingsHaToken.value.trim();
  const haRestEnabled = Boolean(el.settingsHaRestEnabled?.checked);
  const xiaozhiServer = el.settingsXiaozhiServer.value.trim();
  const xiaozhiOtaUrl = el.settingsXiaozhiOtaUrl.value.trim();
  const xiaozhiDevice = el.settingsXiaozhiDevice.value.trim();
  const xiaozhiToken = el.settingsXiaozhiToken.value.trim();
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  if (type === "sensor" || type === "graph") return ["sensor"];
  if (type === "binary_sensor") return ["binary_sensor"];
  if (type === "presence") return ["device_tracker", "person"];
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

  const id = typeof entity?.id === "string" ? entity.id : "";
  if (!id) return false;

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
  return editor.entities.filter((entity) => entityMatchesWidgetType(entity, type, sliderDomain, buttonMode));
}

function pickDefaultEntityForWidgetType(
  type,
  sliderDomain = DEFAULT_SLIDER_ENTITY_DOMAIN,
  buttonMode = DEFAULT_BUTTON_MODE,
) {
  if (type === "empty_tile") return "";
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

  const primaryEnabled = inspectorType !== "empty_tile";
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
    const badge = isEnergyPage(page) ? " ⚡" : isXiaozhiPage(page) ? " 🎤" : "";
    label.textContent = `${page.title || page.id}${badge}`;
    label.title = `[${page.id}] ${isEnergyPage(page) ? "energy" : isXiaozhiPage(page) ? "xiaozhi" : "page"}`;
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
    const prefix = isEnergyPage(page) ? "E " : isXiaozhiPage(page) ? "X " : "";
    button.textContent = `${prefix}${page.title || page.id}`;
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
    return;
  }
  el.pageTitleInput.disabled = false;
  el.applyPageBtn.disabled = false;
  el.pageTitleInput.value = page.title || page.id;

  const energyPage = isEnergyPage(page);
  if (el.energyPageOptions) {
    el.energyPageOptions.classList.toggle("hidden", !energyPage);
  }
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
  const lockedPage = !pageAcceptsWidgets(page);
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
  ];
  for (const button of addButtons) {
    if (button) button.disabled = lockedPage;
  }
  if (el.openSetupWizardBtn) {
    el.openSetupWizardBtn.disabled = lockedPage;
  }
  if (el.deleteWidgetBtn) {
    el.deleteWidgetBtn.disabled = lockedPage || !editor.selectedWidgetId;
  }

  if (lockedPage) {
    const li = document.createElement("li");
    li.className = "list-item muted";
    li.textContent = t(isXiaozhiPage(page) ? "layout.status.xiaozhi_page_only" : "layout.energy.no_widgets");
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
    return;
  }

  el.canvasTitle.textContent = `${t("layout.canvas.title")}: ${page.title || page.id}`;

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

  for (const widget of page.widgets) {
    const box = document.createElement("div");
    const isEmptyTile = widget.type === "empty_tile";
    const isBinarySensor = widget.type === "binary_sensor";
    const isPresence = widget.type === "presence";
    const isMediaPlayerButton = widget.type === "button" && String(widget.entity_id || "").startsWith("media_player.");
    let previewTitle = (isMediaPlayerButton && !String(widget.title || "").trim()) ? "" : (widget.title || widget.id);
    if (isBinarySensor && !normalizeBoolDefaultTrue(widget.binary_show_title)) {
      previewTitle = "";
    }
    box.className = `widget-box ${isEmptyTile ? "empty-tile" : ""} ${widget.id === editor.selectedWidgetId ? "selected" : ""}`;
    box.dataset.widgetId = widget.id;
    box.style.zIndex = isEmptyTile ? "1" : "10";
    let previewState = isEmptyTile ? "design" : (editor.states.get(widget.entity_id) || "unavailable");
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
      el.fButtonStyle.value = "";
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
      : (type === "light_tile" || type === "empty_tile") ? 140
      : type === "heating_tile" ? 150
      : (type === "cover" || type === "lock" || type === "fan" || type === "number") ? 160
      : type === "select" ? 200
      : 180
    : type === "weather_3day" ? 360
      : type === "todo_list" ? 360
      : type === "media_player" ? 360
      : type === "roborock_tile" ? 360
      : (type === "light_tile" || type === "heating_tile" || type === "weather_tile" || type === "empty_tile") ? 300
      : (type === "cover" || type === "lock" || type === "fan" || type === "number") ? 220
      : type === "select" ? 260
      : 220;
  const defaultH = compact
    ? type === "weather_3day" ? 240
      : type === "todo_list" ? 220
      : type === "media_player" ? 220
      : type === "roborock_tile" ? 300
      : type === "weather_tile" ? 180
      : (type === "light_tile" || type === "empty_tile") ? 140
      : type === "heating_tile" ? 150
      : (type === "cover" || type === "lock" || type === "fan" || type === "number") ? 130
      : type === "select" ? 110
      : 110
    : type === "weather_3day" ? 260
      : type === "todo_list" ? 360
      : type === "media_player" ? 280
      : type === "roborock_tile" ? 300
      : (type === "light_tile" || type === "heating_tile" || type === "weather_tile" || type === "empty_tile") ? 260
      : (type === "cover" || type === "lock" || type === "fan" || type === "number") ? 150
      : type === "select" ? 140
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

async function saveLayout() {
  if (isEnergyPage(selectedPage())) {
    applyEnergyPageConfig({ render: false });
  }
  normalizeLayoutWidgets(editor.layout);
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
  if (el.camerasSource) {
    el.camerasSource.onchange = () => {
      populateCamerasEntityOptions();
      updateCamerasFieldsVisibility();
    };
  }
  el.addPageBtn.onclick = addPage;
  if (el.addEnergyPageBtn) {
    el.addEnergyPageBtn.onclick = addEnergyPage;
  }
  if (el.addXiaozhiPageBtn) {
    el.addXiaozhiPageBtn.onclick = addXiaozhiPage;
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
  el.addSensorBtn.onclick = () => openLightEntityPicker("sensor");
  if (el.addBinarySensorBtn) {
    el.addBinarySensorBtn.onclick = () => openLightEntityPicker("binary_sensor");
  }
  if (el.addPresenceBtn) {
    el.addPresenceBtn.onclick = () => addWidget("presence");
  }
  el.addButtonBtn.onclick = () => openLightEntityPicker("button");
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
        el.fButtonStyle.value = "";
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
      if (el.fButtonStyle && buttonModeRequiresMediaPlayer(el.fButtonMode.value)) {
        el.fButtonStyle.value = "";
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
