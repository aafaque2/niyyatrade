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
  private readonly baseUrl = 'https://financialmodelingprep.com/stable';
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
      `/quote?symbol=${ticker}`,
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
    const [profile, ratios, balanceSheet, incomeStatement] = await Promise.all([
      this.fetch<Record<string, unknown>[]>(`/profile?symbol=${ticker}`),
      this.fetch<Record<string, unknown>[]>(`/ratios?symbol=${ticker}`),
      this.fetch<Record<string, unknown>[]>(
        `/balance-sheet-statement?symbol=${ticker}&period=quarter&limit=1`,
      ),
      this.fetch<Record<string, unknown>[]>(
        `/income-statement?symbol=${ticker}&period=quarter&limit=1`,
      ),
    ]);

    if (!profile || profile.length === 0) {
      throw new Error(`No profile found for ${ticker}`);
    }

    const p = profile[0];
    const r = ratios?.[0] ?? {};
    const b = balanceSheet?.[0] ?? {};
    const i = incomeStatement?.[0] ?? {};

    const rangeStr = (p.range as string) ?? '';
    const rangeParts = rangeStr.split(' - ');
    const week52Low = rangeParts.length === 2 ? parseFloat(rangeParts[0]) : null;
    const week52High = rangeParts.length === 2 ? parseFloat(rangeParts[1]) : null;

    return FinancialFundamentalsSchema.parse({
      ticker,
      marketCap: p.marketCap as number,
      totalAssets: (b.totalAssets as number) ?? null,
      totalDebt: (b.totalDebt as number) ?? null,
      cashAndEquivalents: (b.cashAndCashEquivalents as number) ?? null,
      interestIncome: (i.interestIncome as number) ?? null,
      totalRevenue: (i.revenue as number) ?? null,
      sector: p.sector as string,
      industry: p.industry as string | null,
      peRatio: (r.priceToEarningsRatio as number) ?? null,
      dividendYield: (r.dividendYield as number) ?? null,
      volume: (p.averageVolume as number) ?? null,
      week52High,
      week52Low,
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
      `/historical-price-eod/full?symbol=${ticker}&from=${fromDate}&to=${toDate}`,
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
      `/search-symbol?query=${query}&limit=10`,
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
