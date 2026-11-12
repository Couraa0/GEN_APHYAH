import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CurrentUser, MANAGERS, Roles, STAFF } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth.guard.js';
import { RequestStatus, Role } from '../generated/prisma/client.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { PrismaService } from '../prisma.service.js';
import { MarketplaceService } from './marketplace.service.js';

class CreateRequestDto {
  /** Diisi staf. Untuk akun MITRA diabaikan: selalu pembeli milik akun itu. */
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @IsUUID()
  wasteCategoryId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Max(100000)
  quantityKg: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  offeredPricePerKg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class DecideRequestDto {
  @IsIn([RequestStatus.APPROVED, RequestStatus.REJECTED])
  status: RequestStatus;
}

class CreateSaleDto {
  /** Menyelesaikan permintaan yang sudah disetujui; pembeli dan kategori mengikuti permintaan. */
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @IsOptional()
  @IsUUID()
  wasteCategoryId?: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Max(100000)
  weightKg: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerKg: number;

  @IsOptional()
  @IsDateString()
  soldAt?: string;
}

const requestInclude = {
  buyer: { select: { name: true } },
  wasteCategory: { select: { name: true } },
  sale: { select: { id: true, weightKg: true, totalAmount: true } },
} as const;

const WITH_MITRA = [...STAFF, Role.MITRA];

@ApiTags('Marketplace')
@ApiBearerAuth()
@Controller('api')
export class MarketplaceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly marketplace: MarketplaceService,
  ) {}

  /** Katalog: kategori yang ditawarkan beserta stok tersedia. */
  @Roles(...WITH_MITRA)
  @Get('marketplace/listings')
  async listings() {
    const stock = await this.inventory.stock();
    return stock
      .filter((c) => c.listed)
      .map(({ id, name, pricePerKg, stockKg }) => ({
        id,
        name,
        pricePerKg,
        stockKg,
      }));
  }

  @Roles(...WITH_MITRA)
  @Get('marketplace/requests')
  requests(@CurrentUser() user: AuthUser) {
    // Akun MITRA hanya melihat permintaannya sendiri.
    if (user.role === Role.MITRA && !user.buyerId) return [];
    return this.prisma.marketplaceRequest.findMany({
      where: user.role === Role.MITRA ? { buyerId: user.buyerId! } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: requestInclude,
    });
  }

  @Roles(...WITH_MITRA)
  @Post('marketplace/requests')
  async createRequest(
    @Body() dto: CreateRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    const buyerId = user.role === Role.MITRA ? user.buyerId : dto.buyerId;
    if (!buyerId) {
      throw new BadRequestException('Pembeli (buyerId) wajib diisi');
    }
    const category = await this.prisma.wasteCategory.findUnique({
      where: { id: dto.wasteCategoryId },
    });
    if (!category?.listed || !category.active) {
      throw new BadRequestException('Material tidak ada di katalog');
    }
    return this.prisma.marketplaceRequest.create({
      data: { ...dto, buyerId },
      include: requestInclude,
    });
  }

  /** Setujui atau tolak permintaan yang masih menunggu. */
  @Roles(...MANAGERS)
  @Patch('marketplace/requests/:id')
  async decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideRequestDto,
  ) {
    const { count } = await this.prisma.marketplaceRequest.updateMany({
      where: { id, status: RequestStatus.PENDING },
      data: { status: dto.status },
    });
    if (!count) {
      throw new ConflictException('Permintaan tidak ditemukan atau sudah diputuskan');
    }
    return this.prisma.marketplaceRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
  }

  @Roles(...MANAGERS)
  @Get('sales')
  sales() {
    return this.prisma.sale.findMany({
      orderBy: { soldAt: 'desc' },
      take: 200,
      include: {
        buyer: { select: { name: true } },
        wasteCategory: { select: { name: true } },
      },
    });
  }

  @Roles(...MANAGERS)
  @Post('sales')
  sell(@Body() dto: CreateSaleDto, @CurrentUser() user: AuthUser) {
    return this.marketplace.sell(dto, user.id);
  }
}
