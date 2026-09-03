import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as Sentry from '@sentry/nestjs';
import { z } from 'zod';
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

const PLACEHOLDER_SECRETS = [
  'dev-secret-change-in-production',
  'change-me-in-production',
  'secret',
  'password',
  'changeme',
];

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters long')
    .refine((s) => !PLACEHOLDER_SECRETS.includes(s), {
      message: 'JWT_SECRET must be changed from the default/placeholder value',
    }),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FRONTEND_URL: z
    .string()
    .url('FRONTEND_URL must be a valid absolute URL')
    .optional(),
  FRONTEND_PREVIEW_URL: z
    .string()
    .url('FRONTEND_PREVIEW_URL must be a valid absolute URL')
    .optional(),
  JWT_EXPIRES_IN: z.string().optional(),
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  FMP_API_KEY: z.string().optional(),
  UPSTOX_ACCESS_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      console.error(
        `Invalid env var ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      );
    }
    process.exit(1);
  }
  const env = parsed.data;

  if (env.NODE_ENV === 'production') {
    if (!env.FRONTEND_URL) {
      console.warn(
        'FRONTEND_URL not set — CORS will fallback to localhost:3000 (not suitable for production)',
      );
    }
    if (!env.FMP_API_KEY || !env.UPSTOX_ACCESS_TOKEN) {
      console.warn(
        'FMP_API_KEY/UPSTOX_ACCESS_TOKEN not fully set — market-data fallbacks are reduced in production',
      );
    }
  }

  return env;
}

async function bootstrap() {
  const env = validateEnv();

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
  // Express adapter exposes the underlying instance (untyped here)
  if (httpAdapter.getType() === 'express') {
    const instance = httpAdapter.getInstance() as unknown as {
      set?: (key: string, value: unknown) => void;
    };
    instance.set?.('trust proxy', 1);
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

  const port = env.PORT;
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
