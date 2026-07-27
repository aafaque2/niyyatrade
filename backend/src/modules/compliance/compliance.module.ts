import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { SectorRulePlugin } from './engine/plugins/sector-rule.plugin';
import { DebtRulePlugin } from './engine/plugins/debt-rule.plugin';
import { InterestRulePlugin } from './engine/plugins/interest-rule.plugin';
import { EsgSectorPlugin } from './engine/plugins/esg-sector.plugin';
import { EsgInsufficientDataPlugin } from './engine/plugins/esg-insufficient-data.plugin';
import { TickerListRulePlugin } from './engine/plugins/ticker-list-rule.plugin';

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
    TickerListRulePlugin,
    {
      provide: 'COMPLIANCE_RULE_PLUGINS',
      useFactory: (
        sector: SectorRulePlugin,
        debt: DebtRulePlugin,
        interest: InterestRulePlugin,
        esgSector: EsgSectorPlugin,
        esgInsufficient: EsgInsufficientDataPlugin,
        tickerList: TickerListRulePlugin,
      ) => [sector, debt, interest, esgSector, esgInsufficient, tickerList],
      inject: [
        SectorRulePlugin,
        DebtRulePlugin,
        InterestRulePlugin,
        EsgSectorPlugin,
        EsgInsufficientDataPlugin,
        TickerListRulePlugin,
      ],
    },
  ],
  exports: [ComplianceService],
})
export class ComplianceModule {}
