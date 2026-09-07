# BETTA-HA-PANEL 7B — binarki firmware / Firmware binaries

**Wersja / Version:** v0.8.2-7b (wariant / variant `panel7`)
**Płytka / Board:** Waveshare ESP32-P4-WIFI6-Touch-LCD-7B (ESP32-P4 rev v1.x)

Binarki **nie zawierają żadnych sekretów** (Wi-Fi, tokeny HA/Xiaozhi są trzymane wyłącznie
w NVS panelu — w obrazie są tylko placeholdery `YOUR_WIFI_PASSWORD`, `YOUR_HA_ACCESS_TOKEN`).
The binaries contain **no secrets** (Wi-Fi, HA/Xiaozhi tokens live only in the panel's NVS —
the image contains only `YOUR_WIFI_PASSWORD`, `YOUR_HA_ACCESS_TOKEN` placeholders).

## Pliki / Files

| Plik / File | Offset | Opis / Description |
|---|---|---|
| `bootloader.bin` | `0x2000` | bootloader |
| `partition-table.bin` | `0x8000` | tablica partycji / partition table |
| `ota_data_initial.bin` | `0xf000` | dane OTA / OTA data |
| `betta-ha-panel-7b.bin` | `0x20000` | aplikacja / application |

## Wgrywanie / Flashing

```powershell
# esptool (chip esp32p4, flash_mode dio, 32 MB)
esptool.py --chip esp32p4 -p COM4 -b 115200 --flash_mode dio --flash_size 32MB --flash_freq 80m `
  write_flash `
  0x2000  bootloader.bin `
  0x8000  partition-table.bin `
  0xf000  ota_data_initial.bin `
  0x20000 betta-ha-panel-7b.bin
```

> Przed flashowaniem zamknij monitor szeregowy (otwarcie portu DTR/RTS resetuje ESP32-P4).
> Flash **nie kasuje** NVS/LittleFS — ustawienia, encje i zakładki zostają.
> Close the serial monitor before flashing (opening the port via DTR/RTS resets the P4).
> Flashing does **not** erase NVS/LittleFS — settings, entities and tabs are kept.

## Źródło / Source
Kod źródłowy: `BETTA-HA-PANEL_clean_20260907.zip` (obok). Projekt zbudowany na
[BETTA-HA-PANEL v0.8.2](https://github.com/cptkirki/BETTA-HA-PANEL) autorstwa Cpt_Kirk
(licencja LicenseRef-FNCL-1.1). Pełny opis: `DOKUMENTACJA.md`.
Source code: `BETTA-HA-PANEL_clean_20260907.zip` (alongside). Built on
[BETTA-HA-PANEL v0.8.2](https://github.com/cptkirki/BETTA-HA-PANEL) by Cpt_Kirk
(LicenseRef-FNCL-1.1). Full description: `DOKUMENTACJA.md`.
