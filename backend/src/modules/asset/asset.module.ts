import { Module, forwardRef } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetSyncService } from './asset-sync.service';
import { AssetController } from './asset.controller';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [forwardRef(() => MarketDataModule)],
  controllers: [AssetController],
  providers: [AssetService, AssetSyncService],
  exports: [AssetService, AssetSyncService],
})
export class AssetModule {}
