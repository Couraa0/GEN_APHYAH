import {
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
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  BatchStatus,
  OrganicRecordType,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';

class CreateBatchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code: string;

  @IsDateString()
  startedAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

class UpdateBatchDto {
  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

class CreateRecordDto {
  /** FEEDING = pakan organik masuk, HARVEST = panen larva, FRASS = residu, OBSERVATION = catatan. */
  @IsEnum(OrganicRecordType)
  type: OrganicRecordType;

  /** Wajib kecuali untuk OBSERVATION. */
  @ValidateIf(
    (o) => o.type !== OrganicRecordType.OBSERVATION || o.weightKg != null,
  )
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Max(100000)
  weightKg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsDateString()
  recordedAt: string;
}

/** Pencatatan pilot Maggot BSF. Sistem hanya mencatat, tidak mengendalikan proses budidaya. */
@ApiTags('Organic (Maggot BSF)')
@ApiBearerAuth()
@Controller('api/organic/batches')
export class OrganicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.organicBatch.findMany({
      orderBy: { startedAt: 'desc' },
      include: { records: { orderBy: { recordedAt: 'desc' } } },
    });
  }

  @Post()
  create(@Body() dto: CreateBatchDto) {
    return this.prisma.organicBatch.create({
      data: dto,
      include: { records: true },
    });
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBatchDto) {
    return this.prisma.organicBatch.update({ where: { id }, data: dto });
  }

  @Post(':id/records')
  async addRecord(
    @Param('id', ParseUUIDPipe) batchId: string,
    @Body() dto: CreateRecordDto,
  ) {
    const batch = await this.prisma.organicBatch.findUniqueOrThrow({
      where: { id: batchId },
    });
    if (batch.status !== BatchStatus.ACTIVE) {
      throw new ConflictException('Batch sudah ditutup');
    }
    return this.prisma.organicRecord.create({ data: { ...dto, batchId } });
  }
}
