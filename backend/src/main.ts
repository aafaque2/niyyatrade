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

  const placeholderSecrets = [
    'dev-secret-change-in-production',
    'change-me-in-production',
  ];
  if (placeholderSecrets.includes(process.env.JWT_SECRET ?? '')) {
    console.error(
      'JWT_SECRET must be changed from the default/placeholder value',
    );
    process.exit(1);
  }
  if ((process.env.JWT_SECRET ?? '').length < 16) {
    console.error('JWT_SECRET must be at least 16 characters long');
    process.exit(1);
  }

  // Optional but valuable in production
  if (process.env.FRONTEND_URL) {
    try {
      // Must be absolute URL
      new URL(process.env.FRONTEND_URL);
    } catch {
      console.error('FRONTEND_URL must be a valid absolute URL');
      process.exit(1);
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.warn(
      'FRONTEND_URL not set — CORS will fallback to localhost:3000 (not suitable for production)',
    );
  }

  if (process.env.PORT) {
    const n = Number(process.env.PORT);
    if (!Number.isInteger(n) || n < 1 || n > 65535) {
      console.error('PORT must be an integer between 1 and 65535');
      process.exit(1);
    }
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

  // Trust proxy (Render/Vercel) so req.ip / ThrottlerGuard see real client IP
  const httpAdapter = app.getHttpAdapter();
  // Express adapter exposes underlying instance
  if (httpAdapter.getType() === 'express') {
    httpAdapter.getInstance().set('trust proxy', 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
      // Explicit HSTS via helmet defaults (180d) — also set via frontend middleware
    }),
  );

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_PREVIEW_URL,
      'http://localhost:3000',
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
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
  // Don't expose the full API surface (incl. bearer auth) in production.
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Backend running on http://localhost:${port}/api/v1`);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`Swagger docs at http://localhost:${port}/docs`);
  }
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.SENTRY_DSN) {
    logger.log('Sentry error tracking enabled');
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
