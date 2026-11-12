import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

// Error database yang disebabkan input pengguna, bukan bug server.
const PRISMA_ERRORS: Record<string, [number, string]> = {
  P2002: [HttpStatus.CONFLICT, 'Data dengan nilai yang sama sudah ada'],
  P2003: [HttpStatus.BAD_REQUEST, 'Data yang dirujuk tidak ditemukan'],
  P2025: [HttpStatus.NOT_FOUND, 'Data tidak ditemukan'],
  P2034: [HttpStatus.CONFLICT, 'Transaksi bentrok, silakan coba lagi'],
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      PRISMA_ERRORS[exception.code]
    ) {
      [status, message] = PRISMA_ERRORS[exception.code];
    } else {
      this.logger.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
