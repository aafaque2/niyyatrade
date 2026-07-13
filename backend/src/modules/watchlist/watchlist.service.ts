import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';

@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketData: MarketDataService,
  ) {}

  private async ensureWatchlist(userId: string) {
    let watchlist = await this.prisma.watchlist.findFirst({
      where: { userId },
    });
    if (!watchlist) {
      watchlist = await this.prisma.watchlist.create({
        data: { userId, name: 'Default' },
      });
    }
    return watchlist;
  }

  private async ensureAssetExists(ticker: string) {
    const upper = ticker.toUpperCase();
    const existing = await this.prisma.asset.findUnique({
      where: { ticker: upper },
    });
    if (existing) return existing;

    let name = upper;
    let sector = 'Other';
    try {
      const fundamentals = await this.marketData.getFundamentals(upper);
      sector = fundamentals.sector;
      name = fundamentals.industry ?? upper;
    } catch {
      this.logger.warn(`Failed to fetch fundamentals for ${upper}, using defaults`);
    }

    return this.prisma.asset.upsert({
      where: { ticker: upper },
      create: { ticker: upper, name, sector },
      update: {},
    });
  }

  async getWatchlist(userId: string) {
    const watchlist = await this.ensureWatchlist(userId);

    const items = await this.prisma.watchlistItem.findMany({
      where: { watchlistId: watchlist.id },
      include: {
        asset: {
          select: { ticker: true, name: true, sector: true },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      ticker: item.asset.ticker,
      name: item.asset.name,
      sector: item.asset.sector,
      addedAt: item.addedAt,
    }));
  }

  async addTicker(userId: string, ticker: string) {
    const watchlist = await this.ensureWatchlist(userId);

    const asset = await this.ensureAssetExists(ticker);
    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    const existing = await this.prisma.watchlistItem.findUnique({
      where: {
        watchlistId_assetTicker: {
          watchlistId: watchlist.id,
          assetTicker: ticker.toUpperCase(),
        },
      },
    });
    if (existing) {
      throw new ConflictException(`${ticker} is already in your watchlist`);
    }

    const item = await this.prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist.id,
        assetTicker: ticker.toUpperCase(),
      },
      include: {
        asset: { select: { ticker: true, name: true, sector: true } },
      },
    });

    return {
      id: item.id,
      ticker: item.asset.ticker,
      name: item.asset.name,
      sector: item.asset.sector,
      addedAt: item.addedAt,
    };
  }

  async removeTicker(userId: string, ticker: string) {
    const watchlist = await this.ensureWatchlist(userId);

    const item = await this.prisma.watchlistItem.findUnique({
      where: {
        watchlistId_assetTicker: {
          watchlistId: watchlist.id,
          assetTicker: ticker.toUpperCase(),
        },
      },
    });
    if (!item) {
      throw new NotFoundException(`${ticker} not found in your watchlist`);
    }

    await this.prisma.watchlistItem.delete({ where: { id: item.id } });
  }
}
