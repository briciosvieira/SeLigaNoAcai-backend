import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Libera acesso do frontend à API
  app.enableCors({
    origin: [
      'https://acai.briciosvieira.cloud',
      'https://seliganoacai.com',
      'https://www.seliganoacai.com',
      'https://api.seliganoacai.com',
      'https://seliganoacai.com.br',
      'http://localhost:5173',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validação automática dos DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configura a pasta de uploads como estática
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Porta da aplicação
  const port = Number(process.env.PORT) || 3131;

  await app.listen(port);

  console.log(`API rodando em http://localhost:${port}`);
}

bootstrap();
