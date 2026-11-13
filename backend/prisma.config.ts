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
  // Hanya dipakai CLI Prisma (migrasi). Di Supabase, DATABASE_URL memakai transaction pooler
  // (port 6543) yang tidak cocok untuk migrasi, jadi DIRECT_URL (session pooler, 5432) didahulukan.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '' },
});
