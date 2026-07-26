import { Injectable } from '@nestjs/common';
import type { IMarketDataProvider } from './market-data-provider.interface';
import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
} from '../acl/market-data.schemas';

const mockAssets: Record<
  string,
  { name: string; sector: string; industry: string; price: number }
> = {
  AAPL: {
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    price: 17500,
  },
  MSFT: {
    name: 'Microsoft Corporation',
    sector: 'Technology',
    industry: 'Software',
    price: 37800,
  },
  GOOGL: {
    name: 'Alphabet Inc.',
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    price: 14100,
  },
  AMZN: {
    name: 'Amazon.com Inc.',
    sector: 'Consumer Cyclical',
    industry: 'Internet Retail',
    price: 17800,
  },
  TSLA: {
    name: 'Tesla Inc.',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    price: 24500,
  },
  JPM: {
    name: 'JPMorgan Chase & Co.',
    sector: 'Financials',
    industry: 'Conventional Financials',
    price: 18300,
  },
  JNJ: {
    name: 'Johnson & Johnson',
    sector: 'Healthcare',
    industry: 'Drug Manufacturers',
    price: 15600,
  },
  XOM: {
    name: 'Exxon Mobil Corporation',
    sector: 'Energy',
    industry: 'Oil & Gas Integrated',
    price: 11500,
  },
};

@Injectable()
export class MockMarketDataProvider implements IMarketDataProvider {
  getQuote(ticker: string): Promise<MarketQuote> {
    const asset = mockAssets[ticker.toUpperCase()];
    if (!asset) {
      return Promise.resolve({
        ticker: ticker.toUpperCase(),
        priceCents: 10000,
        changePercent: 0.5,
        timestamp: new Date().toISOString(),
        currency: 'USD',
        marketStatus: 'UNKNOWN' as const,
      });
    }

    return Promise.resolve({
      ticker: ticker.toUpperCase(),
      priceCents: asset.price,
      changePercent: Math.random() * 4 - 2,
      timestamp: new Date().toISOString(),
      currency: 'USD',
      marketStatus: 'UNKNOWN' as const,
    });
  }

  getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    const asset = mockAssets[ticker.toUpperCase()];
    if (!asset) {
      return Promise.resolve({
        ticker: ticker.toUpperCase(),
        marketCap: 100_000_000_000,
        totalAssets: 50_000_000_000,
        totalDebt: 15_000_000_000,
        cashAndEquivalents: 5_000_000_000,
        interestIncome: 500_000_000,
        totalRevenue: 30_000_000_000,
        sector: 'Other' as const,
        industry: null,
        peRatio: null,
        dividendYield: null,
        volume: null,
        week52High: null,
        week52Low: null,
        currency: 'USD',
      });
    }

    return Promise.resolve({
      ticker: ticker.toUpperCase(),
      marketCap: 2_500_000_000_000,
      totalAssets: 350_000_000_000,
      totalDebt: 110_000_000_000,
      cashAndEquivalents: 60_000_000_000,
      interestIncome: 3_000_000_000,
      totalRevenue: 383_000_000_000,
      sector: asset.sector as FinancialFundamentals['sector'],
      industry: asset.industry,
      peRatio: 28.5,
      dividendYield: 0.005,
      volume: 45_000_000,
      week52High: 198.23,
      week52Low: 142.15,
      currency: 'USD',
    });
  }

  getCandles(
    ticker: string,
    resolution: string,
    _from?: number,
    _to?: number,
  ): Promise<ChartCandle[]> {
    const numCandles = resolution === '1D' ? 78 : resolution === '1W' ? 5 : 30;
    const candles: ChartCandle[] = [];
    let price = mockAssets[ticker.toUpperCase()]?.price ?? 10000;

    for (let i = numCandles; i >= 0; i--) {
      const timestamp = Math.floor(Date.now() / 1000) - i * 3600;
      const change = price * (Math.random() * 0.02 - 0.01);
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      candles.push([
        timestamp,
        Math.round(open),
        Math.round(high),
        Math.round(low),
        Math.round(close),
        Math.floor(Math.random() * 1000000),
      ]);
      price = close;
    }

    return Promise.resolve(candles);
  }

  search(query: string): Promise<SearchResult[]> {
    const q = query.toUpperCase();
    return Promise.resolve(
      Object.entries(mockAssets)
        .filter(
          ([ticker, asset]) =>
            ticker.includes(q) || asset.name.toUpperCase().includes(q),
        )
        .map(([ticker, asset]) => ({
          ticker,
          name: asset.name,
          sector: asset.sector,
          exchange: 'NASDAQ',
          currency: 'USD',
        })),
    );
  }
}
