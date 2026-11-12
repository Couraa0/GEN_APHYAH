import { defineConfig } from 'prisma/config';

// Prisma 7 tidak lagi membaca .env sendiri. Di Vercel variabel sudah ada di environment.
try {
  process.loadEnvFile();
} catch {
  // tidak ada file .env: pakai environment apa adanya
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
