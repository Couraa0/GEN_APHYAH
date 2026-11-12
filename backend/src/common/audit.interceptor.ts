import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, from, mergeMap, Observable, throwError } from 'rxjs';
import { PrismaService } from '../prisma.service.js';

/** Mencatat setiap request yang mengubah data (bukan GET) ke tabel audit_logs. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = ctx.switchToHttp();
    const req = http.getRequest();
    if (req.method === 'GET') return next.handle();

    // Kegagalan menulis audit log tidak boleh menggagalkan request-nya.
    const log = (statusCode: number) =>
      this.prisma.auditLog
        .create({
          data: {
            userId: req.user?.id,
            method: req.method,
            path: String(req.originalUrl ?? req.url).split('?')[0],
            statusCode,
          },
        })
        .catch(() => undefined);

    return next.handle().pipe(
      mergeMap(async (body) => {
        await log(http.getResponse().statusCode);
        return body;
      }),
      catchError((err) =>
        from(log(err?.status ?? 500)).pipe(
          mergeMap(() => throwError(() => err)),
        ),
      ),
    );
  }
}
