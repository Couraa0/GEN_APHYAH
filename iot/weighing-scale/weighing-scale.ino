// Timbangan digital RUNA: Load Cell -> HX711 -> ESP32 -> Wi-Fi -> POST /api/weighing
//
// Cara pakai: letakkan material, tunggu angka stabil, tekan tombol KIRIM.
// Data masuk ke aplikasi sebagai "hasil timbangan menunggu verifikasi"; petugas
// yang memilih titik/kategori dan menjadikannya transaksi resmi.
//
// Library (Arduino Library Manager): "HX711" oleh Bogdan Necula.
// Salin secrets.example.h menjadi secrets.h lalu isi. Lihat README.md untuk
// rangkaian dan kalibrasi.
//
// CATATAN: kode ini belum diuji pada perangkat keras. Pin, kapasitas load cell,
// dan ambang di bawah harus disesuaikan saat perakitan.

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <time.h>
#include "HX711.h"
#include "secrets.h"

// ---- Pin (sesuaikan dengan rangkaian) ----
const int PIN_HX711_DOUT = 16;
const int PIN_HX711_SCK = 4;
const int PIN_BTN_SEND = 25; // tombol ke GND
const int PIN_BTN_TARE = 26; // tombol ke GND
const int PIN_LED = 2;

// ---- Ambang (setel di lapangan) ----
const float MIN_WEIGHT_KG = 0.05;   // di bawah ini dianggap kosong / derau
const float STABLE_DELTA_KG = 0.02; // selisih maksimum dua pembacaan agar dianggap stabil
// Faktor awal sebelum dikalibrasi. Nilai sebenarnya tergantung load cell: WAJIB
// kalibrasi dengan beban standar (perintah serial "c <kg>"), hasilnya disimpan di flash.
const float DEFAULT_CALIBRATION = 1.0;

// ponytail: antrean di RAM, hilang bila daya mati. Pindah ke LittleFS bila listrik
// di titik sering padam saat masih ada data belum terkirim.
const size_t QUEUE_SIZE = 20;
struct Reading {
  float kg;
  time_t at; // 0 = jam belum tersinkron NTP; server memakai waktu terima
};
Reading pending[QUEUE_SIZE];
size_t pendingCount = 0;

HX711 scale;
Preferences prefs;

void blink(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(PIN_LED, HIGH);
    delay(120);
    digitalWrite(PIN_LED, LOW);
    delay(120);
  }
}

// true sekali per tekanan tombol (debounce + tunggu dilepas).
bool pressed(int pin) {
  if (digitalRead(pin) != LOW) return false;
  delay(30);
  if (digitalRead(pin) != LOW) return false;
  while (digitalRead(pin) == LOW) delay(10);
  return true;
}

void enqueue(float kg) {
  if (pendingCount == QUEUE_SIZE) { // penuh: buang yang paling lama
    memmove(pending, pending + 1, sizeof(Reading) * (QUEUE_SIZE - 1));
    pendingCount--;
  }
  time_t now = time(nullptr);
  pending[pendingCount++] = {kg, now > 1700000000 ? now : 0};
  Serial.printf("Antre: %.3f kg (%u menunggu)\n", kg, (unsigned)pendingCount);
}

// Hasil: 1 = terkirim, 0 = coba lagi nanti, -1 = ditolak server (jangan diulang).
// ponytail: bila respons hilang setelah server menyimpan, pengiriman ulang membuat
// pembacaan ganda; petugas membuangnya di aplikasi. Tambah ID pembacaan bila sering terjadi.
int sendReading(const Reading &r) {
  if (WiFi.status() != WL_CONNECTED) return 0;

  char body[200];
  if (r.at) {
    char ts[25];
    struct tm utc;
    gmtime_r(&r.at, &utc);
    strftime(ts, sizeof(ts), "%Y-%m-%dT%H:%M:%SZ", &utc);
    snprintf(body, sizeof(body), "{\"deviceId\":\"%s\",\"weightKg\":%.3f,\"measuredAt\":\"%s\"}",
             DEVICE_ID, r.kg, ts);
  } else {
    snprintf(body, sizeof(body), "{\"deviceId\":\"%s\",\"weightKg\":%.3f}", DEVICE_ID, r.kg);
  }

  // HTTPS memverifikasi sertifikat server dengan API_ROOT_CA. http:// hanya untuk
  // uji coba di jaringan lokal.
  WiFiClientSecure secure;
  WiFiClient plain;
  bool https = String(API_URL).startsWith("https://");
  if (https) secure.setCACert(API_ROOT_CA);

  HTTPClient http;
  http.setTimeout(8000);
  if (!http.begin(https ? (WiFiClient &)secure : plain, API_URL)) return 0;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int code = http.POST(body);
  http.end();

  Serial.printf("POST %.3f kg -> HTTP %d\n", r.kg, code);
  if (code == 201) return 1;
  if (code == 400) return -1; // data tidak valid: mengulang tidak akan berhasil
  return 0;                   // jaringan, 401 (kunci salah), 5xx: simpan dan coba lagi
}

void flushQueue() {
  while (pendingCount > 0) {
    int result = sendReading(pending[0]);
    if (result == 0) return;
    blink(result == 1 ? 1 : 4);
    memmove(pending, pending + 1, sizeof(Reading) * (pendingCount - 1));
    pendingCount--;
  }
}

// Perintah lewat Serial Monitor (115200 baud):
//   t        -> tare (nolkan dengan platform kosong)
//   c 5.000  -> kalibrasi: taruh beban standar 5 kg dulu, lalu kirim perintah ini
void handleSerial() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line == "t") {
    scale.tare(20);
    Serial.println("Tare OK");
  } else if (line.startsWith("c ")) {
    float knownKg = line.substring(2).toFloat();
    if (knownKg <= 0) return;
    scale.set_scale(1.0);
    float factor = scale.get_units(20) / knownKg;
    scale.set_scale(factor);
    prefs.putFloat("cal", factor);
    Serial.printf("Kalibrasi tersimpan: %.3f\n", factor);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_BTN_SEND, INPUT_PULLUP);
  pinMode(PIN_BTN_TARE, INPUT_PULLUP);
  pinMode(PIN_LED, OUTPUT);

  prefs.begin("runa", false);
  scale.begin(PIN_HX711_DOUT, PIN_HX711_SCK);
  scale.set_scale(prefs.getFloat("cal", DEFAULT_CALIBRATION));
  scale.tare(20); // nyalakan dengan platform kosong

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  configTime(0, 0, "pool.ntp.org"); // jam UTC untuk measuredAt
}

void loop() {
  handleSerial();

  if (pressed(PIN_BTN_TARE)) {
    scale.tare(20);
    Serial.println("Tare OK");
    blink(1);
  }

  if (pressed(PIN_BTN_SEND)) {
    float first = scale.get_units(10);
    float second = scale.get_units(10);
    if (fabs(first - second) > STABLE_DELTA_KG) {
      Serial.println("Belum stabil, ulangi");
      blink(3);
    } else if (second < MIN_WEIGHT_KG) {
      Serial.println("Terlalu ringan / kosong");
      blink(3);
    } else {
      enqueue(second);
    }
  }

  static unsigned long lastFlush = 0;
  if (pendingCount > 0 && millis() - lastFlush > 3000) {
    lastFlush = millis();
    flushQueue();
  }

  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 1000 && scale.is_ready()) {
    lastPrint = millis();
    Serial.printf("Berat: %.3f kg\n", scale.get_units(3));
  }
}
