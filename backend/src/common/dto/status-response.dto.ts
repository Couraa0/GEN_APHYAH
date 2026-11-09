import { ApiProperty } from '@nestjs/swagger';

export class StatusResponseDto {
  @ApiProperty({ example: 'ok', description: 'Status operasi backend' })
  status: string;

  @ApiProperty({
    example: 'GEN_APHYAH Backend (NestJS)',
    description: 'Nama service backend',
  })
  service: string;

  @ApiProperty({ example: '1.0.0', description: 'Versi aplikasi backend' })
  version: string;

  @ApiProperty({
    example: '2026-11-09T14:00:00.000Z',
    description: 'Waktu server saat ini dalam format ISO 8601',
  })
  timestamp: string;
}
