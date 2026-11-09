import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getStatus() {
    return {
      status: 'ok',
      service: 'GEN_APHYAH Backend (NestJS)',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
