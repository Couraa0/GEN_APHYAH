# Backend - GEN APHYAH (NestJS + TypeScript)

Backend server yang dibangun menggunakan framework **NestJS** berbasis arsitektur modular, Dependency Injection, TypeScript, dokumentasi OpenAPI (**Swagger**), dan siap di-deploy secara serverless ke **Vercel**.

---

## 🚀 Fitur Utama

- **Vercel Serverless Ready**:
  - Telah disiapkan handler serverless di `src/main.ts` dan konfigurasi `vercel.json` dengan `@vercel/node`.
  - Otomatis beralih antara standalone mode saat dijalankan di lokal dan serverless function saat berjalan di Vercel (`process.env.VERCEL`).
- **Dokumentasi Swagger OpenAPI**:
  - Swagger UI terpasang dan dapat diakses langsung pada:
    - **`http://localhost:3000/docs`** (lokal) atau **`https://your-backend.vercel.app/docs`** (produksi)
    - Path alias: `/api/docs`
  - Dilengkapi skema interaktif, DTO model (`StatusResponseDto`), dan fitur *Try it out* untuk menguji API secara langsung dari browser.
- **Arsitektur Modular & Bersih**: Mengadopsi pola *Controller-Service-Module* yang memudahkan skalabilitas dan *clean architecture*.
- **CORS Diaktifkan**: Telah dikonfigurasi `app.enableCors()` di `src/main.ts`.
- **Struktur Workspace Terorganisir**:
  - `src/common/`: Folder DTO, Filter exception global (`http-exception.filter.ts`), interceptor, dan decorator.
  - `src/config/`: Konfigurasi environment & port terpusat (`configuration.ts`).
  - `src/`: Root application controller, service, dan module.
- **RESTful Endpoints Bawaan**:
  - `GET /` -> Mengembalikan `Hello World!`
  - `GET /api/status` -> Mengembalikan status server, nama service, versi, dan timestamp.
- **Modern Testing Suite**: Menggunakan **Vitest** untuk unit test dan end-to-end (e2e) testing.

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
│   └── main.ts                 # Bootstrap NestJS (Standalone & Vercel Handler)
├── test/
│   └── app.e2e-spec.ts         # End-to-end integration testing (Vitest + Supertest)
├── .env.example                # Contoh environment variables
├── .gitignore                  # Aturan ignore khusus backend
├── nest-cli.json               # Konfigurasi Nest CLI
├── package.json                # Dependensi & skrip npm
├── tsconfig.json               # Konfigurasi TypeScript
├── tsconfig.build.json         # Konfigurasi kompilasi build produksi
├── vercel.json                 # Konfigurasi serverless function Vercel
└── vitest.config.ts            # Konfigurasi pengujian Vitest
```

---

## 🛠️ Prasyarat

- **Node.js**: Versi `>= 18` (Direkomendasikan Node 20 / 22)
- **npm**: Versi `>= 9`

---

## 📦 Panduan Menjalankan & Testing Lokal

### 1. Masuk ke Direktori Backend & Instalasi
```bash
cd backend
npm install
```

### 2. Menjalankan Server Development Lokal
```bash
npm run start:dev
```
Server akan aktif di: `http://localhost:3000` dengan Swagger di `http://localhost:3000/docs`.

### 3. Menjalankan Pengujian (Testing)
- **Unit Test (Vitest)**:
  ```bash
  npm run test
  ```
- **End-to-End Test (E2E)**:
  ```bash
  npm run test:e2e
  ```

### 4. Build Kompilasi
```bash
npm run build
```

---

## ☁️ Panduan Deploy ke Vercel (Terpisah)

Backend NestJS dapat di-deploy secara terpisah ke Vercel sebagai serverless function:

1. **Buka Dashboard Vercel**: Masuk ke [vercel.com](https://vercel.com/) dan pilih **Add New > Project**.
2. **Pilih Repository**: Impor repository `GEN_APHYAH`.
3. **Atur Root Directory**:
   - Klik tombol **Edit** di samping *Root Directory*.
   - Pilih folder **`backend`**.
4. **Build & Output Settings**:
   - Vercel akan membaca file `vercel.json` secara otomatis untuk menggunakan `@vercel/node`.
   - Tidak perlu mengubah build command atau output directory manual.
5. **Environment Variables**:
   - Tambahkan variabel (opsional):
     - `NODE_ENV`: `production`
     - `CORS_ORIGIN`: `*` (atau domain frontend Vercel Anda)
6. **Klik Deploy**:
   - Setelah deploy selesai, Anda akan mendapatkan URL backend (contoh: `https://gen-aphyah-backend.vercel.app`).
   - Uji endpoint:
     - Health check: `https://gen-aphyah-backend.vercel.app/api/status`
     - Swagger UI: `https://gen-aphyah-backend.vercel.app/docs`
