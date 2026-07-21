import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MockMarketDataProvider } from './providers/mock-market-data.provider';
import { FmpMarketDataProvider } from './providers/fmp-market-data.provider';
import { UpstoxMarketDataProvider } from './providers/upstox-market-data.provider';
import { MultiMarketDataProvider } from './providers/multi-market-data.provider';
import type { IMarketDataProvider } from './providers/market-data-provider.interface';

@Module({
  controllers: [MarketDataController],
  providers: [
    MarketDataService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );
        return new Redis(url);
      },
      inject: [ConfigService],
    },
    {
      provide: 'MARKET_DATA_PROVIDER',
      useFactory: (configService: ConfigService): IMarketDataProvider => {
        const fmpKey = configService.get<string>('FMP_API_KEY');
        const upstoxToken = configService.get<string>('UPSTOX_ACCESS_TOKEN');

        if (!fmpKey && !upstoxToken) {
          return new MockMarketDataProvider();
        }

        const fmp = fmpKey ? new FmpMarketDataProvider(configService) : null;

        if (!fmp) {
          return new MockMarketDataProvider();
        }

        if (!upstoxToken) {
          return fmp;
        }

        const redis = new Redis(
          configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        );
        const upstox = new UpstoxMarketDataProvider(configService, redis);

        return new MultiMarketDataProvider(fmp, upstox);
      },
      inject: [ConfigService],
    },
    MockMarketDataProvider,
    FmpMarketDataProvider,
    UpstoxMarketDataProvider,
    MultiMarketDataProvider,
  ],
  exports: [MarketDataService],
})
export class MarketDataModule {}
