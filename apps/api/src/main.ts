import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.use(helmet());
  app.enableCors({ origin: config.get('CORS_ORIGINS', { infer: true }), credentials: true });
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sweets API')
    .setDescription('Backend for the storefront, mobile app and ERP')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}/api/v1 (docs: /api/docs)`);
}

void bootstrap();
