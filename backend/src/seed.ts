// Data awal: akun admin, empat titik pengumpulan, dan kategori sampah.
// Aman dijalankan berulang (upsert). Jalankan: npm run seed
import { hashPassword } from './auth/password.js';
import { Role, WasteGroup } from './generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

try {
  process.loadEnvFile();
} catch {
  // tidak ada file .env
}

const password = process.env.SEED_ADMIN_PASSWORD;
if (!password || password.length < 8) {
  throw new Error('Set SEED_ADMIN_PASSWORD (minimal 8 karakter) di .env');
}

const prisma = new PrismaService();

await prisma.user.upsert({
  where: { username: 'admin' },
  update: {},
  create: {
    name: 'Administrator',
    username: 'admin',
    role: Role.ADMIN,
    passwordHash: await hashPassword(password),
  },
});

for (const n of [1, 2, 3, 4]) {
  const name = `Titik ${n} Kampung Cipatat`;
  await prisma.collectionPoint.upsert({
    where: { name },
    update: {},
    create: { name, description: 'Titik penempatan sementara di bahu jalan' },
  });
}

// Harga sengaja dikosongkan: diisi pengurus sesuai harga pengepul yang berlaku.
const categories: [string, WasteGroup, boolean][] = [
  ['Plastik', WasteGroup.ANORGANIK, true],
  ['Kardus', WasteGroup.ANORGANIK, true],
  ['Kertas', WasteGroup.ANORGANIK, true],
  ['Logam', WasteGroup.ANORGANIK, true],
  ['Organik', WasteGroup.ORGANIK, false],
  ['Residu', WasteGroup.RESIDU, false],
];
for (const [name, group, listed] of categories) {
  await prisma.wasteCategory.upsert({
    where: { name },
    update: {},
    create: { name, group, listed },
  });
}

await prisma.$disconnect();
console.log('Seed selesai: akun "admin", 4 titik pengumpulan, 6 kategori.');
