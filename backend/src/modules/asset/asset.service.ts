/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

export interface AssetSearchParams {
  q?: string;
  sector?: string;
  exchange?: string;
  limit?: number;
  cursor?: string;
}

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: AssetSearchParams) {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const where: Prisma.AssetWhereInput = { isActive: true };

    if (params.sector && params.sector !== 'All Sectors') {
      where.sector = params.sector;
    }
    if (params.exchange && params.exchange !== 'all') {
      where.exchange = params.exchange.toUpperCase();
    }
    if (params.q && params.q.trim().length >= 1) {
      const q = params.q.trim();
      where.OR = [
        { ticker: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (params.cursor) {
      where.ticker = { gt: params.cursor };
    }

    const items = await this.prisma.asset.findMany({
      where,
      orderBy: [{ ticker: 'asc' }],
      take: limit + 1,
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1].ticker : null;

    return { data, nextCursor, hasMore };
  }

  getByTicker(ticker: string) {
    return this.prisma.asset.findUnique({ where: { ticker } });
  }
}
