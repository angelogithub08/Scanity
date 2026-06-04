import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

const APP_PORT = process.env.APP_PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Configurar limites para upload de arquivos
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ extended: true, limit: '200mb' }));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    exposedHeaders: 'Authorization',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Remove propriedades não decoradas
      forbidNonWhitelisted: false, // Não falha se receber propriedades extras
      forbidUnknownValues: false,
      transformOptions: {
        groups: ['transform'],
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Scanity')
    .setDescription('Projeto de API para o Scanity')
    .setVersion('1.0')
    .addBearerAuth(
      {
        description: 'Autorização padrão JWT',
        type: 'http',
        in: 'header',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'defaultBearerAuth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  if (NODE_ENV === 'development') {
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
      },
    });
  }

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(APP_PORT || 3000);
}
void bootstrap();
