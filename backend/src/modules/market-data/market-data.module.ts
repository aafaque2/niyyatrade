import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MockMarketDataProvider } from './providers/mock-market-data.provider';
import { FmpMarketDataProvider } from './providers/fmp-market-data.provider';
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
        const apiKey = configService.get<string>('FMP_API_KEY');
        if (apiKey) {
          return new FmpMarketDataProvider(configService);
        }
        return new MockMarketDataProvider();
      },
      inject: [ConfigService],
    },
    MockMarketDataProvider,
    FmpMarketDataProvider,
  ],
  exports: [MarketDataService],
})
export class MarketDataModule {}
