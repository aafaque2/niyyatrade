import { Controller, Get, Query } from '@nestjs/common';
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
}
