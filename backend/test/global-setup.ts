import { execSync } from 'node:child_process';

// Terapkan migrasi ke database tes sebelum tes berjalan.
// DIRECT_URL ikut ditimpa: kalau tidak, migrasi tes akan lari ke database di .env (Supabase).
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
