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
  - `hooks/`: Custom hooks React (contoh: `useNetworkStatus.ts`)
  - `services/`: API client terpusat (`api.ts`)
  - `types/`: Deklarasi tipe TypeScript (`index.ts`)
  - `utils/`: Fungsi utilitas & helper (`formatDate.ts`)
- **End-to-End (E2E) Testing**: Terintegrasi dengan **Playwright** untuk pengujian alur pengguna dan PWA.
- **Proxy Integrasi Backend**:
  - Konfigurasi proxy di `vite.config.ts` untuk meneruskan request `/api` ke backend NestJS (`http://localhost:3000`).

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
├── .gitignore               # Aturan ignore khusus frontend
├── index.html               # Template HTML & meta tag PWA
├── package.json             # Dependensi & skrip npm
├── playwright.config.ts     # Konfigurasi Playwright E2E
├── tsconfig.json            # Konfigurasi TypeScript utama
├── tsconfig.app.json        # Konfigurasi TypeScript aplikasi
└── vite.config.ts           # Konfigurasi Vite & plugin PWA
```

---

## 🛠️ Prasyarat

- **Node.js**: Versi `>= 18` (Direkomendasikan versi LTS: Node 20 / 22)
- **npm**: Versi `>= 9`

---

## 📦 Panduan Menjalankan & Testing

### 1. Masuk ke Direktori Frontend
```bash
cd frontend
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Menjalankan Server Development
```bash
npm run dev
```
Aplikasi akan aktif di alamat: `http://localhost:5173`.

### 4. Menjalankan End-to-End (E2E) Test
```bash
npm run test:e2e
```
*(Catatan: Saat pertama kali menjalankan Playwright, instal browser via `npx playwright install` bila diperlukan)*.

### 5. Build untuk Produksi
```bash
npm run build
```
Hasil build beserta Service Worker (`sw.js`) dan Manifest (`manifest.webmanifest`) akan disimpan di folder `dist/`.

### 6. Menjalankan Preview Hasil Build
```bash
npm run preview
```

---

## 📱 Pengujian Fitur PWA (Progressive Web App)

1. **Memeriksa Service Worker & Manifest di DevTools**:
   - Buka aplikasi di Google Chrome / Edge (`http://localhost:5173`).
   - Tekan `F12` atau klik kanan & pilih **Inspect**.
   - Buka tab **Application**:
     - Klik menu **Manifest** untuk melihat nama, warna tema, dan ikon.
     - Klik menu **Service Workers** untuk melihat status Service Worker yang terdaftar.

2. **Menguji Mode Offline**:
   - Pada tab **Application** -> **Service Workers**, centang kotak **Offline** (atau ubah network throttling menjadi *Offline*).
   - Muat ulang (*refresh*) halaman: aplikasi tetap terbuka dengan status *PWA Offline Mode*.

3. **Instalasi Aplikasi**:
   - Klik ikon instalasi pada address bar browser untuk memasang aplikasi ke desktop atau home screen mobile.
