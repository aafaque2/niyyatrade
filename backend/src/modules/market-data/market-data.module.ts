import { Module, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MockMarketDataProvider } from './providers/mock-market-data.provider';
import { FmpMarketDataProvider } from './providers/fmp-market-data.provider';
import { UpstoxMarketDataProvider } from './providers/upstox-market-data.provider';
import { YahooFinance2MarketDataProvider } from './providers/yahoo-finance2-market-data.provider';
import { MultiMarketDataProvider } from './providers/multi-market-data.provider';
import type { IMarketDataProvider } from './providers/market-data-provider.interface';

function createRedisClient(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });
}

@Module({
  controllers: [MarketDataController],
  providers: [
    MarketDataService,
    {
      provide: 'MARKET_DATA_PROVIDER',
      useFactory: (configService: ConfigService): IMarketDataProvider => {
        const fmpKey = configService.get<string>('FMP_API_KEY');
        const upstoxToken = configService.get<string>('UPSTOX_ACCESS_TOKEN');

        const yahoo2 = new YahooFinance2MarketDataProvider();
        const fmp = fmpKey ? new FmpMarketDataProvider(configService) : null;

        if (!fmp && !upstoxToken) {
          return yahoo2;
        }

        const upstox = upstoxToken
          ? new UpstoxMarketDataProvider(
              configService,
              createRedisClient(
                configService.get<string>(
                  'REDIS_URL',
                  'redis://localhost:6379',
                ),
              ),
            )
          : new MockMarketDataProvider();

        const fallback = fmp ?? new MockMarketDataProvider();

        return new MultiMarketDataProvider(yahoo2, fallback, upstox);
      },
      inject: [ConfigService],
    },
    MockMarketDataProvider,
    FmpMarketDataProvider,
  ],
  exports: [MarketDataService],
})
export class MarketDataModule {}
