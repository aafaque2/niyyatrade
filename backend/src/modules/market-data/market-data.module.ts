import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MockMarketDataProvider } from './providers/mock-market-data.provider';
import { FmpMarketDataProvider } from './providers/fmp-market-data.provider';
import { UpstoxMarketDataProvider } from './providers/upstox-market-data.provider';
import { YahooFinanceMarketDataProvider } from './providers/yahoo-finance-market-data.provider';
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

        const fmp = fmpKey ? new FmpMarketDataProvider(configService) : null;
        const yahoo = new YahooFinanceMarketDataProvider();

        if (!upstoxToken) {
          return fmp ?? new MockMarketDataProvider();
        }

        const redis = new Redis(
          configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        );
        const upstox = new UpstoxMarketDataProvider(configService, redis);

        if (!fmp) {
          return new MultiMarketDataProvider(
            new MockMarketDataProvider(),
            upstox,
            yahoo,
          );
        }

        return new MultiMarketDataProvider(fmp, upstox, yahoo);
      },
      inject: [ConfigService],
    },
    MockMarketDataProvider,
    FmpMarketDataProvider,
  ],
  exports: [MarketDataService],
})
export class MarketDataModule {}
