import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: { origin: true, credentials: true },
    bodyParser: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global prefix for REST endpoints (e.g., /api/uploads)
  app.setGlobalPrefix('api', { exclude: ['/', 'graphql'] });

  // Serve static files for uploads (multer uploads go to ./uploads, served at /uploads)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Lenz backend running on http://localhost:${port}`);
  logger.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  logger.log(`📁 Uploads served from: http://localhost:${port}/uploads`);
  logger.log(`📤 REST upload endpoints: POST /api/uploads/single | /api/uploads/multiple`);
}
bootstrap();
