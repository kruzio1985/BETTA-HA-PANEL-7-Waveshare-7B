/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 *
 * sensor_tile: a labeled list of sensor entities (GPU, CPU, temperatures,
 * network, ...) with a status dot, fixed label and live value per row.
 *
 * Rows are configured in def->extra_entity_ids as comma separated
 * "Label=entity.id" pairs, e.g. "GPU=sensor.gpu_temp,CPU=sensor.cpu_temp".
 * A row with an empty entity ("Label=") is hidden; a tile where every
 * entity is empty is hidden entirely.
 */
#include "ui/ui_widget_factory.h"

#include <limits.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "cJSON.h"

#include "ui/fonts/app_text_fonts.h"
#include "ui/fonts/mdi_font_registry.h"
#include "ui/ui_memory.h"
#include "ui/theme/theme_default.h"

#define SENSOR_TILE_DOT_SIZE 10
#define SENSOR_TILE_CHART_POINTS 32
#define SENSOR_TILE_CHART_SCALE 100
#define SENSOR_TILE_IP_ROW_H 34
#define SENSOR_TILE_POWER_H 40
#define SENSOR_TILE_POWER_GAP 10
#define SENSOR_TILE_LEGEND_SEGS 6

/* Air-quality colour scales. A row can carry a ":scale" suffix so its value
 * and status dot are coloured from the measured number (same thresholds as the
 * air station web UI). */
typedef enum {
    SENSOR_TILE_SCALE_NONE = 0,
    SENSOR_TILE_SCALE_AQI,
    SENSOR_TILE_SCALE_PM25,
    SENSOR_TILE_SCALE_PM10,
    SENSOR_TILE_SCALE_CO2,
    SENSOR_TILE_SCALE_TVOC,
    SENSOR_TILE_SCALE_CH2O,
    SENSOR_TILE_SCALE_CO,
    SENSOR_TILE_SCALE_LEVEL,
} sensor_tile_scale_t;

static lv_color_t sensor_tile_scale_color(uint8_t scale, float value)
{
    switch (scale) {
    case SENSOR_TILE_SCALE_AQI:
        if (value <= 50.0f) return lv_color_hex(0x00C853);
        if (value <= 100.0f) return lv_color_hex(0xFFD600);
        if (value <= 150.0f) return lv_color_hex(0xFF9100);
        if (value <= 200.0f) return lv_color_hex(0xE53935);
        if (value <= 300.0f) return lv_color_hex(0x8E24AA);
        return lv_color_hex(0x7B1F1F);
    case SENSOR_TILE_SCALE_PM25:
        if (value <= 10.0f) return lv_color_hex(0x00C853);
        if (value <= 15.0f) return lv_color_hex(0xFFD600);
        if (value <= 25.0f) return lv_color_hex(0xFF9100);
        if (value <= 37.5f) return lv_color_hex(0xE53935);
        return lv_color_hex(0x8E24AA);
    case SENSOR_TILE_SCALE_PM10:
        if (value <= 20.0f) return lv_color_hex(0x00C853);
        if (value <= 45.0f) return lv_color_hex(0xFFD600);
        if (value <= 75.0f) return lv_color_hex(0xFF9100);
        return lv_color_hex(0xE53935);
    case SENSOR_TILE_SCALE_CO2:
        if (value <= 600.0f) return lv_color_hex(0x00C853);
        if (value <= 1000.0f) return lv_color_hex(0xFFD600);
        if (value <= 1500.0f) return lv_color_hex(0xFF9100);
        return lv_color_hex(0xE53935);
    case SENSOR_TILE_SCALE_TVOC:
        if (value <= 0.3f) return lv_color_hex(0x00C853);
        if (value <= 0.5f) return lv_color_hex(0xFFD600);
        if (value <= 1.0f) return lv_color_hex(0xFF9100);
        return lv_color_hex(0xE53935);
    case SENSOR_TILE_SCALE_CH2O:
        if (value <= 20.0f) return lv_color_hex(0x00C853);
        if (value <= 40.0f) return lv_color_hex(0xFFD600);
        if (value <= 80.0f) return lv_color_hex(0xFF9100);
        return lv_color_hex(0xE53935);
    case SENSOR_TILE_SCALE_CO:
        if (value <= 9.0f) return lv_color_hex(0x00C853);
        if (value <= 35.0f) return lv_color_hex(0xFFD600);
        if (value <= 100.0f) return lv_color_hex(0xFF9100);
        return lv_color_hex(0xE53935);
    case SENSOR_TILE_SCALE_LEVEL:
        if (value <= 1.0f) return lv_color_hex(0x00C853);
        if (value <= 2.0f) return lv_color_hex(0xFFD600);
        if (value <= 3.0f) return lv_color_hex(0xFF9100);
        return lv_color_hex(0xE53935);
    default:
        return lv_color_hex(APP_UI_COLOR_STATE_ON);
    }
}

/* Number of colour stops (and their colours) for a scale legend. */
static int sensor_tile_scale_legend(uint8_t scale, lv_color_t *stops, int max_stops)
{
    if (max_stops <= 0) {
        return 0;
    }
    switch (scale) {
    case SENSOR_TILE_SCALE_AQI:
        if (stops != NULL && max_stops >= 6) {
            stops[0] = lv_color_hex(0x00C853);
            stops[1] = lv_color_hex(0xFFD600);
            stops[2] = lv_color_hex(0xFF9100);
            stops[3] = lv_color_hex(0xE53935);
            stops[4] = lv_color_hex(0x8E24AA);
            stops[5] = lv_color_hex(0x7B1F1F);
        }
        return 6;
    case SENSOR_TILE_SCALE_PM25:
        if (stops != NULL && max_stops >= 5) {
            stops[0] = lv_color_hex(0x00C853);
            stops[1] = lv_color_hex(0xFFD600);
            stops[2] = lv_color_hex(0xFF9100);
            stops[3] = lv_color_hex(0xE53935);
            stops[4] = lv_color_hex(0x8E24AA);
        }
        return 5;
    case SENSOR_TILE_SCALE_PM10:
        if (stops != NULL && max_stops >= 4) {
            stops[0] = lv_color_hex(0x00C853);
            stops[1] = lv_color_hex(0xFFD600);
            stops[2] = lv_color_hex(0xFF9100);
            stops[3] = lv_color_hex(0xE53935);
        }
        return 4;
    case SENSOR_TILE_SCALE_CO2:
    case SENSOR_TILE_SCALE_TVOC:
    case SENSOR_TILE_SCALE_CH2O:
    case SENSOR_TILE_SCALE_CO:
    case SENSOR_TILE_SCALE_LEVEL:
        if (stops != NULL && max_stops >= 4) {
            stops[0] = lv_color_hex(0x00C853);
            stops[1] = lv_color_hex(0xFFD600);
            stops[2] = lv_color_hex(0xFF9100);
            stops[3] = lv_color_hex(0xE53935);
        }
        return 4;
    default:
        return 0;
    }
}

/* Map a ":scale" suffix name to a scale enum. */
static uint8_t sensor_tile_scale_from_name(const char *name)
{
    if (name == NULL) {
        return SENSOR_TILE_SCALE_NONE;
    }
    if (strcmp(name, "aqi") == 0) return SENSOR_TILE_SCALE_AQI;
    if (strcmp(name, "pm10") == 0) return SENSOR_TILE_SCALE_PM10;
    if (strcmp(name, "pm") == 0) return SENSOR_TILE_SCALE_PM25;
    if (strcmp(name, "co2") == 0) return SENSOR_TILE_SCALE_CO2;
    if (strcmp(name, "tvoc") == 0) return SENSOR_TILE_SCALE_TVOC;
    if (strcmp(name, "ch2o") == 0) return SENSOR_TILE_SCALE_CH2O;
    if (strcmp(name, "co") == 0) return SENSOR_TILE_SCALE_CO;
    if (strcmp(name, "level") == 0) return SENSOR_TILE_SCALE_LEVEL;
    return SENSOR_TILE_SCALE_NONE;
}

/* Strip a trailing ":scale" suffix from a token (":aqi", ":pm", ":pm10",
 * ":co2", ":tvoc", ":ch2o", ":co", ":level") and return the scale. The token
 * buffer is shortened in place. */
static uint8_t sensor_tile_strip_scale_suffix(char *entity)
{
    if (entity == NULL) {
        return SENSOR_TILE_SCALE_NONE;
    }
    size_t len = strlen(entity);
    struct {
        const char *suffix;
        uint8_t scale;
    } const suffixes[] = {
        { ":aqi", SENSOR_TILE_SCALE_AQI },
        { ":pm10", SENSOR_TILE_SCALE_PM10 },
        { ":pm", SENSOR_TILE_SCALE_PM25 },
        { ":co2", SENSOR_TILE_SCALE_CO2 },
        { ":tvoc", SENSOR_TILE_SCALE_TVOC },
        { ":ch2o", SENSOR_TILE_SCALE_CH2O },
        { ":level", SENSOR_TILE_SCALE_LEVEL },
        { ":co", SENSOR_TILE_SCALE_CO },
    };
    for (size_t i = 0; i < sizeof(suffixes) / sizeof(suffixes[0]); i++) {
        size_t slen = strlen(suffixes[i].suffix);
        if (len >= slen && strcmp(entity + len - slen, suffixes[i].suffix) == 0) {
            entity[len - slen] = '\0';
            return suffixes[i].scale;
        }
    }
    return SENSOR_TILE_SCALE_NONE;
}

typedef struct {
    lv_obj_t *card;
    lv_obj_t *title_label;
    lv_obj_t *icon_label;
    uint8_t row_count;
    int title_font_px;
    int row_font_px;
    int ip_font_px;
    int power_font_px;
    int ports_font_px;
    struct {
        char label[APP_MAX_SENSOR_TILE_LABEL_LEN];
        char entity_id[APP_MAX_ENTITY_ID_LEN];
        bool is_bar;
        bool is_status;
        bool is_chart;
        bool is_ip;
        bool is_ports;
        bool is_power;
        bool has_power_color;
        bool is_header;
        bool is_legend;
        uint8_t scale;
        lv_color_t power_color;
        lv_obj_t *dot;
        lv_obj_t *bar;
        lv_obj_t *chart;
        lv_chart_series_t *chart_series;
        lv_obj_t *legend_segs[SENSOR_TILE_LEGEND_SEGS];
        int32_t chart_history[SENSOR_TILE_CHART_POINTS];
        uint8_t chart_count;
        lv_obj_t *name_label;
        lv_obj_t *value_label;
    } rows[APP_MAX_SENSOR_TILE_ROWS];
} sensor_tile_ctx_t;

static bool sensor_tile_state_is_missing(const char *state_text)
{
    if (state_text == NULL || state_text[0] == '\0') {
        return true;
    }
    return strcmp(state_text, "unavailable") == 0 || strcmp(state_text, "unknown") == 0;
}

static bool sensor_tile_state_is_offline(const char *state_text)
{
    if (state_text == NULL) {
        return true;
    }
    return strcmp(state_text, "off") == 0 || strcmp(state_text, "offline") == 0 ||
           strcmp(state_text, "stopped") == 0 || strcmp(state_text, "disconnected") == 0 ||
           strcmp(state_text, "down") == 0 || strcmp(state_text, "closed") == 0 ||
           strcmp(state_text, "paused") == 0 || strcmp(state_text, "standby") == 0 ||
           strcmp(state_text, "not_home") == 0 || strcmp(state_text, "idle") == 0;
}

static bool sensor_tile_state_is_error(const char *state_text)
{
    if (state_text == NULL) {
        return false;
    }
    return strcmp(state_text, "error") == 0 || strcmp(state_text, "fault") == 0 ||
           strcmp(state_text, "critical") == 0;
}

static bool sensor_tile_state_is_warning(const char *state_text)
{
    if (state_text == NULL) {
        return false;
    }
    return strcmp(state_text, "warning") == 0 || strcmp(state_text, "degraded") == 0;
}

static lv_color_t sensor_tile_state_color(const char *state_text)
{
    if (sensor_tile_state_is_missing(state_text) || sensor_tile_state_is_offline(state_text)) {
        return lv_color_hex(APP_UI_COLOR_CARD_BORDER);
    }
    if (sensor_tile_state_is_error(state_text)) {
        return lv_color_hex(APP_UI_COLOR_ERROR);
    }
    if (sensor_tile_state_is_warning(state_text)) {
        return lv_color_hex(0xF0A030);
    }
    return lv_color_hex(APP_UI_COLOR_STATE_ON);
}

/* Binary on/off colour for ":status" rows: green = on, red = off. */
static lv_color_t sensor_tile_status_color(const char *state_text)
{
    if (state_text == NULL || state_text[0] == '\0' ||
        strcmp(state_text, "unavailable") == 0 || strcmp(state_text, "unknown") == 0) {
        return lv_color_hex(APP_UI_COLOR_CARD_BORDER);
    }
    if (strcmp(state_text, "on") == 0 || strcmp(state_text, "online") == 0 ||
        strcmp(state_text, "running") == 0 || strcmp(state_text, "up") == 0 ||
        strcmp(state_text, "connected") == 0 || strcmp(state_text, "active") == 0 ||
        strcmp(state_text, "open") == 0 || strcmp(state_text, "opening") == 0 ||
        strcmp(state_text, "ready") == 0) {
        return lv_color_hex(APP_UI_COLOR_STATE_ON);
    }
    return lv_color_hex(APP_UI_COLOR_ERROR);
}

static bool sensor_tile_parse_float(const char *text, float *out)
{
    if (text == NULL || out == NULL) {
        return false;
    }
    char *end = NULL;
    float v = strtof(text, &end);
    if (end == text) {
        return false;
    }
    *out = v;
    return true;
}

static void sensor_tile_format_state(const ha_state_t *state, char *buf, size_t len)
{
    if (state == NULL || buf == NULL || len == 0) {
        return;
    }
    if (sensor_tile_state_is_missing(state->state)) {
        snprintf(buf, len, "--");
        return;
    }

    const char *unit = NULL;
    cJSON *attrs = cJSON_Parse(state->attributes_json);
    if (attrs != NULL) {
        cJSON *unit_item = cJSON_GetObjectItemCaseSensitive(attrs, "unit_of_measurement");
        if (cJSON_IsString(unit_item) && unit_item->valuestring != NULL) {
            unit = unit_item->valuestring;
        }
    }

    float value = 0.0f;
    if (sensor_tile_parse_float(state->state, &value) && unit != NULL && unit[0] != '\0') {
        snprintf(buf, len, "%s %s", state->state, unit);
    } else {
        snprintf(buf, len, "%s", state->state);
    }

    if (attrs != NULL) {
        cJSON_Delete(attrs);
    }
}

/* Trim ASCII whitespace around [start, end) and copy the result into out. */
static bool sensor_tile_trim_copy(const char *start, const char *end, char *out, size_t out_len)
{
    while (start < end && (*start == ' ' || *start == '\t' || *start == '\n' || *start == '\r')) {
        start++;
    }
    while (end > start && (end[-1] == ' ' || end[-1] == '\t' || end[-1] == '\n' || end[-1] == '\r')) {
        end--;
    }
    size_t len = (size_t)(end - start);
    if (len == 0 || len >= out_len) {
        return false;
    }
    memcpy(out, start, len);
    out[len] = '\0';
    return true;
}

/* Fallback label from an entity id suffix: underscores become spaces. */
static void sensor_tile_label_from_entity(const char *entity_id, char *buf, size_t len)
{
    const char *suffix = entity_id != NULL ? strchr(entity_id, '.') : NULL;
    suffix = (suffix != NULL) ? suffix + 1 : ((entity_id != NULL) ? entity_id : "");

    size_t i = 0;
    while (*suffix != '\0' && i + 1 < len) {
        buf[i++] = (*suffix == '_') ? ' ' : *suffix;
        suffix++;
    }
    buf[i] = '\0';
}

/* Convert a power-row colour token ("red", "green", ... or "#RRGGBB") into an
 * LVGL colour. Returns false (and leaves *out untouched) for unknown tokens. */
static bool sensor_tile_power_color_parse(const char *text, lv_color_t *out)
{
    if (text == NULL || out == NULL || text[0] == '\0') {
        return false;
    }
    if (strcmp(text, "red") == 0) {
        *out = lv_color_hex(0xFF5252);
    } else if (strcmp(text, "green") == 0) {
        *out = lv_color_hex(0x4CAF50);
    } else if (strcmp(text, "blue") == 0) {
        *out = lv_color_hex(0x42A5F5);
    } else if (strcmp(text, "orange") == 0) {
        *out = lv_color_hex(0xFF9800);
    } else if (strcmp(text, "amber") == 0) {
        *out = lv_color_hex(0xFFC107);
    } else if (strcmp(text, "yellow") == 0) {
        *out = lv_color_hex(0xFFEB3B);
    } else if (strcmp(text, "cyan") == 0) {
        *out = lv_color_hex(0x00BCD4);
    } else if (strcmp(text, "magenta") == 0) {
        *out = lv_color_hex(0xE91E63);
    } else if (strcmp(text, "white") == 0) {
        *out = lv_color_hex(0xFFFFFF);
    } else if (strcmp(text, "gray") == 0 || strcmp(text, "grey") == 0) {
        *out = lv_color_hex(0x9E9E9E);
    } else {
        const char *hex = (*text == '#') ? text + 1 : text;
        if (strlen(hex) != 6) {
            return false;
        }
        unsigned int value = 0;
        for (int i = 0; i < 6; i++) {
            char c = hex[i];
            unsigned int nibble;
            if (c >= '0' && c <= '9') {
                nibble = (unsigned int)(c - '0');
            } else if (c >= 'a' && c <= 'f') {
                nibble = (unsigned int)(c - 'a' + 10);
            } else if (c >= 'A' && c <= 'F') {
                nibble = (unsigned int)(c - 'A' + 10);
            } else {
                return false;
            }
            value = (value << 4) | nibble;
        }
        *out = lv_color_hex(value);
    }
    return true;
}

/* Strip an optional per-row style suffix (":bar" / ":dot" / ":status" /
 * ":chart" / ":ports" / ":ip" / ":power[:color]") from an entity token.
 * Returns true when a recognized suffix was stripped and sets *is_bar /
 * *is_status / *is_chart / *is_ports / *is_ip / *is_power accordingly. A
 * ":power" suffix may carry an optional colour (":power:red" or
 * ":power:#RRGGBB") captured into *power_color / *has_power_color. */
static bool sensor_tile_strip_row_style(char *entity, bool *is_bar, bool *is_status, bool *is_chart,
                                        bool *is_ports, bool *is_ip, bool *is_power,
                                        bool *has_power_color, lv_color_t *power_color,
                                        uint8_t *scale, bool *is_legend)
{
    if (entity == NULL) {
        return false;
    }
    if (is_bar != NULL) {
        *is_bar = false;
    }
    if (is_status != NULL) {
        *is_status = false;
    }
    if (is_chart != NULL) {
        *is_chart = false;
    }
    if (is_ports != NULL) {
        *is_ports = false;
    }
    if (is_ip != NULL) {
        *is_ip = false;
    }
    if (is_power != NULL) {
        *is_power = false;
    }
    if (has_power_color != NULL) {
        *has_power_color = false;
    }
    if (scale != NULL) {
        *scale = SENSOR_TILE_SCALE_NONE;
    }
    if (is_legend != NULL) {
        *is_legend = false;
    }

    /* A legend row is a token whose entity part is ":legend:<scale>". */
    if (strncmp(entity, ":legend:", 8) == 0) {
        if (scale != NULL) {
            *scale = sensor_tile_scale_from_name(entity + 8);
        }
        if (is_legend != NULL) {
            *is_legend = true;
        }
        entity[0] = '\0';
        return true;
    }

    size_t len = strlen(entity);
    if (len >= 4 && strcmp(entity + len - 4, ":bar") == 0) {
        entity[len - 4] = '\0';
        if (is_bar != NULL) {
            *is_bar = true;
        }
        return true;
    }
    if (len >= 4 && strcmp(entity + len - 4, ":dot") == 0) {
        entity[len - 4] = '\0';
        return true;
    }
    if (len >= 7 && strcmp(entity + len - 7, ":status") == 0) {
        entity[len - 7] = '\0';
        if (is_status != NULL) {
            *is_status = true;
        }
        return true;
    }
    if (len >= 6 && strcmp(entity + len - 6, ":chart") == 0) {
        entity[len - 6] = '\0';
        if (is_chart != NULL) {
            *is_chart = true;
        }
        return true;
    }
    if (len >= 6 && strcmp(entity + len - 6, ":ports") == 0) {
        entity[len - 6] = '\0';
        if (is_ports != NULL) {
            *is_ports = true;
        }
        return true;
    }
    /* ":power" may be followed by ":color" or "#RRGGBB". Locate it as a token
     * boundary so we don't mistake it for part of an entity id. */
    char *p = strstr(entity, ":power");
    if (p != NULL && (p[6] == '\0' || p[6] == ':' || p[6] == '#')) {
        char color_token[16] = {0};
        if (p[6] == ':' || p[6] == '#') {
            snprintf(color_token, sizeof(color_token), "%s", p + 7);
        }
        if (color_token[0] != '\0' && power_color != NULL &&
            sensor_tile_power_color_parse(color_token, power_color)) {
            if (has_power_color != NULL) {
                *has_power_color = true;
            }
        }
        *p = '\0';
        if (is_power != NULL) {
            *is_power = true;
        }
        return true;
    }
    if (len >= 3 && strcmp(entity + len - 3, ":ip") == 0) {
        entity[len - 3] = '\0';
        if (is_ip != NULL) {
            *is_ip = true;
        }
        return true;
    }
    {
        uint8_t stripped_scale = sensor_tile_strip_scale_suffix(entity);
        if (stripped_scale != SENSOR_TILE_SCALE_NONE) {
            if (scale != NULL) {
                *scale = stripped_scale;
            }
            return true;
        }
    }
    return false;
}

/* Parse "Label=entity,Label2=entity2,..." into rows. Rows with an empty
 * entity are skipped. Returns the number of visible rows. */
static int sensor_tile_parse_rows(sensor_tile_ctx_t *ctx, const char *list)
{
    if (ctx == NULL || list == NULL || list[0] == '\0') {
        return 0;
    }

    size_t count = 0;
    const char *cursor = list;
    while (*cursor != '\0' && count < APP_MAX_SENSOR_TILE_ROWS) {
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
        const char *end = cursor;

        /* Locate the label/entity separator inside the token. */
        const char *eq = start;
        while (eq < end && *eq != '=') {
            eq++;
        }

        char label[APP_MAX_SENSOR_TILE_LABEL_LEN];
        char entity[APP_MAX_ENTITY_ID_LEN];
        bool is_bar = false;
        bool is_status = false;
        bool is_chart = false;
        bool is_ports = false;
        bool is_ip = false;
        bool is_power = false;
        bool has_power_color = false;
        bool is_header = false;
        bool is_legend = false;
        uint8_t scale = SENSOR_TILE_SCALE_NONE;
        lv_color_t power_color = lv_color_hex(0xFFFFFF);
        if (eq < end) {
            if (!sensor_tile_trim_copy(start, eq, label, sizeof(label))) {
                continue;
            }
            /* A label prefixed with "##" is a section header (empty entity). */
            if (label[0] == '#' && label[1] == '#') {
                is_header = true;
                size_t hl = strlen(label);
                memmove(label, label + 2, hl - 2 + 1);
                while (label[0] == ' ' || label[0] == '\t') {
                    memmove(label, label + 1, strlen(label));
                }
                entity[0] = '\0';
            } else if (!sensor_tile_trim_copy(eq + 1, end, entity, sizeof(entity))) {
                continue; /* empty entity -> hidden row */
            }
        } else {
            /* No '=': treat the whole token as an entity with a derived label. */
            if (!sensor_tile_trim_copy(start, end, entity, sizeof(entity))) {
                continue;
            }
            label[0] = '\0';
        }

        bool explicit_style = sensor_tile_strip_row_style(entity, &is_bar, &is_status, &is_chart, &is_ports, &is_ip,
                                                           &is_power, &has_power_color, &power_color,
                                                           &scale, &is_legend);
        if (entity[0] == '\0' && !is_header && !is_legend) {
            continue; /* entity consisted only of a style -> hidden row */
        }
        /* Binary sensors are inherently on/off: render them as a coloured
         * status circle (green = on, red = off) unless the user picked an
         * explicit style (":bar", ":chart", ":dot" or ":status"). */
        if (!explicit_style && strncmp(entity, "binary_sensor.", 14) == 0) {
            is_status = true;
        }
        if (label[0] == '\0' && !is_header && !is_legend) {
            sensor_tile_label_from_entity(entity, label, sizeof(label));
        }

        snprintf(ctx->rows[count].label, sizeof(ctx->rows[count].label), "%s", label);
        snprintf(ctx->rows[count].entity_id, sizeof(ctx->rows[count].entity_id), "%s", entity);
        ctx->rows[count].is_bar = is_bar;
        ctx->rows[count].is_status = is_status;
        ctx->rows[count].is_chart = is_chart;
        ctx->rows[count].is_ports = is_ports;
        ctx->rows[count].is_ip = is_ip;
        ctx->rows[count].is_power = is_power;
        ctx->rows[count].has_power_color = has_power_color;
        ctx->rows[count].is_header = is_header;
        ctx->rows[count].is_legend = is_legend;
        ctx->rows[count].scale = scale;
        ctx->rows[count].power_color = power_color;
        count++;
    }
    return (int)count;
}

/* Append a numeric sample to a ":chart" row's sparkline and auto-scale the
 * vertical range from the observed min/max. Values are stored scaled by
 * SENSOR_TILE_CHART_SCALE so fractional network/transfer rates keep shape. */
static void sensor_tile_chart_push(sensor_tile_ctx_t *ctx, uint8_t i, float value)
{
    if (ctx == NULL || i >= ctx->row_count) {
        return;
    }
    if (ctx->rows[i].chart == NULL || ctx->rows[i].chart_series == NULL) {
        return;
    }

    int32_t scaled = (int32_t)(value * SENSOR_TILE_CHART_SCALE);
    if (ctx->rows[i].chart_count < SENSOR_TILE_CHART_POINTS) {
        ctx->rows[i].chart_history[ctx->rows[i].chart_count++] = scaled;
    } else {
        memmove(ctx->rows[i].chart_history, ctx->rows[i].chart_history + 1,
                (SENSOR_TILE_CHART_POINTS - 1) * sizeof(int32_t));
        ctx->rows[i].chart_history[SENSOR_TILE_CHART_POINTS - 1] = scaled;
    }

    int32_t mn = INT32_MAX;
    int32_t mx = INT32_MIN;
    for (uint8_t k = 0; k < ctx->rows[i].chart_count; k++) {
        if (ctx->rows[i].chart_history[k] < mn) {
            mn = ctx->rows[i].chart_history[k];
        }
        if (ctx->rows[i].chart_history[k] > mx) {
            mx = ctx->rows[i].chart_history[k];
        }
    }
    if (mn == mx) {
        mn -= SENSOR_TILE_CHART_SCALE;
        mx += SENSOR_TILE_CHART_SCALE;
    }
    lv_chart_set_range(ctx->rows[i].chart, LV_CHART_AXIS_PRIMARY_Y, mn, mx);
    lv_chart_set_next_value(ctx->rows[i].chart, ctx->rows[i].chart_series, scaled);
}

static const lv_font_t *sensor_tile_pick_font(lv_coord_t budget_px, lv_coord_t *out_line_h)
{
    /* Largest available font whose line height fits within budget_px.
     * Several APP_FONT_TEXT_* aliases map to the same physical font on this
     * build, so duplicates are skipped by the h > best_h check. */
    static const lv_font_t *const candidates[] = {
        APP_FONT_TEXT_12, APP_FONT_TEXT_14, APP_FONT_TEXT_16, APP_FONT_TEXT_18,
        APP_FONT_TEXT_20, APP_FONT_TEXT_22, APP_FONT_TEXT_24, APP_FONT_TEXT_28,
        APP_FONT_TEXT_34,
    };

    const lv_font_t *best = APP_FONT_TEXT_12;
    lv_coord_t best_h = lv_font_get_line_height(best);

    for (size_t i = 0; i < sizeof(candidates) / sizeof(candidates[0]); i++) {
        lv_coord_t h = lv_font_get_line_height(candidates[i]);
        if (h <= budget_px && h > best_h) {
            best = candidates[i];
            best_h = h;
        }
    }

    if (out_line_h != NULL) {
        *out_line_h = best_h;
    }
    return best;
}

/* Measure (and prepare) a ":ports" row: the value label wraps its full port
 * list in a small font, so the row height is driven by the wrapped text. The
 * caller runs this once to sum up the ports block height and again (during
 * rendering) to position the labels; the wrapped height is deterministic once
 * font and width are applied, so both passes agree. */
static lv_coord_t sensor_tile_ports_row_height(sensor_tile_ctx_t *ctx, uint8_t i,
                                               const lv_font_t *name_font,
                                               const lv_font_t *value_font,
                                               lv_coord_t value_w)
{
    lv_coord_t name_h = lv_font_get_line_height(name_font);
    lv_coord_t value_h = lv_font_get_line_height(value_font);

    lv_obj_t *vl = (ctx != NULL && i < ctx->row_count) ? ctx->rows[i].value_label : NULL;
    if (vl != NULL) {
        lv_label_set_long_mode(vl, LV_LABEL_LONG_WRAP);
        lv_obj_set_style_text_font(vl, value_font, LV_PART_MAIN);
        lv_obj_set_width(vl, value_w);
        lv_obj_update_layout(vl);
        value_h = lv_obj_get_height(vl);
        if (value_h < lv_font_get_line_height(value_font)) {
            value_h = lv_font_get_line_height(value_font);
        }
    }

    lv_coord_t h = (value_h > name_h) ? value_h : name_h;
    if (h < 16) {
        h = 16;
    }
    return h + 2;
}

static void sensor_tile_apply_layout(sensor_tile_ctx_t *ctx)
{
    if (ctx == NULL || ctx->card == NULL || ctx->title_label == NULL || ctx->row_count == 0) {
        return;
    }

    lv_obj_t *card = ctx->card;
    lv_obj_update_layout(card);

    lv_coord_t cw = lv_obj_get_width(card) - lv_obj_get_style_pad_left(card, LV_PART_MAIN) -
                    lv_obj_get_style_pad_right(card, LV_PART_MAIN);
    lv_coord_t ch = lv_obj_get_height(card) - lv_obj_get_style_pad_top(card, LV_PART_MAIN) -
                    lv_obj_get_style_pad_bottom(card, LV_PART_MAIN);
    if (cw < 60) {
        cw = 60;
    }
    if (ch < 60) {
        ch = 60;
    }

    /* Scale the title font with the tile height so larger tiles get larger
     * text instead of a fixed 14 px title. An explicit
     * sensor_tile_title_font_px (set in the web editor) overrides auto
     * scaling. */
    lv_coord_t title_budget = ch / 4;
    if (title_budget < 16) {
        title_budget = 16;
    }
    if (title_budget > 36) {
        title_budget = 36;
    }
    const lv_font_t *title_font = (ctx->title_font_px > 0)
        ? sensor_tile_pick_font(ctx->title_font_px, NULL)
        : sensor_tile_pick_font(title_budget, NULL);
    lv_obj_set_style_text_font(ctx->title_label, title_font, LV_PART_MAIN);
    lv_obj_set_style_text_align(ctx->title_label, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN);

    lv_coord_t icon_w = 0;
    lv_coord_t icon_h = 0;
    if (ctx->icon_label != NULL) {
        lv_obj_update_layout(ctx->icon_label);
        icon_w = lv_obj_get_width(ctx->icon_label);
        icon_h = lv_obj_get_height(ctx->icon_label);
        if (icon_w > 0) {
            icon_w += 6;
        }
    }
    lv_obj_set_width(ctx->title_label, cw - icon_w);
    lv_obj_set_pos(ctx->title_label, icon_w, 0);
    lv_obj_update_layout(ctx->title_label);
    lv_coord_t title_h = lv_obj_get_height(ctx->title_label);
    if (title_h < 20) {
        title_h = 20;
    }
    if (ctx->icon_label != NULL && icon_w > 0) {
        lv_obj_set_pos(ctx->icon_label, 0, (title_h - icon_h) / 2);
    }

    /* Partition rows into four bands:
     *   - :ip rows  -> two-column address header at the top
     *   - :power rows -> spaced watts footer pinned to the bottom
     *   - :ports rows -> wrapped port list directly under the address header
     *   - everything else -> the regular labelled sensor rows in between. */
    int ip_count = 0;
    int power_count = 0;
    int ports_count = 0;
    int mid_count = 0;
    for (uint8_t i = 0; i < ctx->row_count; i++) {
        if (ctx->rows[i].is_ip) {
            ip_count++;
        } else if (ctx->rows[i].is_power) {
            power_count++;
        } else if (ctx->rows[i].is_ports) {
            ports_count++;
        } else {
            mid_count++;
        }
    }

    /* Pick fonts for the bands. Explicit per-band px (set in the web editor)
     * overrides the auto-scaled defaults; 0 means "auto". */
    lv_coord_t ip_name_h = lv_font_get_line_height(APP_FONT_TEXT_12);
    lv_coord_t ip_value_h = lv_font_get_line_height(APP_FONT_TEXT_16);
    const lv_font_t *ip_name_font = APP_FONT_TEXT_12;
    const lv_font_t *ip_value_font = APP_FONT_TEXT_16;
    if (ctx->ip_font_px > 0) {
        ip_value_font = sensor_tile_pick_font(ctx->ip_font_px, &ip_value_h);
        lv_coord_t name_px = ctx->ip_font_px - 6;
        if (name_px < 10) {
            name_px = 10;
        }
        ip_name_font = sensor_tile_pick_font(name_px, &ip_name_h);
    }
    lv_coord_t ip_row_h = ip_name_h + ip_value_h + 2;
    if (ip_row_h < SENSOR_TILE_IP_ROW_H) {
        ip_row_h = SENSOR_TILE_IP_ROW_H;
    }

    lv_coord_t power_value_h = lv_font_get_line_height(APP_FONT_TEXT_28);
    lv_coord_t power_name_h = lv_font_get_line_height(APP_FONT_TEXT_16);
    const lv_font_t *power_value_font = APP_FONT_TEXT_28;
    const lv_font_t *power_name_font = APP_FONT_TEXT_16;
    if (ctx->power_font_px > 0) {
        power_value_font = sensor_tile_pick_font(ctx->power_font_px, &power_value_h);
        lv_coord_t name_px = ctx->power_font_px - 10;
        if (name_px < 10) {
            name_px = 10;
        }
        power_name_font = sensor_tile_pick_font(name_px, &power_name_h);
    }
    lv_coord_t power_row_h = SENSOR_TILE_POWER_H;
    lv_coord_t power_text_h = power_value_h > power_name_h ? power_value_h : power_name_h;
    if (power_text_h + 4 > power_row_h) {
        power_row_h = power_text_h + 4;
    }

    /* ":ports" rows wrap the full port list in a small font. */
    lv_coord_t ports_value_h = lv_font_get_line_height(APP_FONT_TEXT_12);
    lv_coord_t ports_name_h = lv_font_get_line_height(APP_FONT_TEXT_12);
    const lv_font_t *ports_value_font = APP_FONT_TEXT_12;
    const lv_font_t *ports_name_font = APP_FONT_TEXT_12;
    if (ctx->ports_font_px > 0) {
        ports_value_font = sensor_tile_pick_font(ctx->ports_font_px, &ports_value_h);
        ports_name_font = ports_value_font;
        ports_name_h = ports_value_h;
    }

    lv_coord_t ip_h = (ip_count > 0) ? ((ip_count + 1) / 2) * ip_row_h : 0;
    lv_coord_t power_h = (power_count > 0) ? power_row_h : 0;
    lv_coord_t power_gap = (power_count > 0) ? SENSOR_TILE_POWER_GAP : 0;

    lv_coord_t mid_top = title_h + 4 + ip_h + (ip_count > 0 ? 4 : 0);
    lv_coord_t mid_bottom = ch - power_gap - power_h;
    lv_coord_t list_h = mid_bottom - mid_top;

    /* Ports block: measure each wrapped port list so it takes exactly the
     * height it needs, then hand the rest of the band to the regular rows. */
    lv_coord_t ports_name_w = (cw > 160) ? cw / 4 : 56;
    if (ports_name_w < 36) {
        ports_name_w = 36;
    }
    if (ports_name_w > 72) {
        ports_name_w = 72;
    }
    lv_coord_t ports_value_x = ports_name_w + 8;
    lv_coord_t ports_value_w = cw - ports_value_x;
    if (ports_value_w < 40) {
        ports_value_w = 40;
    }
    lv_coord_t ports_h = 0;
    for (uint8_t i = 0; i < ctx->row_count; i++) {
        if (!ctx->rows[i].is_ports) {
            continue;
        }
        ports_h += sensor_tile_ports_row_height(ctx, i, ports_name_font, ports_value_font,
                                                ports_value_w);
    }
    if (ports_count > 1) {
        ports_h += (ports_count - 1) * 2;
    }
    lv_coord_t ports_gap = (ports_count > 0) ? 4 : 0;

    lv_coord_t mid_available = list_h - ports_h - ports_gap;
    if (mid_count > 0 && mid_available < mid_count * 12) {
        mid_available = mid_count * 12;
    }
    lv_coord_t row_h = (mid_count > 0) ? (mid_available / mid_count) : 0;
    if (row_h > 32) {
        row_h = 32;
    }
    if (row_h < 1 && mid_count > 0) {
        row_h = 1;
    }

    lv_coord_t dot_size = SENSOR_TILE_DOT_SIZE;
    if (dot_size > row_h - 2) {
        dot_size = (row_h - 2 > 4) ? row_h - 2 : 4;
    }
    lv_coord_t status_dot_size = 14;
    if (status_dot_size > row_h - 2) {
        status_dot_size = (row_h - 2 > 4) ? row_h - 2 : 4;
    }
    lv_coord_t line_h = 0;
    const lv_font_t *row_font;
    if (ctx->row_font_px > 0) {
        row_font = sensor_tile_pick_font(ctx->row_font_px, &line_h);
    } else {
        row_font = sensor_tile_pick_font(row_h > 0 ? row_h : 16, &line_h);
        if (line_h > row_h) {
            line_h = row_h;
        }
    }

    /* Value column (right aligned) and name column (left). The bar takes
     * the space in between; cap the name width so the bar always stays a
     * visible width instead of collapsing to a couple of pixels.
     * The value column must be wide enough to show "value + unit" (e.g.
     * "100.0 %" / "29.9 °C") so the unit isn't clipped or wrapped away. */
    lv_coord_t bar_min = (cw > 160) ? 48 : 24;
    lv_coord_t name_x = dot_size + 6;
    lv_coord_t value_w = (cw > 260) ? 118 : ((cw > 180) ? 96 : 48);
    lv_coord_t value_max = cw - name_x - 24 - bar_min - 6;
    if (value_max < 48) {
        value_max = 48;
    }
    if (value_w > value_max) {
        value_w = value_max;
    }
    lv_coord_t name_w = (cw > 160) ? cw / 3 : cw / 2;
    lv_coord_t name_max = cw - value_w - 6 - bar_min - 4 - name_x;
    if (name_max < 24) {
        name_max = 24;
    }
    if (name_w > name_max) {
        name_w = name_max;
    }

    int ip_index = 0;
    int power_index = 0;
    int mid_index = 0;
    lv_coord_t ports_cursor = mid_top;

    for (uint8_t i = 0; i < ctx->row_count; i++) {
        /* ---- Address header cell (LAN left / WAN right) ---- */
        if (ctx->rows[i].is_ip) {
            if (ctx->rows[i].dot != NULL) {
                lv_obj_add_flag(ctx->rows[i].dot, LV_OBJ_FLAG_HIDDEN);
            }
            lv_coord_t cell_w = cw / 2;
            lv_coord_t col = (lv_coord_t)(ip_index % 2);
            lv_coord_t row = (lv_coord_t)(ip_index / 2);
            lv_coord_t x = col * cell_w;
            lv_coord_t y = title_h + 4 + row * ip_row_h;

            if (ctx->rows[i].name_label != NULL) {
                lv_label_set_long_mode(ctx->rows[i].name_label, LV_LABEL_LONG_CLIP);
                lv_obj_set_style_text_font(ctx->rows[i].name_label, ip_name_font, LV_PART_MAIN);
                lv_obj_set_style_text_align(ctx->rows[i].name_label, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN);
                lv_obj_set_size(ctx->rows[i].name_label, cell_w - 4, ip_name_h);
                lv_obj_set_pos(ctx->rows[i].name_label, x, y);
            }
            if (ctx->rows[i].value_label != NULL) {
                lv_label_set_long_mode(ctx->rows[i].value_label, LV_LABEL_LONG_CLIP);
                lv_obj_set_style_text_font(ctx->rows[i].value_label, ip_value_font, LV_PART_MAIN);
                lv_obj_set_style_text_align(ctx->rows[i].value_label, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN);
                lv_obj_set_size(ctx->rows[i].value_label, cell_w - 4, ip_value_h);
                lv_obj_set_pos(ctx->rows[i].value_label, x, y + ip_name_h + 1);
            }
            ip_index++;
            continue;
        }

        /* ---- Ports row: name on the left, wrapped port list beside it ---- */
        if (ctx->rows[i].is_ports) {
            if (ctx->rows[i].dot != NULL) {
                lv_obj_add_flag(ctx->rows[i].dot, LV_OBJ_FLAG_HIDDEN);
            }
            lv_coord_t row_h_ports = sensor_tile_ports_row_height(
                ctx, i, ports_name_font, ports_value_font, ports_value_w);
            lv_coord_t name_y = ports_cursor + (row_h_ports - ports_name_h) / 2;
            if (name_y < ports_cursor) {
                name_y = ports_cursor;
            }
            if (ctx->rows[i].name_label != NULL) {
                lv_label_set_long_mode(ctx->rows[i].name_label, LV_LABEL_LONG_CLIP);
                lv_obj_set_style_text_font(ctx->rows[i].name_label, ports_name_font, LV_PART_MAIN);
                lv_obj_set_style_text_align(ctx->rows[i].name_label, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN);
                lv_obj_set_size(ctx->rows[i].name_label, ports_name_w, ports_name_h);
                lv_obj_set_pos(ctx->rows[i].name_label, 0, name_y);
            }
            if (ctx->rows[i].value_label != NULL) {
                lv_obj_set_style_text_align(ctx->rows[i].value_label, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN);
                lv_obj_set_pos(ctx->rows[i].value_label, ports_value_x, ports_cursor);
            }
            ports_cursor += row_h_ports + 2;
            continue;
        }

        /* ---- Watts footer pinned to the bottom with a spacing gap ---- */
        if (ctx->rows[i].is_power) {
            lv_coord_t y = ch - power_h + power_index * power_row_h;
            lv_coord_t p_name_w = cw / 4;
            if (p_name_w < 40) {
                p_name_w = 40;
            }
            lv_coord_t p_value_w = cw / 4;
            if (p_value_w < 78) {
                p_value_w = 78;
            }
            if (p_name_w + p_value_w + 32 > cw) {
                /* Not enough room for a chart: fall back to a label/value split. */
                p_name_w = cw / 2 - dot_size - 10;
                p_value_w = cw / 2 - 4;
            }
            if (ctx->rows[i].dot != NULL) {
                lv_obj_clear_flag(ctx->rows[i].dot, LV_OBJ_FLAG_HIDDEN);
                lv_obj_set_size(ctx->rows[i].dot, dot_size, dot_size);
                lv_obj_set_pos(ctx->rows[i].dot, 0, y + (power_row_h - dot_size) / 2);
            }
            if (ctx->rows[i].name_label != NULL) {
                lv_label_set_long_mode(ctx->rows[i].name_label, LV_LABEL_LONG_CLIP);
                lv_obj_set_style_text_font(ctx->rows[i].name_label, power_name_font, LV_PART_MAIN);
                lv_obj_set_style_text_align(ctx->rows[i].name_label, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN);
                lv_obj_set_size(ctx->rows[i].name_label, p_name_w, power_name_h);
                lv_obj_set_pos(ctx->rows[i].name_label, dot_size + 6,
                               y + (power_row_h - power_name_h) / 2);
            }
            if (ctx->rows[i].chart != NULL) {
                lv_coord_t chart_h = power_row_h - 6;
                if (chart_h > 26) {
                    chart_h = 26;
                }
                if (chart_h < 6) {
                    chart_h = 6;
                }
                lv_coord_t chart_x = dot_size + 6 + p_name_w + 4;
                lv_coord_t chart_w = cw - p_value_w - 4 - chart_x;
                if (chart_w < 12) {
                    lv_obj_add_flag(ctx->rows[i].chart, LV_OBJ_FLAG_HIDDEN);
                } else {
                    lv_obj_clear_flag(ctx->rows[i].chart, LV_OBJ_FLAG_HIDDEN);
                    lv_obj_set_size(ctx->rows[i].chart, chart_w, chart_h);
                    lv_obj_set_pos(ctx->rows[i].chart, chart_x, y + (power_row_h - chart_h) / 2);
                }
            }
            if (ctx->rows[i].value_label != NULL) {
                lv_label_set_long_mode(ctx->rows[i].value_label, LV_LABEL_LONG_CLIP);
                lv_obj_set_style_text_font(ctx->rows[i].value_label, power_value_font, LV_PART_MAIN);
                lv_obj_set_style_text_align(ctx->rows[i].value_label, LV_TEXT_ALIGN_RIGHT, LV_PART_MAIN);
                lv_obj_set_size(ctx->rows[i].value_label, p_value_w, power_value_h);
                lv_obj_set_pos(ctx->rows[i].value_label, cw - p_value_w,
                               y + (power_row_h - power_value_h) / 2);
            }
            power_index++;
            continue;
        }

        /* ---- Regular labelled sensor row ---- */
        lv_coord_t y = mid_top + ports_h + ports_gap + mid_index * row_h;
        /* LVGL's base_line is the descent (distance from the bottom of the
         * line box to the baseline), so the glyph ink sits base_line/2 above
         * the geometric centre of the line box. Shift the text down by that
         * amount to optically align it with the dot / bar / value. */
        lv_coord_t text_y = y + (row_h - line_h) / 2 + row_font->base_line / 2;

        if (ctx->rows[i].is_header) {
            if (ctx->rows[i].value_label != NULL) {
                lv_obj_add_flag(ctx->rows[i].value_label, LV_OBJ_FLAG_HIDDEN);
            }
            if (ctx->rows[i].name_label != NULL) {
                lv_obj_set_style_text_font(ctx->rows[i].name_label, row_font, LV_PART_MAIN);
                lv_obj_set_style_text_color(ctx->rows[i].name_label, lv_color_hex(0x38BDF8), LV_PART_MAIN);
                lv_obj_set_style_text_align(ctx->rows[i].name_label, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN);
                lv_obj_set_size(ctx->rows[i].name_label, cw, line_h);
                lv_obj_set_pos(ctx->rows[i].name_label, 0, text_y);
            }
            mid_index++;
            continue;
        }

        if (ctx->rows[i].is_legend) {
            if (ctx->rows[i].value_label != NULL) {
                lv_obj_add_flag(ctx->rows[i].value_label, LV_OBJ_FLAG_HIDDEN);
            }
            lv_color_t stops[SENSOR_TILE_LEGEND_SEGS];
            int n = sensor_tile_scale_legend(ctx->rows[i].scale, stops, SENSOR_TILE_LEGEND_SEGS);
            if (n <= 0) {
                n = 1;
            }
            lv_coord_t seg_h = row_h - 4;
            if (seg_h > 10) {
                seg_h = 10;
            }
            if (seg_h < 4) {
                seg_h = 4;
            }
            lv_coord_t bar_x = name_w + 4;
            lv_coord_t bar_w = cw - bar_x;
            lv_coord_t seg_w = bar_w / n;
            if (seg_w < 4) {
                seg_w = 4;
            }
            if (ctx->rows[i].name_label != NULL) {
                lv_obj_set_style_text_font(ctx->rows[i].name_label, row_font, LV_PART_MAIN);
                lv_obj_set_style_text_align(ctx->rows[i].name_label, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN);
                lv_obj_set_size(ctx->rows[i].name_label, name_w, line_h);
                lv_obj_set_pos(ctx->rows[i].name_label, 0, text_y);
            }
            for (int s = 0; s < SENSOR_TILE_LEGEND_SEGS; s++) {
                lv_obj_t *seg = ctx->rows[i].legend_segs[s];
                if (seg == NULL) {
                    continue;
                }
                if (s < n) {
                    lv_obj_clear_flag(seg, LV_OBJ_FLAG_HIDDEN);
                    lv_obj_set_size(seg, seg_w - 1, seg_h);
                    lv_obj_set_pos(seg, bar_x + s * seg_w, y + (row_h - seg_h) / 2);
                } else {
                    lv_obj_add_flag(seg, LV_OBJ_FLAG_HIDDEN);
                }
            }
            mid_index++;
            continue;
        }

        if (ctx->rows[i].is_status) {
            /* Status row: label on the left, coloured status circle on the
             * right (green = on, red = off). No value text. */
            if (ctx->rows[i].dot != NULL) {
                lv_obj_clear_flag(ctx->rows[i].dot, LV_OBJ_FLAG_HIDDEN);
                lv_obj_set_size(ctx->rows[i].dot, status_dot_size, status_dot_size);
                lv_obj_set_pos(ctx->rows[i].dot, cw - status_dot_size,
                               y + (row_h - status_dot_size) / 2);
            }
            if (ctx->rows[i].value_label != NULL) {
                lv_obj_add_flag(ctx->rows[i].value_label, LV_OBJ_FLAG_HIDDEN);
            }
            if (ctx->rows[i].name_label != NULL) {
                lv_obj_set_style_text_font(ctx->rows[i].name_label, row_font, LV_PART_MAIN);
                lv_obj_set_style_text_align(ctx->rows[i].name_label, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN);
                lv_obj_set_size(ctx->rows[i].name_label, cw - status_dot_size - 8, line_h);
                lv_obj_set_pos(ctx->rows[i].name_label, 0, text_y);
            }
            mid_index++;
            continue;
        }

        if (ctx->rows[i].dot != NULL) {
            lv_obj_clear_flag(ctx->rows[i].dot, LV_OBJ_FLAG_HIDDEN);
            lv_obj_set_size(ctx->rows[i].dot, dot_size, dot_size);
            lv_obj_set_pos(ctx->rows[i].dot, 0, y + (row_h - dot_size) / 2);
        }
        if (ctx->rows[i].name_label != NULL) {
            lv_obj_set_style_text_font(ctx->rows[i].name_label, row_font, LV_PART_MAIN);
            lv_obj_set_style_text_align(ctx->rows[i].name_label, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN);
            lv_obj_set_size(ctx->rows[i].name_label, name_w, line_h);
            lv_obj_set_pos(ctx->rows[i].name_label, dot_size + 6, text_y);
        }
        if (ctx->rows[i].is_bar || ctx->rows[i].is_chart) {
            lv_coord_t bar_h = row_h - 6;
            if (bar_h > 12) {
                bar_h = 12;
            }
            if (bar_h < 4) {
                bar_h = 4;
            }
            lv_coord_t bar_x = name_x + name_w + 4;
            lv_coord_t bar_w = cw - value_w - 6 - bar_x;
            if (bar_w < 16) {
                bar_w = 16;
            }
            if (ctx->rows[i].bar != NULL) {
                lv_obj_clear_flag(ctx->rows[i].bar, LV_OBJ_FLAG_HIDDEN);
                lv_obj_set_size(ctx->rows[i].bar, bar_w, bar_h);
                lv_obj_set_pos(ctx->rows[i].bar, bar_x, y + (row_h - bar_h) / 2);
            }
            if (ctx->rows[i].chart != NULL) {
                lv_obj_clear_flag(ctx->rows[i].chart, LV_OBJ_FLAG_HIDDEN);
                lv_coord_t chart_h = row_h - 2;
                if (chart_h > 20) {
                    chart_h = 20;
                }
                if (chart_h < 6) {
                    chart_h = 6;
                }
                lv_obj_set_size(ctx->rows[i].chart, bar_w, chart_h);
                lv_obj_set_pos(ctx->rows[i].chart, bar_x, y + (row_h - chart_h) / 2);
            }
            if (ctx->rows[i].value_label != NULL) {
                lv_obj_clear_flag(ctx->rows[i].value_label, LV_OBJ_FLAG_HIDDEN);
                lv_obj_set_style_text_font(ctx->rows[i].value_label, row_font, LV_PART_MAIN);
                lv_obj_set_style_text_align(ctx->rows[i].value_label, LV_TEXT_ALIGN_RIGHT, LV_PART_MAIN);
                lv_obj_set_size(ctx->rows[i].value_label, value_w, line_h);
                lv_obj_set_pos(ctx->rows[i].value_label, cw - value_w, text_y);
            }
        } else {
            if (ctx->rows[i].value_label != NULL) {
                lv_obj_clear_flag(ctx->rows[i].value_label, LV_OBJ_FLAG_HIDDEN);
                lv_obj_set_style_text_font(ctx->rows[i].value_label, row_font, LV_PART_MAIN);
                lv_obj_set_style_text_align(ctx->rows[i].value_label, LV_TEXT_ALIGN_RIGHT, LV_PART_MAIN);
                lv_obj_set_size(ctx->rows[i].value_label, cw - name_w - dot_size - 6, line_h);
                lv_obj_set_pos(ctx->rows[i].value_label, name_w + dot_size + 6, text_y);
            }
        }
        mid_index++;
    }
}

static void sensor_tile_mark_all_unavailable(sensor_tile_ctx_t *ctx)
{
    if (ctx == NULL) {
        return;
    }
    for (uint8_t i = 0; i < ctx->row_count; i++) {
        if (ctx->rows[i].dot != NULL) {
            lv_obj_set_style_bg_color(
                ctx->rows[i].dot, lv_color_hex(APP_UI_COLOR_CARD_BORDER), LV_PART_MAIN);
        }
        if (ctx->rows[i].bar != NULL) {
            lv_bar_set_value(ctx->rows[i].bar, 0, LV_ANIM_OFF);
        }
        if (ctx->rows[i].value_label != NULL && !ctx->rows[i].is_status &&
            !ctx->rows[i].is_header && !ctx->rows[i].is_legend) {
            lv_label_set_text(ctx->rows[i].value_label, "--");
        }
    }
}

static void sensor_tile_event_cb(lv_event_t *event)
{
    if (event == NULL) {
        return;
    }
    sensor_tile_ctx_t *ctx = (sensor_tile_ctx_t *)lv_event_get_user_data(event);
    if (ctx == NULL) {
        return;
    }

    lv_event_code_t code = lv_event_get_code(event);
    if (code == LV_EVENT_DELETE) {
        free(ctx);
    } else if (code == LV_EVENT_SIZE_CHANGED) {
        sensor_tile_apply_layout(ctx);
    }
}

/* Encode a Unicode codepoint as UTF-8 (4-byte max, as used by the MDI fonts). */
static void sensor_tile_utf8_from_codepoint(uint32_t cp, char out[5])
{
    if (cp <= 0x7FU) {
        out[0] = (char)cp;
        out[1] = '\0';
    } else if (cp <= 0x7FFU) {
        out[0] = (char)(0xC0U | ((cp >> 6) & 0x1FU));
        out[1] = (char)(0x80U | (cp & 0x3FU));
        out[2] = '\0';
    } else if (cp <= 0xFFFFU) {
        out[0] = (char)(0xE0U | ((cp >> 12) & 0x0FU));
        out[1] = (char)(0x80U | ((cp >> 6) & 0x3FU));
        out[2] = (char)(0x80U | (cp & 0x3FU));
        out[3] = '\0';
    } else {
        out[0] = (char)(0xF0U | ((cp >> 18) & 0x07U));
        out[1] = (char)(0x80U | ((cp >> 12) & 0x3FU));
        out[2] = (char)(0x80U | ((cp >> 6) & 0x3FU));
        out[3] = (char)(0x80U | (cp & 0x3FU));
        out[4] = '\0';
    }
}

/* MDI "weather-windy" glyph — a small decorative air-flow icon in the title. */
#define SENSOR_TILE_ICON_WINDY 0xF059DU

esp_err_t w_sensor_tile_create(const ui_widget_def_t *def, lv_obj_t *parent, ui_widget_instance_t *out_instance)
{
    if (def == NULL || parent == NULL || out_instance == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    lv_obj_t *card = lv_obj_create(parent);
    lv_obj_set_pos(card, def->x, def->y);
    lv_obj_set_size(card, def->w, def->h);
    lv_obj_clear_flag(card, LV_OBJ_FLAG_SCROLLABLE);
    theme_default_style_card(card);
    lv_obj_set_style_pad_left(card, 10, LV_PART_MAIN);
    lv_obj_set_style_pad_right(card, 10, LV_PART_MAIN);
    lv_obj_set_style_pad_top(card, 10, LV_PART_MAIN);
    lv_obj_set_style_pad_bottom(card, 10, LV_PART_MAIN);

    lv_obj_t *title = lv_label_create(card);
    lv_label_set_text(title, def->title[0] ? def->title : def->id);
    lv_obj_set_style_text_color(title, lv_color_hex(APP_UI_COLOR_TEXT_SOFT), LV_PART_MAIN);

    lv_obj_t *icon = lv_label_create(card);
    if (mdi_font_weather_20_available()) {
        char icon_utf8[5];
        sensor_tile_utf8_from_codepoint(SENSOR_TILE_ICON_WINDY, icon_utf8);
        lv_label_set_text(icon, icon_utf8);
        lv_obj_set_style_text_font(icon, mdi_font_weather_20(), LV_PART_MAIN);
    } else {
        lv_label_set_text(icon, "");
    }
    lv_obj_set_style_text_color(icon, lv_color_hex(0x38BDF8), LV_PART_MAIN);

    sensor_tile_ctx_t *ctx = ui_calloc_prefer_psram(1, sizeof(sensor_tile_ctx_t));
    if (ctx == NULL) {
        lv_obj_del(card);
        return ESP_ERR_NO_MEM;
    }

    ctx->card = card;
    ctx->title_label = title;
    ctx->icon_label = icon;
    ctx->title_font_px = def->sensor_tile_title_font_px;
    ctx->row_font_px = def->sensor_tile_row_font_px;
    ctx->ip_font_px = def->sensor_tile_ip_font_px;
    ctx->power_font_px = def->sensor_tile_power_font_px;
    ctx->ports_font_px = def->sensor_tile_ports_font_px;
    ctx->row_count = (uint8_t)sensor_tile_parse_rows(ctx, def->extra_entity_ids);

    /* No visible rows: hide the whole tile but keep it alive. */
    if (ctx->row_count == 0) {
        lv_obj_add_flag(card, LV_OBJ_FLAG_HIDDEN);
        lv_obj_add_event_cb(card, sensor_tile_event_cb, LV_EVENT_DELETE, ctx);
        out_instance->obj = card;
        out_instance->ctx = ctx;
        return ESP_OK;
    }

    for (uint8_t i = 0; i < ctx->row_count; i++) {
        if (ctx->rows[i].is_header || ctx->rows[i].is_legend) {
            ctx->rows[i].dot = NULL;
        } else {
            ctx->rows[i].dot = lv_obj_create(card);
            lv_obj_clear_flag(ctx->rows[i].dot, LV_OBJ_FLAG_SCROLLABLE);
            lv_obj_set_style_pad_all(ctx->rows[i].dot, 0, LV_PART_MAIN);
            lv_obj_set_style_border_width(ctx->rows[i].dot, 0, LV_PART_MAIN);
            lv_obj_set_style_radius(ctx->rows[i].dot, LV_RADIUS_CIRCLE, LV_PART_MAIN);
            lv_obj_set_style_bg_opa(ctx->rows[i].dot, LV_OPA_COVER, LV_PART_MAIN);
            lv_obj_set_style_bg_color(ctx->rows[i].dot, lv_color_hex(APP_UI_COLOR_CARD_BORDER), LV_PART_MAIN);
            if (ctx->rows[i].is_power && ctx->rows[i].has_power_color) {
                lv_obj_set_style_bg_color(ctx->rows[i].dot, ctx->rows[i].power_color, LV_PART_MAIN);
            }
        }

        if (ctx->rows[i].is_legend) {
            lv_color_t stops[SENSOR_TILE_LEGEND_SEGS];
            int n = sensor_tile_scale_legend(ctx->rows[i].scale, stops, SENSOR_TILE_LEGEND_SEGS);
            for (int s = 0; s < SENSOR_TILE_LEGEND_SEGS; s++) {
                ctx->rows[i].legend_segs[s] = lv_obj_create(card);
                lv_obj_clear_flag(ctx->rows[i].legend_segs[s], LV_OBJ_FLAG_SCROLLABLE);
                lv_obj_set_style_pad_all(ctx->rows[i].legend_segs[s], 0, LV_PART_MAIN);
                lv_obj_set_style_border_width(ctx->rows[i].legend_segs[s], 0, LV_PART_MAIN);
                lv_obj_set_style_radius(ctx->rows[i].legend_segs[s], 0, LV_PART_MAIN);
                lv_obj_set_style_bg_opa(ctx->rows[i].legend_segs[s], LV_OPA_COVER, LV_PART_MAIN);
                if (s < n) {
                    lv_obj_set_style_bg_color(ctx->rows[i].legend_segs[s], stops[s], LV_PART_MAIN);
                } else {
                    lv_obj_add_flag(ctx->rows[i].legend_segs[s], LV_OBJ_FLAG_HIDDEN);
                }
            }
        }

        if (ctx->rows[i].is_bar) {
            ctx->rows[i].bar = lv_bar_create(card);
            lv_bar_set_range(ctx->rows[i].bar, 0, 100);
            lv_bar_set_value(ctx->rows[i].bar, 0, LV_ANIM_OFF);
            lv_obj_set_style_bg_color(ctx->rows[i].bar, lv_color_hex(APP_UI_COLOR_CARD_BORDER), LV_PART_MAIN);
            lv_obj_set_style_bg_opa(ctx->rows[i].bar, LV_OPA_COVER, LV_PART_MAIN);
            lv_obj_set_style_radius(ctx->rows[i].bar, LV_RADIUS_CIRCLE, LV_PART_MAIN);
            lv_obj_set_style_bg_color(ctx->rows[i].bar, lv_color_hex(APP_UI_COLOR_STATE_ON), LV_PART_INDICATOR);
            lv_obj_set_style_bg_opa(ctx->rows[i].bar, LV_OPA_COVER, LV_PART_INDICATOR);
            lv_obj_set_style_radius(ctx->rows[i].bar, LV_RADIUS_CIRCLE, LV_PART_INDICATOR);
        }

        if (ctx->rows[i].is_chart || ctx->rows[i].is_power) {
            ctx->rows[i].chart = lv_chart_create(card);
            lv_obj_clear_flag(ctx->rows[i].chart, LV_OBJ_FLAG_SCROLLABLE);
            lv_obj_clear_flag(ctx->rows[i].chart, LV_OBJ_FLAG_CLICKABLE);
            lv_obj_add_flag(ctx->rows[i].chart, LV_OBJ_FLAG_GESTURE_BUBBLE);
            lv_obj_set_style_bg_opa(ctx->rows[i].chart, LV_OPA_TRANSP, LV_PART_MAIN);
            lv_obj_set_style_border_width(ctx->rows[i].chart, 0, LV_PART_MAIN);
            lv_obj_set_style_pad_all(ctx->rows[i].chart, 0, LV_PART_MAIN);
            lv_obj_set_style_line_color(ctx->rows[i].chart, lv_color_hex(APP_UI_COLOR_CARD_BORDER), LV_PART_MAIN);
            lv_obj_set_style_line_opa(ctx->rows[i].chart, LV_OPA_TRANSP, LV_PART_MAIN);
            lv_obj_set_style_line_width(ctx->rows[i].chart, 1, LV_PART_MAIN);
            lv_chart_set_type(ctx->rows[i].chart, LV_CHART_TYPE_LINE);
            lv_chart_set_div_line_count(ctx->rows[i].chart, 0, 0);
            lv_chart_set_point_count(ctx->rows[i].chart, SENSOR_TILE_CHART_POINTS);
            lv_obj_set_style_size(ctx->rows[i].chart, 0, 0, LV_PART_INDICATOR);
            lv_obj_set_style_line_width(ctx->rows[i].chart, 2, LV_PART_ITEMS);
            ctx->rows[i].chart_series = lv_chart_add_series(
                ctx->rows[i].chart, lv_color_hex(APP_UI_COLOR_NAV_TAB_ACTIVE), LV_CHART_AXIS_PRIMARY_Y);
            lv_chart_set_range(ctx->rows[i].chart, LV_CHART_AXIS_PRIMARY_Y, -SENSOR_TILE_CHART_SCALE,
                               SENSOR_TILE_CHART_SCALE);
        }

        ctx->rows[i].name_label = lv_label_create(card);
        lv_obj_set_style_text_color(ctx->rows[i].name_label, theme_default_color_text_primary(), LV_PART_MAIN);
        lv_label_set_text(ctx->rows[i].name_label, ctx->rows[i].label);

        ctx->rows[i].value_label = lv_label_create(card);
        lv_obj_set_style_text_color(ctx->rows[i].value_label, lv_color_hex(APP_UI_COLOR_TEXT_PRIMARY), LV_PART_MAIN);
        if (ctx->rows[i].is_power && ctx->rows[i].has_power_color) {
            lv_obj_set_style_text_color(ctx->rows[i].value_label, ctx->rows[i].power_color, LV_PART_MAIN);
        }
        lv_label_set_long_mode(ctx->rows[i].value_label, LV_LABEL_LONG_CLIP);
        lv_label_set_text(ctx->rows[i].value_label, "--");
    }

    lv_obj_add_event_cb(card, sensor_tile_event_cb, LV_EVENT_DELETE, ctx);
    lv_obj_add_event_cb(card, sensor_tile_event_cb, LV_EVENT_SIZE_CHANGED, ctx);

    sensor_tile_apply_layout(ctx);

    out_instance->obj = card;
    out_instance->ctx = ctx;
    return ESP_OK;
}

void w_sensor_tile_apply_state(ui_widget_instance_t *instance, const ha_state_t *state)
{
    if (instance == NULL || instance->obj == NULL || state == NULL) {
        return;
    }

    sensor_tile_ctx_t *ctx = (sensor_tile_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }

    for (uint8_t i = 0; i < ctx->row_count; i++) {
        if (strncmp(ctx->rows[i].entity_id, state->entity_id, APP_MAX_ENTITY_ID_LEN) != 0) {
            continue;
        }

        if (ctx->rows[i].is_status) {
            lv_color_t status_color = sensor_tile_status_color(state->state);
            if (ctx->rows[i].dot != NULL) {
                lv_obj_set_style_bg_color(ctx->rows[i].dot, status_color, LV_PART_MAIN);
            }
            return;
        }

        lv_color_t color = sensor_tile_state_color(state->state);
        if (ctx->rows[i].is_power && ctx->rows[i].has_power_color) {
            color = ctx->rows[i].power_color;
            if (ctx->rows[i].value_label != NULL) {
                lv_obj_set_style_text_color(ctx->rows[i].value_label, color, LV_PART_MAIN);
            }
        } else if (ctx->rows[i].scale != SENSOR_TILE_SCALE_NONE) {
            float value = 0.0f;
            if (sensor_tile_parse_float(state->state, &value)) {
                color = sensor_tile_scale_color(ctx->rows[i].scale, value);
            }
            if (ctx->rows[i].value_label != NULL) {
                lv_obj_set_style_text_color(ctx->rows[i].value_label, color, LV_PART_MAIN);
            }
        }
        if (ctx->rows[i].dot != NULL) {
            lv_obj_set_style_bg_color(ctx->rows[i].dot, color, LV_PART_MAIN);
        }
        if (ctx->rows[i].bar != NULL) {
            float value = 0.0f;
            if (sensor_tile_parse_float(state->state, &value)) {
                if (value < 0.0f) {
                    value = 0.0f;
                }
                if (value > 100.0f) {
                    value = 100.0f;
                }
                lv_bar_set_value(ctx->rows[i].bar, (int32_t)(value + 0.5f), LV_ANIM_ON);
            } else {
                lv_bar_set_value(ctx->rows[i].bar, 0, LV_ANIM_OFF);
            }
            lv_obj_set_style_bg_color(ctx->rows[i].bar, color, LV_PART_INDICATOR);
        }
        if (ctx->rows[i].is_chart || ctx->rows[i].is_power) {
            float value = 0.0f;
            if (sensor_tile_parse_float(state->state, &value)) {
                sensor_tile_chart_push(ctx, i, value);
            }
        }
        if (ctx->rows[i].value_label != NULL) {
            char value_text[256] = {0};
            sensor_tile_format_state(state, value_text, sizeof(value_text));
            lv_label_set_text(ctx->rows[i].value_label, value_text);
        }
        /* A ports row wraps its list, so a changed value can change its
         * height; recompute the whole tile layout to re-flow the rows. */
        if (ctx->rows[i].is_ports) {
            sensor_tile_apply_layout(ctx);
        }
        return;
    }
}

void w_sensor_tile_mark_unavailable(ui_widget_instance_t *instance)
{
    if (instance == NULL || instance->obj == NULL) {
        return;
    }

    sensor_tile_ctx_t *ctx = (sensor_tile_ctx_t *)instance->ctx;
    if (ctx == NULL) {
        return;
    }

    sensor_tile_mark_all_unavailable(ctx);
}
