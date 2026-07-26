import { Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { SectorRulePlugin } from './engine/plugins/sector-rule.plugin';
import { DebtRulePlugin } from './engine/plugins/debt-rule.plugin';
import { InterestRulePlugin } from './engine/plugins/interest-rule.plugin';
import { EsgSectorPlugin } from './engine/plugins/esg-sector.plugin';
import { EsgInsufficientDataPlugin } from './engine/plugins/esg-insufficient-data.plugin';

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
  imports: [PrismaModule, MarketDataModule],
  controllers: [ComplianceController],
  providers: [
    ComplianceService,
    SectorRulePlugin,
    DebtRulePlugin,
    InterestRulePlugin,
    EsgSectorPlugin,
    EsgInsufficientDataPlugin,
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const url = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );
        const client = createRedisClient(url);
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
    {
      provide: 'COMPLIANCE_RULE_PLUGINS',
      useFactory: (
        sector: SectorRulePlugin,
        debt: DebtRulePlugin,
        interest: InterestRulePlugin,
        esgSector: EsgSectorPlugin,
        esgInsufficient: EsgInsufficientDataPlugin,
      ) => [sector, debt, interest, esgSector, esgInsufficient],
      inject: [
        SectorRulePlugin,
        DebtRulePlugin,
        InterestRulePlugin,
        EsgSectorPlugin,
        EsgInsufficientDataPlugin,
      ],
    },
  ],
  exports: [ComplianceService],
})
export class ComplianceModule implements OnModuleDestroy {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
