import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { FxModule } from '../fx/fx.module';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';
import { OrderWatcherService } from './order-watcher.service';

@Module({
  imports: [PrismaModule, MarketDataModule, ComplianceModule, FxModule],
  controllers: [TradingController],
  providers: [TradingService, OrderWatcherService],
  exports: [TradingService],
})
export class TradingModule {}
