/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 *
 * Custom LVGL malloc backend. The P4 has 32 MB of external PSRAM but only a
 * small internal L2MEM pool, and LVGL allocates every widget/object from the
 * internal heap by default. This file makes LVGL allocate from PSRAM first and
 * fall back to internal RAM only when PSRAM is exhausted.
 *
 * Build-time selection: LVGL 9 is configured with LV_STDLIB_CUSTOM
 * (CONFIG_LV_USE_CUSTOM_MALLOC), which makes the stock clib/builtin backends
 * compile to nothing and requires the application to provide the core
 * allocation functions declared in lv_mem.h.
 */
#include "lvgl.h"

/* Link-time anchor: app_main() references this so the object is always pulled
 * from libmain.a during the static link. Without it, lvgl's own archive (which
 * calls lv_mem_init/lv_malloc_core & co.) is scanned after libmain.a and never
 * gets another pass, leaving those symbols undefined at link time. */
void lv_psram_mem_anchor(void)
{
}

#if LV_USE_STDLIB_MALLOC == LV_STDLIB_CUSTOM

#include <inttypes.h>
#include <stdint.h>
#include <string.h>

#include "esp_heap_caps.h"
#include "esp_log.h"

static const char *TAG = "lv_psram_mem";

#define LV_PSRAM_CAPS     (MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT)
#define LV_PSRAM_FALLBACK (MALLOC_CAP_8BIT)
#define LV_PSRAM_ALIGN    8u

/* Every allocation is prefixed with an 8-byte header so the payload keeps
 * LV_PSRAM_ALIGN alignment (heap_caps_aligned_alloc only guarantees the block
 * base) and lv_realloc_core() knows how many bytes to copy when it has to move
 * a block between heaps (internal <-> PSRAM). */
typedef struct {
    uint32_t size;
    uint32_t pad;
} lv_psram_hdr_t;

static void *psram_alloc(size_t size)
{
    if (size == 0) {
        size = 1;
    }
    if (size > (size_t)UINT32_MAX - sizeof(lv_psram_hdr_t)) {
        return NULL;
    }

    size_t total = size + sizeof(lv_psram_hdr_t);
    lv_psram_hdr_t *h = heap_caps_aligned_alloc(LV_PSRAM_ALIGN, total, LV_PSRAM_CAPS);
    if (h == NULL) {
        h = heap_caps_aligned_alloc(LV_PSRAM_ALIGN, total, LV_PSRAM_FALLBACK);
    }
    if (h == NULL) {
        return NULL;
    }

    h->size = (uint32_t)size;
    h->pad = 0;
    return (void *)(h + 1);
}

void lv_mem_init(void)
{
    /* Nothing to configure - allocations go straight to the heap allocator. */
    ESP_LOGI(TAG, "LVGL allocator: PSRAM first (%" PRIu32 " KB free), internal fallback",
             (uint32_t)(heap_caps_get_free_size(MALLOC_CAP_SPIRAM) / 1024));
}

void lv_mem_deinit(void)
{
    /* Nothing to tear down. */
}

lv_mem_pool_t lv_mem_add_pool(void *mem, size_t bytes)
{
    /* Not supported - heap_caps based allocator has no extra pools. */
    LV_UNUSED(mem);
    LV_UNUSED(bytes);
    return NULL;
}

void lv_mem_remove_pool(lv_mem_pool_t pool)
{
    LV_UNUSED(pool);
}

void *lv_malloc_core(size_t size)
{
    return psram_alloc(size);
}

void lv_free_core(void *p)
{
    if (p == NULL) {
        return;
    }
    lv_psram_hdr_t *h = ((lv_psram_hdr_t *)p) - 1;
    heap_caps_free(h);
}

void *lv_realloc_core(void *p, size_t new_size)
{
    if (p == NULL) {
        return psram_alloc(new_size);
    }
    if (new_size == 0) {
        lv_free_core(p);
        return NULL;
    }

    lv_psram_hdr_t *h = ((lv_psram_hdr_t *)p) - 1;
    size_t old_size = h->size;
    if (new_size <= old_size) {
        /* Shrink in place: keep the block, only update the logical size. */
        h->size = (uint32_t)new_size;
        return p;
    }

    void *np = psram_alloc(new_size);
    if (np == NULL) {
        return NULL; /* Old block is left untouched on failure. */
    }
    memcpy(np, p, old_size);
    heap_caps_free(h);
    return np;
}

void lv_mem_monitor_core(lv_mem_monitor_t *mon_p)
{
    if (mon_p == NULL) {
        return;
    }
    memset(mon_p, 0, sizeof(*mon_p));

    multi_heap_info_t info;
    heap_caps_get_info(&info, LV_PSRAM_CAPS);
    if (info.total_free_bytes == 0 && info.total_allocated_bytes == 0) {
        /* Build without PSRAM: report the internal heap that is actually used. */
        heap_caps_get_info(&info, LV_PSRAM_FALLBACK);
    }

    mon_p->total_size = info.total_free_bytes + info.total_allocated_bytes;
    mon_p->free_cnt = info.free_blocks;
    mon_p->free_size = info.total_free_bytes;
    mon_p->free_biggest_size = info.largest_free_block;
    mon_p->used_cnt = info.allocated_blocks;
    if (mon_p->total_size > 0) {
        size_t used = mon_p->total_size - info.total_free_bytes;
        mon_p->used_pct = (uint8_t)(used * 100u / mon_p->total_size);
    }
    if (info.total_free_bytes > 0) {
        mon_p->frag_pct = (uint8_t)(100u - info.largest_free_block * 100u / info.total_free_bytes);
    }
}

lv_result_t lv_mem_test_core(void)
{
    /* The heap_caps allocator is always functional. */
    return LV_RESULT_OK;
}

#endif /* LV_STDLIB_CUSTOM */
