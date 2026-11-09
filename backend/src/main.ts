import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aktifkan CORS untuk komunikasi frontend
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Konfigurasi Swagger OpenAPI Documentation pada path /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GEN APHYAH API')
    .setDescription('Dokumentasi RESTful API untuk GEN APHYAH Backend (NestJS)')
    .setVersion('1.0')
    .addTag('Core', 'Endpoint utama dan health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Backend server is running on http://localhost:${port}`);
  console.log(`📚 Swagger documentation available at http://localhost:${port}/docs`);
}
await bootstrap();
