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

  @Get('quotes')
  @ApiOperation({
    summary:
      'Get batch quotes for multiple tickers (comma-separated, max 50, partial results)',
  })
  async getQuotesBatch(@Query('tickers') tickers?: string) {
    if (!tickers) return [];
    const list = tickers
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 50);
    if (list.length === 0) return [];
    return this.marketDataService.getQuotesBatch(list);
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

  @Get(':ticker/depth')
  @ApiOperation({ summary: 'Get market depth (order book) for an asset' })
  async getDepth(@Param('ticker') ticker: string) {
    return this.marketDataService.getDepth(ticker);
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
      query.interval,
    );
  }
}
