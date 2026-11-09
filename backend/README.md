# Backend - GEN APHYAH (NestJS + TypeScript)

Backend server yang dibangun menggunakan framework **NestJS** berbasis arsitektur modular, Dependency Injection, TypeScript, dan dokumentasi OpenAPI (**Swagger**).

---

## 🚀 Fitur Utama

- **Dokumentasi Swagger OpenAPI**:
  - Swagger UI terpasang dan dapat diakses langsung pada path:
    - **`http://localhost:3000/docs`**
    - **`http://localhost:3000/api/docs`**
  - Dilengkapi skema interaktif, DTO model (`StatusResponseDto`), dan fitur *Try it out* untuk menguji API secara langsung dari browser.
- **Arsitektur Modular & Bersih**: Mengadopsi pola *Controller-Service-Module* yang memudahkan skalabilitas dan *clean architecture*.
- **CORS Diaktifkan**: Telah dikonfigurasi `app.enableCors()` di `src/main.ts` agar frontend dapat berkomunikasi secara aman tanpa kendala Cross-Origin Resource Sharing.
- **Struktur Workspace Terorganisir**:
  - `src/common/`: Folder DTO, Filter exception global (`http-exception.filter.ts`), interceptor, dan decorator.
  - `src/config/`: Konfigurasi environment & port terpusat (`configuration.ts`).
  - `src/`: Root application controller, service, dan module.
- **RESTful Endpoints Bawaan**:
  - `GET /` -> Mengembalikan `Hello World!`
  - `GET /api/status` -> Mengembalikan status server, nama service, versi, dan timestamp.
- **Modern Testing Suite**: Menggunakan **Vitest** untuk unit test dan end-to-end (e2e) testing dengan eksekusi yang sangat cepat.
- **Linter & Formatter**: Terintegrasi dengan Prettier dan Oxlint untuk standarisasi penulisan kode.

---

## 📁 Struktur Direktori Workspace Backend

```text
backend/
├── src/
│   ├── common/                 # Komponen umum & reusable
│   │   ├── dto/                # Data Transfer Objects & Swagger schemas
│   │   │   └── status-response.dto.ts
│   │   └── filters/            # Global Exception Filters
│   │       └── http-exception.filter.ts
│   ├── config/                 # Konfigurasi aplikasi & environment
│   │   └── configuration.ts
│   ├── app.controller.spec.ts  # Unit testing untuk AppController
│   ├── app.controller.ts       # Endpoint handler & Swagger decorators
│   ├── app.module.ts           # Root module aplikasi
│   ├── app.service.ts          # Business logic & data provider
│   └── main.ts                 # Bootstrap NestJS, CORS & Swagger setup
├── test/
│   └── app.e2e-spec.ts         # End-to-end integration testing (Vitest + Supertest)
├── .gitignore                  # Aturan ignore khusus backend
├── nest-cli.json               # Konfigurasi Nest CLI
├── package.json                # Dependensi & skrip npm
├── tsconfig.json               # Konfigurasi TypeScript
├── tsconfig.build.json         # Konfigurasi kompilasi build produksi
└── vitest.config.ts            # Konfigurasi pengujian Vitest
```

---

## 🛠️ Prasyarat

- **Node.js**: Versi `>= 18` (Direkomendasikan Node 20 / 22)
- **npm**: Versi `>= 9`

---

## 📦 Panduan Instalasi & Menjalankan

### 1. Masuk ke Direktori Backend
```bash
cd backend
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Menjalankan Server Development
```bash
npm run start:dev
```
Server akan aktif di: `http://localhost:3000` dengan fitur *auto-reload* (watch mode).

### 4. Mengakses Dokumentasi Swagger
Buka browser dan kunjungi:
```text
http://localhost:3000/docs
```
Atau alternatif path:
```text
http://localhost:3000/api/docs
```

### 5. Menjalankan Pengujian (Testing)
- **Unit Test (Vitest)**:
  ```bash
  npm run test
  ```
- **End-to-End Test (E2E)**:
  ```bash
  npm run test:e2e
  ```
- **Unit Test Watch Mode**:
  ```bash
  npm run test:watch
  ```

### 6. Build untuk Produksi
```bash
npm run build
```
Output kompilasi JavaScript akan tersimpan di dalam folder `dist/`.

### 7. Menjalankan Server Produksi
```bash
npm run start:prod
```

---

## 🌐 Daftar Endpoint API

| Method | Endpoint | Deskripsi | Swagger Tag | Contoh Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Hello World greeting endpoint | `Core` | `"Hello World!"` |
| `GET` | `/api/status` | Health check & info status service | `Core` | `{"status":"ok","service":"GEN_APHYAH Backend (NestJS)","version":"1.0.0","timestamp":"..."}` |
| `GET` | `/docs` | **Swagger UI OpenAPI Documentation** | System | Halaman Web Interaktif Swagger |
| `GET` | `/api/docs` | Swagger UI OpenAPI Documentation (Alias) | System | Halaman Web Interaktif Swagger |

---

## ⚙️ Konfigurasi Environment & Port

Secara default, aplikasi berjalan pada port `3000`. Port dapat disesuaikan menggunakan environment variable `PORT`:
```bash
# Contoh di PowerShell (Windows)
$env:PORT="4000"; npm run start:dev

# Contoh di Bash (Linux/macOS)
PORT=4000 npm run start:dev
```
