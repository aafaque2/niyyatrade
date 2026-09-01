import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FxService } from './fx.service';
import { FxController } from './fx.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [FxService],
  controllers: [FxController],
  exports: [FxService],
})
export class FxModule {}
