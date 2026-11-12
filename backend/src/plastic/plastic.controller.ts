import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth.guard.js';
import { MovementType } from '../generated/prisma/client.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { PrismaService } from '../prisma.service.js';

class CreateExperimentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code: string;

  /** Kategori plastik yang dipakai; beratnya dikeluarkan dari stok. */
  @IsUUID()
  wasteCategoryId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Max(100000)
  plasticWeightKg: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  composition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  method?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  partner?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  prototypeCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  testResult?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  evaluation?: string;

  @IsDateString()
  conductedAt: string;
}

// Berat dan kategori tidak bisa diubah setelah dicatat: sudah masuk ledger stok.
class UpdateExperimentDto extends PartialType(
  OmitType(CreateExperimentDto, [
    'code',
    'wasteCategoryId',
    'plasticWeightKg',
  ] as const),
) {}

const include = { wasteCategory: { select: { name: true } } } as const;

/**
 * Pencatatan eksperimen prototipe paving block. Prototipe belum boleh dianggap
 * layak pakai atau dipasarkan sebelum lolos uji teknis dan keselamatan.
 */
@ApiTags('Plastic (Paving Block)')
@ApiBearerAuth()
@Controller('api/plastic/experiments')
export class PlasticController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  @Get()
  list() {
    return this.prisma.plasticExperiment.findMany({
      orderBy: { conductedAt: 'desc' },
      include,
    });
  }

  @Post()
  create(@Body() dto: CreateExperimentDto, @CurrentUser() user: AuthUser) {
    return this.inventory.transaction(async (tx) => {
      const experiment = await tx.plasticExperiment.create({
        data: dto,
        include,
      });
      await this.inventory.withdraw(tx, {
        wasteCategoryId: dto.wasteCategoryId,
        quantityKg: dto.plasticWeightKg,
        type: MovementType.PROCESSING,
        recordedById: user.id,
        plasticExperimentId: experiment.id,
      });
      return experiment;
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExperimentDto,
  ) {
    return this.prisma.plasticExperiment.update({
      where: { id },
      data: dto,
      include,
    });
  }
}
