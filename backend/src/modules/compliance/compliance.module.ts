import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { SectorRulePlugin } from './engine/plugins/sector-rule.plugin';
import { DebtRulePlugin } from './engine/plugins/debt-rule.plugin';
import { InterestRulePlugin } from './engine/plugins/interest-rule.plugin';

@Module({
  imports: [PrismaModule, MarketDataModule],
  controllers: [ComplianceController],
  providers: [
    ComplianceService,
    SectorRulePlugin,
    DebtRulePlugin,
    InterestRulePlugin,
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
      provide: 'COMPLIANCE_RULE_PLUGINS',
      useFactory: (
        sector: SectorRulePlugin,
        debt: DebtRulePlugin,
        interest: InterestRulePlugin,
      ) => [sector, debt, interest],
      inject: [SectorRulePlugin, DebtRulePlugin, InterestRulePlugin],
    },
  ],
  exports: [ComplianceService],
})
export class ComplianceModule {}
