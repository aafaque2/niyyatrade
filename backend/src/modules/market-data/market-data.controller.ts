import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { SearchQueryDto, CandlesQueryDto } from './dto/market-data-query.dto';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('search')
  async search(@Query() query: SearchQueryDto) {
    if (!query.q || query.q.length < 1) {
      return [];
    }
    return this.marketDataService.search(query.q);
  }

  @Get(':ticker/quote')
  async getQuote(@Param('ticker') ticker: string) {
    return this.marketDataService.getQuote(ticker);
  }

  @Get(':ticker/fundamentals')
  async getFundamentals(@Param('ticker') ticker: string) {
    return this.marketDataService.getFundamentals(ticker);
  }

  @Get(':ticker/candles')
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
