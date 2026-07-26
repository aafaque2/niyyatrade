import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketDataService } from './market-data.service';
import {
  SearchQueryDto,
  CandlesQueryDto,
  FxQueryDto,
} from './dto/market-data-query.dto';

@ApiTags('Market Data')
@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search for assets by name or ticker' })
  async search(@Query() query: SearchQueryDto) {
    if (!query.q || query.q.length < 1) {
      return [];
    }
    return this.marketDataService.search(query.q);
  }

  @Get('fx')
  @ApiOperation({ summary: 'Get FX exchange rate between two currencies' })
  async getFxRate(@Query() query: FxQueryDto) {
    return this.marketDataService.getFxRate(query.from, query.to);
  }

  @Get(':ticker/quote')
  @ApiOperation({ summary: 'Get real-time quote for an asset' })
  async getQuote(@Param('ticker') ticker: string) {
    return this.marketDataService.getQuote(ticker);
  }

  @Get(':ticker/fundamentals')
  @ApiOperation({ summary: 'Get fundamental data for an asset' })
  async getFundamentals(@Param('ticker') ticker: string) {
    return this.marketDataService.getFundamentals(ticker);
  }

  @Get(':ticker/candles')
  @ApiOperation({ summary: 'Get historical candle data for charting' })
  async getCandles(
    @Param('ticker') ticker: string,
    @Query() query: CandlesQueryDto,
  ) {
    return this.marketDataService.getCandles(
      ticker,
      query.resolution || '1M',
      query.from ? parseInt(query.from, 10) : undefined,
      query.to ? parseInt(query.to, 10) : undefined,
    );
  }
}
