import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class FmpMarketDataProvider implements IMarketDataProvider {
  private readonly logger = new Logger(FmpMarketDataProvider.name);
  private readonly baseUrl = 'https://financialmodelingprep.com/api/v3';
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('FMP_API_KEY', '');
  }

  private async fetch<T>(path: string): Promise<T> {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${path}${separator}apikey=${this.apiKey}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HalalTrade/1.0' },
    });

    if (!res.ok) {
      throw new Error(`FMP API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    const data = await this.fetch<Record<string, unknown>[]>(
      `/quote/${ticker}`,
    );

    if (!data || data.length === 0) {
      throw new Error(`No quote data found for ${ticker}`);
    }

    const quote = data[0];

    return MarketQuoteSchema.parse({
      ticker: quote.symbol,
      priceCents: Math.round(Number(quote.price) * 100),
      changePercent: Number(quote.changePercentage),
      timestamp: new Date().toISOString(),
    });
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    const settled = await Promise.allSettled([
      this.fetch<Record<string, unknown>[]>(`/profile/${ticker}`),
      this.fetch<Record<string, unknown>[]>(`/ratios/${ticker}`),
      this.fetch<Record<string, unknown>[]>(
        `/balance-sheet-statement/${ticker}?period=quarter&limit=1`,
      ),
      this.fetch<Record<string, unknown>[]>(
        `/income-statement/${ticker}?period=quarter&limit=1`,
      ),
    ]);

    const extract = (i: number) =>
      settled[i].status === 'fulfilled' && (settled[i].value as Record<string, unknown>[]).length
        ? (settled[i].value as Record<string, unknown>[])[0]
        : ({} as Record<string, unknown>);

    const p = extract(0);
    const r = extract(1);
    const b = extract(2);
    const i = extract(3);

    const rangeStr = (p.range as string) ?? '';
    const rangeParts = rangeStr.split(' - ');
    const week52Low = rangeParts.length === 2 ? parseFloat(rangeParts[0]) : null;
    const week52High = rangeParts.length === 2 ? parseFloat(rangeParts[1]) : null;

    const result = FinancialFundamentalsSchema.safeParse({
      ticker,
      marketCap: p.marketCap ?? null,
      totalAssets: (b.totalAssets as number) ?? null,
      totalDebt: (b.totalDebt as number) ?? null,
      cashAndEquivalents: (b.cashAndCashEquivalents as number) ?? null,
      interestIncome: (i.interestIncome as number) ?? null,
      totalRevenue: (i.revenue as number) ?? null,
      sector: p.sector ?? null,
      industry: p.industry ?? null,
      peRatio: (r.priceToEarningsRatio as number) ?? null,
      dividendYield: (r.dividendYield as number) ?? null,
      volume: (p.averageVolume as number) ?? null,
      week52High,
      week52Low,
    });

    if (result.success) return result.data;

    this.logger.warn(`Fundamentals parse failed for ${ticker}: ${result.error.message}`);
    return FinancialFundamentalsSchema.parse({
      ticker,
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
    _resolution: string,
    from?: number,
    to?: number,
  ): Promise<ChartCandle[]> {
    const fromDate = from
      ? new Date(from * 1000).toISOString().split('T')[0]
      : new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0];
    const toDate = to
      ? new Date(to * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const data = await this.fetch<Record<string, unknown>[]>(
      `/historical-price-eod/full/${ticker}?from=${fromDate}&to=${toDate}`,
    );

    return (data ?? []).map((item) => {
      const dateStr = item.date as string;
      const timestamp = Math.floor(new Date(dateStr).getTime() / 1000);
      return [
        timestamp,
        Math.round(Number(item.open) * 100),
        Math.round(Number(item.high) * 100),
        Math.round(Number(item.low) * 100),
        Math.round(Number(item.close) * 100),
        Number(item.volume ?? 0),
      ] as ChartCandle;
    });
  }

  async search(query: string): Promise<SearchResult[]> {
    const data = await this.fetch<Record<string, unknown>[]>(
      `/search-ticker?query=${query}&limit=10`,
    );

    return (data ?? []).map((item) => {
      const record = item as Record<string, string | null | undefined>;
      return {
        ticker: record.symbol ?? '',
        name: record.name ?? '',
        sector: record.sector ?? null,
        exchange: record.exchange ?? null,
      };
    });
  }
}
