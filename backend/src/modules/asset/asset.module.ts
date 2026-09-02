import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetSyncService } from './asset-sync.service';
import { AssetController } from './asset.controller';

@Module({
  controllers: [AssetController],
  providers: [AssetService, AssetSyncService],
  exports: [AssetService, AssetSyncService],
})
export class AssetModule {}
