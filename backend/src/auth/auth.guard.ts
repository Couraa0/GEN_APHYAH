import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  buyerId: string | null;
}

/** Endpoint tanpa login (login, health check, endpoint perangkat IoT). */
export const Public = () => SetMetadata('isPublic', true);
/** Batasi endpoint ke role tertentu. Tanpa dekorator ini: semua staf, MITRA ditolak. */
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);

export const STAFF: Role[] = [Role.ADMIN, Role.PENGURUS, Role.PETUGAS];
export const MANAGERS: Role[] = [Role.ADMIN, Role.PENGURUS];

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>('isPublic', targets)) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest();
    const [scheme, token] = String(req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Silakan login terlebih dahulu');
    }

    let userId: string;
    try {
      userId = (await this.jwt.verifyAsync<{ sub: string }>(token)).sub;
    } catch {
      throw new UnauthorizedException('Sesi tidak valid atau kedaluwarsa');
    }

    // Dibaca dari database tiap request agar akun yang dinonaktifkan atau
    // diganti role-nya langsung berlaku, tanpa menunggu token kedaluwarsa.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        buyerId: true,
        active: true,
      },
    });
    if (!user?.active) {
      throw new UnauthorizedException('Akun tidak aktif');
    }

    const allowed =
      this.reflector.getAllAndOverride<Role[]>('roles', targets) ?? STAFF;
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Role Anda tidak memiliki akses ini');
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      buyerId: user.buyerId,
    };
    req.user = authUser;
    return true;
  }
}
