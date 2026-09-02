import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { MarketDataService } from '../market-data/market-data.service';

export interface AssetSearchParams {
  q?: string;
  sector?: string;
  exchange?: string;
  limit?: number;
  cursor?: string;
}

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly marketDataService?: MarketDataService,
  ) {}

  async search(params: AssetSearchParams) {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const where: Prisma.AssetWhereInput = { isActive: true };
    const whereCount: Prisma.AssetWhereInput = { isActive: true };

    if (params.sector && params.sector !== 'All Sectors') {
      where.sector = params.sector;
      whereCount.sector = params.sector;
    }
    if (params.exchange && params.exchange !== 'all') {
      where.exchange = params.exchange.toUpperCase();
      whereCount.exchange = params.exchange.toUpperCase();
    }
    if (params.q && params.q.trim().length >= 1) {
      const q = params.q.trim();
      const or: Prisma.AssetWhereInput[] = [
        { ticker: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ];
      where.OR = or;
      whereCount.OR = or;
    }
    if (params.cursor) {
      where.ticker = { gt: params.cursor };
    }

    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy: [{ ticker: 'asc' }],
        take: limit + 1,
      }),
      this.prisma.asset.count({ where: whereCount }),
    ]);

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1].ticker : null;

    return { data, nextCursor, hasMore, total };
  }

  getByTicker(ticker: string) {
    return this.prisma.asset.findUnique({ where: { ticker } });
  }

  async enrichUnknown(limit = 50): Promise<{ enriched: number }> {
    if (!this.marketDataService) return { enriched: 0 };
    const unknowns = await this.prisma.asset.findMany({
      where: { sector: 'Unknown', isActive: true },
      take: limit,
      orderBy: [{ ticker: 'asc' }],
    });
    let enriched = 0;
    for (const a of unknowns) {
      try {
        const f = await this.marketDataService.getFundamentals(a.ticker);
        const sector = f.sector ?? 'Unknown';
        if (sector && sector !== 'Unknown') {
          await this.prisma.asset.update({
            where: { ticker: a.ticker },
            data: { sector, industry: f.industry ?? a.industry },
          });
          enriched += 1;
        }
        // 200ms throttle to stay under free tier 5 req/s
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        this.logger.warn(`enrich ${a.ticker} failed: ${(e as Error).message}`);
      }
    }
    return { enriched };
  }
}
