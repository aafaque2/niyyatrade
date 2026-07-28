import { Injectable, Logger } from '@nestjs/common';
import type { IMarketDataProvider } from './market-data-provider.interface';
import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
  MarketDepth,
} from '../acl/market-data.schemas';
import {
  MarketQuoteSchema,
  FinancialFundamentalsSchema,
} from '../acl/market-data.schemas';
import YahooFinance from 'yahoo-finance2';

const SECTOR_MAP: Record<string, string> = {
  Technology: 'Technology',
  'Financial Services': 'Financials',
  'Consumer Cyclical': 'Consumer Cyclical',
  'Consumer Defensive': 'Consumer Defensive',
  'Communication Services': 'Communication Services',
  Industrials: 'Industrials',
  'Basic Materials': 'Basic Materials',
  'Real Estate': 'Real Estate',
  Utilities: 'Utilities',
  Energy: 'Energy',
  Healthcare: 'Healthcare',
};

@Injectable()
export class YahooFinance2MarketDataProvider implements IMarketDataProvider {
  private readonly logger = new Logger(YahooFinance2MarketDataProvider.name);
  private readonly yf: InstanceType<typeof YahooFinance>;

  constructor() {
    this.yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  }

  private normalizeSector(raw: string | undefined | null): string | null {
    if (!raw) return null;
    return SECTOR_MAP[raw] ?? 'Other';
  }

  private deriveCurrencyFromTicker(ticker: string): string {
    if (/\.(NS|BO|NSE|BSE)$/i.test(ticker)) return 'INR';
    if (/\.(L|LN)$/i.test(ticker)) return 'GBP';
    if (/\.(DE|F)$/i.test(ticker)) return 'EUR';
    if (/\.(T)$/i.test(ticker)) return 'JPY';
    if (/\.(TO)$/i.test(ticker)) return 'CAD';
    if (/\.(AX)$/i.test(ticker)) return 'AUD';
    if (/\.(HK)$/i.test(ticker)) return 'HKD';
    if (/\.(SI)$/i.test(ticker)) return 'SGD';
    return 'USD';
  }

  private mapMarketState(
    state: string | undefined,
  ): 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET' | 'UNKNOWN' {
    switch (state) {
      case 'REGULAR':
        return 'OPEN';
      case 'PRE':
        return 'PRE_MARKET';
      case 'POST':
        return 'POST_MARKET';
      case 'PREPRE':
      case 'POSTPOST':
      case 'CLOSED':
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  private mapResolution(resolution: string): {
    interval: string;
    period1: Date;
  } {
    const now = new Date();
    switch (resolution) {
      case '1D':
        return {
          interval: '5m',
          period1: new Date(now.getTime() - 1 * 86400000),
        };
      case '1W':
        return {
          interval: '15m',
          period1: new Date(now.getTime() - 7 * 86400000),
        };
      case '1M':
        return {
          interval: '1d',
          period1: new Date(now.getTime() - 30 * 86400000),
        };
      case '1Y':
        return {
          interval: '1d',
          period1: new Date(now.getTime() - 365 * 86400000),
        };
      case 'ALL':
        return {
          interval: '1wk',
          period1: new Date('1970-01-01'),
        };
      default:
        return {
          interval: '1d',
          period1: new Date(now.getTime() - 30 * 86400000),
        };
    }
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    const quote = await this.yf.quote(ticker);

    if (!quote.regularMarketPrice) {
      throw new Error(`No quote data for ${ticker}`);
    }

    return MarketQuoteSchema.parse({
      ticker: quote.symbol?.toUpperCase() ?? ticker.toUpperCase(),
      priceCents: Math.round(quote.regularMarketPrice * 100),
      changePercent:
        Math.round((quote.regularMarketChangePercent ?? 0) * 100) / 100,
      timestamp: new Date().toISOString(),
      currency: quote.currency ?? 'USD',
      marketStatus: this.mapMarketState(quote.marketState),
    });
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    const [quoteSummary, quote] = await Promise.all([
      this.yf.quoteSummary(ticker, {
        modules: [
          'financialData',
          'summaryDetail',
          'defaultKeyStatistics',
          'assetProfile',
        ],
      }),
      this.yf.quote(ticker),
    ]);

    const financialData = quoteSummary.financialData;
    const summaryDetail = quoteSummary.summaryDetail;
    const keyStats = quoteSummary.defaultKeyStatistics;
    const assetProfile = quoteSummary.assetProfile;

    const base = {
      ticker: ticker.toUpperCase(),
      marketCap: summaryDetail?.marketCap ?? null,
      totalAssets: keyStats?.totalAssets ?? null,
      totalDebt: financialData?.totalDebt ?? null,
      cashAndEquivalents: financialData?.totalCash ?? null,
      interestIncome: null as number | null,
      totalRevenue: financialData?.totalRevenue ?? null,
      sector: this.normalizeSector(assetProfile?.sector),
      industry: assetProfile?.industry ?? null,
      peRatio: summaryDetail?.trailingPE ?? null,
      dividendYield: summaryDetail?.dividendYield ?? null,
      volume: quote.regularMarketVolume ?? null,
      week52High: quote.fiftyTwoWeekHigh ?? null,
      week52Low: quote.fiftyTwoWeekLow ?? null,
      currency: quote.currency ?? 'USD',
    };

    try {
      const ts = await this.yf.fundamentalsTimeSeries(ticker, {
        period1: new Date(Date.now() - 365 * 86400000),
        type: 'quarterly',
        module: 'all',
      });

      const entries = (ts as unknown as Array<Record<string, unknown>>).filter(
        (e) => e.periodType === '3M',
      );
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (Object.keys(entry).length < 10) continue;
        if (
          base.interestIncome == null &&
          typeof entry.interestIncome === 'number'
        ) {
          base.interestIncome = entry.interestIncome;
        }
        if (
          base.totalAssets == null &&
          typeof entry.totalAssets === 'number'
        ) {
          base.totalAssets = entry.totalAssets;
        }
        if (
          base.totalRevenue == null &&
          typeof entry.totalRevenue === 'number'
        ) {
          base.totalRevenue = entry.totalRevenue;
        }
        if (base.totalDebt == null && typeof entry.totalDebt === 'number') {
          base.totalDebt = entry.totalDebt;
        }
        if (
          base.cashAndEquivalents == null &&
          typeof entry.cashAndCashEquivalents === 'number'
        ) {
          base.cashAndEquivalents = entry.cashAndCashEquivalents;
        }
        if (
          base.interestIncome != null &&
          base.totalRevenue != null &&
          base.totalDebt != null
        ) break;
      }
    } catch (err) {
      this.logger.warn(
        `fundamentalsTimeSeries failed for ${ticker}: ${(err as Error).message}`,
      );
    }

    return FinancialFundamentalsSchema.parse(base);
  }

  async getCandles(
    ticker: string,
    resolution: string,
    from?: number,
    to?: number,
  ): Promise<ChartCandle[]> {
    const { interval, period1: defaultPeriod1 } = this.mapResolution(resolution);

    const result = await this.yf.chart(ticker, {
      interval: interval as '1m' | '5m' | '15m' | '1d' | '1wk',
      period1: from ? new Date(from * 1000) : defaultPeriod1,
      ...(to ? { period2: new Date(to * 1000) } : {}),
    });

    const quotes =
      (result as { quotes?: Array<Record<string, unknown>> }).quotes ?? [];

    const timestamps = quotes
      .filter(
        (q) =>
          q.date != null &&
          q.open != null &&
          q.high != null &&
          q.low != null &&
          q.close != null,
      )
      .map((q) => ({
        ts: Math.floor((q.date as Date).getTime() / 1000),
        open: q.open as number,
        high: q.high as number,
        low: q.low as number,
        close: q.close as number,
        volume: (q.volume as number) ?? 0,
      }));

    this.logger.log(
      `getCandles(${ticker}, ${resolution}, interval=${interval}): ${quotes.length} raw quotes, ${timestamps.length} valid candles`,
    );

    return timestamps.map((t) => [
      t.ts,
      Math.round(t.open * 100),
      Math.round(t.high * 100),
      Math.round(t.low * 100),
      Math.round(t.close * 100),
      t.volume,
    ]);
  }

  async search(query: string): Promise<SearchResult[]> {
    const result = await this.yf.search(query);

    return (result.quotes ?? [])
      .filter((q: Record<string, unknown>) => q.quoteType === 'EQUITY')
      .map((q: Record<string, unknown>) => ({
        ticker: q.symbol as string,
        name: (q.longname ?? q.shortname ?? q.symbol) as string,
        sector: (q.sector as string) ?? null,
        exchange: (q.exchDisp as string) ?? null,
        currency: this.deriveCurrencyFromTicker(q.symbol as string),
      }));
  }

  async getDepth(_ticker: string): Promise<MarketDepth | null> {
    return null;
  }
}
