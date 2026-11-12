import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MANAGERS, Roles } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma.service.js';

class BuyerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class UpdateBuyerDto extends PartialType(BuyerDto) {}

@ApiTags('Buyers')
@ApiBearerAuth()
@Controller('api/buyers')
export class BuyersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.buyer.findMany({ orderBy: { name: 'asc' } });
  }

  @Roles(...MANAGERS)
  @Post()
  create(@Body() dto: BuyerDto) {
    return this.prisma.buyer.create({ data: dto });
  }

  @Roles(...MANAGERS)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBuyerDto) {
    return this.prisma.buyer.update({ where: { id }, data: dto });
  }
}
