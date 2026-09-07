<!-- SPDX-License-Identifier: LicenseRef-FNCL-1.1 | Copyright (c) 2026 Cpt_Kirk -->

# BETTA HA Panel 7B — Baza wiedzy i instrukcje

> Kompletna baza wiedzy o projekcie **BETTA** na panel **Waveshare ESP32-P4 WiFi6 Touch LCD 7B**.
> Ten dokument to „podręcznik serwisowy" — opis sprzętu, oprogramowania, budowania, wgrywania, konfiguracji i znanych problemów.

---

## 1. Sprzęt

| Element | Szczegóły |
|---|---|
| Płytka | Waveshare **ESP32-P4-WIFI6-Touch-LCD-7B** |
| Wyświetlacz | 7" **1024 × 600**, DSI, kontroler **EK79007** |
| Dotyk | **GT911** (I2C) |
| MCU główne | **ESP32-P4** (host, aplikacja) |
| WiFi / BLE | **ESP32-C6** jako koprocesor sieciowy (SDIO, ESP-Hosted) |
| Audio | wbudowany **mikrofon i głośnik** (Xiaozhi AI) |
| Pamięć | wewnętrzny flash + **karta microSD** (slot) |
| Zasilanie / porty | USB-C, UART programowania |

Złącze programowania: **port zewnętrzny USB-C**. Firmware wgrywa się przez UART (COM).

---

## 2. Oprogramowanie

- **Firmware:** `betta-ha-panel-7b` — **v0.8.2-7b** (niestandardowa wersja `panel7` dla 7B)
- **SDK:** ESP-IDF **v5.5.5** (instalacja: `C:\Espressif\frameworks\esp-idf`)
- **Katalog projektu:** `C:\Projects\BETTA-HA-PANEL`
- **Katalog budowy:** `build-panel7`
- **Wariant:** `panel7` (preset SDK `sdkconfig.defaults.panel7`)
- **Adres IP panelu (LAN):** `http://192.168.1.145`

---

## 3. Co panel potrafi

1. **Panel Home Assistant (HA)** — dashboard budowany bezpośrednio na urządzeniu przez **edytor w przeglądarce** (`http://<IP>`). Połączenie WebSocket + REST (pogoda, stany). Widgety: sensor, przycisk, suwak, wykres, światło (jasność / temperatura / RGB), ogrzewanie, pogoda (do 5 dni), media player, todo, Roborock, energia, encje binarne, cover/rolety, wentylator, zamek, liczba, obecność, wybór (select).
2. **Asystent AI Xiaozhi** — sterowanie głosem przez mikrofon + odpowiedzi na głośniku. Aktywacja w chmurze Xiaozhi (`api.tenclass.net`), WebSocket, `Device-Id` na bazie MAC.
3. **Kamery HA** — podgląd kamer (dekodowanie MJPEG, m.in. 640×360 / 704×576). Dwie kamery (np. balkon). Rozdzielczość snapshotu jest ograniczana, by nie zamrażać UI na strumieniu 2K.
4. **Ekran / zasilanie wyświetlacza**:
   - automatyczne **przygaszenie** po bezczynności (domyślnie 3 minuty),
   - **wygaszenie** ekranu po dłuższej bezczynności (domyślnie 30 minut),
   - **tryb nocny** (domyślnie 22:00–06:00) — pełne wygaszenie, żeby nie świecił w nocy,
   - ustawienia zapisywane w **NVS** (przetrwają restart).
5. **Monitor logów w przeglądarce** — strona pokazująca logi, ostrzeżenia, errory i paniki z urządzenia (diagnostyka bez kabla).
6. **Karta microSD** — dostępna w razie potrzeby (dodatkowa przestrzeń).

---

## 4. Struktura kodu (najważniejsze pliki)

```
main/
├─ app_main.c                  # start: NVS → WiFi → HA → UI → kamery → serwer HTTP
├─ app_config.h                # domyślne ustawienia (ekran, Xiaozhi, C6, OTA)
├─ CMakeLists.txt / Kconfig.projbuild
├─ api/
│  ├─ http_server.c            # serwer WWW (max_uri_handlers 32→40 — fix boot-loop)
│  ├─ api_cameras.c            # REST kamer HA
│  ├─ api_system_log.c         # REST logów/panik (monitor logów)
│  └─ ...                      # api_routes, api_settings, api_state, api_ota, api_theme, api_wifi...
├─ drivers/
│  ├─ display_init_panel7.c    # STEROWNIK 7B: jasność, wygaszanie, tryb nocny, NVS
│  ├─ display_init.h           # display_power_config_t (wspólny)
│  ├─ touch_init_panel7.c      # GT911 dla 7B
│  └─ display_init_panel{4,10}.c, display_init_panels3.c
├─ ha/                         # klient Home Assistant (WebSocket, REST, model, fetcher cover)
├─ camera/
│  └─ camera_store.c/h         # baza kamer (source: ha/http + entity_id, wsteczna zgodność)
├─ xiaozhi/
│  ├─ xiaozhi_client.c/h       # klient WebSocket Xiaozhi (stany, audio)
│  ├─ xiaozhi_activate.c/h     # aktywacja w chmurze (device_id → server + token)
│  ├─ xiaozhi_audio.c/h        # mikrofon + głośnik
│  └─ xiaozhi_ui.c/h           # ekran/stan Xiaozhi
├─ diag/
│  └─ system_log.c/h           # przechwytywanie logów do monitora WWW
├─ ui/
│  ├─ ui_settings.c/h          # ekran ustawień (wygaszanie, tryb nocny, Xiaozhi)
│  ├─ ui_cameras_page.c/h      # strona kamer
│  ├─ lv_psram_mem.c/h         # LVGL alokacja w PSRAM
│  └─ widgets/                 # w_*.c — widgety dashboardu
├─ settings/runtime_settings.c # ustawienia runtime (NVS)
└─ layout/                     # walidacja i zapis layoutu
```

---

## 5. Budowanie (Windows)

Wymagane: **ESP-IDF v5.5.5**, Python 3.11+, komponenty Waveshare/Smart86 (pobierane przez menedżera komponentów).

Otwórz terminal i uruchom (budowa wariantu 7B):

```powershell
& $Env:ComSpec /c 'set PYTHONIOENCODING=utf-8 && call "C:\Espressif\frameworks\esp-idf\export.bat" >nul && cd /d C:\Projects\BETTA-HA-PANEL && idf.py -B build-panel7 build'
```

Pliki wynikowe lądują w `build-panel7/`.

---

## 6. Wgrywanie (flash) i monitor szeregowy

**⚠️ WAŻNE — reset przez COM4:** otwarcie/zamknięcie portu **COM4** (przez narzędzia pyserial/esptool/idf.py) przełącza linie DTR/RTS i **RESETUJE ESP32-P4**. Dlatego:

1. **Zatrzymaj monitor szeregowy** przed flashowaniem (inaczej COM4 jest zajęty).
2. Wgraj firmware:
   ```powershell
   & $Env:ComSpec /c 'set PYTHONIOENCODING=utf-8 && call "C:\Espressif\frameworks\esp-idf\export.bat" >nul && cd /d C:\Projects\BETTA-HA-PANEL && idf.py -B build-panel7 -p COM4 flash'
   ```
3. Uruchom monitor (zapis do pliku):
   ```powershell
   & $Env:ComSpec /c 'set PYTHONIOENCODING=utf-8 && call "C:\Espressif\frameworks\esp-idf\export.bat" >nul && cd /d C:\Projects\BETTA-HA-PANEL && idf.py -B build-panel7 -p COM4 monitor > panic_monitor.log 2>&1'
   ```

Po flashu w logu mogą pojawić się **dwie** sekcje `=== boot ... ===` — to normalne: flash robi twardy reset (`reset=USB(11)`), a otwarcie `idf.py monitor` znów przełącza DTR/RTS. **To nie jest crash.**

---

## 7. Konfiguracja

- **Web editor** — wejdź w przeglądarce na `http://192.168.1.145`. Edycja dashboardu, dodawanie stron/widgetów, motyw, OTA, języki.
- **Ustawienia na urządzeniu** — ekran Ustawienia: wygaszanie ekranu (Nigdy / 15 min / 30 min / 1 h / 2 h / 4 h), tryb nocny (wł./wył.) i godziny startu/końca (0–23). Ustawienia zapisują się w NVS.
- **Home Assistant** — połącz tokenem długoterminowym (long-lived access token) przez web editor.
- **Xiaozhi** — urządzenie aktywuje się w chmurze Xiaozhi (`api.tenclass.net/xiaozhi/ota/`), pobiera adres serwera + token i łączy się WebSocket z nagłówkiem `Device-Id` (MAC). Aby używać z DeepSeek — skonfiguruj konto/asystenta po stronie serwisu Xiaozhi (klucz DeepSeek), urządzenie jest rozpoznawane po `Device-Id`.

---

## 8. Kamery

- Kamery są wykrywane przez REST discovery (`/api/ha/light_entities?domain=camera`).
- Snapshot jest pobierany w **niskiej rozdzielczości** (strumień podrzędny), a nie 2K — zapobiega to zamrażaniu UI i brakowi obrazu.
- Wspierane źródła: `ha` (encja HA) i `http` (bezpośredni URL).

---

## 9. Ekran: przygaszanie / wygaszanie / tryb nocny

Logika w `display_init_panel7.c`:

- **Przygaszenie** — po `dim_after_ms` (domyślnie 3 min) jasność spada do 10%.
- **Wygaszenie** — po `off_timeout_ms` (domyślnie 30 min) podświetlenie = 0 (`bsp_display_brightness_set(0)`); panel DSI i dotyk nadal działają — dotknięcie budzi ekran.
- **Tryb nocny** — gdy `night_mode_enabled` i godzina w oknie [start, end) (domyślnie 22:00–06:00), po czasie przygaszenia ekran **całkowicie się wyłącza** (nie tylko przygasa). Obsługiwane okna zawijane przez północ (start > end, np. 22→6).
- **Strażnik zegara** — jeśli zegar nie jest zsynchronizowany (rok < 2016), tryb nocny jest pomijany, żeby ekran nie gasł w dzień.
- Zapis w **NVS** (namespace `display`, klucz `power`).

---

## 10. Znane komunikaty w logu (kosmetyczne / normalne)

| Komunikat | Co oznacza | Działanie |
|---|---|---|
| `E lcd_panel: esp_lcd_panel_disp_on_off(71): disp_on_off is not supported` | Panel DSI EK79007 nie obsługuje tej komendy — wywołanie kosmetyczne w `display_init` | ignoruj (można usunąć wywołanie) |
| `W H_SDIO_DRV: Reset slave using GPIO[54]` | normalny reset koprocesora C6 przy starcie | ignoruj |
| `W transport: Version mismatch: Host [2.11.0] > Co-proc [0.0.0]` | C6 zgłasza wersję FW 0.0.0 | ignoruj (C6 działa) |
| `W rpc_core: Timeout waiting for Resp for [0x15e](Req_GetCoprocessorFwVersion)` / `E rpc_core: Response not received` (×3) | zapytanie o wersję FW C6 przekracza timeout | ignoruj |
| `W rpc_rsp: Hosted RPC_Resp [0x21a], uid [12], resp code [12295]` | asynchroniczna odpowiedź RPC w trakcie handshake | ignoruj |
| `reset=USB(11)` | reset po flashu / otwarciu monitora (DTR/RTS), **nie panic** | ignoruj |

**C6 nie wymaga aktualizacji firmware** — projekt nie zawiera wsadzonego obrazu C6 (`APP_HAVE_HOSTED_C6_FW_IMAGE=0`), więc automatyczna aktualizacja jest pomijana, a WiFi i tak łączy się poprawnie.

---

## 11. Zasady pracy (RULES)

- **Nigdy nie kasuj** działającego firmware/konfiguracji bez backupu.
- **Wgrywaj tylko nowszy** firmware; nie cofaj do starszych bez potrzeby.
- Przed flashowaniem **zawsze zatrzymaj monitor** na COM4.
- Po zmianach w kodzie: **zbuduj → wgraj → sprawdź log** (linia `display: Power config ...` potwierdza nowy firmware).
- Backup projektu trzymaj w `C:\Projects\backups\` (najnowszy plik).
