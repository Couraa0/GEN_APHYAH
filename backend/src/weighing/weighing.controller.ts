import { createHash, timingSafeEqual } from 'node:crypto';
import {
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Public } from '../auth/auth.guard.js';
import { WeighingStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';

class DeviceReadingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  deviceId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Max(10000)
  weightKg: number;

  /** Waktu ukur dari perangkat. Kosong = waktu server saat data diterima. */
  @IsOptional()
  @IsDateString()
  measuredAt?: string;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest();

@ApiTags('Weighing (IoT)')
@Controller('api/weighing')
export class WeighingController {
  constructor(private readonly prisma: PrismaService) {}

  /** Dipanggil timbangan ESP32. Autentikasi dengan kunci perangkat, bukan login pengguna. */
  // ponytail: satu kunci bersama (IOT_DEVICE_KEY); pindah ke kunci per perangkat di tabel bila timbangan > 1
  @Public()
  @ApiHeader({ name: 'X-Device-Key', required: true })
  @Post()
  receive(
    @Body() dto: DeviceReadingDto,
    @Headers('x-device-key') key: string | undefined,
  ) {
    const expected = process.env.IOT_DEVICE_KEY;
    if (
      !expected ||
      !key ||
      !timingSafeEqual(sha256(key), sha256(expected))
    ) {
      throw new UnauthorizedException('Kunci perangkat tidak valid');
    }
    return this.prisma.weighingRecord.create({
      data: {
        deviceId: dto.deviceId,
        weightKg: dto.weightKg,
        measuredAt: dto.measuredAt ?? new Date(),
      },
    });
  }

  /** Pembacaan timbangan yang menunggu diverifikasi petugas. */
  @ApiBearerAuth()
  @Get()
  pending() {
    return this.prisma.weighingRecord.findMany({
      where: { status: WeighingStatus.PENDING },
      orderBy: { measuredAt: 'desc' },
      take: 50,
    });
  }

  @ApiBearerAuth()
  @Patch(':id/discard')
  async discard(@Param('id', ParseUUIDPipe) id: string) {
    const { count } = await this.prisma.weighingRecord.updateMany({
      where: { id, status: WeighingStatus.PENDING },
      data: { status: WeighingStatus.DISCARDED },
    });
    if (!count) {
      throw new ConflictException('Data timbangan sudah dipakai atau dibuang');
    }
    return { id, status: WeighingStatus.DISCARDED };
  }
}
