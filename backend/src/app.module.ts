import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorage } from './shared/throttler/redis-throttler.storage';
import type Redis from 'ioredis';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { IdentityModule } from './modules/identity/identity.module';
import { TradingModule } from './modules/trading/trading.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { HealthModule } from './modules/health/health.module';
import { MarketDataModule } from './modules/market-data/market-data.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { HistoryModule } from './modules/history/history.module';
import { RedisModule } from './modules/redis/redis.module';
import { MailModule } from './modules/mail/mail.module';
import { FxModule } from './modules/fx/fx.module';
import { AssetModule } from './modules/asset/asset.module';
import { GlobalExceptionFilter } from './filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from './interceptors/response-envelope.interceptor';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ScheduleModule.forRoot(),
    RedisModule,
    ThrottlerModule.forRootAsync({
      useFactory: (redis: Redis) => ({
        throttlers: [
          {
            // ttl is in milliseconds (throttler v5+)
            ttl: 60_000,
            limit: 100,
          },
        ],
        storage: new RedisThrottlerStorage(redis),
        // Health probes must never trip rate limits
        skipIf: (ctx) => {
          try {
            const req = ctx.switchToHttp().getRequest<{
              url?: string;
              path?: string;
            }>();
            const url = req?.url ?? req?.path ?? '';
            return url.includes('/health');
          } catch {
            return false;
          }
        },
      }),
      inject: ['REDIS_CLIENT'],
    }),
    MailModule,
    FxModule,
    AuthModule,
    PrismaModule,
    IdentityModule,
    TradingModule,
    ComplianceModule,
    HealthModule,
    MarketDataModule,
    WatchlistModule,
    HistoryModule,
    AssetModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, RequestLoggerMiddleware).forRoutes('*');
  }
}
