import { Injectable, Logger } from '@nestjs/common';
import type { IMarketDataProvider } from './market-data-provider.interface';
import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
} from '../acl/market-data.schemas';
import {
  MarketQuoteSchema,
  FinancialFundamentalsSchema,
} from '../acl/market-data.schemas';

interface YahooChartResult {
  symbol: string;
  timestamp: number[];
  indicators: {
    quote: {
      open: (number | null)[];
      high: (number | null)[];
      low: (number | null)[];
      close: (number | null)[];
      volume: (number | null)[];
    }[];
  };
  meta: {
    regularMarketPrice: number;
    previousClose: number;
    chartPreviousClose?: number;
    symbol: string;
    shortName?: string;
    longName?: string;
    currency: string;
    exchangeName?: string;
    instrumentType: string;
  };
}

interface YahooSearchResult {
  quotes: {
    symbol: string;
    shortname: string;
    longname: string;
    exchDisp: string;
    sector?: string;
    quoteType: string;
  }[];
}

@Injectable()
export class YahooFinanceMarketDataProvider implements IMarketDataProvider {
  private readonly logger = new Logger(YahooFinanceMarketDataProvider.name);
  private readonly baseUrl = 'https://query1.finance.yahoo.com';
  private readonly searchUrl = 'https://query2.finance.yahoo.com';

  private get headers() {
    return {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/json',
    };
  }

  private async fetch<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(
        `Yahoo Finance ${res.status} for ${url} — ${body.slice(0, 300)}`,
      );
      throw new Error(
        `Yahoo Finance API error: ${res.status} ${res.statusText}`,
      );
    }

    return res.json() as Promise<T>;
  }

  private mapResolutionToYahoo(
    resolution: string,
  ): { interval: string; range: string } {
    switch (resolution) {
      case '1D':
        return { interval: '5m', range: '1d' };
      case '1W':
        return { interval: '15m', range: '5d' };
      case '1M':
        return { interval: '1d', range: '1mo' };
      case '1Y':
        return { interval: '1d', range: '1y' };
      case 'ALL':
        return { interval: '1wk', range: 'max' };
      default:
        return { interval: '1d', range: '1mo' };
    }
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    const url = `${this.baseUrl}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const data = await this.fetch<{ chart: { result: YahooChartResult[] } }>(
      url,
    );

    const result = data.chart?.result?.[0];
    if (!result) {
      throw new Error(`No quote data for ${ticker}`);
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const changePercent =
      prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

    return MarketQuoteSchema.parse({
      ticker: ticker.toUpperCase(),
      priceCents: Math.round(price * 100),
      changePercent: Math.round(changePercent * 100) / 100,
      timestamp: new Date().toISOString(),
    });
  }

  async getFundamentals(_ticker: string): Promise<FinancialFundamentals> {
    return FinancialFundamentalsSchema.parse({
      ticker: _ticker.toUpperCase(),
      marketCap: 0,
      totalAssets: null,
      totalDebt: null,
      cashAndEquivalents: null,
      interestIncome: null,
      totalRevenue: 0,
      sector: 'Other',
      industry: null,
      peRatio: null,
      dividendYield: null,
      volume: null,
      week52High: null,
      week52Low: null,
    });
  }

  async getCandles(
    ticker: string,
    resolution: string,
    from?: number,
    to?: number,
  ): Promise<ChartCandle[]> {
    const { interval, range } = this.mapResolutionToYahoo(resolution);

    let url = `${this.baseUrl}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;

    if (from || to) {
      const params = new URLSearchParams({ interval });
      if (from) params.set('period1', String(Math.floor(from)));
      if (to) params.set('period2', String(Math.floor(to)));
      url = `${this.baseUrl}/v8/finance/chart/${encodeURIComponent(ticker)}?${params.toString()}`;
    }

    const data = await this.fetch<{ chart: { result: YahooChartResult[] } }>(
      url,
    );

    const result = data.chart?.result?.[0];
    if (!result?.timestamp?.length) {
      this.logger.warn(`No candle data for ${ticker}`);
      return [];
    }

    const timestamps = result.timestamp;
    const quote = result.indicators?.quote?.[0];
    if (!quote) {
      return [];
    }

    const candles: ChartCandle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open[i];
      const high = quote.high[i];
      const low = quote.low[i];
      const close = quote.close[i];
      const volume = quote.volume[i] ?? 0;

      if (open == null || high == null || low == null || close == null) continue;

      candles.push([
        timestamps[i],
        Math.round(open * 100),
        Math.round(high * 100),
        Math.round(low * 100),
        Math.round(close * 100),
        volume,
      ]);
    }

    return candles;
  }

  async search(query: string): Promise<SearchResult[]> {
    const url = `${this.searchUrl}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0&enableFuzzyQuery=true`;
    const data = await this.fetch<YahooSearchResult>(url);

    return (data.quotes ?? [])
      .filter((q) => q.quoteType === 'EQUITY')
      .map((q) => ({
        ticker: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        sector: q.sector ?? null,
        exchange: q.exchDisp ?? null,
      }));
  }
}
