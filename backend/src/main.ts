import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Express } from 'express';
import { AppModule } from './app.module.js';

// Lokal: baca backend/.env. Di Vercel variabel sudah ada di environment.
try {
  process.loadEnvFile();
} catch {
  // tidak ada file .env
}

let cachedServer: Express;

export async function createNestServer(expressInstance: Express) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  // Autentikasi memakai header Authorization (bukan cookie), jadi tanpa credentials.
  const origins = (process.env.CORS_ORIGIN ?? '*').split(',').map((o) => o.trim());
  app.enableCors({
    origin: origins.includes('*') ? '*' : origins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RUNA Circular Integration API')
    .setDescription(
      'REST API Bank Sampah RUNA: pengumpulan, stok, pengangkutan, marketplace, pilot pengolahan, dan laporan.',
    )
    .setVersion('1.0')
    .addBearerAuth()
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
  void bootstrap();
}
