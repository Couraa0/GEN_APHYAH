import { IsDateString, IsOptional } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

/** Filter Prisma untuk kolom tanggal, atau undefined bila tanpa rentang. */
export function dateRange({ from, to }: DateRangeDto) {
  return from || to ? { gte: from, lte: to } : undefined;
}
