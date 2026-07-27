import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { ComplianceService } from '../compliance/compliance.service';
import { OrderSide, type CreateOrderDto } from './dto/create-order.dto';
import { getStartingBalance } from '../../shared/constants/currency';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketData: MarketDataService,
    private readonly compliance: ComplianceService,
  ) {}

  async getPortfolio(userId: string, includeCompliance?: boolean) {
    const [portfolio, user] = await Promise.all([
      this.prisma.portfolio.findUnique({
        where: { userId },
        include: { positions: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { activeFrameworkId: true, currency: true },
      }),
    ]);

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    const positions = portfolio.positions ?? [];
    const baseCurrency = user?.currency ?? 'USD';
    let totalValueCents = new Decimal(portfolio.availableCashCents.toString());

    const positionDtos = await Promise.all(
      positions.map(async (pos) => {
        let currentPriceCents = 0;
        let currency = 'USD';
        let changePercent = 0;
        try {
          const quote = await this.marketData.getQuote(pos.assetTicker);
          currentPriceCents = quote.priceCents;
          currency = quote.currency;
          changePercent = quote.changePercent ?? 0;
        } catch {
          this.logger.warn(`Failed to fetch quote for ${pos.assetTicker}`);
        }

        const qty = new Decimal(pos.quantity);
        const marketValue = qty.mul(currentPriceCents).toDecimalPlaces(0);

        let convertedValue = marketValue;
        if (currency.toUpperCase() !== baseCurrency) {
          try {
            const fxRate = await this.marketData.getFxRate(
              currency,
              baseCurrency,
            );
            convertedValue = marketValue.mul(fxRate.rate).toDecimalPlaces(0);
          } catch {
            this.logger.warn(
              `FX conversion failed for ${currency}/${baseCurrency}, using raw value`,
            );
          }
        }
        totalValueCents = totalValueCents.add(convertedValue);

        const costBasis = qty
          .mul(Number(pos.averagePriceCents))
          .toDecimalPlaces(0);
        const returnCents = marketValue.sub(costBasis);
        const returnPercent = costBasis.gt(0)
          ? returnCents.div(costBasis).mul(100).toDecimalPlaces(2).toNumber()
          : 0;

        let complianceVerdict: string | undefined;
        if (includeCompliance) {
          try {
            const report = await this.compliance.evaluate(
              pos.assetTicker,
              user?.activeFrameworkId ?? undefined,
              userId,
            );
            complianceVerdict = report.verdict;
          } catch {
            this.logger.warn(
              `Failed to fetch compliance for ${pos.assetTicker}`,
            );
          }
        }

        return {
          ticker: pos.assetTicker,
          quantity: qty.toNumber(),
          avgPriceCents: Number(pos.averagePriceCents),
          currentPriceCents,
          returnCents: returnCents.toNumber(),
          returnPercent,
          changePercent,
          complianceVerdict,
          currency,
        };
      }),
    );

    const compliantCount = positionDtos.filter(
      (p) => p.complianceVerdict === 'COMPLIANT',
    ).length;
    const overallComplianceScore =
      positionDtos.length > 0
        ? Math.round((compliantCount / positionDtos.length) * 100)
        : 100;

    const totalPositionValue = positionDtos.reduce(
      (sum, p) => sum + p.quantity * p.currentPriceCents,
      0,
    );
    const dailyChangePercent =
      totalPositionValue > 0
        ? positionDtos.reduce(
            (sum, p) =>
              sum + (p.quantity * p.currentPriceCents * p.changePercent) / 100,
            0,
          ) / totalPositionValue
        : 0;

    const recentOrders = await this.prisma.order.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        assetTicker: true,
        side: true,
        quantity: true,
        executedPriceCents: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      id: portfolio.id,
      buyingPowerCents: Number(portfolio.availableCashCents),
      totalValueCents: totalValueCents.toNumber(),
      overallComplianceScore,
      dailyChangePercent: Math.round(dailyChangePercent * 100) / 100,
      positions: positionDtos,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        ticker: o.assetTicker,
        side: o.side,
        quantity: Number(o.quantity),
        priceCents: Number(o.executedPriceCents),
        status: o.status,
        createdAt: o.createdAt,
      })),
    };
  }

  private async ensureAssetExists(ticker: string) {
    const upper = ticker.toUpperCase();
    const existing = await this.prisma.asset.findUnique({
      where: { ticker: upper },
    });
    if (existing) return;

    let name = upper;
    let sector = 'Other';
    try {
      const fundamentals = await this.marketData.getFundamentals(upper);
      sector = fundamentals.sector ?? 'Other';
      name = fundamentals.industry ?? upper;
    } catch {
      // use defaults
    }

    await this.prisma.asset.upsert({
      where: { ticker: upper },
      create: { ticker: upper, name, sector },
      update: {},
    });
  }

  async executeMarketOrder(userId: string, dto: CreateOrderDto) {
    let quote;
    try {
      quote = await this.marketData.getQuote(dto.assetTicker);
    } catch {
      throw new BadRequestException(
        `Unable to get price for ${dto.assetTicker}`,
      );
    }

    const priceCents = quote.priceCents;
    const quantity = new Decimal(dto.quantity);
    const totalCostCents = quantity.mul(priceCents).toDecimalPlaces(0);

    if (totalCostCents.lt(1)) {
      throw new BadRequestException('Order total is less than 1 cent');
    }

    await this.ensureAssetExists(dto.assetTicker);

    this.logger.log(
      `Executing ${dto.side} order for user=${userId} ticker=${dto.assetTicker} qty=${dto.quantity} price=${priceCents}`,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const portfolio = await this.lockPortfolio(tx, userId);

        if (dto.side === OrderSide.BUY) {
          return this.executeBuy(
            tx,
            portfolio,
            dto.assetTicker,
            quantity,
            priceCents,
            totalCostCents.toNumber(),
          );
        }
        return this.executeSell(
          tx,
          portfolio,
          dto.assetTicker,
          quantity,
          priceCents,
          totalCostCents.toNumber(),
        );
      });
    } catch (err) {
      this.logger.error(
        `Order execution failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  private async lockPortfolio(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<{ id: string; availableCashCents: bigint }> {
    const rows = await tx.$queryRaw<
      Array<{ id: string; availableCashCents: bigint }>
    >(
      Prisma.sql`SELECT "id", "availableCashCents" FROM "Portfolio" WHERE "userId" = ${userId} FOR UPDATE`,
    );

    if (!rows.length) {
      throw new NotFoundException('Portfolio not found');
    }

    return rows[0];
  }

  private async executeBuy(
    tx: Prisma.TransactionClient,
    portfolio: { id: string; availableCashCents: bigint },
    ticker: string,
    quantity: Decimal,
    priceCents: number,
    totalCostCents: number,
  ) {
    const cash = new Decimal(portfolio.availableCashCents.toString());
    if (cash.lt(totalCostCents)) {
      throw new BadRequestException('Insufficient buying power');
    }

    const existing = await tx.position.findUnique({
      where: {
        portfolioId_assetTicker: {
          portfolioId: portfolio.id,
          assetTicker: ticker,
        },
      },
    });

    if (existing) {
      const oldQty = new Decimal(existing.quantity);
      const totalQty = oldQty.add(quantity);
      const totalCost = oldQty
        .mul(Number(existing.averagePriceCents))
        .add(quantity.mul(priceCents));
      const newAvgPrice = totalCost.div(totalQty).toDecimalPlaces(0);

      await tx.position.update({
        where: { id: existing.id },
        data: {
          quantity: totalQty.toNumber(),
          averagePriceCents: newAvgPrice.toNumber(),
        },
      });
    } else {
      await tx.position.create({
        data: {
          portfolioId: portfolio.id,
          assetTicker: ticker,
          quantity: quantity.toNumber(),
          averagePriceCents: priceCents,
        },
      });
    }

    await tx.portfolio.update({
      where: { id: portfolio.id },
      data: {
        availableCashCents: cash.sub(totalCostCents).toNumber(),
      },
    });

    const order = await tx.order.create({
      data: {
        portfolioId: portfolio.id,
        assetTicker: ticker,
        side: 'BUY',
        quantity: quantity.toNumber(),
        status: 'EXECUTED',
        executedPriceCents: priceCents,
        executedAt: new Date(),
      },
    });

    await tx.transaction.create({
      data: {
        portfolioId: portfolio.id,
        orderId: order.id,
        transactionType: 'BUY',
        assetTicker: ticker,
        quantity: quantity.toNumber(),
        pricePerShareCents: priceCents,
        totalAmountCents: totalCostCents,
      },
    });

    return {
      orderId: order.id,
      status: order.status,
      executedPriceCents: priceCents,
    };
  }

  private async executeSell(
    tx: Prisma.TransactionClient,
    portfolio: { id: string; availableCashCents: bigint },
    ticker: string,
    quantity: Decimal,
    priceCents: number,
    totalCostCents: number,
  ) {
    const positionRows = await tx.$queryRaw<
      Array<{ id: string; quantity: string; averagePriceCents: bigint }>
    >(
      Prisma.sql`SELECT "id", "quantity", "averagePriceCents" FROM "Position" WHERE "portfolioId" = ${portfolio.id} AND "assetTicker" = ${ticker} FOR UPDATE`,
    );

    if (!positionRows.length) {
      throw new BadRequestException('No position found for this asset');
    }

    const position = positionRows[0];
    const heldQty = new Decimal(position.quantity);

    if (heldQty.lt(quantity)) {
      throw new BadRequestException('Insufficient shares');
    }

    const newQty = heldQty.sub(quantity);

    if (newQty.isZero()) {
      await tx.position.delete({ where: { id: position.id } });
    } else {
      await tx.$executeRaw(
        Prisma.sql`UPDATE "Position" SET "quantity" = ${newQty.toNumber()}::decimal(15,6) WHERE "id" = ${position.id}::uuid`,
      );
    }

    const cash = new Decimal(portfolio.availableCashCents.toString());
    await tx.portfolio.update({
      where: { id: portfolio.id },
      data: {
        availableCashCents: cash.add(totalCostCents).toNumber(),
      },
    });

    const order = await tx.order.create({
      data: {
        portfolioId: portfolio.id,
        assetTicker: ticker,
        side: 'SELL',
        quantity: quantity.toNumber(),
        status: 'EXECUTED',
        executedPriceCents: priceCents,
        executedAt: new Date(),
      },
    });

    await tx.transaction.create({
      data: {
        portfolioId: portfolio.id,
        orderId: order.id,
        transactionType: 'SELL',
        assetTicker: ticker,
        quantity: quantity.toNumber(),
        pricePerShareCents: priceCents,
        totalAmountCents: totalCostCents,
      },
    });

    return {
      orderId: order.id,
      status: order.status,
      executedPriceCents: priceCents,
    };
  }

  async resetPortfolio(userId: string) {
    const [portfolio, user] = await Promise.all([
      this.prisma.portfolio.findUnique({
        where: { userId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true },
      }),
    ]);
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    const startingBalance = getStartingBalance(user?.currency ?? 'USD');

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { portfolioId: portfolio.id },
      });
      await tx.order.deleteMany({
        where: { portfolioId: portfolio.id },
      });
      await tx.position.deleteMany({
        where: { portfolioId: portfolio.id },
      });
      await tx.portfolio.update({
        where: { id: portfolio.id },
        data: { availableCashCents: startingBalance },
      });
    });
  }
}
