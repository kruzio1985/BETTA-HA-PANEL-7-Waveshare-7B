// ============================================================
// Xiaozhi AI Voice Assistant Client
// ============================================================
//
// Xiaozhi (小智) WebSocket protocol v3 client.
//
// Ported from ForgeUI 70_Xiaozhi.c (fg_xiaozhi_* -> xz_xiaozhi_*)
// for the BETTA-HA-PANEL firmware. Settings come from the BETTA
// runtime_settings snapshot (xz_xiaozhi_init), audio from
// xz_audio_*, and the UI from xz_ui_*.
//
// Architecture / ownership rules (important for deadlock avoidance):
//   - The WebSocket event handler runs on the esp_websocket_client task
//     and NEVER blocks on the mutex. It only writes volatile single-word
//     state, updates the LVGL screen through the (recursive) display
//     lock, and signals the event group.
//   - The connect task owns the WebSocket lifecycle: it is the only place
//     that calls esp_websocket_client_start/stop/destroy.
//   - The capture task owns microphone open/close and the Opus encoder.
//   - The playback task owns the speaker: the event handler decodes Opus
//     into a stream buffer and the playback task drains it via xz_audio_play.
//   - The Opus decoder is created by the event handler and destroyed by the
//     connect task only after esp_websocket_client_stop() has returned.
//
// ============================================================

#include "xiaozhi_client.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/semphr.h"
#include "freertos/stream_buffer.h"
#include "freertos/task.h"

#include "esp_crt_bundle.h"
#include "esp_log.h"
#include "esp_mac.h"
#include "esp_system.h"
#include "esp_websocket_client.h"

#include <math.h>

#include "opus.h"
#include "cJSON.h"

#include "settings/runtime_settings.h"
#include "xiaozhi_activate.h"
#include "xiaozhi_audio.h"
#include "xiaozhi_ui.h"

#define TAG "XZ_CLIENT"

#define XZ_SAMPLE_RATE   16000   /* Pipeline sample rate (mic + speaker)  */
#define XZ_CHANNELS      1

#define CAP_FRAME_SAMPLES   960     /* 60 ms @ 16 kHz (Opus frame)           */
#define OPUS_MAX_PACKET     4000    /* Large enough for a 60 ms Opus frame   */
#define TX_FRAME_SIZE       (OPUS_MAX_PACKET + 4)
#define RX_BUF_SIZE         (16 * 1024)
#define RX_TEXT_SIZE        (4 * 1024)
#define PCM_BUF_SAMPLES     4096
#define PLAYBACK_BUF_SIZE   (16 * 1024)

/* Task stacks: esp-opus is built with USE_ALLOCA, so Opus SILK scratch
 * buffers live on the task stack. Encoding needed ~13 KB, so give both the
 * capture task (opus_encode) and the ws client task (opus_decode runs inside
 * the ws event handler) generous stacks to avoid stack-protection faults. */
#define WS_TASK_STACK           16384
#define XZ_CAP_TASK_STACK       32768
#define WS_BUFFER_SIZE          16384
#define WS_NETWORK_TIMEOUT_MS   10000
#define CONNECT_TIMEOUT_MS      15000
#define CAPTURE_JOIN_TIMEOUT_MS 1000

#define XZ_SESSION_ID_MAX  128
#define XZ_DEVICE_ID_MAX   64
#define XZ_AUTH_MAX        (APP_XIAOZHI_TOKEN_MAX_LEN + 16)

/* Event-group bits */
#define BIT_CONNECTED       BIT0
#define BIT_DISCONNECTED    BIT1
#define BIT_ERROR           BIT2
#define BIT_SERVER_HELLO    BIT3
#define BIT_STOP_SESSION    BIT4

/* ------------------------------------------------------------------ */
/* Shared state                                                        */
/* ------------------------------------------------------------------ */
typedef struct {
    SemaphoreHandle_t mutex;        /* Guards ws/capture_task/connect_task/session_id/decoder */
    EventGroupHandle_t evg;
    SemaphoreHandle_t session_sem;  /* Binary: given after server hello, taken by capture task */
    StreamBufferHandle_t playback;  /* Decoded PCM enqueued by ws handler, played by playback task */

    esp_websocket_client_handle_t ws;
    TaskHandle_t connect_task;
    TaskHandle_t capture_task;

    volatile bool listening;         /* Capture-loop condition */
    volatile bool ws_connected;      /* Set/cleared by the ws handler */
    volatile bool disconnect_requested;
    volatile bool capture_running;   /* Set by capture task while streaming */
    volatile xiaozhi_state_t state;

    char server[APP_XIAOZHI_SERVER_MAX_LEN];
    char device[APP_XIAOZHI_DEVICE_MAX_LEN];
    char token[APP_XIAOZHI_TOKEN_MAX_LEN];

    char session_id[XZ_SESSION_ID_MAX];
    int server_sample_rate;          /* Server OUTPUT rate (default 24000) */
    int server_frame_duration;

    OpusDecoder *decoder;            /* Owned by ws handler; destroyed by connect task */
} xiaozhi_ctx_t;

static xiaozhi_ctx_t s;

/* Server-hello staging area: written only by the ws handler, read by the
 * connect task after xEventGroupWaitBits() provides the memory barrier. */
static char s_hello_session_id[XZ_SESSION_ID_MAX];
static int  s_hello_sample_rate = 24000;
static int  s_hello_frame_duration = 60;

/* File-scope buffers (kept off small task stacks). */
static int16_t  s_pcm_cap[CAP_FRAME_SAMPLES];       /* Mono mic frame for Opus      */
static int16_t  s_pcm_cap_s[CAP_FRAME_SAMPLES * XZ_MIC_CHANNELS]; /* Raw stereo frame */
static int16_t  s_pcm_dec[PCM_BUF_SAMPLES];         /* Opus decode output       */
static int16_t  s_pcm_res[PCM_BUF_SAMPLES];         /* Resampled playback       */
static int16_t  s_pcm_play[PCM_BUF_SAMPLES];        /* Playback task buffer     */
static uint8_t  s_tx_frame[TX_FRAME_SIZE];          /* Outgoing binary frame    */
static uint8_t  s_rx_bin[RX_BUF_SIZE];              /* Incoming binary buffer   */
static size_t   s_rx_bin_len;
static char     s_rx_text[RX_TEXT_SIZE];            /* Incoming text buffer     */
static size_t   s_rx_text_len;

/* ------------------------------------------------------------------ */
/* Bandlimited resampler (polyphase windowed-sinc / Kaiser)            */
/* ------------------------------------------------------------------ */
/* Speaker and mic share one duplex I2S bus, so both must run at 16 kHz
 * while the server TTS is Opus @ 24 kHz (sometimes 8/48 kHz). A naive
 * linear resampler folds 8-12 kHz energy back under 8 kHz, which sounds
 * harsh and produces crackle-like artifacts on sibilants. This kernel
 * removes that spectral aliasing while keeping unity DC gain. */
#define RS_HALF      16                 /* Kernel half-width (input samples) */
#define RS_TAPS       (2 * RS_HALF + 1) /* 33 taps                            */
#define RS_PHASES     64                 /* Polyphase sub-sample resolution    */
#define RS_BETA       8.6f               /* Kaiser window shape parameter      */

static float s_rs_table[RS_PHASES][RS_TAPS];
static int   s_rs_table_rate;           /* rate_in the cached table was built for */

/* ------------------------------------------------------------------ */
/* Forward declarations                                                */
/* ------------------------------------------------------------------ */
static void ws_event_handler(void *arg, esp_event_base_t base, int32_t event_id, void *data);
static void connect_task_fn(void *arg);
static void capture_task_fn(void *arg);
static void playback_task_fn(void *arg);

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
static void set_state(xiaozhi_state_t st)
{
    s.state = st;
}

static esp_err_t send_json(esp_websocket_client_handle_t ws, cJSON *obj)
{
    if (ws == NULL || obj == NULL) {
        return ESP_ERR_INVALID_ARG;
    }
    char *str = cJSON_PrintUnformatted(obj);
    if (str == NULL) {
        return ESP_ERR_NO_MEM;
    }
    int r = esp_websocket_client_send_text(ws, str, (int)strlen(str), pdMS_TO_TICKS(500));
    cJSON_free(str);
    return (r < 0) ? ESP_FAIL : ESP_OK;
}

static esp_err_t send_hello(esp_websocket_client_handle_t ws)
{
    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        return ESP_ERR_NO_MEM;
    }
    cJSON_AddStringToObject(root, "type", "hello");
    cJSON_AddNumberToObject(root, "version", 3);

    cJSON *feat = cJSON_CreateObject();
    cJSON_AddBoolToObject(feat, "mcp", true);
    cJSON_AddItemToObject(root, "features", feat);

    cJSON_AddStringToObject(root, "transport", "websocket");

    cJSON *ap = cJSON_CreateObject();
    cJSON_AddStringToObject(ap, "format", "opus");
    cJSON_AddNumberToObject(ap, "sample_rate", XZ_SAMPLE_RATE);
    cJSON_AddNumberToObject(ap, "channels", XZ_CHANNELS);
    cJSON_AddNumberToObject(ap, "frame_duration", 60);
    cJSON_AddItemToObject(root, "audio_params", ap);

    esp_err_t err = send_json(ws, root);
    cJSON_Delete(root);
    return err;
}

static esp_err_t send_listen_control(esp_websocket_client_handle_t ws,
                                     const char *session_id,
                                     const char *state,
                                     const char *mode)
{
    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        return ESP_ERR_NO_MEM;
    }
    cJSON_AddStringToObject(root, "session_id", session_id != NULL ? session_id : "");
    cJSON_AddStringToObject(root, "type", "listen");
    cJSON_AddStringToObject(root, "state", state);
    if (mode != NULL) {
        cJSON_AddStringToObject(root, "mode", mode);
    }
    esp_err_t err = send_json(ws, root);
    cJSON_Delete(root);
    return err;
}

static esp_err_t send_abort(esp_websocket_client_handle_t ws, const char *session_id)
{
    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        return ESP_ERR_NO_MEM;
    }
    cJSON_AddStringToObject(root, "session_id", session_id != NULL ? session_id : "");
    cJSON_AddStringToObject(root, "type", "abort");
    esp_err_t err = send_json(ws, root);
    cJSON_Delete(root);
    return err;
}

static void build_device_id(char *out, size_t out_len)
{
    if (s.device[0] != '\0') {
        snprintf(out, out_len, "%s", s.device);
        return;
    }

    uint8_t mac[6] = {0};
    if (esp_read_mac(mac, ESP_MAC_BASE) != ESP_OK) {
        snprintf(out, out_len, "esp32p4-panel");
        return;
    }
    snprintf(out, out_len, "%02x:%02x:%02x:%02x:%02x:%02x",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}

/* ------------------------------------------------------------------ */
/* WebSocket event handler (no mutex, no blocking calls)               */
/* ------------------------------------------------------------------ */
static void handle_text_frame(void);
static void handle_binary_frame(size_t frame_len);

static void ws_event_handler(void *arg, esp_event_base_t base, int32_t event_id, void *data)
{
    esp_websocket_client_handle_t ws = (esp_websocket_client_handle_t)arg;
    (void)base;
    esp_websocket_event_data_t *d = (esp_websocket_event_data_t *)data;

    switch (event_id) {
    case WEBSOCKET_EVENT_CONNECTED:
        ESP_LOGI(TAG, "connected");
        s.ws_connected = true;
        xEventGroupSetBits(s.evg, BIT_CONNECTED);
        /* New session: start with an empty on-screen conversation. */
        xz_ui_clear_chat();
        xz_ui_add_chat_message("system", "Polaczono z serwerem Xiaozhi.");
        xz_ui_set_status("Laczenie z serwerem...");
        send_hello(ws);
        break;

    case WEBSOCKET_EVENT_DISCONNECTED:
    case WEBSOCKET_EVENT_CLOSED:
        ESP_LOGW(TAG, "disconnected (event %ld)", (long)event_id);
        s.ws_connected = false;
        xEventGroupSetBits(s.evg, BIT_DISCONNECTED);
        if (s.state == XIAOZHI_STATE_LISTENING || s.state == XIAOZHI_STATE_SPEAKING) {
            set_state(XIAOZHI_STATE_ERROR);
        }
        xz_ui_set_status("Rozlaczono");
        break;

    case WEBSOCKET_EVENT_ERROR:
        ESP_LOGE(TAG, "websocket error");
        s.ws_connected = false;
        xEventGroupSetBits(s.evg, BIT_ERROR);
        set_state(XIAOZHI_STATE_ERROR);
        xz_ui_set_status("Blad polaczenia");
        break;

    case WEBSOCKET_EVENT_DATA:
        if (d->op_code == 0x1) {
            size_t take = (size_t)d->data_len;
            if (take >= RX_TEXT_SIZE) {
                s_rx_text_len = 0;
                break;
            }
            if (s_rx_text_len + take >= RX_TEXT_SIZE) {
                s_rx_text_len = 0;
            }
            memcpy(s_rx_text + s_rx_text_len, d->data_ptr, take);
            s_rx_text_len += take;
            if (d->fin) {
                s_rx_text[s_rx_text_len] = '\0';
                s_rx_text_len = 0;
                handle_text_frame();
            }
        } else if (d->op_code == 0x2) {
            size_t take = (size_t)d->data_len;
            if (take >= RX_BUF_SIZE) {
                s_rx_bin_len = 0;
                break;
            }
            if (s_rx_bin_len + take >= RX_BUF_SIZE) {
                s_rx_bin_len = 0;
            }
            memcpy(s_rx_bin + s_rx_bin_len, d->data_ptr, take);
            s_rx_bin_len += take;
            if (d->fin) {
                size_t len = s_rx_bin_len;
                s_rx_bin_len = 0;
                handle_binary_frame(len);
            }
        }
        break;

    default:
        break;
    }
}

static void parse_server_hello(cJSON *root)
{
    cJSON *transport = cJSON_GetObjectItem(root, "transport");
    if (cJSON_IsString(transport) && strcmp(transport->valuestring, "websocket") != 0) {
        ESP_LOGE(TAG, "unsupported transport: %s", transport->valuestring);
        xEventGroupSetBits(s.evg, BIT_ERROR);
        return;
    }

    const char *sid = "";
    cJSON *j_sid = cJSON_GetObjectItem(root, "session_id");
    if (cJSON_IsString(j_sid)) {
        sid = j_sid->valuestring;
    }

    int rate = 24000;
    int dur = 60;
    cJSON *ap = cJSON_GetObjectItem(root, "audio_params");
    if (cJSON_IsObject(ap)) {
        cJSON *j_rate = cJSON_GetObjectItem(ap, "sample_rate");
        if (cJSON_IsNumber(j_rate)) {
            rate = j_rate->valueint;
        }
        cJSON *j_dur = cJSON_GetObjectItem(ap, "frame_duration");
        if (cJSON_IsNumber(j_dur)) {
            dur = j_dur->valueint;
        }
    }

    strncpy(s_hello_session_id, sid, sizeof(s_hello_session_id) - 1);
    s_hello_session_id[sizeof(s_hello_session_id) - 1] = '\0';
    s_hello_sample_rate = rate;
    s_hello_frame_duration = dur;

    xEventGroupSetBits(s.evg, BIT_SERVER_HELLO);
}

static void handle_text_frame(void)
{
    const char *text = s_rx_text;
    cJSON *root = cJSON_Parse(text);
    if (root == NULL) {
        return;
    }

    cJSON *type = cJSON_GetObjectItem(root, "type");
    if (!cJSON_IsString(type)) {
        cJSON_Delete(root);
        return;
    }
    ESP_LOGI(TAG, "recv text: type=%s", type->valuestring);

    if (strcmp(type->valuestring, "hello") == 0) {
        parse_server_hello(root);
    } else if (strcmp(type->valuestring, "stt") == 0) {
        cJSON *j_text = cJSON_GetObjectItem(root, "text");
        if (cJSON_IsString(j_text)) {
            xz_ui_set_transcript(j_text->valuestring);
        }
    } else if (strcmp(type->valuestring, "tts") == 0) {
        cJSON *j_state = cJSON_GetObjectItem(root, "state");
        cJSON *j_text = cJSON_GetObjectItem(root, "text");
        if (cJSON_IsString(j_state)) {
            if (strcmp(j_state->valuestring, "start") == 0 ||
                strcmp(j_state->valuestring, "sentence_start") == 0) {
                set_state(XIAOZHI_STATE_SPEAKING);
                xz_ui_set_status("Odpowiedz...");
                if (cJSON_IsString(j_text)) {
                    xz_ui_set_response(j_text->valuestring);
                }
            } else if (strcmp(j_state->valuestring, "stop") == 0) {
                if (s.listening) {
                    set_state(XIAOZHI_STATE_LISTENING);
                } else {
                    set_state(XIAOZHI_STATE_CONNECTED);
                }
                xz_ui_set_status(s.listening ? "Sluchanie..." : "Gotowy");
            }
        }
    } else if (strcmp(type->valuestring, "llm") == 0) {
        /* Informational only for V1 */
    } else if (strcmp(type->valuestring, "mcp") == 0) {
        /* MCP tool payloads are not handled in V1 */
    } else if (strcmp(type->valuestring, "system") == 0) {
        cJSON *j_cmd = cJSON_GetObjectItem(root, "command");
        if (cJSON_IsString(j_cmd) && strcmp(j_cmd->valuestring, "reboot") == 0) {
            ESP_LOGW(TAG, "server requested reboot");
            xz_ui_set_status("Restart...");
        }
    }

    cJSON_Delete(root);
}

static float rs_bessel_i0(float x)
{
    float s = 1.0f, term = 1.0f;
    float x2 = x * x / 4.0f;
    for (int k = 1; k < 40; k++) {
        term *= x2 / ((float)(k * k));
        s += term;
        if (term < 1e-14f) {
            break;
        }
    }
    return s;
}

static void rs_build_table(int rate_in)
{
    const float pi = 3.14159265358979f;
    float ratio = (float)XZ_SAMPLE_RATE / (float)rate_in;
    /* Cutoff (cycles/sample of the input): 90 % of the Nyquist of the
     * lower of the in/out rate. No aliasing on downsampling, and the
     * table rebuild is cached per rate_in so this runs only once. */
    float cutoff = 0.5f * (ratio < 1.0f ? ratio : 1.0f) * 0.90f;

    for (int q = 0; q < RS_PHASES; q++) {
        float frac = (float)q / (float)RS_PHASES;
        float sum = 0.0f;
        for (int j = -RS_HALF; j <= RS_HALF; j++) {
            float x = (float)j - frac;
            float ax = x / (float)RS_HALF;
            float w = rs_bessel_i0(RS_BETA * sqrtf(fmaxf(0.0f, 1.0f - ax * ax)));
            float arg = 2.0f * cutoff * x;
            float s = (arg == 0.0f) ? 1.0f : sinf(pi * arg) / (pi * arg);
            float h = (2.0f * cutoff) * s * w;
            s_rs_table[q][j + RS_HALF] = h;
            sum += h;
        }
        /* Row normalization for exact unity DC gain (Kaiser scale cancels). */
        if (sum != 0.0f) {
            for (int t = 0; t < RS_TAPS; t++) {
                s_rs_table[q][t] /= sum;
            }
        }
    }
    s_rs_table_rate = rate_in;
}

static int resample_bandlimited(const int16_t *in, int in_samples, int rate_in,
                                int16_t *out, int out_cap)
{
    if (rate_in <= 0 || in_samples <= 0) {
        return 0;
    }
    if (rate_in == XZ_SAMPLE_RATE) {
        int n = in_samples < out_cap ? in_samples : out_cap;
        memcpy(out, in, (size_t)n * sizeof(int16_t));
        return n;
    }
    if (s_rs_table_rate != rate_in) {
        rs_build_table(rate_in);
    }

    double ratio = (double)XZ_SAMPLE_RATE / (double)rate_in;
    int out_samples = (int)((double)in_samples * ratio);
    if (out_samples > out_cap) {
        out_samples = out_cap;
    }

    for (int i = 0; i < out_samples; i++) {
        double p = (double)i / ratio;
        int c = (int)p;
        int q = (int)((p - (double)c) * (double)RS_PHASES + 0.5);
        if (q >= RS_PHASES) {
            q = RS_PHASES - 1;
        }
        const float *row = s_rs_table[q];
        float acc = 0.0f;
        for (int j = -RS_HALF; j <= RS_HALF; j++) {
            int idx = c + j;
            if (idx < 0) {
                idx = 0;
            } else if (idx >= in_samples) {
                idx = in_samples - 1;
            }
            acc += (float)in[idx] * row[j + RS_HALF];
        }
        if (acc > 32767.0f) acc = 32767.0f;
        if (acc < -32768.0f) acc = -32768.0f;
        out[i] = (int16_t)acc;
    }
    return out_samples;
}

/* ------------------------------------------------------------------ */
/* Digital soft limiter (headroom ceiling)                             */
/* ------------------------------------------------------------------ */
/* Xiaozhi TTS is normalised hot (peaks near full scale). Feeding a
 * near-0 dBFS ceiling to the codec at high volume slightly over-drives
 * the analogue power amp: the -10 dBFS test beep stays clean at vol 85,
 * so the analogue path is fine, only near-full-scale content misbehaves.
 * Keep the digital signal perfectly linear (unity gain, no added THD)
 * below the -6 dBFS knee and softly round anything above it toward a
 * ~-3 dBFS asymptote, so the PA never sees 0 dBFS content and cannot
 * square the waveform. Below the knee the transfer is exactly identity,
 * so normal speech passes through untouched. */
#define XZ_LIM_THRESH  0.500f   /* -6.0 dBFS knee; below this: unity gain   */
#define XZ_LIM_CEIL    0.707f   /* -3.0 dBFS asymptote (real peak ~ -3.5)   */
static void xz_pcm_soft_limit(int16_t *pcm, int n)
{
    const float inv_fs = 1.0f / 32768.0f;
    const float d = XZ_LIM_CEIL - XZ_LIM_THRESH;
    for (int i = 0; i < n; i++) {
        float x = (float)pcm[i] * inv_fs;
        float ax = fabsf(x);
        if (ax > XZ_LIM_THRESH) {
            /* C1-continuous soft knee: slope 1 at the knee, asymptote C. */
            ax = XZ_LIM_CEIL - d * expf(-(ax - XZ_LIM_THRESH) / d);
            x = copysignf(ax, x);
        }
        pcm[i] = (int16_t)(x * 32767.0f);
    }
}

/* ------------------------------------------------------------------ */
/* Peak meter (diagnostic)                                             */
/* ------------------------------------------------------------------ */
/* Logs decoded vs post-limiter peaks in dBFS so hot TTS levels can be
 * verified from the monitor instead of guessed. */
static float g_pk_dec = 0.0f;
static float g_pk_out = 0.0f;
static int   g_pk_cnt = 0;

static void xz_track_peaks(const int16_t *dec, int n_dec,
                           const int16_t *out, int n_out)
{
    for (int i = 0; i < n_dec; i++) {
        float a = fabsf((float)dec[i]);
        if (a > g_pk_dec) {
            g_pk_dec = a;
        }
    }
    for (int i = 0; i < n_out; i++) {
        float a = fabsf((float)out[i]);
        if (a > g_pk_out) {
            g_pk_out = a;
        }
    }
    if (++g_pk_cnt < 120) {
        return;
    }
    ESP_LOGI(TAG, "Pk: dec %.1f dBFS -> out %.1f dBFS",
             20.0f * log10f(g_pk_dec / 32768.0f + 1e-9f),
             20.0f * log10f(g_pk_out / 32768.0f + 1e-9f));
    g_pk_dec = g_pk_out = 0.0f;
    g_pk_cnt = 0;
}

static void handle_binary_frame(size_t frame_len)
{
    if (frame_len < 4) {
        return;
    }
    uint16_t payload_size = (uint16_t)((s_rx_bin[2] << 8) | s_rx_bin[3]);
    if (frame_len < 4 + (size_t)payload_size) {
        ESP_LOGW(TAG, "short binary frame: %u > %u", 4 + payload_size, (unsigned)frame_len);
        return;
    }

    /* Lazy decoder creation. Safe: the ws handler is the only creator and
     * the connect task only destroys it after esp_websocket_client_stop()
     * has fully stopped, so no lock is needed here. */
    if (s.decoder == NULL) {
        int err = 0;
        int rate = s.server_sample_rate > 0 ? s.server_sample_rate : XZ_SAMPLE_RATE;
        s.decoder = opus_decoder_create(rate, 1, &err);
        if (s.decoder == NULL || err != OPUS_OK) {
            ESP_LOGE(TAG, "opus_decoder_create failed: %d", err);
            s.decoder = NULL;
            return;
        }
    }

    int decoded = opus_decode(s.decoder, s_rx_bin + 4, payload_size,
                              s_pcm_dec, PCM_BUF_SAMPLES, 0);
    if (decoded < 0) {
        ESP_LOGW(TAG, "opus_decode failed: %d", decoded);
        return;
    }
    if (decoded == 0) {
        return;
    }

    int out_samples = resample_bandlimited(s_pcm_dec, decoded,
                                           s.server_sample_rate > 0 ? s.server_sample_rate : XZ_SAMPLE_RATE,
                                           s_pcm_res, PCM_BUF_SAMPLES);
    if (out_samples <= 0) {
        return;
    }

    /* Keep hot TTS peaks below the analogue PA's clean headroom (see
     * limiter) and log the resulting levels for tuning. */
    xz_pcm_soft_limit(s_pcm_res, out_samples);
    xz_track_peaks(s_pcm_dec, decoded, s_pcm_res, out_samples);

    set_state(XIAOZHI_STATE_SPEAKING);

    size_t bytes = (size_t)out_samples * sizeof(int16_t);
    size_t sent = xStreamBufferSend(s.playback, s_pcm_res, bytes, pdMS_TO_TICKS(1000));
    if (sent != bytes) {
        ESP_LOGW(TAG, "playback stream overflow: %u/%u", (unsigned)sent, (unsigned)bytes);
    }
}

/* ------------------------------------------------------------------ */
/* Playback task                                                       */
/* ------------------------------------------------------------------ */
static void playback_task_fn(void *arg)
{
    (void)arg;
    for (;;) {
        size_t got = xStreamBufferReceive(s.playback, s_pcm_play,
                                          sizeof(s_pcm_play), portMAX_DELAY);
        if (got > 0) {
            xz_audio_play(s_pcm_play, (int)(got / sizeof(int16_t)));
        }
    }
}

/* ------------------------------------------------------------------ */
/* Capture task                                                        */
/* ------------------------------------------------------------------ */
static void capture_task_exit(void)
{
    xSemaphoreTake(s.mutex, portMAX_DELAY);
    s.capture_task = NULL;
    s.capture_running = false;
    xSemaphoreGive(s.mutex);
    vTaskDelete(NULL);
}

static void capture_task_fn(void *arg)
{
    (void)arg;
    s.capture_running = true;

    /* Wait until the connect task has completed the handshake. */
    if (xSemaphoreTake(s.session_sem, pdMS_TO_TICKS(CONNECT_TIMEOUT_MS)) != pdTRUE) {
        ESP_LOGW(TAG, "capture: timed out waiting for session");
        set_state(XIAOZHI_STATE_ERROR);
        xz_ui_set_status("Brak polaczenia");
        capture_task_exit();
        return;
    }
    /* Keep the latch full so a later capture session (same ws connection)
     * can also proceed immediately. */
    xSemaphoreGive(s.session_sem);

    esp_websocket_client_handle_t ws = NULL;
    char session_id[XZ_SESSION_ID_MAX];

    xSemaphoreTake(s.mutex, portMAX_DELAY);
    ws = s.ws;
    strncpy(session_id, s.session_id, sizeof(session_id) - 1);
    session_id[sizeof(session_id) - 1] = '\0';
    xSemaphoreGive(s.mutex);

    if (ws == NULL) {
        capture_task_exit();
        return;
    }

    if (xz_audio_open_mic() != ESP_OK) {
        ESP_LOGE(TAG, "failed to open mic");
        xz_ui_set_status("Blad mikrofonu");
        set_state(XIAOZHI_STATE_ERROR);
        capture_task_exit();
        return;
    }

    int enc_err = OPUS_OK;
    OpusEncoder *enc = opus_encoder_create(XZ_SAMPLE_RATE,
                                           XZ_CHANNELS,
                                           OPUS_APPLICATION_VOIP, &enc_err);
    if (enc == NULL || enc_err != OPUS_OK) {
        ESP_LOGE(TAG, "opus_encoder_create failed: %d", enc_err);
        xz_audio_close_mic();
        xz_ui_set_status("Blad kodera");
        set_state(XIAOZHI_STATE_ERROR);
        capture_task_exit();
        return;
    }
    opus_encoder_ctl(enc, OPUS_SET_BITRATE(16000));

    set_state(XIAOZHI_STATE_LISTENING);
    xz_ui_set_listening(true);
    send_listen_control(ws, session_id, "start", "manual");

    int diag = 0;
    while (s.listening && s.ws_connected) {
        int have = 0;
        while (have < CAP_FRAME_SAMPLES && s.listening && s.ws_connected) {
            int n = xz_audio_read(s_pcm_cap_s + (size_t)have * XZ_MIC_CHANNELS,
                                  CAP_FRAME_SAMPLES - have);
            if (n < 0) {
                have = -1;
                break;
            }
            if (n > 0) {
                have += n;
            }
        }
        if (have < CAP_FRAME_SAMPLES) {
            break; /* Mic error or session stopped */
        }

        /* Downmix the interleaved stereo frame (one sample per physical mic)
         * to mono for Opus, tracking per-channel levels. */
        int32_t peak_l = 0, peak_r = 0;
        int64_t sum_l = 0, sum_r = 0;
        for (int i = 0; i < CAP_FRAME_SAMPLES; i++) {
            int32_t l = s_pcm_cap_s[i * XZ_MIC_CHANNELS + 0];
            int32_t r = s_pcm_cap_s[i * XZ_MIC_CHANNELS + 1];
            s_pcm_cap[i] = (int16_t)((l + r) >> 1);
            int32_t al = l < 0 ? -l : l;
            int32_t ar = r < 0 ? -r : r;
            if (al > peak_l) peak_l = al;
            if (ar > peak_r) peak_r = ar;
            sum_l += (int64_t)l * l;
            sum_r += (int64_t)r * r;
        }

        /* Report levels every ~0.5 s so a dead mic slot is obvious. */
        if ((++diag % 8) == 0) {
            int rms_l = (int)sqrtf((float)sum_l / CAP_FRAME_SAMPLES);
            int rms_r = (int)sqrtf((float)sum_r / CAP_FRAME_SAMPLES);
            ESP_LOGI(TAG, "mic L peak=%d rms=%d | R peak=%d rms=%d | cap_stack_hwm=%u",
                     (int)peak_l, rms_l, (int)peak_r, rms_r,
                     (unsigned)uxTaskGetStackHighWaterMark(NULL));
        }

        int enc_len = opus_encode(enc, s_pcm_cap, CAP_FRAME_SAMPLES,
                                  s_tx_frame + 4, OPUS_MAX_PACKET);
        if (enc_len < 0) {
            ESP_LOGW(TAG, "opus_encode failed: %d", enc_len);
            continue;
        }

        s_tx_frame[0] = 0x00; /* type = audio */
        s_tx_frame[1] = 0x00;
        s_tx_frame[2] = (uint8_t)((enc_len >> 8) & 0xFF);
        s_tx_frame[3] = (uint8_t)(enc_len & 0xFF);

        int sent = esp_websocket_client_send_bin(ws, (const char *)s_tx_frame,
                                                 enc_len + 4, pdMS_TO_TICKS(500));
        if (sent < 0) {
            ESP_LOGW(TAG, "send_bin failed: %d", sent);
            break;
        }
    }

    if (s.ws_connected) {
        send_listen_control(ws, session_id, "stop", NULL);
    }

    xz_ui_set_listening(false);
    if (s.state == XIAOZHI_STATE_LISTENING) {
        set_state(XIAOZHI_STATE_CONNECTED);
    }

    opus_encoder_destroy(enc);
    xz_audio_close_mic();
    capture_task_exit();
}

/* ------------------------------------------------------------------ */
/* Connect task — owns WebSocket create/start/stop/destroy             */
/* ------------------------------------------------------------------ */
static void connect_task_fn(void *arg)
{
    (void)arg;

    /* Drain stale session readiness from any previous connection. */
    xSemaphoreTake(s.session_sem, 0);
    xEventGroupClearBits(s.evg, BIT_CONNECTED | BIT_DISCONNECTED | BIT_ERROR |
                                BIT_SERVER_HELLO | BIT_STOP_SESSION);

    if (s.server[0] == '\0' || s.token[0] == '\0') {
        ESP_LOGE(TAG, "xiaozhi not configured");
        set_state(XIAOZHI_STATE_ERROR);
        xz_ui_set_status("Nie skonfigurowano");
        goto exit_connect_task;
    }

    char device_id[XZ_DEVICE_ID_MAX];
    build_device_id(device_id, sizeof(device_id));

    char client_id[40] = {0};
    if (xz_ident_get_uuid(client_id, sizeof(client_id)) != ESP_OK || client_id[0] == '\0') {
        strlcpy(client_id, device_id, sizeof(client_id));
    }

    esp_websocket_client_config_t ws_cfg = {
        .uri = s.server,
        .disable_auto_reconnect = true,
        .task_stack = WS_TASK_STACK,
        .buffer_size = WS_BUFFER_SIZE,
        .network_timeout_ms = WS_NETWORK_TIMEOUT_MS,
        .crt_bundle_attach = esp_crt_bundle_attach,
    };

    esp_websocket_client_handle_t ws = esp_websocket_client_init(&ws_cfg);
    if (ws == NULL) {
        ESP_LOGE(TAG, "esp_websocket_client_init failed");
        set_state(XIAOZHI_STATE_ERROR);
        xz_ui_set_status("Blad init");
        goto exit_connect_task;
    }

    esp_websocket_register_events(ws, WEBSOCKET_EVENT_ANY, ws_event_handler, ws);

    /* Authorization: Xiaozhi expects the raw token when it contains a space,
     * otherwise a "Bearer " prefix. */
    if (s.token[0] != '\0') {
        char auth[XZ_AUTH_MAX];
        if (strchr(s.token, ' ') != NULL) {
            snprintf(auth, sizeof(auth), "%s", s.token);
        } else {
            snprintf(auth, sizeof(auth), "Bearer %s", s.token);
        }
        esp_websocket_client_append_header(ws, "Authorization", auth);
    }
    esp_websocket_client_append_header(ws, "Protocol-Version", "3");
    esp_websocket_client_append_header(ws, "Device-Id", device_id);
    esp_websocket_client_append_header(ws, "Client-Id", client_id);

    xSemaphoreTake(s.mutex, portMAX_DELAY);
    s.ws = ws;
    xSemaphoreGive(s.mutex);

    set_state(XIAOZHI_STATE_CONNECTING);

    if (esp_websocket_client_start(ws) != ESP_OK) {
        ESP_LOGE(TAG, "esp_websocket_client_start failed");
        xSemaphoreTake(s.mutex, portMAX_DELAY);
        s.ws = NULL;
        xSemaphoreGive(s.mutex);
        esp_websocket_client_destroy(ws);
        set_state(XIAOZHI_STATE_ERROR);
        xz_ui_set_status("Blad startu");
        goto exit_connect_task;
    }

    EventBits_t bits = xEventGroupWaitBits(s.evg,
                                           BIT_SERVER_HELLO | BIT_DISCONNECTED | BIT_ERROR,
                                           pdFALSE, pdFALSE, pdMS_TO_TICKS(CONNECT_TIMEOUT_MS));
    if (bits & BIT_SERVER_HELLO) {
        xSemaphoreTake(s.mutex, portMAX_DELAY);
        strncpy(s.session_id, s_hello_session_id, sizeof(s.session_id) - 1);
        s.session_id[sizeof(s.session_id) - 1] = '\0';
        s.server_sample_rate = s_hello_sample_rate;
        s.server_frame_duration = s_hello_frame_duration;
        xSemaphoreGive(s.mutex);

        set_state(XIAOZHI_STATE_CONNECTED);
        xz_ui_set_status("Gotowy — dotknij i mow");
        xz_ui_add_chat_message("system", "Gotowy. Dotknij mikrofonu i mow.");
        ESP_LOGI(TAG, "session ready: %s (server rate %d Hz)",
                 s.session_id, s.server_sample_rate);

        /* Release the capture task (if it is already waiting). */
        xSemaphoreGive(s.session_sem);

        /* Wait until the session ends or a disconnect is requested. */
        xEventGroupWaitBits(s.evg, BIT_DISCONNECTED | BIT_ERROR | BIT_STOP_SESSION,
                            pdFALSE, pdFALSE, portMAX_DELAY);
    } else {
        ESP_LOGW(TAG, "handshake failed (bits=0x%lx)", (unsigned long)bits);
        set_state(XIAOZHI_STATE_ERROR);
        xz_ui_set_status("Nie udalo sie polaczyc");
        xSemaphoreTake(s.mutex, portMAX_DELAY);
        s.ws = NULL;
        xSemaphoreGive(s.mutex);
        xSemaphoreGive(s.session_sem);
    }

    /* Teardown: stop capture first, then stop/destroy the ws client. */
    bool was_disconnect = s.disconnect_requested;
    s.listening = false;
    s.disconnect_requested = false;

    TaskHandle_t cap = NULL;
    xSemaphoreTake(s.mutex, portMAX_DELAY);
    cap = s.capture_task;
    xSemaphoreGive(s.mutex);

    if (cap != NULL) {
        int waited = 0;
        while (s.capture_running && waited < CAPTURE_JOIN_TIMEOUT_MS) {
            vTaskDelay(pdMS_TO_TICKS(10));
            waited += 10;
        }
        if (s.capture_running) {
            ESP_LOGW(TAG, "capture task did not stop in time");
        }
    }

    esp_websocket_client_stop(ws);
    esp_websocket_client_destroy(ws);

    xSemaphoreTake(s.mutex, portMAX_DELAY);
    s.ws = NULL;
    s.session_id[0] = '\0';
    if (s.decoder != NULL) {
        opus_decoder_destroy(s.decoder);
        s.decoder = NULL;
    }
    xSemaphoreGive(s.mutex);

    set_state(was_disconnect ? XIAOZHI_STATE_IDLE : XIAOZHI_STATE_ERROR);

exit_connect_task:
    xSemaphoreTake(s.mutex, portMAX_DELAY);
    s.connect_task = NULL;
    xSemaphoreGive(s.mutex);
    vTaskDelete(NULL);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */
esp_err_t xz_xiaozhi_init(const xiaozhi_config_t *cfg)
{
    if (s.mutex != NULL) {
        return ESP_OK; /* Already initialized */
    }

    s.mutex = xSemaphoreCreateMutex();
    s.evg = xEventGroupCreate();
    s.session_sem = xSemaphoreCreateBinary();
    s.playback = xStreamBufferCreate(PLAYBACK_BUF_SIZE, 1);

    if (s.mutex == NULL || s.evg == NULL || s.session_sem == NULL || s.playback == NULL) {
        ESP_LOGE(TAG, "failed to allocate primitives");
        return ESP_ERR_NO_MEM;
    }

    s.server[0] = '\0';
    s.device[0] = '\0';
    s.token[0] = '\0';
    if (cfg != NULL) {
        if (cfg->server != NULL) {
            strlcpy(s.server, cfg->server, sizeof(s.server));
        }
        if (cfg->device != NULL) {
            strlcpy(s.device, cfg->device, sizeof(s.device));
        }
        if (cfg->token != NULL) {
            strlcpy(s.token, cfg->token, sizeof(s.token));
        }
    }

    set_state(XIAOZHI_STATE_IDLE);

    BaseType_t ok = xTaskCreate(playback_task_fn, "xiaozhi_play",
                                4096, NULL, 5, NULL);
    if (ok != pdPASS) {
        ESP_LOGE(TAG, "failed to create playback task");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "initialized");
    return ESP_OK;
}

bool xz_xiaozhi_configured(void)
{
    /* A non-empty token is enough: the cloud authorizes each connection by the
     * Device-Id header and may hand back "test-token" even once the device is
     * bound, so it must not block readiness. */
    return s.server[0] != '\0' && s.token[0] != '\0';
}

void xz_xiaozhi_set_config(const xiaozhi_config_t *cfg)
{
    if (cfg == NULL) {
        return;
    }

    xSemaphoreTake(s.mutex, portMAX_DELAY);
    if (cfg->server != NULL) {
        strlcpy(s.server, cfg->server, sizeof(s.server));
    }
    if (cfg->device != NULL) {
        strlcpy(s.device, cfg->device, sizeof(s.device));
    }
    if (cfg->token != NULL) {
        strlcpy(s.token, cfg->token, sizeof(s.token));
    }
    xSemaphoreGive(s.mutex);

    ESP_LOGI(TAG, "config updated (server=%s)", s.server);
}

static esp_err_t ensure_connect_task(void)
{
    xSemaphoreTake(s.mutex, portMAX_DELAY);
    if (s.ws == NULL && s.connect_task == NULL) {
        xSemaphoreTake(s.session_sem, 0);
        BaseType_t ok = xTaskCreate(connect_task_fn, "xiaozhi_conn",
                                    8192, NULL, 5, &s.connect_task);
        if (ok != pdPASS) {
            xSemaphoreGive(s.mutex);
            ESP_LOGE(TAG, "failed to create connect task");
            return ESP_FAIL;
        }
    }
    xSemaphoreGive(s.mutex);
    return ESP_OK;
}

static esp_err_t ensure_capture_task(void)
{
    xSemaphoreTake(s.mutex, portMAX_DELAY);
    if (s.capture_task == NULL) {
        BaseType_t ok = xTaskCreate(capture_task_fn, "xiaozhi_cap",
                                    XZ_CAP_TASK_STACK, NULL, 6, &s.capture_task);
        if (ok != pdPASS) {
            xSemaphoreGive(s.mutex);
            ESP_LOGE(TAG, "failed to create capture task");
            return ESP_FAIL;
        }
    }
    xSemaphoreGive(s.mutex);
    return ESP_OK;
}

esp_err_t xz_xiaozhi_start_listening(void)
{
    if (s.server[0] == '\0' || s.token[0] == '\0') {
        set_state(XIAOZHI_STATE_ERROR);
        xz_ui_set_status("Nie skonfigurowano Xiaozhi");
        return ESP_ERR_INVALID_STATE;
    }

    s.disconnect_requested = false;
    s.listening = true;

    esp_err_t err = ensure_connect_task();
    if (err != ESP_OK) {
        s.listening = false;
        return err;
    }
    err = ensure_capture_task();
    if (err != ESP_OK) {
        s.listening = false;
        return err;
    }
    return ESP_OK;
}

esp_err_t xz_xiaozhi_stop_listening(void)
{
    s.listening = false;
    xz_ui_set_listening(false);
    return ESP_OK;
}

esp_err_t xz_xiaozhi_abort_speaking(void)
{
    xStreamBufferReset(s.playback);

    esp_websocket_client_handle_t ws = NULL;
    char session_id[XZ_SESSION_ID_MAX];

    xSemaphoreTake(s.mutex, portMAX_DELAY);
    ws = s.ws;
    strncpy(session_id, s.session_id, sizeof(session_id) - 1);
    session_id[sizeof(session_id) - 1] = '\0';
    xSemaphoreGive(s.mutex);

    if (ws != NULL && session_id[0] != '\0') {
        send_abort(ws, session_id);
    }
    return ESP_OK;
}

esp_err_t xz_xiaozhi_disconnect(void)
{
    s.disconnect_requested = true;
    s.listening = false;
    xEventGroupSetBits(s.evg, BIT_STOP_SESSION);
    xz_ui_set_status("Rozlaczanie...");
    return ESP_OK;
}

xiaozhi_state_t xz_xiaozhi_get_state(void)
{
    return (xiaozhi_state_t)s.state;
}
