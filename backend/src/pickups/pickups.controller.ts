import {
  Body,
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
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { MANAGERS, Roles } from '../auth/auth.guard.js';
import { PickupStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';

class CreatePickupDto {
  @IsUUID()
  collectionPointId: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

class UpdatePickupDto {
  @IsOptional()
  @IsEnum(PickupStatus)
  status?: PickupStatus;

  /** Wajib saat status DONE: berat yang benar-benar dipindahkan. */
  @ValidateIf((o) => o.status === PickupStatus.DONE || o.movedWeightKg != null)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(100000)
  movedWeightKg?: number;

  /** Pengepul atau mitra penerima material. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  handedOverTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

const include = {
  collectionPoint: { select: { name: true } },
  assignedTo: { select: { name: true } },
} as const;

@ApiTags('Pickups')
@ApiBearerAuth()
@Controller('api/pickups')
export class PickupsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.pickupSchedule.findMany({
      orderBy: { scheduledAt: 'desc' },
      take: 200,
      include,
    });
  }

  @Roles(...MANAGERS)
  @Post()
  create(@Body() dto: CreatePickupDto) {
    return this.prisma.pickupSchedule.create({ data: dto, include });
  }

  /** Petugas memperbarui status dan mencatat berat yang dipindahkan. */
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePickupDto) {
    return this.prisma.pickupSchedule.update({
      where: { id },
      data: dto,
      include,
    });
  }
}
