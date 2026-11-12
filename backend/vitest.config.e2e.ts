import { defineConfig } from 'vitest/config';

try {
  process.loadEnvFile();
} catch {
  // tidak ada file .env
}

// Tes e2e MENGHAPUS seluruh isi database yang dipakainya, jadi harus database
// terpisah dari development. Jalankan `npm run db:test` untuk membuatnya.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error('Set TEST_DATABASE_URL di .env sebelum menjalankan tes e2e');
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: './test/global-setup.ts',
    fileParallelism: false,
    env: {
      DATABASE_URL: testDatabaseUrl,
      JWT_SECRET: 'e2e-only-secret',
      IOT_DEVICE_KEY: 'e2e-only-device-key',
    },
  },
});
