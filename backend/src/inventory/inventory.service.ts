import { ConflictException, Injectable } from '@nestjs/common';
import { MovementType, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';

interface Withdrawal {
  wasteCategoryId: string;
  quantityKg: number;
  type: MovementType;
  recordedById: string;
  note?: string;
  saleId?: string;
  plasticExperimentId?: string;
}

/**
 * Sumber kebenaran stok. Saldo selalu dihitung dari ledger inventory_movements
 * (positif = masuk, negatif = keluar), tidak pernah disimpan sebagai angka total.
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Saldo stok per kategori aktif. */
  async stock() {
    const [categories, sums] = await Promise.all([
      this.prisma.wasteCategory.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.inventoryMovement.groupBy({
        by: ['wasteCategoryId'],
        _sum: { quantityKg: true },
      }),
    ]);
    const byCategory = new Map(
      sums.map((s) => [s.wasteCategoryId, s._sum.quantityKg]),
    );
    return categories.map((c) => ({
      ...c,
      stockKg: byCategory.get(c.id) ?? new Prisma.Decimal(0),
    }));
  }

  /**
   * Jalankan perubahan stok keluar dalam transaksi SERIALIZABLE, sehingga dua
   * pengeluaran bersamaan tidak bisa sama-sama lolos pengecekan saldo.
   */
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  /** Catat stok keluar. Menolak bila melebihi saldo. Panggil di dalam transaction(). */
  async withdraw(tx: Prisma.TransactionClient, w: Withdrawal) {
    const { _sum } = await tx.inventoryMovement.aggregate({
      where: { wasteCategoryId: w.wasteCategoryId },
      _sum: { quantityKg: true },
    });
    const available = _sum.quantityKg ?? new Prisma.Decimal(0);
    if (available.lt(w.quantityKg)) {
      throw new ConflictException(
        `Stok tidak cukup: tersedia ${available.toString()} kg`,
      );
    }
    return tx.inventoryMovement.create({
      data: { ...w, quantityKg: -w.quantityKg },
    });
  }
}
