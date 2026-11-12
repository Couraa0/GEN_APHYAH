import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  NotEquals,
} from 'class-validator';
import { CurrentUser, MANAGERS, Roles } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth.guard.js';
import { MovementType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import { InventoryService } from './inventory.service.js';

class AdjustStockDto {
  @IsUUID()
  wasteCategoryId: string;

  /** Positif menambah stok, negatif mengurangi. */
  @IsNumber({ maxDecimalPlaces: 3 })
  @NotEquals(0)
  quantityKg: number;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  note: string;
}

class QueryMovementsDto {
  @IsOptional()
  @IsUUID()
  wasteCategoryId?: string;
}

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('api/inventory')
export class InventoryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  @Get()
  stock() {
    return this.inventory.stock();
  }

  @Get('movements')
  movements(@Query() query: QueryMovementsDto) {
    return this.prisma.inventoryMovement.findMany({
      where: { wasteCategoryId: query.wasteCategoryId },
      orderBy: { createdAt: 'desc' },
      take: 200, // ponytail: 200 terbaru tanpa pagination; tambah cursor bila riwayat perlu ditelusuri jauh
      include: {
        wasteCategory: { select: { name: true } },
        recordedBy: { select: { name: true } },
      },
    });
  }

  /** Penyesuaian manual (koreksi, susut, pemindahan keluar). Penjualan lewat /api/sales. */
  @Roles(...MANAGERS)
  @Post('movements')
  adjust(@Body() dto: AdjustStockDto, @CurrentUser() user: AuthUser) {
    const base = {
      wasteCategoryId: dto.wasteCategoryId,
      type: MovementType.ADJUSTMENT,
      note: dto.note,
      recordedById: user.id,
    };
    if (dto.quantityKg > 0) {
      return this.prisma.inventoryMovement.create({
        data: { ...base, quantityKg: dto.quantityKg },
      });
    }
    return this.inventory.transaction((tx) =>
      this.inventory.withdraw(tx, { ...base, quantityKg: -dto.quantityKg }),
    );
  }
}
