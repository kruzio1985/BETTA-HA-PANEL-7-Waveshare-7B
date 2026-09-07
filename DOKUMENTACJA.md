# BETTA-HA-PANEL 7B — Dokumentacja projektu / Project documentation

**Wersja / Version:** v0.8.2-7b (wariant / variant `panel7`)
**Baza / Base:** [BETTA-HA-PANEL v0.8.2](https://github.com/cptkirki/BETTA-HA-PANEL) — autor / author: **Cpt_Kirk (Chris)**
**Licencja / License:** [LicenseRef-FNCL-1.1](LICENSE) (Federation Non-Commercial License)

> Niniejszy dokument opisuje cały firmware wraz z pełnym przypisaniem źródeł (które pliki pochodzą
> z oryginalnego projektu BETTA-HA-PANEL, a które zostały dodane/zmienione w naszym forku).
>
> This document describes the whole firmware with full source attribution (which files come from
> the original BETTA-HA-PANEL project and which were added/changed in our fork).

---

# CZĘŚĆ I — POLSKI

## 1. Pochodzenie projektu (atrybucja)

Nasz firmware **nie jest projektem napisanym od zera** — jest zbudowany na otwartym projekcie:

- **Projekt bazowy:** BETTA-HA-PANEL (repozytorium: <https://github.com/cptkirki/BETTA-HA-PANEL>)
- **Autor oryginału:** Cpt_Kirk (Chris)
- **Licencja oryginału:** LicenseRef-FNCL-1.1 — Federation Non-Commercial License
  (użycie wyłącznie niekomercyjne; wymagane zachowanie licencji i oznaczenie zmian)
- **Wersja bazowa:** v0.8.2 (commit upstream `420df76`)
- **Nasz fork:** commit `6fd025e` „Add ESP32-P4 7B panel support, Xiaozhi AI, HA cameras,
  web log monitor, screen power" (+ nasze późniejsze poprawki stabilności opisane w rozdziale 7)

Zgodnie z licencją FNCL-1.1 zachowujemy oryginalny plik [LICENSE](LICENSE), oryginalny
[README.UPSTREAM.md](README.UPSTREAM.md) oraz oznaczenie autorstwa we wszystkich plikach źródłowych
(nagłówki `Copyright (c) 2026 Cpt_Kirk` + SPDX).

### Co jest oryginałem, a co naszym dodatkiem

| Zakres | Pochodzenie |
|---|---|
| Silnik dashboardu, edytor web, silnik widgetów, integracja HA (WebSocket + REST), OTA, motywy, wielojęzyczność, provisioning Wi-Fi `BETTA-Setup`, ESP-Hosted (Wi-Fi przez ESP32-C6) | **Oryginał BETTA-HA-PANEL v0.8.2 (Cpt_Kirk)** |
| Wsparcie panelu 7" (`panel7`), asystent głosowy **Xiaozhi**, kamery HA, monitor logów w przeglądarce, wygaszanie ekranu + tryb nocny, 7 nowych widgetów, LVGL w PSRAM, font Poppins, poprawka boot-loopa HTTP, przeprojektowany interfejs web | **Nasz fork** (commit `6fd025e`) |
| 4 poprawki stabilności: watchdog UI, restart co 24 h, eviction kolejki zdarzeń, koalescencja zdarzeń HA (fix „zapychania" przez czujniki Zigbee) | **Nasz fork** (bieżąca sesja, 2026-09-07) |

---

## 2. Sprzęt docelowy

| Parametr | Wartość |
|---|---|
| Płytka | Waveshare **ESP32-P4-WIFI6-Touch-LCD-7B** |
| Wyświetlacz | 7" 1024 × 600, MIPI-DSI, kontroler **EK79007** |
| Dotyk | pojemnościowy **GT911** (do 5 punktów) |
| CPU | Espressif **ESP32-P4** (rev v1.x, < 3.0) |
| Wi-Fi | przez koprocesor **ESP32-C6** (SDIO / ESP-Hosted) |
| Pamięć | 32 MB flash, PSRAM |
| Audio | wbudowany **mikrofon i głośnik** |
| Peryferia | slot karty **microSD** |
| SDK | ESP-IDF **v5.5.x** (budowane w 5.5.5) |
| Wariant budowy | `panel7` (`CONFIG_APP_PANEL_VARIANT_7INCH_1024`) |

---

## 3. Funkcje (co potrafi firmware)

### 3.1 Panel Home Assistant
- Połączenie z HA przez **WebSocket** (nasłuch zmian stanu) z fallbackiem **REST**
  (prognoza pogody, long-poll stanów).
- Do 256 encji i 256 stanów w modelu, do 6 stron, do 32 widgetów na stronę.
- Edytor w przeglądarce pod adresem `http://<ip-panelu>` — budowanie dashboardu bez
  edycji YAML i bez przebudowy firmware (przeciągnij-i-upuść, multi-strona, wybór encji
  pogrupowany po pokojach).
- **Widżety:** sensor, przycisk, suwak, wykres, światło, ogrzewanie, pogoda (prognoza do
  5 dni), lista zadań (todo), odtwarzacz multimediów, Roborock (odkurzacz), panel energii,
  pusty kafelek + (nasze) binary sensor, roleta (cover), zamek (lock), wentylator (fan),
  liczba (number), obecność (presence), lista wyboru (select).
- **Światło zaawansowane:** jasność, temperatura barwowa, RGB — pokazywane tylko gdy HA
  zgłasza taką możliwość (plus efekty RGBIC/Govee w dedykowanej pamięci podręcznej).
- **Panel energii:** automatyczna wizualizacja przepływu sieć / słońce / bateria / gaz / woda
  z modelu energii HA.
- **Wykresy:** linia, linia wygładzona, słupki; próbkowanie do 4096 punktów z decymacją.

### 3.2 Asystent głosowy Xiaozhi (小智) — nasz dodatek
- Klient protokołu **Xiaozhi WebSocket v3** (rejestracja urządzenia na stronie Xiaozhi,
  korzystanie z modeli m.in. DeepSeek po stronie serwera).
- Stany: idle / connecting / connected / listening / speaking / error.
- Przechwytywanie mikrofonu 16 kHz mono, kodowanie **Opus** (60 ms/ramkę), odtwarzanie TTS
  z serwera na głośniku, push-to-talk, przerwanie mówienia (abort).
- **Aktywacja w chmurze** (`api.tenclass.net`) — parowanie i pobranie serwera + tokenu.
- Device-ID z adresu MAC (rozpoznanie panelu na stronie Xiaozhi).
- Token i adres serwera trzymane **tylko w NVS panelu** (nie w kodzie źródłowym).

### 3.3 Kamery Home Assistant — nasz dodatek
- Do 4 kamer (REST, MJPEG), podgląd klatek, odświeżanie 1–60 s, skalowanie klatek
  (żeby kamery 2K nie zawieszały UI).
- Źródło: `ha` (encja HA) lub `http` (adres URL), logowanie do kamery (użytkownik/hasło).

### 3.4 Monitor logów w przeglądarce — nasz dodatek
- Przechwytywanie logów błędów/ostrzeżeń (E/W) oraz **panik** do pliku na LittleFS
  (auto-rotacja, max 96 KB × 3 pliki) + bufor pierścieniowy 8 KB.
- Podgląd logów w przeglądarce (REST `/api/system_log`).

### 3.5 Zarządzanie ekranem — nasz dodatek
- Auto-przygaszenie (10%) po bezczynności, pełne wyłączenie ekranu po 30 min.
- **Tryb nocny** 22:00–06:00, ustawienia zapisywane w NVS (przetrwanie restartu).

### 3.6 Pozostałe (z oryginału)
- **Provisioning:** AP `BETTA-Setup` przy pierwszym uruchomieniu (konfiguracja Wi-Fi + HA,
  Quick Setup startera dashboardu).
- **OTA:** wgranie `.ota.bin` lub URL z edytora web (bez kabla po v0.7.1).
- **Wielojęzyczność:** EN/DE/ES/FR + własny JSON tłumaczeń; domyślnie **pl**.
- **Motywy:** edytor motywów, palety, zapis na LittleFS.
- **HTTP API:** pełne REST (layout, encje, stany, ustawienia, Wi-Fi, OTA, zrzut ekranu,
  diagnostyka HA, kamery, logi, wersja).
- **Ekran startowy** (boot splash), **pasek postępu OTA** na ekranie.

---

## 4. Architektura — mapa modułów

Katalog `main/`:

| Moduł | Pliki | Opis |
|---|---|---|
| wejście | `app_main.c` | Start systemu: NVS → Wi-Fi → HA → UI → kamery → HTTP |
| konfiguracja | `app_config.h`, `Kconfig.projbuild` | Wszystkie stałe konfiguracyjne + opcje build-time `CONFIG_APP_*` |
| zdarzenia | `app_events.c` | Kolejka zdarzeń UI (z fixem eviction — rozdz. 7) |
| `api/` | `http_server.c`, `http_guard.c`, `api_routes.c`, `api_layout.c`, `api_energy.c`, `api_entities.c`, `api_state.c`, `api_settings.c`, `api_i18n.c`, `api_wifi.c`, `api_version.c`, `api_screenshot.c`, `api_ota.c`, `api_theme.c`, `api_ha_diagnostics.c`, `api_cameras.c`, `api_system_log.c` | Serwer HTTP + pełne REST API + guard (limit żądań) |
| `camera/` | `camera_store.c/.h` | Baza kamer (źródło ha/http + entity_id) |
| `diag/` | `system_log.c/.h` | Przechwytywanie logów E/W + panik, rotacja plików, **watchdog UI + restart 24 h** |
| `drivers/` | `board_pins.h`, `display_init_panel7.c` (i warianty 4/10/S3), `touch_init_panel7.c` (i warianty), `panels3_bsp_shim/` | Inicjalizacja wyświetlacza i dotyku per wariant |
| `ha/` | `ha_client.c`, `ha_ws.c`, `ha_model.c`, `ha_energy_model.c`, `ha_light_capabilities.c`, `ha_cover_fetcher.c`, `ha_services.h` | Klient HA: REST + WebSocket, model encji/stanów, energia, światła, klatki MJPEG, **koalescencja zdarzeń** |
| `layout/` | `layout_store.c`, `layout_validate.c`, `layout_schema.h` | Zapis/walidacja układu dashboardu (JSON, LittleFS) |
| `net/` | `wifi_mgr.c`, `time_sync.c` | Wi-Fi (ESP-Hosted/C6), synchronizacja czasu SNTP |
| `settings/` | `runtime_settings.c`, `i18n_store.c` | Ustawienia runtime + **sekrety w NVS** (wifi_pwd, ha_token, xz_token), tłumaczenia |
| `ui/` | `ui_runtime.c`, `ui_boot_splash.c`, `ui_ota_progress.c`, `ui_pages.c`, `ui_settings.c`, `ui_energy_page.c`, `ui_cameras_page.c`, `ui_i18n.c`, `ui_widget_factory.c`, `ui_bindings.c`, `lv_psram_mem.c`, `fonts/`, `theme/`, `widgets/` | Silnik UI (LVGL), strony, motywy, fabryka widgetów, alokacja LVGL w PSRAM, **heartbeat UI** |
| `ui/widgets/` | `w_sensor.c`, `w_button.c`, `w_slider.c`, `w_graph.c`, `w_light_tile.c`, `w_heating_tile.c`, `w_weather_tile.c`, `w_todo.c`, `w_media_player.c`, `w_roborock.c`, `w_empty_tile.c`, `w_binary_sensor.c`, `w_cover.c`, `w_lock.c`, `w_fan.c`, `w_select.c`, `w_number.c`, `w_presence.c` | 18 widżetów dashboardu |
| `util/` | `json_util.c`, `ringbuf.c`, `log_tags.h` | Narzędzia JSON, bufor pierścieniowy, tagi logów |
| `xiaozhi/` | `xiaozhi_activate.c`, `xiaozhi_client.c`, `xiaozhi_audio.c`, `xiaozhi_ui.c` (+ `.h`) | Asystent głosowy Xiaozhi (aktywacja, WS v3, audio, ekran) |

Pozostałe katalogi:

| Katalog | Zawartość |
|---|---|
| `components/webui/` | Edytor web: `www/index.html`, `www/app.js` (343 KB), `www/styles.css` — interfejs w przeglądarce |
| `managed_components/` | 26 zależności (m.in. `lvgl`, `esp_lvgl_port`, `esp_lcd_ek79007`, `esp_lcd_touch` + `gt911`, `esp_hosted` + `esp_wifi_remote`, `esp_websocket_client`, `esp_codec_dev`, `78__esp-opus`, `joltwallet__littlefs`, `waveshare__esp32_p4_wifi6_touch_lcd_7b` — BSP) |
| `release/` | Obrazy factory + OTA, archiwum |
| `tools/` | `make_factory_bin.ps1` — pakowanie obrazów |
| `images/` | Grafiki (logo BETTA OS itp.) |

---

## 5. Zapis danych i bezpieczeństwo

| Dane | Miejsce | Uwagi |
|---|---|---|
| Hasło Wi-Fi, token HA, token Xiaozhi | **NVS** (namespace `runtime_sec`) | **Nigdy nie trafiają do kodu źródłowego** — w źródłach są tylko placeholdery `YOUR_WIFI_PASSWORD`, `YOUR_HA_ACCESS_TOKEN`, AP password `""` |
| Układ dashboardu (`layout.json`), kamery, ustawienia, motywy, tłumaczenia, logi | **LittleFS** (`/littlefs/...`) | Przetrwanie flashowania — flash zapisuje tylko bootloader, tablicę partycji, otadata i aplikację; NVS i LittleFS są nietknięte |
| Obrazy OTA/factory | `release/` | — |

Partycje: `partitions.csv` (definicja NVS `0x9000`, aplikacja `0x20000`, LittleFS `0x1B20000` itd.).

---

## 6. Budowanie i wgrywanie

Wymagania: **ESP-IDF v5.5.x**, Python 3.11, komponenty BSP pobierane automatycznie.

```powershell
# Budowanie wariantu 7B (panel7)
idf.py -B build-panel7 -D SDKCONFIG_DEFAULTS="sdkconfig.defaults;sdkconfig.defaults.panel7" -D SDKCONFIG="sdkconfig.panel7" build

# Wgranie na panel (port szeregowy, np. COM4)
idf.py -B build-panel7 -p COM4 flash

# Pakowanie obrazów release (factory + OTA)
pwsh tools/make_factory_bin.ps1 -Variant panel7
```

Ważne:
- Używać **kodu 65001** (UTF-8) w konsoli Windows — `idf.py` wysypuje się na kodowaniu cp1250.
- Przed flashowaniem **zamknąć monitor szeregowy** (otwarcie portu przez DTR/RTS resetuje P4).
- Flash **nie kasuje danych** (NVS/LittleFS) — ustawienia, encje i zakładki zostają.
- Panel 7B ma **ESP32-P4 rev v1.x** — wymagany `CONFIG_ESP32P4_SELECTS_REV_LESS_V3=y` /
  `CONFIG_ESP32P4_REV_MIN_100=y` (inaczej bootloader odmówi startu).

---

## 7. Nasze poprawki stabilności (2026-09-07) — „freeze fixes"

Portowane z naszego projektu bliźniaczego i dodane do tego firmware:

| Poprawka | Plik | Działanie |
|---|---|---|
| **Watchdog UI** | `diag/system_log.c` (+ `ui/ui_runtime.c/.h`) | Jeśli pętla UI (LVGL) nie „bije" przez 60 s, panel wykonuje restart — leczy zawieszenia, w których zadanie UI trzyma blokadę LVGL i nie opróżnia kolejki |
| **Restart co 24 h** | `diag/system_log.c`, `app_config.h` (`APP_DAILY_RESTART_MS`) | Czysty reset programowy po 24 h uptime — czyści powolne wycieki i fragmentację sterty |
| **Eviction kolejki zdarzeń** | `app_events.c`, `app_config.h` (`APP_EVENT_QUEUE_EVICT_ON_FULL`) | Gdy kolejka pełna, usuwany jest **najstarszy** event (a nie najnowszy) — kolejka nie może się zapchać |
| **Koalescencja zdarzeń HA** | `ha/ha_client.c`, `app_config.h` (`APP_EVENT_COALESCE_MS 1000`, 8 slotów) | Zdarzenia per-encja scalane w oknie 1 s — czujniki „gadatliwe" (np. liczniki Zigbee, pogoda) nie zalewają kolejki |

Te poprawki naprawiają problem zawieszania się panelu po ~2 dniach i blokowania przez
„gadatliwe" urządzenia Zigbee.

---

## 8. Pełna lista zmian względem oryginału v0.8.2

**Nowe moduły (nowe pliki):**
1. Wsparcie panelu 7B — `main/drivers/display_init_panel7.c`, `touch_init_panel7.c`,
   `sdkconfig.defaults.panel7`, `main/idf_component.panel7.yml`, zmiany w `CMakeLists.txt`,
   `CMakePresets.json`, `main/CMakeLists.txt`, `dependencies.lock`.
2. Asystent AI Xiaozhi — folder `main/xiaozhi/` (8 plików): aktywacja w chmurze, klient WS v3,
   audio (mikrofon/głośnik, Opus), ekran statusu, Device-ID z MAC.
3. Kamery HA — `main/api/api_cameras.c`, `main/camera/camera_store.c/.h`,
   `main/ui/ui_cameras_page.c/.h`, zmiany w `ha_cover_fetcher.*` (ekstrakcja klatki MJPEG).
4. Monitor logów — `main/api/api_system_log.c`, `main/diag/system_log.c/.h`, `main/util/log_tags.h`.
5. Wygaszanie ekranu + tryb nocny — `main/ui/ui_settings.c/.h`, logika w `display_init_panel7.c`,
   zapis w NVS, zmiany w `app_config.h`, `display_init*.c`, `runtime_settings.*`.
6. Nowe widżety — `w_binary_sensor.c`, `w_cover.c`, `w_fan.c`, `w_lock.c`, `w_number.c`,
   `w_presence.c`, `w_select.c`, `w_widget_util.h`.
7. LVGL w PSRAM — `main/ui/lv_psram_mem.c/.h`.
8. Font Poppins — `main/ui/fonts/Poppins-Regular.ttf`.
9. Dokumentacja — `KNOWLEDGE_BASE.md`.

**Poprawki błędów (zmiany w istniejących plikach):**
- **Boot-loop HTTP:** `main/api/http_server.c` — `max_uri_handlers` 32 → 40.
- Kamery: discovery encji przez REST, alokacja tablicy `camera_entry_t` na stercie (nie na stosie).
- Integracja kamer/encji — `ha_client.c`, `ha_model.*`, `ha_light_capabilities.*`.
- Walidacja + tłumaczenia — `layout_validate.c`, `i18n_store.c`.
- Przeprojektowany interfejs web — `components/webui/www/*`.
- Kolejność inicjalizacji — `app_main.c`.
- **4 poprawki stabilności** (rozdz. 7) — `app_config.h`, `app_events.c`, `ui_runtime.c/.h`,
  `system_log.c`, `ha_client.c`.

---

# PART II — ENGLISH

## 1. Provenance (attribution)

This firmware is **built on top of** the open-source project:

- **Base project:** BETTA-HA-PANEL (repository: <https://github.com/cptkirki/BETTA-HA-PANEL>)
- **Original author:** Cpt_Kirk (Chris)
- **Original license:** LicenseRef-FNCL-1.1 — Federation Non-Commercial License
  (non-commercial use only; license text and change marks must be preserved)
- **Base version:** v0.8.2 (upstream commit `420df76`)
- **Our fork:** commit `6fd025e` „Add ESP32-P4 7B panel support, Xiaozhi AI, HA cameras,
  web log monitor, screen power" (+ later stability fixes, see section 7)

Per the FNCL-1.1 license we keep the original [LICENSE](LICENSE), the original
[README.UPSTREAM.md](README.UPSTREAM.md) and the `Copyright (c) 2026 Cpt_Kirk` + SPDX headers in all source files.

### Original vs. our additions

| Scope | Origin |
|---|---|
| Dashboard engine, web editor, widget engine, HA integration (WebSocket + REST), OTA, themes, i18n, `BETTA-Setup` Wi-Fi provisioning, ESP-Hosted (Wi-Fi via ESP32-C6) | **Original BETTA-HA-PANEL v0.8.2 (Cpt_Kirk)** |
| 7" panel support (`panel7`), **Xiaozhi** voice assistant, HA cameras, in-browser log monitor, screen dimming + night mode, 7 new widgets, LVGL in PSRAM, Poppins font, HTTP boot-loop fix, redesigned web UI | **Our fork** (commit `6fd025e`) |
| 4 stability fixes: UI watchdog, 24 h restart, event queue eviction, HA event coalescing (fix for Zigbee sensor flooding) | **Our fork** (current session, 2026-09-07) |

---

## 2. Target hardware

| Parameter | Value |
|---|---|
| Board | Waveshare **ESP32-P4-WIFI6-Touch-LCD-7B** |
| Display | 7" 1024 × 600, MIPI-DSI, **EK79007** controller |
| Touch | capacitive **GT911** (up to 5 points) |
| CPU | Espressif **ESP32-P4** (rev v1.x, < 3.0) |
| Wi-Fi | via **ESP32-C6** coprocessor (SDIO / ESP-Hosted) |
| Memory | 32 MB flash, PSRAM |
| Audio | built-in **microphone and speaker** |
| Peripherals | **microSD** card slot |
| SDK | ESP-IDF **v5.5.x** (built with 5.5.5) |
| Build variant | `panel7` (`CONFIG_APP_PANEL_VARIANT_7INCH_1024`) |

---

## 3. Features

### 3.1 Home Assistant panel
- **WebSocket** connection (state-change subscription) with **REST** fallback
  (weather forecast, long-poll states).
- Up to 256 entities / 256 states, 6 pages, 32 widgets per page.
- On-device editor at `http://<panel-ip>` — build the dashboard with no YAML and no rebuild
  (drag-and-drop, multi-page, room-grouped entity picker).
- **Widgets:** sensor, button, slider, graph, light, heating, weather (up to 5-day forecast),
  todo list, media player, Roborock vacuum, energy dashboard, empty tile + (ours) binary sensor,
  cover, lock, fan, number, presence, select.
- **Advanced light control:** brightness, colour temperature, RGB — only shown when HA reports
  the capability (plus RGBIC/Govee effect lists in a dedicated cache).
- **Energy dashboard:** grid / solar / battery / gas / water flow from the HA energy model.
- **Graphs:** line, smoothed line, bar; sampling up to 4096 points with decimation.

### 3.2 Xiaozhi voice assistant (小智) — our addition
- **Xiaozhi WebSocket v3** protocol client (register the device on the Xiaozhi website,
  use server-side models such as DeepSeek).
- States: idle / connecting / connected / listening / speaking / error.
- 16 kHz mono microphone capture, **Opus** encoding (60 ms frames), server TTS playback on the
  speaker, push-to-talk, abort-speaking.
- **Cloud activation** (`api.tenclass.net`) — pairing, server URL + token retrieval.
- Device-ID derived from MAC address (device recognition on the Xiaozhi site).
- Token and server URL kept **only in device NVS** (never in source code).

### 3.3 Home Assistant cameras — our addition
- Up to 4 cameras (REST, MJPEG), frame preview, 1–60 s refresh, frame downscaling
  (so 2K cameras don't freeze the UI).
- Source: `ha` (HA entity) or `http` (URL), camera login (user/password).

### 3.4 In-browser log monitor — our addition
- Captures error/warning (E/W) logs and **panics** to a file on LittleFS
  (auto-rotating, max 96 KB × 3 files) + 8 KB ring buffer.
- Log view in the browser (REST `/api/system_log`).

### 3.5 Screen power management — our addition
- Auto-dim (10%) on idle, full screen off after 30 min.
- **Night mode** 22:00–06:00, settings saved in NVS (survive reboot).

### 3.6 Other (from upstream)
- **Provisioning:** `BETTA-Setup` AP on first boot (Wi-Fi + HA setup, Quick Setup starter dashboard).
- **OTA:** upload `.ota.bin` or OTA URL from the editor (no cable after v0.7.1).
- **Multilingual:** EN/DE/ES/FR + custom translation JSON; default **pl**.
- **Themes:** theme editor, palettes, LittleFS storage.
- **HTTP API:** full REST (layout, entities, states, settings, Wi-Fi, OTA, screenshot,
  HA diagnostics, cameras, logs, version).
- **Boot splash** screen and on-screen **OTA progress bar**.

---

## 4. Architecture — module map

`main/` directory:

| Module | Files | Description |
|---|---|---|
| entry | `app_main.c` | Startup: NVS → Wi-Fi → HA → UI → cameras → HTTP |
| config | `app_config.h`, `Kconfig.projbuild` | All config constants + `CONFIG_APP_*` build options |
| events | `app_events.c` | UI event queue (with eviction fix — sec. 7) |
| `api/` | `http_server.c`, `http_guard.c`, `api_routes.c`, `api_layout.c`, `api_energy.c`, `api_entities.c`, `api_state.c`, `api_settings.c`, `api_i18n.c`, `api_wifi.c`, `api_version.c`, `api_screenshot.c`, `api_ota.c`, `api_theme.c`, `api_ha_diagnostics.c`, `api_cameras.c`, `api_system_log.c` | HTTP server + full REST API + request guard |
| `camera/` | `camera_store.c/.h` | Camera store (ha/http source + entity_id) |
| `diag/` | `system_log.c/.h` | E/W log + panic capture, file rotation, **UI watchdog + 24 h restart** |
| `drivers/` | `board_pins.h`, `display_init_panel7.c` (+ 4/10/S3 variants), `touch_init_panel7.c` (+ variants), `panels3_bsp_shim/` | Display and touch init per variant |
| `ha/` | `ha_client.c`, `ha_ws.c`, `ha_model.c`, `ha_energy_model.c`, `ha_light_capabilities.c`, `ha_cover_fetcher.c`, `ha_services.h` | HA client: REST + WebSocket, entity/state model, energy, lights, MJPEG frames, **event coalescing** |
| `layout/` | `layout_store.c`, `layout_validate.c`, `layout_schema.h` | Dashboard layout store/validate (JSON, LittleFS) |
| `net/` | `wifi_mgr.c`, `time_sync.c` | Wi-Fi (ESP-Hosted/C6), SNTP time sync |
| `settings/` | `runtime_settings.c`, `i18n_store.c` | Runtime settings + **secrets in NVS** (wifi_pwd, ha_token, xz_token), translations |
| `ui/` | `ui_runtime.c`, `ui_boot_splash.c`, `ui_ota_progress.c`, `ui_pages.c`, `ui_settings.c`, `ui_energy_page.c`, `ui_cameras_page.c`, `ui_i18n.c`, `ui_widget_factory.c`, `ui_bindings.c`, `lv_psram_mem.c`, `fonts/`, `theme/`, `widgets/` | UI engine (LVGL), pages, themes, widget factory, LVGL in PSRAM, **UI heartbeat** |
| `ui/widgets/` | `w_sensor.c`, `w_button.c`, `w_slider.c`, `w_graph.c`, `w_light_tile.c`, `w_heating_tile.c`, `w_weather_tile.c`, `w_todo.c`, `w_media_player.c`, `w_roborock.c`, `w_empty_tile.c`, `w_binary_sensor.c`, `w_cover.c`, `w_lock.c`, `w_fan.c`, `w_select.c`, `w_number.c`, `w_presence.c` | 18 dashboard widgets |
| `util/` | `json_util.c`, `ringbuf.c`, `log_tags.h` | JSON helpers, ring buffer, log tags |
| `xiaozhi/` | `xiaozhi_activate.c`, `xiaozhi_client.c`, `xiaozhi_audio.c`, `xiaozhi_ui.c` (+ `.h`) | Xiaozhi voice assistant (activation, WS v3, audio, screen) |

Other directories:

| Directory | Contents |
|---|---|
| `components/webui/` | Web editor: `www/index.html`, `www/app.js` (343 KB), `www/styles.css` — browser UI |
| `managed_components/` | 26 dependencies (e.g. `lvgl`, `esp_lvgl_port`, `esp_lcd_ek79007`, `esp_lcd_touch` + `gt911`, `esp_hosted` + `esp_wifi_remote`, `esp_websocket_client`, `esp_codec_dev`, `78__esp-opus`, `joltwallet__littlefs`, `waveshare__esp32_p4_wifi6_touch_lcd_7b` — BSP) |
| `release/` | Factory + OTA images, archive |
| `tools/` | `make_factory_bin.ps1` — image packaging |
| `images/` | Graphics (BETTA OS logo, etc.) |

---

## 5. Data storage & security

| Data | Location | Notes |
|---|---|---|
| Wi-Fi password, HA token, Xiaozhi token | **NVS** (namespace `runtime_sec`) | **Never in source code** — sources contain only placeholders `YOUR_WIFI_PASSWORD`, `YOUR_HA_ACCESS_TOKEN`, AP password `""` |
| Dashboard layout (`layout.json`), cameras, settings, themes, translations, logs | **LittleFS** (`/littlefs/...`) | Survive flashing — flash writes only bootloader, partition table, otadata and app; NVS and LittleFS are untouched |
| OTA/factory images | `release/` | — |

Partitions: `partitions.csv` (NVS `0x9000`, app `0x20000`, LittleFS `0x1B20000`, etc.).

---

## 6. Building & flashing

Requirements: **ESP-IDF v5.5.x**, Python 3.11, BSP components pulled automatically.

```powershell
# Build the 7B variant (panel7)
idf.py -B build-panel7 -D SDKCONFIG_DEFAULTS="sdkconfig.defaults;sdkconfig.defaults.panel7" -D SDKCONFIG="sdkconfig.panel7" build

# Flash (serial port, e.g. COM4)
idf.py -B build-panel7 -p COM4 flash

# Package release images (factory + OTA)
pwsh tools/make_factory_bin.ps1 -Variant panel7
```

Notes:
- Use **code page 65001** (UTF-8) in the Windows console — `idf.py` crashes on cp1250 encoding.
- **Close the serial monitor before flashing** (opening the port via DTR/RTS resets the P4).
- Flashing **does not erase data** (NVS/LittleFS) — settings, entities and tabs remain.
- The 7B board has **ESP32-P4 rev v1.x** — requires `CONFIG_ESP32P4_SELECTS_REV_LESS_V3=y` /
  `CONFIG_ESP32P4_REV_MIN_100=y` (otherwise the bootloader refuses to boot).

---

## 7. Our stability fixes (2026-09-07) — „freeze fixes"

Ported from our twin project and added to this firmware:

| Fix | File | Effect |
|---|---|---|
| **UI watchdog** | `diag/system_log.c` (+ `ui/ui_runtime.c/.h`) | If the UI (LVGL) loop doesn't „beat" for 60 s, the panel resets — heals hangs where the UI task holds the LVGL lock and never drains the queue |
| **24 h restart** | `diag/system_log.c`, `app_config.h` (`APP_DAILY_RESTART_MS`) | Clean software reset after 24 h uptime — clears slow leaks and heap fragmentation |
| **Event queue eviction** | `app_events.c`, `app_config.h` (`APP_EVENT_QUEUE_EVICT_ON_FULL`) | When the queue is full the **oldest** event is evicted (not the newest) — the queue can never saturate |
| **HA event coalescing** | `ha/ha_client.c`, `app_config.h` (`APP_EVENT_COALESCE_MS 1000`, 8 slots) | Per-entity events are coalesced in a 1 s window — „chatty" sensors (e.g. Zigbee power meters, weather) no longer flood the queue |

These fixes cure the ~2-day panel freeze and the blocking caused by „chatty" Zigbee devices.

---

## 8. Full changelog vs. upstream v0.8.2

**New modules (new files):**
1. 7B panel support — `main/drivers/display_init_panel7.c`, `touch_init_panel7.c`,
   `sdkconfig.defaults.panel7`, `main/idf_component.panel7.yml`, changes in `CMakeLists.txt`,
   `CMakePresets.json`, `main/CMakeLists.txt`, `dependencies.lock`.
2. Xiaozhi AI assistant — `main/xiaozhi/` (8 files): cloud activation, WS v3 client,
   audio (mic/speaker, Opus), status screen, MAC-based Device-ID.
3. HA cameras — `main/api/api_cameras.c`, `main/camera/camera_store.c/.h`,
   `main/ui/ui_cameras_page.c/.h`, changes in `ha_cover_fetcher.*` (MJPEG frame extraction).
4. Log monitor — `main/api/api_system_log.c`, `main/diag/system_log.c/.h`, `main/util/log_tags.h`.
5. Screen dimming + night mode — `main/ui/ui_settings.c/.h`, logic in `display_init_panel7.c`,
   NVS persistence, changes in `app_config.h`, `display_init*.c`, `runtime_settings.*`.
6. New widgets — `w_binary_sensor.c`, `w_cover.c`, `w_fan.c`, `w_lock.c`, `w_number.c`,
   `w_presence.c`, `w_select.c`, `w_widget_util.h`.
7. LVGL in PSRAM — `main/ui/lv_psram_mem.c/.h`.
8. Poppins font — `main/ui/fonts/Poppins-Regular.ttf`.
9. Documentation — `KNOWLEDGE_BASE.md`.

**Bug fixes (changes in existing files):**
- **HTTP boot-loop:** `main/api/http_server.c` — `max_uri_handlers` 32 → 40.
- Cameras: entity discovery via REST, `camera_entry_t` array allocated on heap (not stack).
- Camera/entity integration — `ha_client.c`, `ha_model.*`, `ha_light_capabilities.*`.
- Validation + translations — `layout_validate.c`, `i18n_store.c`.
- Redesigned web UI — `components/webui/www/*`.
- Init order — `app_main.c`.
- **4 stability fixes** (section 7) — `app_config.h`, `app_events.c`, `ui_runtime.c/.h`,
  `system_log.c`, `ha_client.c`.
