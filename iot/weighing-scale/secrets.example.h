// Salin file ini menjadi secrets.h (tidak ikut ke Git) lalu isi nilainya.
#pragma once

#define WIFI_SSID "nama-wifi"
#define WIFI_PASSWORD "password-wifi"

// Endpoint backend. Produksi: https://<domain-backend>/api/weighing
// Uji coba lokal: http://<ip-laptop>:3000/api/weighing
#define API_URL "https://example.vercel.app/api/weighing"

// Sama dengan IOT_DEVICE_KEY di environment backend.
#define DEVICE_KEY "isi-dengan-IOT_DEVICE_KEY"
#define DEVICE_ID "RUNA-SCALE-001"

// Sertifikat root CA (format PEM) dari domain backend, untuk verifikasi HTTPS.
// Ambil dari browser: klik ikon gembok -> sertifikat -> ekspor root CA.
#define API_ROOT_CA \
  "-----BEGIN CERTIFICATE-----\n" \
  "...\n" \
  "-----END CERTIFICATE-----\n"
