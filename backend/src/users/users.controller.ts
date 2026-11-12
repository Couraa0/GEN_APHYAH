import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MANAGERS, Roles } from '../auth/auth.guard.js';
import { hashPassword } from '../auth/password.js';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';

class CreateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @Matches(/^[a-z0-9._-]{3,60}$/, {
    message: 'username: 3-60 karakter huruf kecil, angka, titik, - atau _',
  })
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;

  @IsEnum(Role)
  role: Role;

  /** Wajib untuk role MITRA: pembeli yang diwakili akun ini. */
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['username'] as const),
) {}

const publicFields = {
  id: true,
  name: true,
  username: true,
  role: true,
  active: true,
  buyerId: true,
  createdAt: true,
} as const;

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles(...MANAGERS)
  @Get()
  list() {
    return this.prisma.user.findMany({
      select: publicFields,
      orderBy: { name: 'asc' },
    });
  }

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() { password, ...data }: CreateUserDto) {
    if (data.role === Role.MITRA && !data.buyerId) {
      throw new BadRequestException('Akun MITRA wajib dikaitkan dengan pembeli');
    }
    return this.prisma.user.create({
      data: { ...data, passwordHash: await hashPassword(password) },
      select: publicFields,
    });
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { password, ...data }: UpdateUserDto,
  ) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(password && { passwordHash: await hashPassword(password) }),
      },
      select: publicFields,
    });
  }
}
