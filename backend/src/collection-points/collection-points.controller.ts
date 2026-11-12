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

class CollectionPointDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class UpdateCollectionPointDto extends PartialType(CollectionPointDto) {}

@ApiTags('Collection Points')
@ApiBearerAuth()
@Controller('api/collection-points')
export class CollectionPointsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.collectionPoint.findMany({ orderBy: { name: 'asc' } });
  }

  @Roles(...MANAGERS)
  @Post()
  create(@Body() dto: CollectionPointDto) {
    return this.prisma.collectionPoint.create({ data: dto });
  }

  @Roles(...MANAGERS)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollectionPointDto,
  ) {
    return this.prisma.collectionPoint.update({ where: { id }, data: dto });
  }
}
