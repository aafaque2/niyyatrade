import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as Sentry from '@sentry/nestjs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getPinoAdapter } from './shared/utils/nest-logger.adapter';

// Serialize BigInt as Number for JSON responses (cents values).
// Safe here: cent amounts are far below Number.MAX_SAFE_INTEGER in practice.
Object.defineProperty(BigInt.prototype, 'toJSON', {
  value: function (this: bigint) {
    return Number(this);
  },
});

function validateEnv() {
  const required = ['JWT_SECRET', 'DATABASE_URL', 'REDIS_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET === 'dev-secret-change-in-production') {
    console.error('JWT_SECRET must be changed from the default dev value');
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnv();

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  }

  const pinoAdapter = getPinoAdapter();
  const app = await NestFactory.create(AppModule, {
    logger: pinoAdapter,
  });

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('NiyyaTrade API')
    .setDescription(
      'Paper trading platform with compliance analysis — trade with intentions, invest with ethics.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Backend running on http://localhost:${port}/api/v1`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.SENTRY_DSN) {
    logger.log('Sentry error tracking enabled');
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
