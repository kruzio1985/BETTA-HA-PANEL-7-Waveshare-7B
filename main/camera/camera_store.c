/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "camera/camera_store.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "cJSON.h"
#include "esp_log.h"

#include "util/json_util.h"
#include "util/log_tags.h"

#define TAG TAG_CAMERA

static void camera_store_write_default_file(void)
{
    FILE *f = fopen(APP_CAMERAS_PATH, "wb");
    if (f == NULL) {
        ESP_LOGW(TAG, "cannot create default cameras file %s", APP_CAMERAS_PATH);
        return;
    }
    const char empty[] = "[]";
    fwrite(empty, 1U, sizeof(empty) - 1U, f);
    fclose(f);
}

esp_err_t camera_store_init(void)
{
    FILE *f = fopen(APP_CAMERAS_PATH, "rb");
    if (f == NULL) {
        ESP_LOGW(TAG, "cameras file missing, writing empty list");
        camera_store_write_default_file();
        return ESP_OK;
    }
    fclose(f);
    return ESP_OK;
}

static bool camera_store_copy_str(const cJSON *obj, const char *key, char *dst, size_t dst_size)
{
    const char *value = NULL;
    if (!json_util_get_string(obj, key, &value) || value == NULL) {
        dst[0] = '\0';
        return false;
    }
    snprintf(dst, dst_size, "%s", value);
    return true;
}

static uint32_t camera_store_clamp_refresh(int value)
{
    if (value < (int)APP_CAMERA_REFRESH_MIN_MS) return APP_CAMERA_REFRESH_MIN_MS;
    if (value > (int)APP_CAMERA_REFRESH_MAX_MS) return APP_CAMERA_REFRESH_MAX_MS;
    return (uint32_t)value;
}

static void camera_store_generate_id(size_t index, char *dst, size_t dst_size)
{
    snprintf(dst, dst_size, "cam_%u", (unsigned)(index + 1U));
}

static esp_err_t camera_store_parse_json(const char *json,
                                         camera_entry_t *entries,
                                         size_t *count_out)
{
    if (json == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    cJSON *root = cJSON_Parse(json);
    if (root == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    esp_err_t ret = ESP_OK;
    if (!cJSON_IsArray(root)) {
        cJSON_Delete(root);
        return ESP_ERR_INVALID_ARG;
    }

    size_t count = 0;
    cJSON *item = NULL;
    cJSON_ArrayForEach(item, root) {
        if (count >= APP_MAX_CAMERAS) {
            break;
        }
        if (!cJSON_IsObject(item)) {
            continue;
        }

        camera_entry_t entry;
        memset(&entry, 0, sizeof(entry));

        /* Source defaults to "http" so legacy entries (URL-only) keep working. */
        camera_store_copy_str(item, "source", entry.source, sizeof(entry.source));
        if (entry.source[0] == '\0') {
            snprintf(entry.source, sizeof(entry.source), "http");
        }
        if (strcmp(entry.source, "ha") != 0) {
            snprintf(entry.source, sizeof(entry.source), "http");
        }

        camera_store_copy_str(item, "entity_id", entry.entity_id, sizeof(entry.entity_id));
        camera_store_copy_str(item, "snapshot_url", entry.snapshot_url, sizeof(entry.snapshot_url));

        if (strcmp(entry.source, "ha") == 0) {
            if (entry.entity_id[0] == '\0') {
                ESP_LOGW(TAG, "ignoring HA camera without entity_id");
                continue;
            }
            if (strncmp(entry.entity_id, "camera.", 7) != 0) {
                ESP_LOGW(TAG, "ignoring HA camera with non-camera entity_id");
                continue;
            }
        } else {
            if (entry.snapshot_url[0] == '\0') {
                continue; /* URL is mandatory for http source */
            }
            if (strncmp(entry.snapshot_url, "http://", 7) != 0 &&
                strncmp(entry.snapshot_url, "https://", 8) != 0) {
                ESP_LOGW(TAG, "ignoring camera with non-absolute URL");
                continue;
            }
        }

        camera_store_copy_str(item, "id", entry.id, sizeof(entry.id));
        if (entry.id[0] == '\0') {
            camera_store_generate_id(count, entry.id, sizeof(entry.id));
        }
        camera_store_copy_str(item, "name", entry.name, sizeof(entry.name));
        if (entry.name[0] == '\0') {
            if (strcmp(entry.source, "ha") == 0 && entry.entity_id[0] != '\0') {
                strncpy(entry.name, entry.entity_id, sizeof(entry.name) - 1);
                entry.name[sizeof(entry.name) - 1] = '\0';
            } else {
                snprintf(entry.name, sizeof(entry.name), "Kamera %u", (unsigned)(count + 1U));
            }
        }
        camera_store_copy_str(item, "username", entry.username, sizeof(entry.username));
        camera_store_copy_str(item, "password", entry.password, sizeof(entry.password));

        int refresh = APP_CAMERA_REFRESH_DEFAULT_MS;
        json_util_get_int(item, "refresh_ms", &refresh);
        entry.refresh_ms = camera_store_clamp_refresh(refresh);

        cJSON *enabled_json = cJSON_GetObjectItem(item, "enabled");
        entry.enabled = (enabled_json == NULL) ? true : cJSON_IsTrue(enabled_json);

        if (entries != NULL) {
            entries[count] = entry;
        }
        count++;
    }

    cJSON_Delete(root);
    if (count_out != NULL) {
        *count_out = count;
    }
    return ret;
}

esp_err_t camera_store_load(camera_entry_t *entries, size_t *count_out)
{
    if (count_out == NULL) {
        return ESP_ERR_INVALID_ARG;
    }
    *count_out = 0;

    FILE *f = fopen(APP_CAMERAS_PATH, "rb");
    if (f == NULL) {
        return ESP_ERR_NOT_FOUND;
    }
    if (fseek(f, 0, SEEK_END) != 0) {
        fclose(f);
        return ESP_FAIL;
    }
    long size = ftell(f);
    if (size <= 0 || size > APP_CAMERAS_MAX_JSON_LEN) {
        fclose(f);
        return ESP_ERR_INVALID_SIZE;
    }
    rewind(f);

    char *buf = (char *)calloc((size_t)size + 1U, sizeof(char));
    if (buf == NULL) {
        fclose(f);
        return ESP_ERR_NO_MEM;
    }
    size_t read = fread(buf, 1U, (size_t)size, f);
    fclose(f);
    if (read != (size_t)size) {
        free(buf);
        return ESP_FAIL;
    }

    esp_err_t err = camera_store_parse_json(buf, entries, count_out);
    free(buf);
    return err;
}

esp_err_t camera_store_save_json(const char *json)
{
    if (json == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    /* Validate by parsing; never persist an unparsable payload. */
    esp_err_t err = camera_store_parse_json(json, NULL, NULL);
    if (err != ESP_OK) {
        return err;
    }

    FILE *f = fopen(APP_CAMERAS_PATH, "wb");
    if (f == NULL) {
        ESP_LOGE(TAG, "cannot open cameras file for writing: %s", APP_CAMERAS_PATH);
        return ESP_FAIL;
    }
    size_t len = strlen(json);
    size_t written = fwrite(json, 1U, len, f);
    fclose(f);
    if (written != len) {
        ESP_LOGE(TAG, "failed to write cameras file");
        return ESP_FAIL;
    }
    ESP_LOGI(TAG, "saved cameras (%u bytes)", (unsigned)len);
    return ESP_OK;
}

esp_err_t camera_store_load_json(char **json_out)
{
    if (json_out == NULL) {
        return ESP_ERR_INVALID_ARG;
    }
    *json_out = NULL;

    FILE *f = fopen(APP_CAMERAS_PATH, "rb");
    if (f == NULL) {
        return ESP_ERR_NOT_FOUND;
    }
    if (fseek(f, 0, SEEK_END) != 0) {
        fclose(f);
        return ESP_FAIL;
    }
    long size = ftell(f);
    if (size <= 0 || size > APP_CAMERAS_MAX_JSON_LEN) {
        fclose(f);
        return ESP_ERR_INVALID_SIZE;
    }
    rewind(f);

    char *buf = (char *)calloc((size_t)size + 1U, sizeof(char));
    if (buf == NULL) {
        fclose(f);
        return ESP_ERR_NO_MEM;
    }
    size_t read = fread(buf, 1U, (size_t)size, f);
    fclose(f);
    if (read != (size_t)size) {
        free(buf);
        return ESP_FAIL;
    }
    *json_out = buf;
    return ESP_OK;
}
