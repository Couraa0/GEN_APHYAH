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
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MANAGERS, Roles } from '../auth/auth.guard.js';
import { WasteGroup } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';

class CategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsEnum(WasteGroup)
  group?: WasteGroup;

  /** Tampil di katalog marketplace. */
  @IsOptional()
  @IsBoolean()
  listed?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerKg?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class UpdateCategoryDto extends PartialType(CategoryDto) {}

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.wasteCategory.findMany({ orderBy: { name: 'asc' } });
  }

  @Roles(...MANAGERS)
  @Post()
  create(@Body() dto: CategoryDto) {
    return this.prisma.wasteCategory.create({ data: dto });
  }

  @Roles(...MANAGERS)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.prisma.wasteCategory.update({ where: { id }, data: dto });
  }
}
