import { execSync } from 'node:child_process';

// Terapkan migrasi ke database tes sebelum tes berjalan.
export default function setup() {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
}
