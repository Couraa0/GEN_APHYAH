import { ConflictException, Injectable } from '@nestjs/common';
import {
  CollectionType,
  MovementType,
  Prisma,
  WeighingStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';

export interface NewCollection {
  collectionPointId: string;
  wasteCategoryId: string;
  householdId?: string;
  weightKg: number;
  collectionType?: CollectionType;
  recordedAt: string;
  weighingRecordId?: string;
}

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Simpan transaksi pengumpulan + stok masuk dalam satu transaksi database.
   * Idempotent: kunci yang sama (kirim ulang dari antrean offline) mengembalikan
   * transaksi yang sudah ada, tidak membuat yang baru.
   */
  async create(input: NewCollection, userId: string, clientMutationId: string) {
    const find = () =>
      this.prisma.collectionTransaction.findUnique({
        where: { clientMutationId },
      });

    const existing = await find();
    if (existing) return existing;

    const { weighingRecordId, ...data } = input;
    try {
      return await this.prisma.$transaction(async (tx) => {
        let weightKg: number | Prisma.Decimal = data.weightKg;

        if (weighingRecordId) {
          // Berat dari timbangan IoT adalah yang resmi, bukan angka kiriman klien.
          const weighing = await tx.weighingRecord.findUnique({
            where: { id: weighingRecordId },
          });
          if (weighing?.status !== WeighingStatus.PENDING) {
            throw new ConflictException(
              'Data timbangan tidak ditemukan atau sudah dipakai',
            );
          }
          weightKg = weighing.weightKg;
        }

        const created = await tx.collectionTransaction.create({
          data: {
            ...data,
            weightKg,
            recordedById: userId,
            clientMutationId,
            movement: {
              create: {
                wasteCategoryId: data.wasteCategoryId,
                type: MovementType.COLLECTION,
                quantityKg: weightKg,
                recordedById: userId,
              },
            },
          },
        });

        if (weighingRecordId) {
          // where status PENDING: bila dua petugas memakai timbangan yang sama, hanya satu yang lolos.
          const { count } = await tx.weighingRecord.updateMany({
            where: { id: weighingRecordId, status: WeighingStatus.PENDING },
            data: {
              status: WeighingStatus.USED,
              collectionTransactionId: created.id,
            },
          });
          if (!count) {
            throw new ConflictException('Data timbangan sudah dipakai');
          }
        }
        return created;
      });
    } catch (err) {
      // Dua kiriman dengan kunci sama tiba bersamaan: yang kalah mengambil hasil yang menang.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const winner = await find();
        if (winner) return winner;
      }
      throw err;
    }
  }
}
