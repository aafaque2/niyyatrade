import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FxService, FxSnapshot } from './fx.service';

@ApiTags('FX')
@Controller('fx')
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Get latest daily FX rates (USD base)' })
  async getLatest(): Promise<{ data: FxSnapshot }> {
    const snap = await this.fxService.getSnapshot();
    return { data: snap };
  }
}
