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
import { EsgSectorPlugin } from './engine/plugins/esg-sector.plugin';
import { EsgInsufficientDataPlugin } from './engine/plugins/esg-insufficient-data.plugin';

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
export class ComplianceModule {}
