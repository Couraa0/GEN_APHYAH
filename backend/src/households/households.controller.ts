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
import { PrismaService } from '../prisma.service.js';

class HouseholdDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  rt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  rw?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class UpdateHouseholdDto extends PartialType(HouseholdDto) {}

@ApiTags('Households')
@ApiBearerAuth()
@Controller('api/households')
export class HouseholdsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.household.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { collections: true } } },
    });
  }

  @Post()
  create(@Body() dto: HouseholdDto) {
    return this.prisma.household.create({ data: dto });
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHouseholdDto,
  ) {
    return this.prisma.household.update({ where: { id }, data: dto });
  }
}
