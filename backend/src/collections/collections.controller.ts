import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  isUUID,
  IsUUID,
  Max,
} from 'class-validator';
import { CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth.guard.js';
import { dateRange, DateRangeDto } from '../common/date-range.dto.js';
import { CollectionType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import { CollectionsService } from './collections.service.js';

class CreateCollectionDto {
  @IsUUID()
  collectionPointId: string;

  @IsUUID()
  wasteCategoryId: string;

  /** Kosongkan bila material hasil konsolidasi beberapa rumah tangga. */
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Max(10000)
  weightKg: number;

  @IsOptional()
  @IsEnum(CollectionType)
  collectionType?: CollectionType;

  @IsDateString()
  recordedAt: string;

  /** Isi bila berat diambil dari timbangan IoT; berat resmi mengikuti data timbangan. */
  @IsOptional()
  @IsUUID()
  weighingRecordId?: string;
}

class QueryCollectionsDto extends DateRangeDto {
  @IsOptional()
  @IsUUID()
  collectionPointId?: string;
}

@ApiTags('Collections')
@ApiBearerAuth()
@Controller('api/collections')
export class CollectionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collections: CollectionsService,
  ) {}

  @Get()
  list(@Query() query: QueryCollectionsDto) {
    return this.prisma.collectionTransaction.findMany({
      where: {
        collectionPointId: query.collectionPointId,
        recordedAt: dateRange(query),
      },
      orderBy: { recordedAt: 'desc' },
      take: 200, // ponytail: 200 terbaru tanpa pagination; tambah cursor bila riwayat perlu ditelusuri jauh
      include: {
        collectionPoint: { select: { name: true } },
        wasteCategory: { select: { name: true } },
        household: { select: { name: true } },
        recordedBy: { select: { name: true } },
        weighing: { select: { deviceId: true } },
      },
    });
  }

  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'UUID buatan klien, satu per transaksi',
    required: true,
  })
  @Post()
  create(
    @Body() dto: CreateCollectionDto,
    @Headers('idempotency-key') key: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!isUUID(key)) {
      throw new BadRequestException('Header Idempotency-Key harus berupa UUID');
    }
    return this.collections.create(dto, user.id, key);
  }
}
