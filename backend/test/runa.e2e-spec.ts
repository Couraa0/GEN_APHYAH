import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { hashPassword } from './../src/auth/password.js';
import { PrismaService } from './../src/prisma.service.js';

// Alur inti RUNA: login & role, pengumpulan idempotent, stok dari ledger,
// timbangan IoT, penjualan, permintaan marketplace, pilot plastik, laporan.
describe('RUNA core flows (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const token: Record<string, string> = {};
  let pointId: string;
  let plastikId: string;
  let buyerId: string;

  const http = () => request(app.getHttpServer());
  const as = (role: string) => ({ Authorization: `Bearer ${token[role]}` });
  const stockOf = async (categoryId: string) => {
    const res = await http().get('/api/inventory').set(as('pengurus')).expect(200);
    return Number(res.body.find((c: any) => c.id === categoryId).stockKg);
  };
  const collect = (weightKg: number, key = randomUUID(), extra = {}) =>
    http()
      .post('/api/collections')
      .set(as('petugas'))
      .set('Idempotency-Key', key)
      .send({
        collectionPointId: pointId,
        wasteCategoryId: plastikId,
        weightKg,
        recordedAt: new Date().toISOString(),
        ...extra,
      });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} CASCADE`,
    );

    pointId = (await prisma.collectionPoint.create({ data: { name: 'Titik 1' } })).id;
    plastikId = (
      await prisma.wasteCategory.create({ data: { name: 'Plastik', listed: true } })
    ).id;
    buyerId = (await prisma.buyer.create({ data: { name: 'Pengepul A' } })).id;

    const passwordHash = await hashPassword('rahasia-tes-123');
    for (const [username, role] of [
      ['pengurus', 'PENGURUS'],
      ['petugas', 'PETUGAS'],
      ['mitra', 'MITRA'],
    ] as const) {
      await prisma.user.create({
        data: {
          name: username,
          username,
          role,
          passwordHash,
          buyerId: role === 'MITRA' ? buyerId : null,
        },
      });
      const res = await http()
        .post('/api/auth/login')
        .send({ username, password: 'rahasia-tes-123' })
        .expect(200);
      token[username] = res.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('menolak password salah dan request tanpa login', async () => {
    await http()
      .post('/api/auth/login')
      .send({ username: 'pengurus', password: 'salah' })
      .expect(401);
    await http().get('/api/collections').expect(401);
  });

  it('mengunci login sementara setelah 5 kali password salah', async () => {
    await prisma.user.create({
      data: {
        name: 'kunci',
        username: 'kunci',
        role: 'PETUGAS',
        passwordHash: await hashPassword('rahasia-tes-123'),
      },
    });
    const login = (password: string) =>
      http().post('/api/auth/login').send({ username: 'kunci', password });

    for (let i = 0; i < 5; i++) await login('salah').expect(401);
    // Terkunci: password yang benar pun ditolak.
    await login('rahasia-tes-123').expect(429);

    // Setelah masa kunci lewat, login berhasil dan hitungannya kembali nol.
    await prisma.user.update({
      where: { username: 'kunci' },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });
    await login('rahasia-tes-123').expect(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { username: 'kunci' } });
    expect([user.failedLogins, user.lockedUntil]).toEqual([0, null]);
  });

  it('membatasi akses sesuai role', async () => {
    await http()
      .post('/api/sales')
      .set(as('petugas'))
      .send({ buyerId, wasteCategoryId: plastikId, weightKg: 1, pricePerKg: 1 })
      .expect(403);
    await http().get('/api/collections').set(as('mitra')).expect(403);
    await http().get('/api/marketplace/listings').set(as('mitra')).expect(200);
  });

  it('menolak input pengumpulan yang tidak valid', async () => {
    await collect(-5).expect(400);
    await collect(5, 'bukan-uuid').expect(400);
  });

  it('pengumpulan menambah stok, dan kirim ulang tidak menggandakan', async () => {
    const key = randomUUID();
    const first = await collect(12.5, key).expect(201);
    const retry = await collect(12.5, key).expect(201);

    expect(retry.body.id).toBe(first.body.id);
    expect(await stockOf(plastikId)).toBe(12.5);
    expect(await prisma.collectionTransaction.count()).toBe(1);
  });

  it('berat dari timbangan IoT dipakai sekali dan menjadi berat resmi', async () => {
    const reading = { deviceId: 'RUNA-SCALE-001', weightKg: 7.25 };
    await http()
      .post('/api/weighing')
      .set('X-Device-Key', 'kunci-salah')
      .send(reading)
      .expect(401);
    const weighing = await http()
      .post('/api/weighing')
      .set('X-Device-Key', 'e2e-only-device-key')
      .send(reading)
      .expect(201);

    // Klien mengirim 999, tetapi yang tercatat adalah berat dari timbangan.
    const tx = await collect(999, randomUUID(), {
      weighingRecordId: weighing.body.id,
    }).expect(201);
    expect(Number(tx.body.weightKg)).toBe(7.25);
    expect(await stockOf(plastikId)).toBe(19.75);

    await collect(1, randomUUID(), { weighingRecordId: weighing.body.id }).expect(409);
    const pending = await http().get('/api/weighing').set(as('petugas')).expect(200);
    expect(pending.body).toHaveLength(0);
  });

  it('penjualan mengurangi stok dan ditolak bila melebihi saldo', async () => {
    const sale = { buyerId, wasteCategoryId: plastikId, pricePerKg: 2500 };
    await http()
      .post('/api/sales')
      .set(as('pengurus'))
      .send({ ...sale, weightKg: 100 })
      .expect(409);

    const ok = await http()
      .post('/api/sales')
      .set(as('pengurus'))
      .send({ ...sale, weightKg: 9.75 })
      .expect(201);
    expect(Number(ok.body.totalAmount)).toBe(24375);
    expect(await stockOf(plastikId)).toBe(10);
  });

  it('permintaan marketplace: mitra meminta, pengurus menyetujui dan menyelesaikan', async () => {
    const created = await http()
      .post('/api/marketplace/requests')
      .set(as('mitra'))
      .send({ wasteCategoryId: plastikId, quantityKg: 4 })
      .expect(201);
    expect(created.body.buyerId).toBe(buyerId);

    // Belum disetujui: belum boleh diselesaikan.
    const complete = () =>
      http()
        .post('/api/sales')
        .set(as('pengurus'))
        .send({ requestId: created.body.id, weightKg: 4, pricePerKg: 3000 });
    await complete().expect(409);

    await http()
      .patch(`/api/marketplace/requests/${created.body.id}`)
      .set(as('pengurus'))
      .send({ status: 'APPROVED' })
      .expect(200);
    await complete().expect(201);

    const list = await http()
      .get('/api/marketplace/requests')
      .set(as('mitra'))
      .expect(200);
    expect(list.body[0].status).toBe('COMPLETED');
    expect(await stockOf(plastikId)).toBe(6);
  });

  it('eksperimen plastik mengeluarkan stok sebagai pengolahan', async () => {
    await http()
      .post('/api/plastic/experiments')
      .set(as('pengurus'))
      .send({
        code: 'PB-001',
        wasteCategoryId: plastikId,
        plasticWeightKg: 2,
        prototypeCount: 3,
        conductedAt: new Date().toISOString(),
      })
      .expect(201);
    expect(await stockOf(plastikId)).toBe(4);
  });

  it('batch BSF mencatat pakan dan panen', async () => {
    const batch = await http()
      .post('/api/organic/batches')
      .set(as('petugas'))
      .send({ code: 'BSF-001', startedAt: new Date().toISOString() })
      .expect(201);
    const record = (type: string, weightKg?: number) =>
      http()
        .post(`/api/organic/batches/${batch.body.id}/records`)
        .set(as('petugas'))
        .send({ type, weightKg, recordedAt: new Date().toISOString() });
    await record('FEEDING', 10).expect(201);
    await record('HARVEST', 1.5).expect(201);
    await record('HARVEST').expect(400); // panen tanpa berat
  });

  it('laporan dan dashboard merangkum seluruh alur', async () => {
    const report = await http().get('/api/reports').set(as('pengurus')).expect(200);
    expect(Number(report.body.collected.totalKg)).toBe(19.75);
    expect(report.body.collected.count).toBe(2);
    expect(Number(report.body.sold.totalKg)).toBe(13.75);
    expect(Number(report.body.sold.totalAmount)).toBe(36375);
    expect(Number(report.body.plastic.processedKg)).toBe(2);
    expect(report.body.plastic.prototypes).toBe(3);
    expect(Number(report.body.organic.feedingKg)).toBe(10);
    expect(Number(report.body.organic.harvestKg)).toBe(1.5);

    const dashboard = await http().get('/api/dashboard').set(as('pengurus')).expect(200);
    expect(dashboard.body.trend).toHaveLength(1);
    expect(dashboard.body.trend[0].weightKg).toBe(19.75);
    expect(dashboard.body.stock).toHaveLength(1);
  });

  it('mencatat perubahan data ke audit log', async () => {
    const logs = await prisma.auditLog.count({
      where: { method: 'POST', path: '/api/collections', statusCode: 201 },
    });
    expect(logs).toBeGreaterThanOrEqual(2);
  });
});
