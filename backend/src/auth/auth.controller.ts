import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import { CurrentUser, Public, Roles } from './auth.guard.js';
import type { AuthUser } from './auth.guard.js';
import { verifyPassword } from './password.js';

class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  username: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password: string;
}

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username.trim().toLowerCase() },
    });
    const ok =
      !!user?.active && (await verifyPassword(dto.password, user.passwordHash));
    if (!user || !ok) {
      throw new UnauthorizedException('Username atau password salah');
    }
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id }),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        buyerId: user.buyerId,
      },
    };
  }

  @ApiBearerAuth()
  @Roles(...Object.values(Role))
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
