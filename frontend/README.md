# Frontend - GEN APHYAH (Vite + React + TypeScript + PWA)

Aplikasi frontend modern yang dibangun menggunakan kombinasi **Vite**, **React 19**, **TypeScript**, dan **Progressive Web App (PWA)** via `vite-plugin-pwa`.

---

## 🚀 Fitur Utama

- **Ultra-Fast Development**: Didukung oleh Vite dengan *Hot Module Replacement* (HMR) instan.
- **Strict Type-Safety**: Menggunakan TypeScript untuk menjaga stabilitas dan skalabilitas kode.
- **Progressive Web App (PWA)**:
  - Dukungan Service Worker otomatis via `vite-plugin-pwa` (Workbox).
  - Mode offline caching untuk aset statis.
  - Manifest Web App terkonfigurasi lengkap dengan ikon 192x192 dan 512x512 maskable.
  - Dapat diinstal di desktop (Chrome/Edge) maupun perangkat mobile (Android/iOS).
  - Komponen notifikasi pembaruan otomatis (`ReloadPrompt.tsx`).
- **Arsitektur Folder Modular**:
  - `components/`: Komponen UI reusable (`common/`, dll.)
  - `hooks/`: Custom hooks React (`useNetworkStatus.ts`)
  - `services/`: API client terpusat (`api.ts`)
  - `types/`: Deklarasi tipe TypeScript (`index.ts`)
  - `utils/`: Fungsi utilitas & helper (`formatDate.ts`)
- **End-to-End (E2E) Testing**: Terintegrasi dengan **Playwright** (`e2e/app.spec.ts`).
- **Vercel Ready**: File konfigurasi `vercel.json` untuk SPA rewrite routing dan dukungan variabel lingkungan `VITE_API_URL`.

---

## 📁 Struktur Direktori Workspace Frontend

```text
frontend/
├── e2e/                     # Pengujian End-to-End (Playwright)
│   └── app.spec.ts          # E2E test suite halaman utama & PWA
├── public/
│   ├── favicon.svg          # Favicon browser
│   ├── icons.svg            # Asset icon bawaan
│   ├── pwa-192x192.svg      # Ikon PWA resolusi standar
│   └── pwa-512x512.svg      # Ikon PWA resolusi tinggi / maskable
├── src/
│   ├── assets/              # Aset gambar & ilustrasi
│   ├── components/          # Komponen UI
│   │   └── common/
│   │       └── StatusBadge.tsx # Badge status jaringan PWA
│   ├── hooks/               # Custom React hooks
│   │   └── useNetworkStatus.ts # Hook pemantau status online/offline
│   ├── services/            # Service layer & API client
│   │   └── api.ts           # Client pemanggil REST API backend
│   ├── types/               # Type definition TypeScript
│   │   └── index.ts         # Interface model backend & state
│   ├── utils/               # Fungsi pembantu (helper)
│   │   └── formatDate.ts    # Formatter tanggal/waktu Indonesia
│   ├── App.css              # Styling dashboard utama
│   ├── App.tsx              # Komponen utama dengan tes koneksi backend
│   ├── index.css            # Styling global dasar
│   ├── main.tsx             # Entry point React DOM
│   ├── ReloadPrompt.tsx     # Komponen notifikasi update Service Worker
│   └── vite-env.d.ts        # Deklarasi tipe Vite & PWA Client
├── .env.example             # Contoh variabel lingkungan
├── .gitignore               # Aturan ignore khusus frontend
├── index.html               # Template HTML & meta tag PWA
├── package.json             # Dependensi & skrip npm
├── playwright.config.ts     # Konfigurasi Playwright E2E
├── tsconfig.json            # Konfigurasi TypeScript utama
├── tsconfig.app.json        # Konfigurasi TypeScript aplikasi
├── vercel.json              # Konfigurasi deployment Vercel
└── vite.config.ts           # Konfigurasi Vite & plugin PWA
```

---

## 🛠️ Prasyarat

- **Node.js**: Versi `>= 18` (Direkomendasikan versi LTS: Node 20 / 22)
- **npm**: Versi `>= 9`

---

## 📦 Panduan Menjalankan & Testing Lokal

### 1. Masuk ke Direktori Frontend & Instalasi
```bash
cd frontend
npm install
```

### 2. Menjalankan Server Development
```bash
npm run dev
```
Aplikasi akan aktif di alamat: `http://localhost:5173`.

### 3. Menjalankan End-to-End (E2E) Test
```bash
npm run test:e2e
```

### 4. Build untuk Produksi
```bash
npm run build
```

---

## ☁️ Panduan Deploy ke Vercel (Terpisah)

Frontend dapat di-deploy ke Vercel secara independen:

1. **Buka Dashboard Vercel**: Masuk ke [vercel.com](https://vercel.com/) dan pilih **Add New > Project**.
2. **Pilih Repository**: Impor repository `GEN_APHYAH`.
3. **Atur Root Directory**:
   - Klik tombol **Edit** di samping *Root Directory*.
   - Pilih folder **`frontend`**.
4. **Build & Output Settings**:
   - **Framework Preset**: `Vite` (terdeteksi otomatis).
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.
5. **Environment Variables**:
   - Tambahkan variabel:
     - `VITE_API_URL`: Masukkan URL domain backend Vercel Anda (misal: `https://gen-aphyah-backend.vercel.app`).
6. **Klik Deploy**: Vercel akan mem-build aplikasi dan menerbitkan URL frontend PWA aktif Anda.
