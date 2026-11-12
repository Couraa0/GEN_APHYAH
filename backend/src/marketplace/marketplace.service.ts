import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  MovementType,
  Prisma,
  RequestStatus,
} from '../generated/prisma/client.js';
import { InventoryService } from '../inventory/inventory.service.js';

export interface NewSale {
  requestId?: string;
  buyerId?: string;
  wasteCategoryId?: string;
  weightKg: number;
  pricePerKg: number;
  soldAt?: string;
}

@Injectable()
export class MarketplaceService {
  constructor(private readonly inventory: InventoryService) {}

  /**
   * Catat penjualan: stok keluar + transaksi + (bila dari permintaan) permintaan
   * selesai, semuanya dalam satu transaksi database.
   */
  sell(input: NewSale, userId: string) {
    return this.inventory.transaction(async (tx) => {
      let { buyerId, wasteCategoryId } = input;

      if (input.requestId) {
        const request = await tx.marketplaceRequest.findUnique({
          where: { id: input.requestId },
        });
        if (request?.status !== RequestStatus.APPROVED) {
          throw new ConflictException(
            'Permintaan harus berstatus disetujui sebelum diselesaikan',
          );
        }
        ({ buyerId, wasteCategoryId } = request);
        await tx.marketplaceRequest.update({
          where: { id: request.id },
          data: { status: RequestStatus.COMPLETED },
        });
      }
      if (!buyerId || !wasteCategoryId) {
        throw new BadRequestException(
          'Isi requestId, atau buyerId dan wasteCategoryId',
        );
      }

      const sale = await tx.sale.create({
        data: {
          buyerId,
          wasteCategoryId,
          requestId: input.requestId,
          weightKg: input.weightKg,
          pricePerKg: input.pricePerKg,
          totalAmount: new Prisma.Decimal(input.weightKg)
            .mul(input.pricePerKg)
            .toDecimalPlaces(2),
          soldAt: input.soldAt ?? new Date(),
        },
      });
      await this.inventory.withdraw(tx, {
        wasteCategoryId,
        quantityKg: input.weightKg,
        type: MovementType.SALE,
        recordedById: userId,
        saleId: sale.id,
      });
      return sale;
    });
  }
}
