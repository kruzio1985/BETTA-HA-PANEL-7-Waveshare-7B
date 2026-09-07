/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#include "app_events.h"

#include "esp_log.h"
#include "esp_timer.h"

#include "util/log_tags.h"

static QueueHandle_t s_event_queue = NULL;

esp_err_t app_events_init(void)
{
    if (s_event_queue != NULL) {
        return ESP_OK;
    }
    s_event_queue = xQueueCreate(APP_EVENT_QUEUE_LENGTH, sizeof(app_event_t));
    if (s_event_queue == NULL) {
        ESP_LOGE(TAG_APP, "Failed to create event queue");
        return ESP_ERR_NO_MEM;
    }
    return ESP_OK;
}

QueueHandle_t app_events_get_queue(void)
{
    return s_event_queue;
}

bool app_events_publish(const app_event_t *event, TickType_t timeout_ticks)
{
    if (s_event_queue == NULL || event == NULL) {
        return false;
    }

#if APP_EVENT_QUEUE_EVICT_ON_FULL
    if (xQueueSend(s_event_queue, event, timeout_ticks) == pdTRUE) {
        return true;
    }

    /* Queue full: the consumer (UI task) is stuck or too slow. Evict the OLDEST
     * event so the queue can never stay saturated. State changes are superseded
     * by the HA model snapshot that the UI task reconciles from, so the oldest
     * event is always the least relevant. */
    app_event_t discarded;
    if (xQueueReceive(s_event_queue, &discarded, 0) != pdTRUE) {
        return false;
    }
    if (xQueueSend(s_event_queue, event, 0) != pdTRUE) {
        return false;
    }

    static uint32_t evicted_count = 0;
    static int64_t last_evict_log_ms = 0;
    evicted_count++;
    int64_t now_ms = esp_timer_get_time() / 1000;
    if ((now_ms - last_evict_log_ms) >= 5000) {
        ESP_LOGW(TAG_APP,
                 "Event queue full: evicted oldest event type=%d (evicted=%u)",
                 (int)discarded.type, (unsigned)evicted_count);
        evicted_count = 0;
        last_evict_log_ms = now_ms;
    }
    return true;
#else
    return xQueueSend(s_event_queue, event, timeout_ticks) == pdTRUE;
#endif
}

bool app_events_receive(app_event_t *event, TickType_t timeout_ticks)
{
    if (s_event_queue == NULL || event == NULL) {
        return false;
    }
    return xQueueReceive(s_event_queue, event, timeout_ticks) == pdTRUE;
}
