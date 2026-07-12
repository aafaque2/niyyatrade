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
    const url = `${this.baseUrl}${path}?apikey=${this.apiKey}`;
    const res = await fetch(url);

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
      changePercent: Number(quote.changesPercentage),
      timestamp: new Date().toISOString(),
    });
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    const [profile, ratios] = await Promise.all([
      this.fetch<Record<string, unknown>[]>(`/profile/${ticker}`),
      this.fetch<Record<string, unknown>[]>(`/ratios/${ticker}`),
    ]);

    if (!profile || profile.length === 0) {
      throw new Error(`No profile found for ${ticker}`);
    }

    const p = profile[0];
    const r = ratios?.[0] ?? {};

    return FinancialFundamentalsSchema.parse({
      ticker,
      marketCap: p.mktCap ?? p.marketCap,
      totalAssets: r.totalAssets,
      totalDebt: r.totalDebt,
      cashAndEquivalents: r.cashAndEquivalents,
      interestIncome: r.interestIncome,
      totalRevenue: r.revenue ?? r.totalRevenue,
      sector: p.sector,
      industry: p.industry,
    });
  }

  async getCandles(
    ticker: string,
    _resolution: string,
    _from?: number,
    _to?: number,
  ): Promise<ChartCandle[]> {
    const data = await this.fetch<unknown[][]>(
      `/historical-price-full/${ticker}`,
    );

    return (data as ChartCandle[]).slice(0, 100);
  }

  async search(query: string): Promise<SearchResult[]> {
    const data = await this.fetch<Record<string, unknown>[]>(
      `/search?query=${query}&limit=10`,
    );

    return (data ?? []).map((item) => {
      const record = item as Record<string, string | null | undefined>;
      return {
        ticker: record.symbol ?? '',
        name: record.name ?? '',
        sector: record.sector ?? null,
        exchange: record.exchangeShortName ?? null,
      };
    });
  }
}
