import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { IdentityModule } from './modules/identity/identity.module';
import { TradingModule } from './modules/trading/trading.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { HealthModule } from './modules/health/health.module';
import { MarketDataModule } from './modules/market-data/market-data.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { HistoryModule } from './modules/history/history.module';
import { GlobalExceptionFilter } from './filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from './interceptors/response-envelope.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 100,
      },
    ]),
    AuthModule,
    PrismaModule,
    IdentityModule,
    TradingModule,
    ComplianceModule,
    HealthModule,
    MarketDataModule,
    WatchlistModule,
    HistoryModule,
  ],
  providers: [
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
export class AppModule {}
