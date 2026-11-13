import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
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

// ponytail: kunci per akun, disimpan di database supaya tetap berlaku di serverless (penghitung
// di memori hilang tiap instance). Batasnya: orang yang tahu sebuah username bisa menahan akun
// itu dari login baru selama masa kunci (sesi yang sudah masuk tidak terganggu). Bila itu jadi
// masalah, hitung per IP di tabel terpisah atau pakai @nestjs/throttler dengan penyimpanan bersama.
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

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
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new HttpException(
        `Terlalu banyak percobaan masuk. Coba lagi dalam ${minutes} menit.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const ok =
      !!user?.active && (await verifyPassword(dto.password, user.passwordHash));
    if (!user || !ok) {
      if (user) await this.countFailedLogin(user.id);
      throw new UnauthorizedException('Username atau password salah');
    }
    if (user.failedLogins || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: 0, lockedUntil: null },
      });
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

  /** Tambah hitungan password salah; pada kali ke-5 kunci login dan mulai hitungan dari nol. */
  private async countFailedLogin(userId: string) {
    const { failedLogins } = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });
    if (failedLogins >= MAX_FAILED_LOGINS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLogins: 0,
          lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000),
        },
      });
    }
  }

  @ApiBearerAuth()
  @Roles(...Object.values(Role))
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
