/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "layout/layout_validate.h"

#include <ctype.h>
#include <stdbool.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "cJSON.h"

#include "app_config.h"
#include "ui/theme/theme_palette.h"
#include "ui/ui_radio_page.h"

/* JSON strings have no known maximum length, so quotes inside the fixed-size diagnostic
 * buffers are bounded explicitly: an unbounded "%s" into a fixed buffer is an error at -O2
 * (-Werror=format-truncation). 64 chars + the longest prefix still fit in messages[][96]. */
#define LAYOUT_MSG_VALUE_MAX 64

#define GRAPH_POINT_COUNT_MIN 16
#define GRAPH_POINT_COUNT_MAX 64
#define GRAPH_TIME_WINDOW_MIN_MIN 1
#define GRAPH_TIME_WINDOW_MIN_MAX 1440

static const char *const GRAPH_DISPLAY_MODES[] = {
    "line",
    "line_smooth",
    "line_smooth_points",
    "bars",
};

static const int GRAPH_BAR_BUCKET_MIN_ALLOWED[] = {5, 10, 15, 30};

static bool str_in_list(const char *value, const void *list, size_t entry_size, size_t list_len)
{
    if (value == NULL || list == NULL || entry_size == 0) {
        return false;
    }
    const char *base = (const char *)list;
    for (size_t i = 0; i < list_len; i++) {
        const char *entry = base + (i * entry_size);
        if (strncmp(value, entry, entry_size) == 0) {
            return true;
        }
    }
    return false;
}

static bool is_valid_entity_id(const char *entity_id)
{
    if (entity_id == NULL) {
        return false;
    }

    size_t len = strlen(entity_id);
    if (len < 3 || len >= APP_MAX_ENTITY_ID_LEN) {
        return false;
    }

    const char *dot = strchr(entity_id, '.');
    if (dot == NULL || dot == entity_id || *(dot + 1) == '\0') {
        return false;
    }
    if (strchr(dot + 1, '.') != NULL) {
        return false;
    }

    for (const char *p = entity_id; *p != '\0'; p++) {
        if (*p == '.') {
            continue;
        }
        if (!(islower((unsigned char)*p) || isdigit((unsigned char)*p) || *p == '_')) {
            return false;
        }
    }

    return true;
}

static bool entity_in_domain(const char *entity_id, const char *domain)
{
    if (entity_id == NULL || domain == NULL) {
        return false;
    }
    size_t domain_len = strlen(domain);
    return strncmp(entity_id, domain, domain_len) == 0 && entity_id[domain_len] == '.';
}

static char s_labeled_list_reason[96];

/* sensor_tile rows: "Label=entity.id,Label2=entity2.id". Every row needs a
 * non-empty label and an optional entity id; an empty entity hides the row,
 * and a label prefixed with "##" is a section header (empty entity). A
 * ":legend:<scale>" entity is a colour legend row. On failure sets *reason. */
static bool is_valid_labeled_entity_list(const char *list, size_t max_rows, const char **reason)
{
    if (reason != NULL) {
        *reason = NULL;
    }
    if (list == NULL || list[0] == '\0') {
        return true;
    }

    size_t count = 0;
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
        const char *end = cursor;
        while (end > start && (end[-1] == ' ' || end[-1] == '\t' || end[-1] == '\n' || end[-1] == '\r')) {
            end--;
        }

        const char *eq = start;
        while (eq < end && *eq != '=') {
            eq++;
        }
        if (eq == end || eq == start) {
            if (reason != NULL) {
                snprintf(s_labeled_list_reason, sizeof(s_labeled_list_reason),
                    "row %d must be 'Label=entity'", (int)count + 1);
                *reason = s_labeled_list_reason;
            }
            return false;
        }

        const char *label_start = start;
        const char *label_end = eq;
        while (label_start < label_end &&
               (*label_start == ' ' || *label_start == '\t' || *label_start == '\n' || *label_start == '\r')) {
            label_start++;
        }
        while (label_end > label_start &&
               (label_end[-1] == ' ' || label_end[-1] == '\t' || label_end[-1] == '\n' || label_end[-1] == '\r')) {
            label_end--;
        }
        size_t label_len = (size_t)(label_end - label_start);
        if (label_len == 0 || label_len >= APP_MAX_SENSOR_TILE_LABEL_LEN) {
            if (reason != NULL) {
                snprintf(s_labeled_list_reason, sizeof(s_labeled_list_reason),
                    "label length must be 1-%d characters (row %d)",
                    APP_MAX_SENSOR_TILE_LABEL_LEN - 1, (int)count + 1);
                *reason = s_labeled_list_reason;
            }
            return false;
        }

        const char *entity_start = eq + 1;
        const char *entity_end = end;
        while (entity_start < entity_end &&
               (*entity_start == ' ' || *entity_start == '\t' || *entity_start == '\n' || *entity_start == '\r')) {
            entity_start++;
        }
        while (entity_end > entity_start &&
               (entity_end[-1] == ' ' || entity_end[-1] == '\t' || entity_end[-1] == '\n' || entity_end[-1] == '\r')) {
            entity_end--;
        }
        size_t entity_len = (size_t)(entity_end - entity_start);
        if (entity_len > 0) {
            char entity[APP_MAX_ENTITY_ID_LEN + 8];
            if (entity_len >= sizeof(entity)) {
                if (reason != NULL) {
                    snprintf(s_labeled_list_reason, sizeof(s_labeled_list_reason),
                        "entity id too long in row %d", (int)count + 1);
                    *reason = s_labeled_list_reason;
                }
                return false;
            }
            memcpy(entity, entity_start, entity_len);
            entity[entity_len] = '\0';

            /* A legend row contributes no entity. */
            if (strncmp(entity, ":legend:", 8) == 0) {
                count++;
                continue;
            }

            /* Strip a per-row style suffix: ":bar", ":dot", ":status",
             * ":chart", ":ports", ":ip", ":power[:color]", and the air-quality
             * scales ":aqi", ":pm", ":pm10", ":co2", ":tvoc", ":ch2o", ":co",
             * ":level". */
            size_t slen = strlen(entity);
            bool stripped = true;
            while (stripped) {
                stripped = false;
                slen = strlen(entity);
                if (slen >= 7 && strcmp(entity + slen - 7, ":status") == 0) {
                    entity[slen - 7] = '\0'; stripped = true;
                } else if (slen >= 6 && strcmp(entity + slen - 6, ":chart") == 0) {
                    entity[slen - 6] = '\0'; stripped = true;
                } else if (slen >= 6 && strcmp(entity + slen - 6, ":ports") == 0) {
                    entity[slen - 6] = '\0'; stripped = true;
                } else if (slen >= 6 && strcmp(entity + slen - 6, ":level") == 0) {
                    entity[slen - 6] = '\0'; stripped = true;
                } else if (slen >= 5 && strcmp(entity + slen - 5, ":pm10") == 0) {
                    entity[slen - 5] = '\0'; stripped = true;
                } else if (slen >= 5 && strcmp(entity + slen - 5, ":tvoc") == 0) {
                    entity[slen - 5] = '\0'; stripped = true;
                } else if (slen >= 5 && strcmp(entity + slen - 5, ":ch2o") == 0) {
                    entity[slen - 5] = '\0'; stripped = true;
                } else if (slen >= 4 && strcmp(entity + slen - 4, ":bar") == 0) {
                    entity[slen - 4] = '\0'; stripped = true;
                } else if (slen >= 4 && strcmp(entity + slen - 4, ":dot") == 0) {
                    entity[slen - 4] = '\0'; stripped = true;
                } else if (slen >= 4 && strcmp(entity + slen - 4, ":aqi") == 0) {
                    entity[slen - 4] = '\0'; stripped = true;
                } else if (slen >= 4 && strcmp(entity + slen - 4, ":co2") == 0) {
                    entity[slen - 4] = '\0'; stripped = true;
                } else if (slen >= 3 && strcmp(entity + slen - 3, ":ip") == 0) {
                    entity[slen - 3] = '\0'; stripped = true;
                } else if (slen >= 3 && strcmp(entity + slen - 3, ":pm") == 0) {
                    entity[slen - 3] = '\0'; stripped = true;
                } else if (slen >= 3 && strcmp(entity + slen - 3, ":co") == 0) {
                    entity[slen - 3] = '\0'; stripped = true;
                } else {
                    char *p = strstr(entity, ":power");
                    if (p != NULL && (p[6] == '\0' || p[6] == ':' || p[6] == '#')) {
                        *p = '\0';
                        stripped = true;
                    }
                }
            }

            if (entity[0] != '\0' && !is_valid_entity_id(entity)) {
                if (reason != NULL) {
                    snprintf(s_labeled_list_reason, sizeof(s_labeled_list_reason),
                        "invalid entity id in row %d", (int)count + 1);
                    *reason = s_labeled_list_reason;
                }
                return false;
            }
        }

        count++;
        if (count > max_rows) {
            if (reason != NULL) {
                snprintf(s_labeled_list_reason, sizeof(s_labeled_list_reason),
                    "too many rows (max %d)", (int)max_rows);
                *reason = s_labeled_list_reason;
            }
            return false;
        }
    }

    return true;
}

static bool is_supported_widget_type(const char *type)
{
    if (type == NULL) {
        return false;
    }
    return (strcmp(type, "sensor") == 0) || (strcmp(type, "button") == 0) || (strcmp(type, "slider") == 0) ||
           (strcmp(type, "graph") == 0) || (strcmp(type, "empty_tile") == 0) || (strcmp(type, "light_tile") == 0) ||
           (strcmp(type, "heating_tile") == 0) || (strcmp(type, "weather_tile") == 0) ||
           (strcmp(type, "weather_3day") == 0) || (strcmp(type, "todo_list") == 0) ||
           (strcmp(type, "media_player") == 0) || (strcmp(type, "roborock_tile") == 0) ||
           (strcmp(type, "binary_sensor") == 0) || (strcmp(type, "presence") == 0) ||
           (strcmp(type, "alarm_tile") == 0) || (strcmp(type, "clock_alarm") == 0) ||
           (strcmp(type, "cover") == 0) || (strcmp(type, "cover_tile") == 0) ||
           (strcmp(type, "scene_tile") == 0) || (strcmp(type, "person_tile") == 0) ||
           (strcmp(type, "timer_tile") == 0) || (strcmp(type, "lock") == 0) ||
           (strcmp(type, "fan") == 0) || (strcmp(type, "select") == 0) || (strcmp(type, "number") == 0) ||
           (strcmp(type, "sensor_tile") == 0);
}

static bool is_supported_page_type(const char *type)
{
    if (type == NULL || type[0] == '\0') {
        return true;
    }
    return strcmp(type, "dashboard") == 0 || strcmp(type, "energy_dashboard") == 0 ||
           strcmp(type, "music_assistant") == 0 || strcmp(type, "radio") == 0 ||
           strcmp(type, "xiaozhi") == 0;
}

typedef struct {
    int min_w;
    int min_h;
    int max_w;
    int max_h;
} widget_size_limits_t;

static widget_size_limits_t widget_size_limits_for_type(const char *type)
{
    widget_size_limits_t limits = {
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
        /* Needs room for the status text plus the arm/disarm button row. */
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 150;
        limits.min_h = 110;
#else
        limits.min_w = 200;
        limits.min_h = 140;
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
    } else if (strcmp(type, "clock_alarm") == 0) {
        /* Needs room for the clock digits plus the optional date row. */
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 110;
        limits.min_h = 80;
#else
        limits.min_w = 150;
        limits.min_h = 110;
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
        limits.min_w = 280;
        limits.min_h = 180;
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
    } else if (strcmp(type, "cover_tile") == 0) {
        /* Icon, position value and progress bar, plus the optional button row. */
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 140;
        limits.min_h = 110;
#else
        limits.min_w = 180;
        limits.min_h = 140;
#endif
        limits.max_w = APP_CONTENT_BOX_WIDTH;
        limits.max_h = APP_CONTENT_BOX_HEIGHT;
    } else if (strcmp(type, "scene_tile") == 0) {
        /* Icon plus the scene name - the whole tile is the button. */
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 96;
        limits.min_h = 90;
#else
        limits.min_w = 120;
        limits.min_h = 110;
#endif
        limits.max_w = 480;
        limits.max_h = 480;
    } else if (strcmp(type, "person_tile") == 0) {
        /* Letter avatar plus the name and zone rows. */
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 110;
        limits.min_h = 80;
#else
        limits.min_w = 140;
        limits.min_h = 100;
#endif
        limits.max_w = 640;
        limits.max_h = 480;
    } else if (strcmp(type, "timer_tile") == 0) {
        /* Countdown value plus the preset / start / pause button row. */
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 110;
        limits.min_h = 90;
#else
        limits.min_w = 140;
        limits.min_h = 110;
#endif
        limits.max_w = 480;
        limits.max_h = 480;
    } else if (strcmp(type, "sensor_tile") == 0) {
        /* Labeled multi-row list: needs room for a title plus several rows. */
#if defined(CONFIG_APP_PANEL_VARIANT_S3_480)
        limits.min_w = 120;
        limits.min_h = 100;
#else
        limits.min_w = 120;
        limits.min_h = 100;
#endif
    }

    if (limits.max_w > APP_CONTENT_BOX_WIDTH) {
        limits.max_w = APP_CONTENT_BOX_WIDTH;
    }
    if (limits.max_h > APP_CONTENT_BOX_HEIGHT) {
        limits.max_h = APP_CONTENT_BOX_HEIGHT;
    }
    return limits;
}

static const char *required_domain_for_widget_type(const char *type)
{
    if (type == NULL) {
        return NULL;
    }
    if (strcmp(type, "sensor") == 0) {
        return "sensor";
    }
    if (strcmp(type, "binary_sensor") == 0) {
        return "binary_sensor";
    }
    if (strcmp(type, "binary_sensor") == 0) {
        return "binary_sensor";
    }
    if (strcmp(type, "alarm_tile") == 0) {
        return "alarm_control_panel";
    }
    if (strcmp(type, "light_tile") == 0) {
        return "light";
    }
    if (strcmp(type, "heating_tile") == 0) {
        return "climate";
    }
    if (strcmp(type, "weather_tile") == 0 || strcmp(type, "weather_3day") == 0) {
        return "weather";
    }
    if (strcmp(type, "todo_list") == 0) {
        return "todo";
    }
    if (strcmp(type, "media_player") == 0) {
        return "media_player";
    }
    if (strcmp(type, "roborock_tile") == 0) {
        return "vacuum";
    }
    if (strcmp(type, "lock") == 0) {
        return "lock";
    }
    if (strcmp(type, "cover") == 0) {
        return "cover";
    }
    if (strcmp(type, "fan") == 0) {
        return "fan";
    }
    if (strcmp(type, "select") == 0) {
        return "select";
    }
    if (strcmp(type, "number") == 0) {
        return "number";
    }
    if (strcmp(type, "cover_tile") == 0) {
        return "cover";
    }
    if (strcmp(type, "scene_tile") == 0) {
        return "scene";
    }
    if (strcmp(type, "person_tile") == 0) {
        return "person";
    }
    if (strcmp(type, "timer_tile") == 0) {
        return "timer";
    }
    return NULL;
}

static bool widget_entity_id_optional(const char *type)
{
    /* These tiles also work without an entity and bind one when it is set. */
    return type != NULL &&
           (strcmp(type, "timer_tile") == 0 || strcmp(type, "cover_tile") == 0 ||
               strcmp(type, "scene_tile") == 0 || strcmp(type, "person_tile") == 0);
}

static bool widget_entity_domain_valid(const char *type, const char *entity_id)
{
    if (type == NULL || entity_id == NULL) {
        return false;
    }

    if (strcmp(type, "sensor") == 0) {
        return entity_in_domain(entity_id, "sensor") || entity_in_domain(entity_id, "binary_sensor");
    }
    if (strcmp(type, "binary_sensor") == 0) {
        return entity_in_domain(entity_id, "binary_sensor");
    }
    if (strcmp(type, "presence") == 0) {
        return entity_in_domain(entity_id, "device_tracker") || entity_in_domain(entity_id, "person");
    }
    if (strcmp(type, "binary_sensor") == 0) {
        return entity_in_domain(entity_id, "binary_sensor");
    }
    if (strcmp(type, "alarm_tile") == 0) {
        return entity_in_domain(entity_id, "alarm_control_panel");
    }
    if (strcmp(type, "button") == 0) {
        return entity_in_domain(entity_id, "switch") || entity_in_domain(entity_id, "media_player") ||
               entity_in_domain(entity_id, "button") || entity_in_domain(entity_id, "scene") ||
               entity_in_domain(entity_id, "script") || entity_in_domain(entity_id, "automation") ||
               entity_in_domain(entity_id, "input_boolean");
    }
    if (strcmp(type, "select") == 0) {
        return entity_in_domain(entity_id, "select") || entity_in_domain(entity_id, "input_select");
    }
    if (strcmp(type, "number") == 0) {
        return entity_in_domain(entity_id, "number") || entity_in_domain(entity_id, "input_number");
    }
    if (strcmp(type, "media_player") == 0) {
        return entity_in_domain(entity_id, "media_player");
    }
    if (strcmp(type, "roborock_tile") == 0) {
        return entity_in_domain(entity_id, "vacuum");
    }
    if (strcmp(type, "empty_tile") == 0) {
        return true;
    }
    if (strcmp(type, "clock_alarm") == 0) {
        /* The clock tile has no entity of its own. */
        return true;
    }
    if (strcmp(type, "sensor_tile") == 0) {
        /* Its entities live in the comma-separated "entity_ids" list. */
        return true;
    }
    if (widget_entity_id_optional(type) && entity_id[0] == '\0') {
        return true;
    }

    const char *required_domain = required_domain_for_widget_type(type);
    if (required_domain == NULL) {
        return true;
    }
    return entity_in_domain(entity_id, required_domain);
}

static bool widget_requires_primary_entity(const char *type)
{
    return type == NULL || (strcmp(type, "empty_tile") != 0 && strcmp(type, "clock_alarm") != 0 &&
                            strcmp(type, "sensor_tile") != 0);
}

static bool is_hex_digit_char(char c)
{
    return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
}

static bool is_valid_hex_rgb_color(const char *text)
{
    if (text == NULL || text[0] == '\0') {
        return false;
    }

    const char *p = text;
    if (p[0] == '#') {
        p++;
    } else if (p[0] == '0' && (p[1] == 'x' || p[1] == 'X')) {
        p += 2;
    }

    if (strlen(p) != 6) {
        return false;
    }

    for (size_t i = 0; i < 6; i++) {
        if (!is_hex_digit_char(p[i])) {
            return false;
        }
    }
    return true;
}

static bool is_valid_slider_direction(const char *direction)
{
    if (direction == NULL || direction[0] == '\0') {
        return false;
    }
    return strcmp(direction, "auto") == 0 || strcmp(direction, "left_to_right") == 0 ||
           strcmp(direction, "right_to_left") == 0 || strcmp(direction, "bottom_to_top") == 0 ||
           strcmp(direction, "top_to_bottom") == 0;
}

static bool is_valid_tile_grad_dir(const char *direction)
{
    if (direction == NULL) {
        return false;
    }
    return strcmp(direction, "none") == 0 || strcmp(direction, "hor") == 0 || strcmp(direction, "ver") == 0;
}

/* Which service flavour the alarm tile uses: auto detects Alarmo from the attributes. */
static bool is_valid_alarm_backend(const char *backend)
{
    if (backend == NULL) {
        return false;
    }
    return strcmp(backend, "auto") == 0 || strcmp(backend, "alarmo") == 0 || strcmp(backend, "builtin") == 0;
}

/* One or more of away|home|night|vacation|custom|disarm separated by commas or spaces. */
static bool is_valid_alarm_modes(const char *modes)
{
    if (modes == NULL || modes[0] == '\0') {
        return false;
    }

    bool found = false;
    const char *cursor = modes;
    while (cursor != NULL && cursor[0] != '\0') {
        while (cursor[0] == ' ' || cursor[0] == ',' || cursor[0] == ';') {
            cursor++;
        }
        const char *end = cursor;
        while (end[0] != '\0' && end[0] != ',' && end[0] != ';' && end[0] != ' ') {
            end++;
        }
        const size_t len = (size_t)(end - cursor);
        if (len > 0) {
            if (!((len == 4 && strncmp(cursor, "away", 4) == 0) || (len == 4 && strncmp(cursor, "home", 4) == 0) ||
                  (len == 5 && strncmp(cursor, "night", 5) == 0) || (len == 6 && strncmp(cursor, "custom", 6) == 0) ||
                  (len == 6 && strncmp(cursor, "disarm", 6) == 0) ||
                  (len == 8 && strncmp(cursor, "vacation", 8) == 0))) {
                return false;
            }
            found = true;
        }
        cursor = (end[0] == '\0') ? NULL : end;
    }
    return found;
}

static bool is_valid_tile_font_scale(const char *scale)
{
    if (scale == NULL) {
        return false;
    }
    return strcmp(scale, "auto") == 0 || strcmp(scale, "s") == 0 || strcmp(scale, "m") == 0 ||
           strcmp(scale, "l") == 0 || strcmp(scale, "xl") == 0;
}

static bool is_valid_optional_hex_rgb_color(const char *text)
{
    return text == NULL || text[0] == '\0' || is_valid_hex_rgb_color(text);
}

/* Accepts -1 (meaning "inherit the theme") or an integer inside min..max. */
static bool is_valid_auto_or_int(const cJSON *item, int min, int max)
{
    return cJSON_IsNumber(item) && (double)item->valueint == item->valuedouble &&
           item->valueint >= -1 && item->valueint <= max && (item->valueint >= min || item->valueint == -1);
}

static bool is_valid_button_mode(const char *mode)
{
    if (mode == NULL || mode[0] == '\0') {
        return false;
    }
    return strcmp(mode, "auto") == 0 || strcmp(mode, "play_pause") == 0 || strcmp(mode, "stop") == 0 ||
           strcmp(mode, "next") == 0 || strcmp(mode, "previous") == 0;
}

static bool button_mode_requires_media_player(const char *mode)
{
    if (mode == NULL || mode[0] == '\0') {
        return false;
    }
    return strcmp(mode, "play_pause") == 0 || strcmp(mode, "stop") == 0 || strcmp(mode, "next") == 0 ||
           strcmp(mode, "previous") == 0;
}

static bool is_valid_energy_source(const char *source)
{
    if (source == NULL || source[0] == '\0') {
        return false;
    }
    return strcmp(source, "ha_energy") == 0 || strcmp(source, "manual_live") == 0;
}

static void validate_energy_entity_field(cJSON *energy, const char *key, const char *page_id,
    layout_validation_result_t *result)
{
    cJSON *item = cJSON_GetObjectItemCaseSensitive(energy, key);
    if (item == NULL) {
        return;
    }

    char msg[128];
    if (!cJSON_IsString(item) || item->valuestring == NULL) {
        snprintf(msg, sizeof(msg), "page %s energy.%s must be a string", page_id != NULL ? page_id : "?", key);
        layout_validation_add(result, msg);
        return;
    }

    if (item->valuestring[0] == '\0') {
        return;
    }

    if (!is_valid_entity_id(item->valuestring) || !entity_in_domain(item->valuestring, "sensor")) {
        snprintf(msg, sizeof(msg), "page %s energy.%s must be sensor.*", page_id != NULL ? page_id : "?", key);
        layout_validation_add(result, msg);
    }
}

static void validate_energy_page(cJSON *page, const char *page_id, layout_validation_result_t *result)
{
    cJSON *energy = cJSON_GetObjectItemCaseSensitive(page, "energy");
    if (energy == NULL) {
        return;
    }
    if (!cJSON_IsObject(energy)) {
        char msg[96];
        snprintf(msg, sizeof(msg), "page %s: energy must be object", page_id != NULL ? page_id : "?");
        layout_validation_add(result, msg);
        return;
    }

    cJSON *source = cJSON_GetObjectItemCaseSensitive(energy, "source");
    if (source != NULL) {
        char msg[128];
        if (!cJSON_IsString(source) || source->valuestring == NULL) {
            snprintf(msg, sizeof(msg), "page %s energy.source must be a string", page_id != NULL ? page_id : "?");
            layout_validation_add(result, msg);
        } else if (source->valuestring[0] != '\0' && !is_valid_energy_source(source->valuestring)) {
            snprintf(msg,
                sizeof(msg),
                "page %s energy.source must be ha_energy or manual_live",
                page_id != NULL ? page_id : "?");
            layout_validation_add(result, msg);
        }
    }

    static const char *keys[] = {
        "home_power_entity_id",
        "solar_power_entity_id",
        "grid_power_entity_id",
        "grid_import_power_entity_id",
        "grid_export_power_entity_id",
        "battery_power_entity_id",
        "battery_charge_power_entity_id",
        "battery_discharge_power_entity_id",
        "battery_soc_entity_id",
    };
    for (size_t i = 0; i < (sizeof(keys) / sizeof(keys[0])); i++) {
        validate_energy_entity_field(energy, keys[i], page_id, result);
    }
}

static void validate_music_entity_field(cJSON *music, const char *key, const char *page_id,
    layout_validation_result_t *result)
{
    cJSON *item = cJSON_GetObjectItemCaseSensitive(music, key);
    if (item == NULL) {
        return;
    }

    char msg[128];
    if (!cJSON_IsString(item) || item->valuestring == NULL) {
        snprintf(msg, sizeof(msg), "page %s music.%s must be a string", page_id != NULL ? page_id : "?", key);
        layout_validation_add(result, msg);
        return;
    }

    if (item->valuestring[0] == '\0') {
        return;
    }

    if (!is_valid_entity_id(item->valuestring) || !entity_in_domain(item->valuestring, "media_player")) {
        snprintf(msg, sizeof(msg), "page %s music.%s must be media_player.*", page_id != NULL ? page_id : "?", key);
        layout_validation_add(result, msg);
    }
}

/* Optional media_player entity override of a radio sub-object.  An empty string
 * is valid: the page then uses the first media_player it can find. */
static void validate_radio_entity_field(cJSON *radio, const char *key, const char *page_id,
    layout_validation_result_t *result)
{
    cJSON *item = cJSON_GetObjectItemCaseSensitive(radio, key);
    if (item == NULL) {
        return;
    }

    char msg[128];
    if (!cJSON_IsString(item) || item->valuestring == NULL) {
        snprintf(msg, sizeof(msg), "page %s: radio.%s must be string", page_id != NULL ? page_id : "?", key);
        layout_validation_add(result, msg);
        return;
    }

    if (item->valuestring[0] == '\0') {
        return;
    }

    if (!is_valid_entity_id(item->valuestring) || !entity_in_domain(item->valuestring, "media_player")) {
        snprintf(msg, sizeof(msg), "page %s: radio.%s must be media_player.*", page_id != NULL ? page_id : "?", key);
        layout_validation_add(result, msg);
    }
}

static void validate_music_page(cJSON *page, const char *page_id, layout_validation_result_t *result)
{
    cJSON *music = cJSON_GetObjectItemCaseSensitive(page, "music");
    if (music == NULL) {
        return;
    }
    if (!cJSON_IsObject(music)) {
        char msg[96];
        snprintf(msg, sizeof(msg), "page %s: music must be object", page_id != NULL ? page_id : "?");
        layout_validation_add(result, msg);
        return;
    }

    validate_music_entity_field(music, "player_entity_id", page_id, result);

    cJSON *players = cJSON_GetObjectItemCaseSensitive(music, "players");
    if (players == NULL) {
        return;
    }
    if (!cJSON_IsArray(players)) {
        char msg[96];
        snprintf(msg, sizeof(msg), "page %s: music.players must be array", page_id != NULL ? page_id : "?");
        layout_validation_add(result, msg);
        return;
    }

    int n = cJSON_GetArraySize(players);
    for (int i = 0; i < n; i++) {
        cJSON *item = cJSON_GetArrayItem(players, i);
        char msg[128];
        if (!cJSON_IsString(item) || item->valuestring == NULL || item->valuestring[0] == '\0') {
            snprintf(msg, sizeof(msg), "page %s music.players[%d] must be a string", page_id != NULL ? page_id : "?", i);
            layout_validation_add(result, msg);
        } else if (!is_valid_entity_id(item->valuestring) || !entity_in_domain(item->valuestring, "media_player")) {
            snprintf(msg, sizeof(msg), "page %s music.players[%d] must be media_player.*",
                page_id != NULL ? page_id : "?", i);
            layout_validation_add(result, msg);
        }
    }
}

/* The "radio" page object:
 *
 *   { "entity": "media_player.salon", "columns": 3,
 *     "stations": [ { "name": "RMF FM", "url": "https://...", "entity": "media_player.x" } ] }
 *
 * Every key is optional: with an empty station list the page falls back to the
 * stations compiled into the firmware, so the list is not required. */
static void validate_radio_page(cJSON *page, const char *page_id, layout_validation_result_t *result)
{
    cJSON *radio = cJSON_GetObjectItemCaseSensitive(page, "radio");
    if (radio == NULL) {
        return;
    }
    if (!cJSON_IsObject(radio)) {
        char msg[96];
        snprintf(msg, sizeof(msg), "page %s: radio must be object", page_id != NULL ? page_id : "?");
        layout_validation_add(result, msg);
        return;
    }

    const char *pid = page_id != NULL ? page_id : "?";
    char msg[128];

    /* "player_entity_id" is the spelling of the first radio draft, kept so old
     * stored layouts keep validating. */
    validate_radio_entity_field(radio, "entity", pid, result);
    validate_radio_entity_field(radio, "player_entity_id", pid, result);

    cJSON *columns = cJSON_GetObjectItemCaseSensitive(radio, "columns");
    if (columns != NULL &&
        (!cJSON_IsNumber(columns) || columns->valueint < UI_RADIO_MIN_COLUMNS ||
            columns->valueint > UI_RADIO_MAX_COLUMNS)) {
        snprintf(msg, sizeof(msg), "page %s: radio.columns must be %d..%d", pid, UI_RADIO_MIN_COLUMNS,
            UI_RADIO_MAX_COLUMNS);
        layout_validation_add(result, msg);
    }

    /* Where the stream plays: "panel" (built-in speaker) or "ha" (media_player). */
    cJSON *player_mode = cJSON_GetObjectItemCaseSensitive(radio, "player_mode");
    if (player_mode != NULL) {
        const char *value = cJSON_IsString(player_mode) ? player_mode->valuestring : NULL;
        if (value == NULL || (strcmp(value, "panel") != 0 && strcmp(value, "ha") != 0)) {
            snprintf(msg, sizeof(msg), "page %s: radio.player_mode must be \"panel\" or \"ha\"", pid);
            layout_validation_add(result, msg);
        }
    }
    cJSON *panel_flag = cJSON_GetObjectItemCaseSensitive(radio, "panel");
    if (panel_flag != NULL && !cJSON_IsBool(panel_flag)) {
        snprintf(msg, sizeof(msg), "page %s: radio.panel must be boolean", pid);
        layout_validation_add(result, msg);
    }

    cJSON *stations = cJSON_GetObjectItemCaseSensitive(radio, "stations");
    if (stations == NULL) {
        return;
    }
    if (!cJSON_IsArray(stations)) {
        snprintf(msg, sizeof(msg), "page %s: radio.stations must be array", pid);
        layout_validation_add(result, msg);
        return;
    }

    int count = cJSON_GetArraySize(stations);
    if (count > UI_RADIO_MAX_STATIONS) {
        snprintf(msg, sizeof(msg), "page %s: radio.stations has %d entries, max is %d", pid, count,
            UI_RADIO_MAX_STATIONS);
        layout_validation_add(result, msg);
    }

    for (int i = 0; i < count; i++) {
        cJSON *station = cJSON_GetArrayItem(stations, i);
        if (!cJSON_IsObject(station)) {
            snprintf(msg, sizeof(msg), "page %s: radio.stations[%d] must be object", pid, i);
            layout_validation_add(result, msg);
            continue;
        }

        cJSON *name = cJSON_GetObjectItemCaseSensitive(station, "name");
        if (!cJSON_IsString(name) || name->valuestring == NULL || name->valuestring[0] == '\0') {
            snprintf(msg, sizeof(msg), "page %s: radio.stations[%d].name is required", pid, i);
            layout_validation_add(result, msg);
        } else if (strlen(name->valuestring) >= UI_RADIO_STATION_NAME_LEN) {
            snprintf(msg, sizeof(msg), "page %s: radio.stations[%d].name is too long (max %d)", pid, i,
                UI_RADIO_STATION_NAME_LEN - 1);
            layout_validation_add(result, msg);
        }

        cJSON *url = cJSON_GetObjectItemCaseSensitive(station, "url");
        if (!cJSON_IsString(url) || url->valuestring == NULL || url->valuestring[0] == '\0') {
            snprintf(msg, sizeof(msg), "page %s: radio.stations[%d].url is required", pid, i);
            layout_validation_add(result, msg);
        } else if (strlen(url->valuestring) >= UI_RADIO_STATION_URL_LEN) {
            snprintf(msg, sizeof(msg), "page %s: radio.stations[%d].url is too long (max %d)", pid, i,
                UI_RADIO_STATION_URL_LEN - 1);
            layout_validation_add(result, msg);
        } else if (strncmp(url->valuestring, "http://", 7) != 0 && strncmp(url->valuestring, "https://", 8) != 0) {
            snprintf(msg, sizeof(msg), "page %s: radio.stations[%d].url must be http(s)", pid, i);
            layout_validation_add(result, msg);
        }

        cJSON *entity = cJSON_GetObjectItemCaseSensitive(station, "entity");
        if (entity != NULL) {
            if (!cJSON_IsString(entity) || entity->valuestring == NULL) {
                snprintf(msg, sizeof(msg), "page %s: radio.stations[%d].entity must be string", pid, i);
                layout_validation_add(result, msg);
            } else if (entity->valuestring[0] != '\0' &&
                       (!is_valid_entity_id(entity->valuestring) ||
                           !entity_in_domain(entity->valuestring, "media_player"))) {
                snprintf(msg, sizeof(msg), "page %s: radio.stations[%d].entity must be media_player.*", pid, i);
                layout_validation_add(result, msg);
            }
        }
    }
}

void layout_validation_clear(layout_validation_result_t *result)
{
    if (result == NULL) {
        return;
    }
    result->count = 0;
    memset(result->messages, 0, sizeof(result->messages));
}

void layout_validation_add(layout_validation_result_t *result, const char *msg)
{
    if (result == NULL || msg == NULL) {
        return;
    }
    if (result->count >= APP_LAYOUT_MAX_ERRORS) {
        return;
    }
    char *slot = result->messages[result->count];
    snprintf(slot, sizeof(result->messages[0]), "%.*s", (int)(sizeof(result->messages[0]) - 1U), msg);
    result->count++;
}

/* Validates the optional per-page background keys ("page_*"). */
static void validate_page_style(cJSON *page, const char *page_id, layout_validation_result_t *result)
{
    static const char *const page_color_keys[] = {
        "page_bg_color",
        "page_bg_grad_color",
    };
    char msg[96];

    for (size_t i = 0; i < sizeof(page_color_keys) / sizeof(page_color_keys[0]); ++i) {
        cJSON *item = cJSON_GetObjectItemCaseSensitive(page, page_color_keys[i]);
        if (item == NULL) {
            continue;
        }
        if (!cJSON_IsString(item) || !is_valid_optional_hex_rgb_color(item->valuestring)) {
            snprintf(msg, sizeof(msg), "page %s: %s must be hex RGB", page_id, page_color_keys[i]);
            layout_validation_add(result, msg);
        }
    }

    cJSON *grad_dir = cJSON_GetObjectItemCaseSensitive(page, "page_bg_grad_dir");
    if (grad_dir != NULL && (!cJSON_IsString(grad_dir) || !is_valid_tile_grad_dir(grad_dir->valuestring))) {
        snprintf(msg, sizeof(msg), "page %s: page_bg_grad_dir must be none|hor|ver", page_id);
        layout_validation_add(result, msg);
    }

    cJSON *wallpaper = cJSON_GetObjectItemCaseSensitive(page, "page_wallpaper");
    if (wallpaper != NULL && !cJSON_IsBool(wallpaper)) {
        snprintf(msg, sizeof(msg), "page %s: page_wallpaper must be boolean", page_id);
        layout_validation_add(result, msg);
    }

    cJSON *dim = cJSON_GetObjectItemCaseSensitive(page, "page_dim");
    if (dim != NULL && (!cJSON_IsNumber(dim) || (double)dim->valueint != dim->valuedouble ||
            dim->valueint < 0 || dim->valueint > 90)) {
        snprintf(msg, sizeof(msg), "page %s: page_dim must be 0..90", page_id);
        layout_validation_add(result, msg);
    }

    /* Optional per-page theme id: syntax only. An id that no longer exists is not an
     * error - the router falls back to the global theme at runtime. */
    cJSON *page_theme = cJSON_GetObjectItemCaseSensitive(page, "page_theme");
    if (page_theme != NULL &&
        (!cJSON_IsString(page_theme) || page_theme->valuestring == NULL ||
            strlen(page_theme->valuestring) >= APP_MAX_THEME_ID_LEN)) {
        snprintf(msg, sizeof(msg), "page %s: page_theme must be a theme id (< %d chars)", page_id,
                 APP_MAX_THEME_ID_LEN);
        layout_validation_add(result, msg);
    }
}

static bool validate_widget(cJSON *widget, const char *known_widget_ids, size_t known_ids_len,
    size_t page_index, size_t widget_index, layout_validation_result_t *result)
{
    char msg[160];

    cJSON *id = cJSON_GetObjectItemCaseSensitive(widget, "id");
    cJSON *type = cJSON_GetObjectItemCaseSensitive(widget, "type");
    cJSON *entity_id = cJSON_GetObjectItemCaseSensitive(widget, "entity_id");
    cJSON *secondary_entity_id = cJSON_GetObjectItemCaseSensitive(widget, "secondary_entity_id");
    cJSON *slider_direction = cJSON_GetObjectItemCaseSensitive(widget, "slider_direction");
    cJSON *slider_accent_color = cJSON_GetObjectItemCaseSensitive(widget, "slider_accent_color");
    cJSON *button_accent_color = cJSON_GetObjectItemCaseSensitive(widget, "button_accent_color");
    cJSON *button_mode = cJSON_GetObjectItemCaseSensitive(widget, "button_mode");
    cJSON *graph_line_color = cJSON_GetObjectItemCaseSensitive(widget, "graph_line_color");
    cJSON *graph_point_count = cJSON_GetObjectItemCaseSensitive(widget, "graph_point_count");
    cJSON *graph_time_window_min = cJSON_GetObjectItemCaseSensitive(widget, "graph_time_window_min");
    cJSON *graph_display_mode = cJSON_GetObjectItemCaseSensitive(widget, "graph_display_mode");
    cJSON *graph_bar_bucket_min = cJSON_GetObjectItemCaseSensitive(widget, "graph_bar_bucket_min");
    cJSON *rect = cJSON_GetObjectItemCaseSensitive(widget, "rect");

    if (!cJSON_IsString(id) || id->valuestring == NULL || strlen(id->valuestring) == 0U) {
        snprintf(msg, sizeof(msg), "page[%u] widget[%u]: invalid id", (unsigned)page_index, (unsigned)widget_index);
        layout_validation_add(result, msg);
    } else if (strlen(id->valuestring) >= APP_MAX_WIDGET_ID_LEN) {
        snprintf(msg, sizeof(msg), "widget id too long: %.*s", LAYOUT_MSG_VALUE_MAX, id->valuestring);
        layout_validation_add(result, msg);
    } else if (str_in_list(id->valuestring, known_widget_ids, APP_MAX_WIDGET_ID_LEN, known_ids_len)) {
        snprintf(msg, sizeof(msg), "duplicate widget id: %s", id->valuestring);
        layout_validation_add(result, msg);
    }

    if (!cJSON_IsString(type) || type->valuestring == NULL) {
        snprintf(msg, sizeof(msg), "widget %s: missing type", cJSON_IsString(id) ? id->valuestring : "?");
        layout_validation_add(result, msg);
    } else if (!is_supported_widget_type(type->valuestring)) {
        snprintf(msg, sizeof(msg), "widget %s: unsupported type %s", cJSON_IsString(id) ? id->valuestring : "?",
            type->valuestring);
        layout_validation_add(result, msg);
    }

    bool requires_entity = true;
    if (cJSON_IsString(type) && type->valuestring != NULL) {
        requires_entity = widget_requires_primary_entity(type->valuestring);
    }

    bool entity_optional = cJSON_IsString(type) && type->valuestring != NULL &&
                           widget_entity_id_optional(type->valuestring);
    bool entity_absent = !cJSON_IsString(entity_id) || entity_id->valuestring == NULL ||
                         entity_id->valuestring[0] == '\0';

    if (requires_entity) {
        if ((!cJSON_IsString(entity_id) || !is_valid_entity_id(entity_id->valuestring)) &&
            !(entity_optional && entity_absent)) {
            snprintf(msg, sizeof(msg), "widget %s: invalid entity_id", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }

        if (!entity_absent && cJSON_IsString(type) && type->valuestring != NULL) {
            if (!widget_entity_domain_valid(type->valuestring, entity_id->valuestring)) {
                if (strcmp(type->valuestring, "sensor") == 0) {
                    snprintf(msg, sizeof(msg), "widget %s: entity_id must be sensor.* or binary_sensor.*",
                        cJSON_IsString(id) ? id->valuestring : "?");
                } else if (strcmp(type->valuestring, "button") == 0) {
                    snprintf(msg, sizeof(msg), "widget %s: entity_id must be switch.* or media_player.*",
                        cJSON_IsString(id) ? id->valuestring : "?");
                } else {
                    const char *required_domain = required_domain_for_widget_type(type->valuestring);
                    snprintf(msg, sizeof(msg), "widget %s: entity_id must be %s.*",
                        cJSON_IsString(id) ? id->valuestring : "?", required_domain != NULL ? required_domain : "?");
                }
                layout_validation_add(result, msg);
            }
        }
    } else if (cJSON_IsString(entity_id) && entity_id->valuestring != NULL && entity_id->valuestring[0] != '\0' &&
               !is_valid_entity_id(entity_id->valuestring)) {
        snprintf(msg, sizeof(msg), "widget %s: invalid entity_id", cJSON_IsString(id) ? id->valuestring : "?");
        layout_validation_add(result, msg);
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "heating_tile") == 0) {
        if (cJSON_IsString(secondary_entity_id) && secondary_entity_id->valuestring != NULL &&
            secondary_entity_id->valuestring[0] != '\0') {
            if (!is_valid_entity_id(secondary_entity_id->valuestring) ||
                !entity_in_domain(secondary_entity_id->valuestring, "sensor")) {
                snprintf(msg, sizeof(msg), "widget %s: invalid secondary_entity_id", cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }

        cJSON *style_variant = cJSON_GetObjectItemCaseSensitive(widget, "style_variant");
        if (cJSON_IsString(style_variant) && style_variant->valuestring != NULL &&
            style_variant->valuestring[0] != '\0') {
            if (strcmp(style_variant->valuestring, "default") != 0 &&
                strcmp(style_variant->valuestring, "arc_semi") != 0) {
                snprintf(msg, sizeof(msg), "widget %s: style_variant must be default|arc_semi",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }
        cJSON *arc_opening = cJSON_GetObjectItemCaseSensitive(widget, "arc_opening");
        if (cJSON_IsString(arc_opening) && arc_opening->valuestring != NULL &&
            arc_opening->valuestring[0] != '\0') {
            const char *v = arc_opening->valuestring;
            if (strcmp(v, "left") != 0 && strcmp(v, "right") != 0 && strcmp(v, "top") != 0 && strcmp(v, "bottom") != 0) {
                snprintf(msg, sizeof(msg), "widget %s: arc_opening must be left|right|top|bottom",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "roborock_tile") == 0) {
        if (cJSON_IsString(secondary_entity_id) && secondary_entity_id->valuestring != NULL &&
            secondary_entity_id->valuestring[0] != '\0') {
            if (!is_valid_entity_id(secondary_entity_id->valuestring) ||
                !entity_in_domain(secondary_entity_id->valuestring, "image")) {
                snprintf(msg, sizeof(msg), "widget %s: secondary_entity_id must be image.*",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "sensor_tile") == 0) {
        cJSON *entity_ids = cJSON_GetObjectItemCaseSensitive(widget, "entity_ids");
        if (entity_ids != NULL && !cJSON_IsString(entity_ids)) {
            snprintf(msg, sizeof(msg),
                "widget %s: entity_ids must list up to %d 'Label=entity' pairs (empty entity hides a row)",
                cJSON_IsString(id) ? id->valuestring : "?", APP_MAX_SENSOR_TILE_ROWS);
            layout_validation_add(result, msg);
        } else if (entity_ids != NULL && entity_ids->valuestring != NULL) {
            const char *reason = NULL;
            if (!is_valid_labeled_entity_list(entity_ids->valuestring, APP_MAX_SENSOR_TILE_ROWS, &reason)) {
                snprintf(msg, sizeof(msg),
                    "widget %s: entity_ids: %s",
                    cJSON_IsString(id) ? id->valuestring : "?",
                    reason != NULL ? reason : "must list up to 24 'Label=entity' pairs");
                layout_validation_add(result, msg);
            }
        }

        static const char *const font_keys[] = {
            "sensor_tile_title_font_px", "sensor_tile_row_font_px",
            "sensor_tile_ip_font_px", "sensor_tile_power_font_px",
            "sensor_tile_ports_font_px",
        };
        for (size_t k = 0; k < sizeof(font_keys) / sizeof(font_keys[0]); k++) {
            cJSON *font_px = cJSON_GetObjectItemCaseSensitive(widget, font_keys[k]);
            if (font_px != NULL && (!cJSON_IsNumber(font_px) || font_px->valueint < 0 || font_px->valueint > 64)) {
                snprintf(msg, sizeof(msg), "widget %s: %s must be a number from 0 to 64 (0 = auto)",
                    cJSON_IsString(id) ? id->valuestring : "?", font_keys[k]);
                layout_validation_add(result, msg);
            }
        }
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "slider") == 0) {
        if (slider_direction != NULL) {
            if (!cJSON_IsString(slider_direction) || slider_direction->valuestring == NULL ||
                !is_valid_slider_direction(slider_direction->valuestring)) {
                snprintf(msg, sizeof(msg),
                    "widget %s: slider_direction must be auto|left_to_right|right_to_left|bottom_to_top|top_to_bottom",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }

        if (slider_accent_color != NULL) {
            if (!cJSON_IsString(slider_accent_color) || slider_accent_color->valuestring == NULL ||
                !is_valid_hex_rgb_color(slider_accent_color->valuestring)) {
                snprintf(msg, sizeof(msg), "widget %s: slider_accent_color must be hex RGB",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "binary_sensor") == 0) {
        cJSON *binary_color_on = cJSON_GetObjectItemCaseSensitive(widget, "binary_color_on");
        cJSON *binary_color_off = cJSON_GetObjectItemCaseSensitive(widget, "binary_color_off");
        cJSON *binary_show_title = cJSON_GetObjectItemCaseSensitive(widget, "binary_show_title");
        if (binary_color_on != NULL && !cJSON_IsString(binary_color_on)) {
            snprintf(msg, sizeof(msg), "widget %s: binary_color_on must be a string", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (binary_color_off != NULL && !cJSON_IsString(binary_color_off)) {
            snprintf(msg, sizeof(msg), "widget %s: binary_color_off must be a string", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (binary_color_on != NULL && cJSON_IsString(binary_color_on) && binary_color_on->valuestring != NULL &&
            binary_color_on->valuestring[0] != '\0' && !is_valid_hex_rgb_color(binary_color_on->valuestring)) {
            snprintf(msg, sizeof(msg), "widget %s: binary_color_on must be hex RGB", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (binary_color_off != NULL && cJSON_IsString(binary_color_off) && binary_color_off->valuestring != NULL &&
            binary_color_off->valuestring[0] != '\0' && !is_valid_hex_rgb_color(binary_color_off->valuestring)) {
            snprintf(msg, sizeof(msg), "widget %s: binary_color_off must be hex RGB", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (binary_show_title != NULL && !cJSON_IsBool(binary_show_title)) {
            snprintf(msg, sizeof(msg), "widget %s: binary_show_title must be a boolean", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "binary_sensor") == 0) {
        cJSON *binary_color_on = cJSON_GetObjectItemCaseSensitive(widget, "binary_color_on");
        cJSON *binary_color_off = cJSON_GetObjectItemCaseSensitive(widget, "binary_color_off");
        cJSON *binary_show_title = cJSON_GetObjectItemCaseSensitive(widget, "binary_show_title");
        if (binary_color_on != NULL && !cJSON_IsString(binary_color_on)) {
            snprintf(msg, sizeof(msg), "widget %s: binary_color_on must be a string", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (binary_color_off != NULL && !cJSON_IsString(binary_color_off)) {
            snprintf(msg, sizeof(msg), "widget %s: binary_color_off must be a string", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (binary_color_on != NULL && cJSON_IsString(binary_color_on) && binary_color_on->valuestring != NULL &&
            binary_color_on->valuestring[0] != '\0' && !is_valid_hex_rgb_color(binary_color_on->valuestring)) {
            snprintf(msg, sizeof(msg), "widget %s: binary_color_on must be hex RGB", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (binary_color_off != NULL && cJSON_IsString(binary_color_off) && binary_color_off->valuestring != NULL &&
            binary_color_off->valuestring[0] != '\0' && !is_valid_hex_rgb_color(binary_color_off->valuestring)) {
            snprintf(msg, sizeof(msg), "widget %s: binary_color_off must be hex RGB", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (binary_show_title != NULL && !cJSON_IsBool(binary_show_title)) {
            snprintf(msg, sizeof(msg), "widget %s: binary_show_title must be a boolean", cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "alarm_tile") == 0) {
        cJSON *alarm_code = cJSON_GetObjectItemCaseSensitive(widget, "alarm_code");
        cJSON *alarm_modes = cJSON_GetObjectItemCaseSensitive(widget, "alarm_modes");
        cJSON *alarm_ask_code = cJSON_GetObjectItemCaseSensitive(widget, "alarm_ask_code");
        cJSON *alarm_backend = cJSON_GetObjectItemCaseSensitive(widget, "alarm_backend");
        cJSON *alarm_zone_label = cJSON_GetObjectItemCaseSensitive(widget, "alarm_zone_label");
        cJSON *alarm_bool_fields[4] = {
            cJSON_GetObjectItemCaseSensitive(widget, "alarm_show_sensors"),
            cJSON_GetObjectItemCaseSensitive(widget, "alarm_show_bypassed"),
            cJSON_GetObjectItemCaseSensitive(widget, "alarm_force_arm"),
            cJSON_GetObjectItemCaseSensitive(widget, "alarm_skip_delay"),
        };
        static const char *alarm_bool_names[4] = {
            "alarm_show_sensors", "alarm_show_bypassed", "alarm_force_arm", "alarm_skip_delay"
        };
        if (alarm_code != NULL && (!cJSON_IsString(alarm_code) || alarm_code->valuestring == NULL ||
                                   strlen(alarm_code->valuestring) >= APP_MAX_ALARM_CODE_LEN)) {
            snprintf(msg, sizeof(msg), "widget %s: alarm_code must be a string shorter than %d",
                cJSON_IsString(id) ? id->valuestring : "?", APP_MAX_ALARM_CODE_LEN);
            layout_validation_add(result, msg);
        }
        if (alarm_modes != NULL && (!cJSON_IsString(alarm_modes) || alarm_modes->valuestring == NULL ||
                                    strlen(alarm_modes->valuestring) >= APP_MAX_ALARM_MODES_LEN ||
                                    !is_valid_alarm_modes(alarm_modes->valuestring))) {
            snprintf(msg, sizeof(msg),
                "widget %s: alarm_modes must be a list of away|home|night|vacation|custom|disarm",
                cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (alarm_ask_code != NULL && !cJSON_IsBool(alarm_ask_code)) {
            snprintf(msg, sizeof(msg), "widget %s: alarm_ask_code must be a boolean",
                cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (alarm_backend != NULL && (!cJSON_IsString(alarm_backend) || alarm_backend->valuestring == NULL ||
                                      !is_valid_alarm_backend(alarm_backend->valuestring))) {
            snprintf(msg, sizeof(msg), "widget %s: alarm_backend must be auto|alarmo|builtin",
                cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
        if (alarm_zone_label != NULL && (!cJSON_IsString(alarm_zone_label) ||
                                         alarm_zone_label->valuestring == NULL ||
                                         strlen(alarm_zone_label->valuestring) >= APP_MAX_NAME_LEN)) {
            snprintf(msg, sizeof(msg), "widget %s: alarm_zone_label must be a string shorter than %d",
                cJSON_IsString(id) ? id->valuestring : "?", APP_MAX_NAME_LEN);
            layout_validation_add(result, msg);
        }
        for (size_t i = 0; i < 4; i++) {
            if (alarm_bool_fields[i] != NULL && !cJSON_IsBool(alarm_bool_fields[i])) {
                snprintf(msg, sizeof(msg), "widget %s: %s must be a boolean",
                    cJSON_IsString(id) ? id->valuestring : "?", alarm_bool_names[i]);
                layout_validation_add(result, msg);
            }
        }
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "clock_alarm") == 0) {
        cJSON *clock_seconds = cJSON_GetObjectItemCaseSensitive(widget, "clock_show_seconds");
        cJSON *clock_date = cJSON_GetObjectItemCaseSensitive(widget, "clock_show_date");
        const char *widget_name = cJSON_IsString(id) ? id->valuestring : "?";

        if (clock_seconds != NULL && !cJSON_IsBool(clock_seconds)) {
            snprintf(msg, sizeof(msg), "widget %s: clock_show_seconds must be a boolean", widget_name);
            layout_validation_add(result, msg);
        }
        if (clock_date != NULL && !cJSON_IsBool(clock_date)) {
            snprintf(msg, sizeof(msg), "widget %s: clock_show_date must be a boolean", widget_name);
            layout_validation_add(result, msg);
        }
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "sensor") == 0) {
        cJSON *sensor_value_color = cJSON_GetObjectItemCaseSensitive(widget, "sensor_value_color");
        if (sensor_value_color != NULL) {
            if (!cJSON_IsString(sensor_value_color) || sensor_value_color->valuestring == NULL ||
                (sensor_value_color->valuestring[0] != '\0' && !is_valid_hex_rgb_color(sensor_value_color->valuestring))) {
                snprintf(msg, sizeof(msg), "widget %s: sensor_value_color must be hex RGB",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "button") == 0) {
        if (button_accent_color != NULL) {
            if (!cJSON_IsString(button_accent_color) || button_accent_color->valuestring == NULL ||
                !is_valid_hex_rgb_color(button_accent_color->valuestring)) {
                snprintf(msg, sizeof(msg), "widget %s: button_accent_color must be hex RGB",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }

        if (button_mode != NULL) {
            if (!cJSON_IsString(button_mode) || button_mode->valuestring == NULL ||
                !is_valid_button_mode(button_mode->valuestring)) {
                snprintf(msg, sizeof(msg), "widget %s: button_mode must be auto|play_pause|stop|next|previous",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            } else if (button_mode_requires_media_player(button_mode->valuestring) &&
                       cJSON_IsString(entity_id) && entity_id->valuestring != NULL &&
                       !entity_in_domain(entity_id->valuestring, "media_player")) {
                snprintf(msg, sizeof(msg), "widget %s: button_mode %s requires media_player.* entity_id",
                    cJSON_IsString(id) ? id->valuestring : "?",
                    button_mode->valuestring);
                layout_validation_add(result, msg);
            }
        }
    }

    if (cJSON_IsString(type) && type->valuestring != NULL && strcmp(type->valuestring, "graph") == 0) {
        if (graph_line_color != NULL) {
            if (!cJSON_IsString(graph_line_color) || graph_line_color->valuestring == NULL ||
                !is_valid_hex_rgb_color(graph_line_color->valuestring)) {
                snprintf(msg, sizeof(msg), "widget %s: graph_line_color must be hex RGB",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }

        if (graph_point_count != NULL) {
            if (!cJSON_IsNumber(graph_point_count) ||
                graph_point_count->valuedouble < (double)GRAPH_POINT_COUNT_MIN ||
                graph_point_count->valuedouble > (double)GRAPH_POINT_COUNT_MAX ||
                (double)graph_point_count->valueint != graph_point_count->valuedouble) {
                snprintf(msg, sizeof(msg), "widget %s: graph_point_count must be integer %d..%d",
                    cJSON_IsString(id) ? id->valuestring : "?",
                    GRAPH_POINT_COUNT_MIN,
                    GRAPH_POINT_COUNT_MAX);
                layout_validation_add(result, msg);
            }
        }

        if (graph_time_window_min != NULL) {
            if (!cJSON_IsNumber(graph_time_window_min) ||
                graph_time_window_min->valuedouble < (double)GRAPH_TIME_WINDOW_MIN_MIN ||
                graph_time_window_min->valuedouble > (double)GRAPH_TIME_WINDOW_MIN_MAX ||
                (double)graph_time_window_min->valueint != graph_time_window_min->valuedouble) {
                snprintf(msg, sizeof(msg), "widget %s: graph_time_window_min must be integer %d..%d",
                    cJSON_IsString(id) ? id->valuestring : "?",
                    GRAPH_TIME_WINDOW_MIN_MIN,
                    GRAPH_TIME_WINDOW_MIN_MAX);
                layout_validation_add(result, msg);
            }
        }

        if (graph_display_mode != NULL) {
            bool valid_mode = false;
            if (cJSON_IsString(graph_display_mode) && graph_display_mode->valuestring != NULL) {
                for (size_t i = 0; i < sizeof(GRAPH_DISPLAY_MODES) / sizeof(GRAPH_DISPLAY_MODES[0]); ++i) {
                    if (strcmp(graph_display_mode->valuestring, GRAPH_DISPLAY_MODES[i]) == 0) {
                        valid_mode = true;
                        break;
                    }
                }
            }
            if (!valid_mode) {
                snprintf(msg, sizeof(msg),
                    "widget %s: graph_display_mode must be line|line_smooth|line_smooth_points|bars",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }

        if (graph_bar_bucket_min != NULL) {
            bool valid_bucket = false;
            if (cJSON_IsNumber(graph_bar_bucket_min) &&
                (double)graph_bar_bucket_min->valueint == graph_bar_bucket_min->valuedouble) {
                for (size_t i = 0; i < sizeof(GRAPH_BAR_BUCKET_MIN_ALLOWED) / sizeof(GRAPH_BAR_BUCKET_MIN_ALLOWED[0]); ++i) {
                    if (graph_bar_bucket_min->valueint == GRAPH_BAR_BUCKET_MIN_ALLOWED[i]) {
                        valid_bucket = true;
                        break;
                    }
                }
            }
            if (!valid_bucket) {
                snprintf(msg, sizeof(msg),
                    "widget %s: graph_bar_bucket_min must be one of 5|10|15|30",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            }
        }
    }

    {
        static const char *const tile_color_keys[] = {
            "tile_bg_color",
            "tile_bg_grad_color",
            "tile_border_color",
            "tile_text_color",
            "tile_title_color",
            "tile_label_color",
            "tile_value_color",
            "tile_icon_color",
        };
        for (size_t i = 0; i < sizeof(tile_color_keys) / sizeof(tile_color_keys[0]); ++i) {
            cJSON *item = cJSON_GetObjectItemCaseSensitive(widget, tile_color_keys[i]);
            if (item == NULL) {
                continue;
            }
            if (!cJSON_IsString(item) || !is_valid_optional_hex_rgb_color(item->valuestring)) {
                snprintf(msg, sizeof(msg), "widget %s: %s must be hex RGB",
                    cJSON_IsString(id) ? id->valuestring : "?", tile_color_keys[i]);
                layout_validation_add(result, msg);
            }
        }

        cJSON *tile_bg_grad_dir = cJSON_GetObjectItemCaseSensitive(widget, "tile_bg_grad_dir");
        if (tile_bg_grad_dir != NULL &&
            (!cJSON_IsString(tile_bg_grad_dir) || !is_valid_tile_grad_dir(tile_bg_grad_dir->valuestring))) {
            snprintf(msg, sizeof(msg), "widget %s: tile_bg_grad_dir must be none|hor|ver",
                cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }

        cJSON *tile_font_scale = cJSON_GetObjectItemCaseSensitive(widget, "tile_font_scale");
        if (tile_font_scale != NULL &&
            (!cJSON_IsString(tile_font_scale) || !is_valid_tile_font_scale(tile_font_scale->valuestring))) {
            snprintf(msg, sizeof(msg), "widget %s: tile_font_scale must be auto|s|m|l|xl",
                cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }

        static const struct {
            const char *key;
            int max;
        } tile_int_keys[] = {
            { "tile_border_width", 16 },
            { "tile_radius", 128 },
            { "tile_opacity", 100 },
        };
        for (size_t i = 0; i < sizeof(tile_int_keys) / sizeof(tile_int_keys[0]); ++i) {
            cJSON *item = cJSON_GetObjectItemCaseSensitive(widget, tile_int_keys[i].key);
            if (item == NULL) {
                continue;
            }
            if (!is_valid_auto_or_int(item, 0, tile_int_keys[i].max)) {
                snprintf(msg, sizeof(msg), "widget %s: %s must be -1 or 0..%d",
                    cJSON_IsString(id) ? id->valuestring : "?", tile_int_keys[i].key, tile_int_keys[i].max);
                layout_validation_add(result, msg);
            }
        }

        cJSON *tile_shadow = cJSON_GetObjectItemCaseSensitive(widget, "tile_shadow");
        if (tile_shadow != NULL && !cJSON_IsBool(tile_shadow)) {
            snprintf(msg, sizeof(msg), "widget %s: tile_shadow must be a boolean",
                cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        }
    }

    if (!cJSON_IsObject(rect)) {
        snprintf(msg, sizeof(msg), "widget %s: missing rect", cJSON_IsString(id) ? id->valuestring : "?");
        layout_validation_add(result, msg);
    } else {
        cJSON *x = cJSON_GetObjectItemCaseSensitive(rect, "x");
        cJSON *y = cJSON_GetObjectItemCaseSensitive(rect, "y");
        cJSON *w = cJSON_GetObjectItemCaseSensitive(rect, "w");
        cJSON *h = cJSON_GetObjectItemCaseSensitive(rect, "h");
        if (!cJSON_IsNumber(x) || !cJSON_IsNumber(y) || !cJSON_IsNumber(w) || !cJSON_IsNumber(h)) {
            snprintf(msg, sizeof(msg), "widget %s: rect values must be numbers",
                cJSON_IsString(id) ? id->valuestring : "?");
            layout_validation_add(result, msg);
        } else {
            int rx = x->valueint;
            int ry = y->valueint;
            int rw = w->valueint;
            int rh = h->valueint;
            widget_size_limits_t limits = widget_size_limits_for_type(cJSON_IsString(type) ? type->valuestring : NULL);
            if (rw <= 0 || rh <= 0 || rx < 0 || ry < 0 || (rx + rw) > APP_CONTENT_BOX_WIDTH ||
                (ry + rh) > APP_CONTENT_BOX_HEIGHT) {
                snprintf(msg, sizeof(msg), "widget %s: rect out of bounds for content box",
                    cJSON_IsString(id) ? id->valuestring : "?");
                layout_validation_add(result, msg);
            } else if (rw < limits.min_w || rh < limits.min_h || rw > limits.max_w || rh > limits.max_h) {
                snprintf(msg, sizeof(msg), "widget %s: size must be %dx%d..%dx%d",
                    cJSON_IsString(id) ? id->valuestring : "?",
                    limits.min_w,
                    limits.min_h,
                    limits.max_w,
                    limits.max_h);
                layout_validation_add(result, msg);
            }
        }
    }

    return true;
}

bool layout_validate_json(const char *json, layout_validation_result_t *result)
{
    layout_validation_clear(result);
    if (json == NULL) {
        layout_validation_add(result, "layout json is null");
        return false;
    }

    cJSON *root = cJSON_Parse(json);
    if (root == NULL) {
        layout_validation_add(result, "layout json parse error");
        return false;
    }

    cJSON *version = cJSON_GetObjectItemCaseSensitive(root, "version");
    cJSON *pages = cJSON_GetObjectItemCaseSensitive(root, "pages");

    if (!cJSON_IsNumber(version) || version->valueint != 1) {
        layout_validation_add(result, "layout version must be 1");
    }

    if (!cJSON_IsArray(pages)) {
        layout_validation_add(result, "pages must be an array");
        cJSON_Delete(root);
        return false;
    }

    int page_count = cJSON_GetArraySize(pages);
    if (page_count <= 0) {
        layout_validation_add(result, "at least one page required");
    }
    if (page_count > APP_MAX_PAGES) {
        layout_validation_add(result, "too many pages");
    }

    char *known_page_ids = calloc(APP_MAX_PAGES, APP_MAX_PAGE_ID_LEN);
    char *known_widget_ids = calloc(APP_MAX_WIDGETS_TOTAL, APP_MAX_WIDGET_ID_LEN);
    if (known_page_ids == NULL || known_widget_ids == NULL) {
        free(known_page_ids);
        free(known_widget_ids);
        layout_validation_add(result, "out of memory during validation");
        cJSON_Delete(root);
        return false;
    }

    size_t known_page_ids_len = 0;
    size_t known_widget_ids_len = 0;

    for (int i = 0; i < page_count; i++) {
        cJSON *page = cJSON_GetArrayItem(pages, i);
        if (!cJSON_IsObject(page)) {
            layout_validation_add(result, "page entry must be object");
            continue;
        }

        cJSON *page_id = cJSON_GetObjectItemCaseSensitive(page, "id");
        cJSON *page_type = cJSON_GetObjectItemCaseSensitive(page, "type");
        cJSON *widgets = cJSON_GetObjectItemCaseSensitive(page, "widgets");
        char msg[96];
        bool is_energy_dashboard_page = false;
        bool is_xiaozhi_page = false;
        bool is_music_assistant_page = false;
        bool is_radio_page = false;

        if (!cJSON_IsString(page_id) || page_id->valuestring == NULL || strlen(page_id->valuestring) == 0U) {
            snprintf(msg, sizeof(msg), "page[%u]: invalid id", (unsigned)i);
            layout_validation_add(result, msg);
        } else if (strlen(page_id->valuestring) >= APP_MAX_PAGE_ID_LEN) {
            snprintf(msg, sizeof(msg), "page id too long: %.*s", LAYOUT_MSG_VALUE_MAX, page_id->valuestring);
            layout_validation_add(result, msg);
        } else if (str_in_list(page_id->valuestring, known_page_ids, APP_MAX_PAGE_ID_LEN, known_page_ids_len)) {
            snprintf(msg, sizeof(msg), "duplicate page id: %s", page_id->valuestring);
            layout_validation_add(result, msg);
        } else if (known_page_ids_len < APP_MAX_PAGES) {
            char *dst = known_page_ids + (known_page_ids_len * APP_MAX_PAGE_ID_LEN);
            snprintf(dst, APP_MAX_PAGE_ID_LEN, "%s", page_id->valuestring);
            known_page_ids_len++;
        }

        if (page_type != NULL) {
            if (!cJSON_IsString(page_type) || page_type->valuestring == NULL ||
                !is_supported_page_type(page_type->valuestring)) {
                snprintf(msg, sizeof(msg), "page %s: unsupported type", cJSON_IsString(page_id) ? page_id->valuestring : "?");
                layout_validation_add(result, msg);
            } else if (strcmp(page_type->valuestring, "energy_dashboard") == 0) {
                is_energy_dashboard_page = true;
            } else if (strcmp(page_type->valuestring, "xiaozhi") == 0) {
                is_xiaozhi_page = true;
            } else if (strcmp(page_type->valuestring, "music_assistant") == 0) {
                is_music_assistant_page = true;
            } else if (strcmp(page_type->valuestring, "radio") == 0) {
                is_radio_page = true;
            }
        }

        if (is_radio_page) {
            validate_page_style(page, cJSON_IsString(page_id) ? page_id->valuestring : "?", result);
            validate_radio_page(page, cJSON_IsString(page_id) ? page_id->valuestring : "?", result);
            if (widgets != NULL && !cJSON_IsArray(widgets)) {
                snprintf(msg, sizeof(msg), "page %s: widgets must be array",
                    cJSON_IsString(page_id) ? page_id->valuestring : "?");
                layout_validation_add(result, msg);
            } else if (cJSON_IsArray(widgets) && cJSON_GetArraySize(widgets) > 0) {
                snprintf(msg, sizeof(msg), "page %s: radio pages cannot contain widgets",
                    cJSON_IsString(page_id) ? page_id->valuestring : "?");
                layout_validation_add(result, msg);
            }
            continue;
        } else if (is_music_assistant_page) {
            validate_page_style(page, cJSON_IsString(page_id) ? page_id->valuestring : "?", result);
            validate_music_page(page, cJSON_IsString(page_id) ? page_id->valuestring : "?", result);
            if (widgets != NULL && !cJSON_IsArray(widgets)) {
                snprintf(msg, sizeof(msg), "page %s: widgets must be array", cJSON_IsString(page_id) ? page_id->valuestring : "?");
                layout_validation_add(result, msg);
            } else if (cJSON_IsArray(widgets) && cJSON_GetArraySize(widgets) > 0) {
                snprintf(msg, sizeof(msg), "page %s: music_assistant pages cannot contain widgets",
                    cJSON_IsString(page_id) ? page_id->valuestring : "?");
                layout_validation_add(result, msg);
            }
            continue;
        }

        if (is_energy_dashboard_page) {
            validate_page_style(page, cJSON_IsString(page_id) ? page_id->valuestring : "?", result);
            validate_energy_page(page, cJSON_IsString(page_id) ? page_id->valuestring : "?", result);
            if (widgets != NULL && !cJSON_IsArray(widgets)) {
                snprintf(msg, sizeof(msg), "page %s: widgets must be array", cJSON_IsString(page_id) ? page_id->valuestring : "?");
                layout_validation_add(result, msg);
            } else if (cJSON_IsArray(widgets) && cJSON_GetArraySize(widgets) > 0) {
                snprintf(msg, sizeof(msg), "page %s: energy_dashboard pages cannot contain widgets",
                    cJSON_IsString(page_id) ? page_id->valuestring : "?");
                layout_validation_add(result, msg);
            }
            continue;
        }

        if (is_xiaozhi_page) {
            if (widgets != NULL && !cJSON_IsArray(widgets)) {
                snprintf(msg, sizeof(msg), "page %s: widgets must be array", cJSON_IsString(page_id) ? page_id->valuestring : "?");
                layout_validation_add(result, msg);
            } else if (cJSON_IsArray(widgets) && cJSON_GetArraySize(widgets) > 0) {
                snprintf(msg, sizeof(msg), "page %s: xiaozhi pages cannot contain widgets",
                    cJSON_IsString(page_id) ? page_id->valuestring : "?");
                layout_validation_add(result, msg);
            }
            continue;
        }

        if (!cJSON_IsArray(widgets)) {
            snprintf(msg, sizeof(msg), "page %s: widgets must be array", cJSON_IsString(page_id) ? page_id->valuestring : "?");
            layout_validation_add(result, msg);
            continue;
        }

        validate_page_style(page, cJSON_IsString(page_id) ? page_id->valuestring : "?", result);

        int widget_count = cJSON_GetArraySize(widgets);
        if (widget_count > APP_MAX_WIDGETS_PER_PAGE) {
            snprintf(msg, sizeof(msg), "page %s: too many widgets", cJSON_IsString(page_id) ? page_id->valuestring : "?");
            layout_validation_add(result, msg);
        }

        for (int w = 0; w < widget_count; w++) {
            cJSON *widget = cJSON_GetArrayItem(widgets, w);
            if (!cJSON_IsObject(widget)) {
                layout_validation_add(result, "widget entry must be object");
                continue;
            }
            validate_widget(widget, known_widget_ids, known_widget_ids_len, (size_t)i, (size_t)w, result);
            cJSON *id = cJSON_GetObjectItemCaseSensitive(widget, "id");
            if (cJSON_IsString(id) && id->valuestring != NULL && strlen(id->valuestring) > 0 &&
                strlen(id->valuestring) < APP_MAX_WIDGET_ID_LEN &&
                !str_in_list(id->valuestring, known_widget_ids, APP_MAX_WIDGET_ID_LEN, known_widget_ids_len) &&
                known_widget_ids_len < APP_MAX_WIDGETS_TOTAL) {
                char *dst = known_widget_ids + (known_widget_ids_len * APP_MAX_WIDGET_ID_LEN);
                snprintf(dst, APP_MAX_WIDGET_ID_LEN, "%s", id->valuestring);
                known_widget_ids_len++;
            }
        }
    }

    free(known_page_ids);
    free(known_widget_ids);
    cJSON_Delete(root);
    return result->count == 0;
}
