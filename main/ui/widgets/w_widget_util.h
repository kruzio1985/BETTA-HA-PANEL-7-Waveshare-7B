/* SPDX-License-Identifier: LicenseRef-FNCL-1.1
 * Copyright (c) 2026 Cpt_Kirk
 *
 * Small shared helpers for the compact HA widget tiles (lock / cover / fan /
 * select / number slider). Kept header-only static-inline so every widget TU
 * gets them without adding a translation unit.
 */
#pragma once

#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#include "lvgl.h"

static inline bool w_hex_digit(char c)
{
    return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
}

static inline int w_hex_nibble(char c)
{
    if (c >= '0' && c <= '9') {
        return c - '0';
    }
    if (c >= 'a' && c <= 'f') {
        return 10 + (c - 'a');
    }
    if (c >= 'A' && c <= 'F') {
        return 10 + (c - 'A');
    }
    return -1;
}

/* Accepts "#RRGGBB", "0xRRGGBB" or "RRGGBB". */
static inline bool w_parse_hex_color(const char *text, lv_color_t *out)
{
    if (text == NULL || out == NULL || text[0] == '\0') {
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
    uint32_t rgb = 0;
    for (int i = 0; i < 6; i++) {
        if (!w_hex_digit(p[i])) {
            return false;
        }
        rgb = (rgb << 4) | (uint32_t)w_hex_nibble(p[i]);
    }
    *out = lv_color_hex(rgb);
    return true;
}

static inline bool w_state_is_unavailable(const char *state_text)
{
    if (state_text == NULL || state_text[0] == '\0') {
        return true;
    }
    return strcmp(state_text, "unavailable") == 0 || strcmp(state_text, "unknown") == 0;
}
