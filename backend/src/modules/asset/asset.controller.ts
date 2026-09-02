import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssetService } from './asset.service';

@ApiTags('Assets')
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search assets from DB universe (sector/exchange filters)',
  })
  async search(
    @Query('q') q?: string,
    @Query('sector') sector?: string,
    @Query('exchange') exchange?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.assetService.search({
      q,
      sector,
      exchange,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Post('enrich')
  @ApiOperation({
    summary: 'Enrich Unknown sectors via fundamentals (throttled)',
  })
  async enrich(@Query('limit') limit?: string) {
    const l = limit ? parseInt(limit, 10) : 25;
    return this.assetService.enrichUnknown(Math.min(Math.max(l, 1), 100));
  }
}
