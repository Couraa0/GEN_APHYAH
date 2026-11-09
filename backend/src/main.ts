import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Express } from 'express';
import { AppModule } from './app.module.js';

let cachedServer: Express;

export async function createNestServer(expressInstance: Express) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GEN APHYAH API')
    .setDescription('Dokumentasi RESTful API untuk GEN APHYAH Backend (NestJS)')
    .setVersion('1.0')
    .addTag('Core', 'Endpoint utama dan health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return app;
}

// Handler serverless untuk Vercel
export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = express();
    await createNestServer(cachedServer);
  }
  return cachedServer(req, res);
}

// Bootstrap standalone untuk development lokal (jika bukan environment Vercel)
if (process.env.VERCEL !== '1') {
  async function bootstrap() {
    const localExpress = express();
    const app = await createNestServer(localExpress);
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🚀 Backend server is running on http://localhost:${port}`);
    console.log(`📚 Swagger documentation available at http://localhost:${port}/docs`);
  }
  bootstrap();
}
