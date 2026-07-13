import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { OrderSide, OrderStatus } from '../../generated/prisma/enums';

export interface OrderHistoryItem {
  id: string;
  ticker: string;
  side: OrderSide;
  quantity: number;
  priceCents: number | null;
  status: OrderStatus;
  executedAt: string | null;
  createdAt: string;
}

export interface ComplianceHistoryItem {
  id: string;
  ticker: string;
  frameworkId: string;
  verdict: string;
  evaluatedAt: string;
}

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrderHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: OrderHistoryItem[]; total: number; page: number; pages: number }> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
    });
    if (!portfolio) {
      return { items: [], total: 0, page: 1, pages: 0 };
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { portfolioId: portfolio.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          assetTicker: true,
          side: true,
          quantity: true,
          executedPriceCents: true,
          status: true,
          executedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.order.count({ where: { portfolioId: portfolio.id } }),
    ]);

    return {
      items: orders.map((o) => ({
        id: o.id,
        ticker: o.assetTicker,
        side: o.side as OrderSide,
        quantity: Number(o.quantity),
        priceCents: o.executedPriceCents ? Number(o.executedPriceCents) : null,
        status: o.status as OrderStatus,
        executedAt: o.executedAt?.toISOString() ?? null,
        createdAt: o.createdAt.toISOString(),
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getComplianceHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: ComplianceHistoryItem[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [audits, total] = await Promise.all([
      this.prisma.complianceAudit.findMany({
        where: { userId },
        orderBy: { evaluatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          assetTicker: true,
          frameworkId: true,
          verdict: true,
          evaluatedAt: true,
        },
      }),
      this.prisma.complianceAudit.count({ where: { userId } }),
    ]);

    return {
      items: audits.map((a) => ({
        id: a.id,
        ticker: a.assetTicker,
        frameworkId: a.frameworkId,
        verdict: a.verdict,
        evaluatedAt: a.evaluatedAt.toISOString(),
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
