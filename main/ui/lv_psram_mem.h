/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 */
#pragma once

/* Link-time anchor for the custom LVGL allocator (see lv_psram_mem.c).
 * Called once at boot from app_main() so the object that defines
 * lv_mem_init/lv_malloc_core & co. is always pulled from libmain.a. */
void lv_psram_mem_anchor(void);
