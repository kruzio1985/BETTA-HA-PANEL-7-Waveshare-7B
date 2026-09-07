// ============================================================
// Xiaozhi Audio Backend
// ============================================================
//
// Ported from ForgeUI 30_Audio.c (fg_audio_* -> xz_audio_*) for
// the BETTA-HA-PANEL firmware.
//
// Current Hardware Path:
//
// Waveshare ESP32-P4-WIFI6-Touch-LCD-7B
// BSP audio init
// ESP codec device speaker output (ES8311)
//
// ============================================================

#include "xiaozhi_audio.h"
#include "esp_log.h"
#include "esp_err.h"
#include "nvs_flash.h"

#include "bsp/esp32_p4_wifi6_touch_lcd_7b.h"
#include "esp_codec_dev.h"
#include "driver/i2s_std.h"

#include <math.h>
#include <stdint.h>
#include <stdbool.h>

static const char *TAG = "XZ_AUDIO";

/* Default speaker volume. The ES8311 volume register is 0.5 dB/step and the
 * BSP adds ~+3.6 dB of hw-gain compensation, so volume 85 lands around
 * register 0xB7 (~ -3.9 dB), just below the clean 0 dB point (0xBF). That is
 * a clearly louder but still distortion-free default vs. the old 70 (~0xA8).
 * The value is persisted so a reboot no longer drops the volume back down. */
#define XZ_VOLUME_DEFAULT  85
#define XZ_AUDIO_NVS_NS    "xz_audio"
#define XZ_AUDIO_NVS_VOL   "volume"

static esp_codec_dev_handle_t g_speaker = NULL;
static esp_codec_dev_handle_t g_mic = NULL;
static bool g_ready = false;
static bool g_mic_open = false;
static bool g_busy  = false;
static int  g_volume = XZ_VOLUME_DEFAULT;

#define XZ_AUDIO_SAMPLE_RATE 16000
#define XZ_AUDIO_CHANNELS    1
#define XZ_AUDIO_BITS        16
#define DURATION_MS 150
#define FREQ        1000

static int16_t g_beep_buffer[XZ_AUDIO_SAMPLE_RATE * DURATION_MS / 1000];

/*
 * The BSP's internal default is 22050 Hz mono/16-bit. Xiaozhi (and Opus)
 * work best at 16 kHz, so we pass an explicit I2S config. GPIOs come from the
 * BSP header so this stays in sync with the board definition.
 */
static i2s_std_config_t xz_audio_build_i2s_config(void)
{
    i2s_std_config_t cfg = {
        .clk_cfg  = I2S_STD_CLK_DEFAULT_CONFIG(XZ_AUDIO_SAMPLE_RATE),
        .slot_cfg = I2S_STD_PHILIP_SLOT_DEFAULT_CONFIG(I2S_DATA_BIT_WIDTH_16BIT,
                                                       I2S_SLOT_MODE_MONO),
        .gpio_cfg = {
            .mclk = BSP_I2S_MCLK,
            .bclk = BSP_I2S_SCLK,
            .ws   = BSP_I2S_LCLK,
            .dout = BSP_I2S_DOUT,
            .din  = BSP_I2S_DSIN,
            .invert_flags = {
                .mclk_inv = false,
                .bclk_inv = false,
                .ws_inv   = false,
            },
        },
    };
    return cfg;
}

esp_codec_dev_sample_info_t xz_audio_sample_info(void)
{
    esp_codec_dev_sample_info_t fs = {
        .bits_per_sample = XZ_AUDIO_BITS,
        .channel = XZ_AUDIO_CHANNELS,
        .channel_mask = 0,
        .sample_rate = XZ_AUDIO_SAMPLE_RATE,
        .mclk_multiple = 0,
    };
    return fs;
}

/* Mic capture runs in stereo so both physical ES7210 mics (one per I2S
 * slot) are read; the voice client downmixes to mono. */
esp_codec_dev_sample_info_t xz_audio_mic_sample_info(void)
{
    esp_codec_dev_sample_info_t fs = {
        .bits_per_sample = XZ_AUDIO_BITS,
        .channel = XZ_MIC_CHANNELS,
        .channel_mask = 0,
        .sample_rate = XZ_AUDIO_SAMPLE_RATE,
        .mclk_multiple = 0,
    };
    return fs;
}

static void xz_audio_save_volume(void)
{
    nvs_handle_t h;
    if (nvs_open(XZ_AUDIO_NVS_NS, NVS_READWRITE, &h) != ESP_OK) {
        return;
    }
    nvs_set_i32(h, XZ_AUDIO_NVS_VOL, (int32_t)g_volume);
    nvs_commit(h);
    nvs_close(h);
}

static void xz_audio_load_volume(void)
{
    nvs_handle_t h;
    if (nvs_open(XZ_AUDIO_NVS_NS, NVS_READONLY, &h) != ESP_OK) {
        return;
    }
    int32_t v = -1;
    if (nvs_get_i32(h, XZ_AUDIO_NVS_VOL, &v) == ESP_OK && v >= 0 && v <= 100) {
        g_volume = (int)v;
    }
    nvs_close(h);
}

esp_err_t xz_audio_init(void)
{
    if (g_ready) return ESP_OK;

    ESP_LOGI(TAG, "Init audio...");

    xz_audio_load_volume();

    i2s_std_config_t i2s_cfg = xz_audio_build_i2s_config();
    esp_err_t err = bsp_audio_init(&i2s_cfg);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "bsp_audio_init failed: %s", esp_err_to_name(err));
        return err;
    }

    g_speaker = bsp_audio_codec_speaker_init();
    if (!g_speaker) {
        ESP_LOGE(TAG, "Speaker init failed");
        return ESP_FAIL;
    }

    g_mic = bsp_audio_codec_microphone_init();
    if (!g_mic) {
        ESP_LOGE(TAG, "Mic init failed");
        return ESP_FAIL;
    }

    esp_codec_dev_sample_info_t fs = xz_audio_sample_info();

    err = esp_codec_dev_open(g_speaker, &fs);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_codec_dev_open(speaker) failed: %s", esp_err_to_name(err));
        return err;
    }

    err = esp_codec_dev_set_out_vol(g_speaker, g_volume);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "Initial volume set failed: %s", esp_err_to_name(err));
    }

    g_ready = true;
    ESP_LOGI(TAG, "Audio ready (duplex %d Hz / mono / 16-bit)", XZ_AUDIO_SAMPLE_RATE);

    return ESP_OK;
}

esp_err_t xz_audio_set_volume(int volume)
{
    if (volume < 0) volume = 0;
    if (volume > 100) volume = 100;

    g_volume = volume;

    esp_err_t err = xz_audio_init();
    if (err != ESP_OK) return err;

    err = esp_codec_dev_set_out_vol(g_speaker, g_volume);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Volume set failed: %s", esp_err_to_name(err));
    } else {
        ESP_LOGI(TAG, "Volume set: %d%%", g_volume);
        xz_audio_save_volume();
    }

    return err;
}

int xz_audio_get_volume(void)
{
    return g_volume;
}

esp_err_t xz_audio_test_beep(void)
{
    if (g_busy) {
        ESP_LOGW(TAG, "Beep already running");
        return ESP_OK;
    }

    g_busy = true;

    esp_err_t err = xz_audio_init();
    if (err != ESP_OK) {
        g_busy = false;
        return err;
    }

    esp_codec_dev_set_out_vol(g_speaker, g_volume);

    const int samples = XZ_AUDIO_SAMPLE_RATE * DURATION_MS / 1000;

    for (int i = 0; i < samples; i++) {
        float t = (float)i / XZ_AUDIO_SAMPLE_RATE;
        g_beep_buffer[i] = (int16_t)(sinf(2.0f * (float)M_PI * FREQ * t) * 10000);
    }

    err = esp_codec_dev_write(g_speaker, g_beep_buffer, samples * sizeof(int16_t));

    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Write failed: %s", esp_err_to_name(err));
    } else {
        ESP_LOGI(TAG, "BEEP sent at %d%% volume", g_volume);
    }

    g_busy = false;
    return err;
}

esp_err_t xz_audio_open_mic(void)
{
    esp_err_t err = xz_audio_init();
    if (err != ESP_OK) {
        return err;
    }
    if (g_mic_open) {
        return ESP_OK;
    }

    esp_codec_dev_sample_info_t fs = xz_audio_mic_sample_info();
    if (esp_codec_dev_open(g_mic, &fs) != ESP_CODEC_DEV_OK) {
        ESP_LOGE(TAG, "Failed to open mic device");
        return ESP_FAIL;
    }
    g_mic_open = true;
    ESP_LOGI(TAG, "Mic opened: stereo %d ch, %d Hz", XZ_MIC_CHANNELS,
             XZ_AUDIO_SAMPLE_RATE);
    return ESP_OK;
}

esp_err_t xz_audio_close_mic(void)
{
    if (g_mic == NULL || !g_mic_open) {
        return ESP_OK;
    }
    esp_codec_dev_close(g_mic);
    g_mic_open = false;
    return ESP_OK;
}

esp_err_t xz_audio_set_mic_gain(float db)
{
    if (g_mic == NULL) {
        return ESP_ERR_INVALID_STATE;
    }
    int r = esp_codec_dev_set_in_gain(g_mic, db);
    if (r != ESP_CODEC_DEV_OK) {
        ESP_LOGW(TAG, "set_in_gain(%.1f) failed: %d", db, r);
        return ESP_FAIL;
    }
    return ESP_OK;
}

esp_err_t xz_audio_play(const int16_t *pcm, int sample_count)
{
    if (pcm == NULL || sample_count <= 0) {
        return ESP_ERR_INVALID_ARG;
    }
    esp_err_t err = xz_audio_init();
    if (err != ESP_OK) {
        return err;
    }
    int bytes = sample_count * sizeof(int16_t) * XZ_AUDIO_CHANNELS;
    int w = esp_codec_dev_write(g_speaker, (void *)pcm, bytes);
    if (w < 0) {
        ESP_LOGW(TAG, "Speaker write failed: %d", w);
        return ESP_FAIL;
    }
    return ESP_OK;
}

int xz_audio_read(int16_t *pcm, int max_frames)
{
    if (g_mic == NULL || !g_mic_open || pcm == NULL || max_frames <= 0) {
        return -1;
    }
    /* esp_codec_dev_read returns an error code (0 = OK), not a byte count;
     * on success the requested buffer has been filled (interleaved stereo,
     * one frame = one sample per mic). */
    int bytes = max_frames * sizeof(int16_t) * XZ_MIC_CHANNELS;
    int r = esp_codec_dev_read(g_mic, pcm, bytes);
    if (r < 0) {
        return -1;
    }
    return max_frames;
}

esp_codec_dev_handle_t xz_audio_get_speaker(void)
{
    return g_speaker;
}

esp_codec_dev_handle_t xz_audio_get_mic(void)
{
    return g_mic;
}
