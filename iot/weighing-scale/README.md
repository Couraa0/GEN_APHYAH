# Timbangan Digital RUNA (ESP32 + HX711)

Proof of concept satu perangkat. **Firmware belum diuji pada perangkat keras**; pin dan
ambang perlu disesuaikan saat perakitan.

## Rangkaian

| Komponen | Pin ESP32 |
|---|---|
| HX711 DOUT | GPIO 16 |
| HX711 SCK | GPIO 4 |
| HX711 VCC / GND | 3V3 / GND |
| Tombol KIRIM | GPIO 25 ke GND |
| Tombol TARE | GPIO 26 ke GND |
| LED status | GPIO 2 (LED bawaan) |

Load cell ke HX711: E+ / E- / A- / A+ sesuai warna kabel pada datasheet load cell.
Kapasitas load cell dipilih setelah berat maksimum operasional diverifikasi.

## Menyiapkan

1. Arduino IDE: pasang board **esp32** dan library **HX711** (Bogdan Necula).
2. Salin `secrets.example.h` menjadi `secrets.h`, isi Wi-Fi, URL backend, dan kunci perangkat
   (`IOT_DEVICE_KEY` di backend).
3. Unggah `weighing-scale.ino`.

## Kalibrasi (wajib, sekali per load cell)

Buka Serial Monitor 115200 baud:

1. Kosongkan platform, kirim `t` (tare).
2. Letakkan beban standar yang beratnya diketahui, misalnya 5 kg.
3. Kirim `c 5.000`. Faktor kalibrasi disimpan di flash dan dipakai setiap menyala.
4. Uji dengan beban lain; ulangi bila selisihnya terlalu besar.

## Pemakaian

1. Nyalakan dengan platform kosong (tare otomatis), atau tekan TARE.
2. Letakkan material, tunggu stabil, tekan KIRIM.
3. LED: 1 kedip = terkirim, 3 kedip = belum stabil / kosong, 4 kedip = ditolak server.
4. Di aplikasi: menu **Pengumpulan** → "Hasil timbangan digital menunggu verifikasi" → **Pakai**.

Tanpa koneksi, hingga 20 pembacaan disimpan sementara dan dikirim saat Wi-Fi kembali
(hilang bila daya mati).
