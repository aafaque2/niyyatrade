import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { ComplianceService } from '../compliance/compliance.service';
import { FxService } from '../fx/fx.service';
import { OrderSide, type CreateOrderDto } from './dto/create-order.dto';
import { getStartingBalance } from '../../shared/constants/currency';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketData: MarketDataService,
    private readonly compliance: ComplianceService,
    private readonly fxService: FxService,
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

    const activeFramework = user?.activeFrameworkId
      ? await this.prisma.framework.findUnique({
          where: { id: user.activeFrameworkId },
          select: { slug: true },
        })
      : null;

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
        const marketValueAsset = qty.mul(currentPriceCents).toDecimalPlaces(0);

        let marketValueBase = marketValueAsset;
        if (currency.toUpperCase() !== baseCurrency) {
          try {
            const rate = await this.fxService.getRate(currency, baseCurrency);
            marketValueBase = marketValueAsset.mul(rate).toDecimalPlaces(0);
          } catch {
            this.logger.warn(
              `FX conversion failed for ${currency}/${baseCurrency}, using raw value`,
            );
          }
        }
        totalValueCents = totalValueCents.add(marketValueBase);

        const costBasis = qty
          .mul(Number(pos.averagePriceCents))
          .toDecimalPlaces(0);
        const returnCents = marketValueBase.sub(costBasis);
        const costBasisAbs = costBasis.abs();
        const returnPercent = costBasisAbs.gt(0)
          ? returnCents.div(costBasisAbs).mul(100).toDecimalPlaces(2).toNumber()
          : 0;

        // avgPrice stored in base currency — convert to asset currency for display
        let avgPriceDisplayCents = Number(pos.averagePriceCents);
        if (baseCurrency !== currency) {
          try {
            const rate = await this.fxService.getRate(baseCurrency, currency);
            avgPriceDisplayCents = Math.round(avgPriceDisplayCents * rate);
          } catch {
            // fallback to raw base value
          }
        }

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
          avgPriceCents: avgPriceDisplayCents,
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

    // dailyChange must be in base currency — convert per-position change if needed
    const dailyChangeCents = await (async () => {
      let total = new Decimal(0);
      for (const p of positionDtos) {
        const raw = new Decimal(p.quantity)
          .mul(p.currentPriceCents)
          .mul(p.changePercent ?? 0)
          .div(100);
        if ((p.currency ?? 'USD').toUpperCase() !== baseCurrency) {
          try {
            const rate = await this.fxService.getRate(
              p.currency ?? 'USD',
              baseCurrency,
            );
            total = total.add(raw.mul(rate).toDecimalPlaces(0));
          } catch {
            total = total.add(raw.toDecimalPlaces(0));
          }
        } else {
          total = total.add(raw.toDecimalPlaces(0));
        }
      }
      return total.toNumber();
    })();
    const prevTotalValue = totalValueCents.toNumber() - dailyChangeCents;
    const dailyChangePercent =
      prevTotalValue > 0
        ? Math.round((dailyChangeCents / prevTotalValue) * 10000) / 100
        : 0;

    const recentOrders = await this.prisma.order.findMany({
      where: { portfolioId: portfolio.id, status: { not: 'PENDING' as const } },
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
      shortSellingAllowed: activeFramework
        ? activeFramework.slug !== 'halal-aaoifi'
        : true,
      activeFrameworkSlug: activeFramework?.slug ?? null,
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

  async placeLimitOrder(userId: string, dto: CreateOrderDto) {
    const limitPriceCents = dto.limitPriceCents;
    if (!limitPriceCents || limitPriceCents <= 0) {
      throw new BadRequestException('Invalid limit price');
    }

    const quantity = new Decimal(dto.quantity);
    if (quantity.mul(limitPriceCents).toDecimalPlaces(0).lt(1)) {
      throw new BadRequestException('Order total is less than 1 cent');
    }

    await this.ensureAssetExists(dto.assetTicker);

    if (dto.side === OrderSide.SELL) {
      await this.assertShortSellAllowed(userId, dto.assetTicker, quantity);
    }

    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
    });
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Convert limit price from asset currency to base currency for consistent ledger
    let targetPriceBaseCents = limitPriceCents;
    let assetCurrency: string | undefined;
    try {
      const quote = await this.marketData.getQuote(dto.assetTicker);
      assetCurrency = quote.currency;
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true },
      });
      const baseCurrency = user?.currency ?? 'USD';
      if (
        assetCurrency &&
        assetCurrency.toUpperCase() !== baseCurrency.toUpperCase()
      ) {
        targetPriceBaseCents = await this.fxService.convertCents(
          limitPriceCents,
          assetCurrency,
          baseCurrency,
        );
      }
    } catch (err) {
      this.logger.warn(
        `FX convert for limit price failed, using raw: ${(err as Error).message}`,
      );
    }

    // For BUY, ensure enough buying power at limit price (fail fast)
    if (dto.side === OrderSide.BUY) {
      const totalAtLimit = quantity
        .mul(targetPriceBaseCents)
        .toDecimalPlaces(0);
      const cash = new Decimal(portfolio.availableCashCents.toString());
      if (cash.lt(totalAtLimit)) {
        throw new BadRequestException(
          'Insufficient buying power for limit order',
        );
      }
    }

    this.logger.log(
      `Placing ${dto.side} LIMIT order for user=${userId} ticker=${dto.assetTicker} qty=${dto.quantity} limit=${limitPriceCents} (base ${targetPriceBaseCents} ${assetCurrency ?? 'USD'})`,
    );

    const order = await this.prisma.order.create({
      data: {
        portfolioId: portfolio.id,
        assetTicker: dto.assetTicker,
        side: dto.side,
        quantity: quantity.toNumber(),
        status: 'PENDING',
        targetPriceCents: targetPriceBaseCents,
        // Limit orders live 7 days, then the watcher cancels them so stale
        // PENDING rows cannot accumulate forever.
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      orderId: order.id,
      status: order.status,
      targetPriceCents: targetPriceBaseCents,
    };
  }

  private async assertShortSellAllowed(
    userId: string,
    ticker: string,
    quantity: Decimal,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { activeFrameworkId: true },
    });
    if (!user?.activeFrameworkId) return;

    const framework = await this.prisma.framework.findUnique({
      where: { id: user.activeFrameworkId },
      select: { slug: true },
    });
    if (framework?.slug !== 'halal-aaoifi') return;

    // Halal framework is active — check if this sell would create/reduce a short
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) return;

    await this.assertShortSellAllowedForPortfolio(
      portfolio.id,
      ticker,
      quantity,
    );
  }

  private async assertShortSellAllowedForPortfolio(
    portfolioId: string,
    ticker: string,
    quantity: Decimal,
  ) {
    const pos = await this.prisma.position.findUnique({
      where: {
        portfolioId_assetTicker: {
          portfolioId,
          assetTicker: ticker,
        },
      },
      select: { quantity: true },
    });

    const heldQty = pos ? new Decimal(pos.quantity) : new Decimal(0);
    if (heldQty.lt(quantity)) {
      throw new BadRequestException(
        'Short selling is not permitted under the Halal (AAOIFI) framework',
      );
    }
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

    // Market-hours gate: live MARKET fills only when we know the market is
    // open. CLOSED sessions (overnight/weekends) would otherwise fill at stale
    // close prices. LIMIT orders can still be placed anytime — the watcher
    // holds them until the market reopens.
    if (quote.marketStatus === 'CLOSED') {
      throw new BadRequestException(
        `Market is closed for ${dto.assetTicker} — place a limit order and it will execute when trading resumes`,
      );
    }

    // Settle everything in the user's base currency — portfolio cash is
    // held in a single currency, so foreign-priced assets must be converted
    // before debiting/crediting. Fail closed if FX data is unavailable.
    const priceCents = await this.resolvePriceCentsInBaseCurrency(
      userId,
      quote.priceCents,
      quote.currency,
    );
    const quantity = new Decimal(dto.quantity);
    const totalCostCents = quantity.mul(priceCents).toDecimalPlaces(0);

    if (totalCostCents.lt(1)) {
      throw new BadRequestException('Order total is less than 1 cent');
    }

    await this.ensureAssetExists(dto.assetTicker);

    if (dto.side === OrderSide.SELL && quantity.gt(0)) {
      await this.assertShortSellAllowed(userId, dto.assetTicker, quantity);
    }

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

  /**
   * Convert a quote price (in the asset's quote currency) into the user's
   * base-currency cents. Throws if conversion is impossible so a trade is
   * never settled in the wrong currency.
   */
  private async resolvePriceCentsInBaseCurrency(
    userId: string,
    priceCents: number,
    quoteCurrency?: string,
  ): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    });
    const baseCurrency = user?.currency ?? 'USD';
    const quoteCcy = (quoteCurrency ?? 'USD').toUpperCase();

    if (quoteCcy === baseCurrency) {
      return priceCents;
    }

    try {
      const rate = await this.fxService.getRate(quoteCcy, baseCurrency);
      return Math.round(priceCents * rate);
    } catch {
      throw new BadRequestException(
        `Unable to convert ${quoteCcy} price to ${baseCurrency} — trade cancelled`,
      );
    }
  }

  private async resolvePriceForPortfolio(
    portfolioId: string,
    priceCents: number,
    quoteCurrency?: string,
  ): Promise<number> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { userId: true },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return this.resolvePriceCentsInBaseCurrency(
      portfolio.userId,
      priceCents,
      quoteCurrency,
    );
  }

  async executePendingOrder(order: {
    id: string;
    portfolioId: string;
    assetTicker: string;
    side: string;
    quantity: number;
    targetPriceCents: number;
  }) {
    // Limit orders are placed in the asset's quote currency (UI shows
    // Last price in asset currency). Execute at the current market price
    // (converted to base) — not at the limit price — to avoid overpaying
    // when a BUY limit is placed above market (or SELL below). The limit
    // is only a trigger; execution uses the market price at trigger time.
    let executionPriceCents: number;
    try {
      const quote = await this.marketData.getQuote(order.assetTicker);
      executionPriceCents = await this.resolvePriceForPortfolio(
        order.portfolioId,
        quote.priceCents,
        quote.currency,
      );
    } catch (err) {
      this.logger.warn(
        `Pending order ${order.id} price resolve failed: ${(err as Error).message}`,
      );
      throw err;
    }

    const priceCents = executionPriceCents;
    const quantity = new Decimal(order.quantity);
    const totalCostCents = quantity.mul(priceCents).toDecimalPlaces(0);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const portfolio = await tx.$queryRaw<
          Array<{ id: string; availableCashCents: bigint }>
        >(
          Prisma.sql`SELECT "id", "availableCashCents" FROM "Portfolio" WHERE "id" = ${order.portfolioId} FOR UPDATE`,
        );

        if (!portfolio.length) {
          throw new NotFoundException('Portfolio not found');
        }

        // Re-validate compliance at execution time — holdings may have changed
        // since placement (e.g. shares sold elsewhere), and a SELL exceeding
        // current holdings would otherwise open a short under the Halal framework.
        if (order.side === 'SELL') {
          await this.assertShortSellAllowedForPortfolio(
            order.portfolioId,
            order.assetTicker,
            quantity,
          );
        }

        const result =
          order.side === 'BUY'
            ? await this.executeBuy(
                tx,
                portfolio[0],
                order.assetTicker,
                quantity,
                priceCents,
                totalCostCents.toNumber(),
                order.id,
              )
            : await this.executeSell(
                tx,
                portfolio[0],
                order.assetTicker,
                quantity,
                priceCents,
                totalCostCents.toNumber(),
                order.id,
              );

        return result;
      });
    } catch (err) {
      // Permanent validation failures -> FAILED. Transient upstream blips
      // (timeouts, 5xx, FX hiccups) leave the order PENDING for the next tick.
      const permanent =
        err instanceof BadRequestException ||
        err instanceof NotFoundException ||
        err instanceof ConflictException ||
        (typeof (err as { status?: unknown })?.status === 'number' &&
          (err as { status: number }).status >= 400 &&
          (err as { status: number }).status < 500);
      if (!permanent) {
        this.logger.warn(
          `Pending order ${order.id} hit transient error, keeping PENDING: ${(err as Error).message}`,
        );
        throw err;
      }
      this.logger.warn(
        `Pending order ${order.id} execution failed: ${(err as Error).message}`,
      );
      // Mark as FAILED
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
      return { orderId: order.id, status: 'FAILED', executedPriceCents: null };
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
    orderId?: string,
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

    let newQty: Decimal;
    let newAvgPrice: number;

    if (existing) {
      const heldQty = new Decimal(existing.quantity);
      const currentAvgPrice = Number(existing.averagePriceCents);

      if (heldQty.lt(0)) {
        // Currently short — auto-cover first
        const shortQty = heldQty.abs();
        if (quantity.lte(shortQty)) {
          // Partial cover: reduce short position
          newQty = shortQty.sub(quantity).negated();
          newAvgPrice = currentAvgPrice;
        } else {
          // Cover entire short + open new long
          const newLongQty = quantity.sub(shortQty);
          newQty = newLongQty;
          newAvgPrice = priceCents;
        }
      } else {
        // Already long — add to long (weighted average)
        const totalQty = heldQty.add(quantity);
        const totalCost = heldQty
          .mul(currentAvgPrice)
          .add(quantity.mul(priceCents));
        newAvgPrice = totalCost.div(totalQty).toDecimalPlaces(0).toNumber();
        newQty = totalQty;
      }

      if (newQty.isZero()) {
        await tx.position.delete({ where: { id: existing.id } });
      } else {
        await tx.position.update({
          where: { id: existing.id },
          data: {
            quantity: newQty.toNumber(),
            averagePriceCents: newAvgPrice,
          },
        });
      }
    } else {
      // No position — open new long
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

    // Claim the order atomically — if another instance already executed it,
    // this update matches nothing and we abort (rolling back all mutations).
    const claimedOrderId = orderId;
    if (claimedOrderId) {
      const claimed = await tx.order.updateMany({
        where: { id: claimedOrderId, status: 'PENDING' },
        data: {
          status: 'EXECUTED',
          executedPriceCents: priceCents,
          executedAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException(
          `Order ${claimedOrderId} is no longer pending`,
        );
      }
    }

    const order = claimedOrderId
      ? { id: claimedOrderId, status: 'EXECUTED' as const }
      : await tx.order.create({
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
    orderId?: string,
  ) {
    const positionRows = await tx.$queryRaw<
      Array<{ id: string; quantity: string; averagePriceCents: bigint }>
    >(
      Prisma.sql`SELECT "id", "quantity", "averagePriceCents" FROM "Position" WHERE "portfolioId" = ${portfolio.id} AND "assetTicker" = ${ticker} FOR UPDATE`,
    );

    const sellQty = quantity;
    let newQty: Decimal;
    let newAvgPrice: number;

    if (
      !positionRows.length ||
      new Decimal(positionRows[0].quantity).isZero()
    ) {
      // No position — open new short
      newQty = sellQty.negated();
      newAvgPrice = priceCents;
    } else {
      const pos = positionRows[0];
      const heldQty = new Decimal(pos.quantity);
      const currentAvgPrice = Number(pos.averagePriceCents);

      if (heldQty.gt(0)) {
        // Currently long
        if (sellQty.lte(heldQty)) {
          // Selling within long position
          newQty = heldQty.sub(sellQty);
          newAvgPrice = currentAvgPrice;
        } else {
          // Selling more than held — going short
          const shortQty = sellQty.sub(heldQty);
          newQty = shortQty.negated();
          newAvgPrice = priceCents;
        }
      } else {
        // Already short — adding to short (weighted average)
        const curShortQty = heldQty.abs();
        const totalShortQty = curShortQty.add(sellQty);
        const totalCost = curShortQty
          .mul(currentAvgPrice)
          .add(sellQty.mul(priceCents));
        newAvgPrice = totalCost
          .div(totalShortQty)
          .toDecimalPlaces(0)
          .toNumber();
        newQty = totalShortQty.negated();
      }
    }

    if (newQty.isZero()) {
      if (positionRows.length) {
        await tx.position.delete({ where: { id: positionRows[0].id } });
      }
    } else if (positionRows.length) {
      await tx.$executeRaw(
        Prisma.sql`UPDATE "Position" SET "quantity" = ${newQty.toNumber()}::decimal(15,6), "averagePriceCents" = ${newAvgPrice} WHERE "id" = ${positionRows[0].id}::uuid`,
      );
    } else {
      await tx.position.create({
        data: {
          portfolioId: portfolio.id,
          assetTicker: ticker,
          quantity: newQty.toNumber(),
          averagePriceCents: newAvgPrice,
        },
      });
    }

    const cash = new Decimal(portfolio.availableCashCents.toString());
    await tx.portfolio.update({
      where: { id: portfolio.id },
      data: {
        availableCashCents: cash.add(totalCostCents).toNumber(),
      },
    });

    // Claim the order atomically — see executeBuy.
    const claimedOrderId = orderId;
    if (claimedOrderId) {
      const claimed = await tx.order.updateMany({
        where: { id: claimedOrderId, status: 'PENDING' },
        data: {
          status: 'EXECUTED',
          executedPriceCents: priceCents,
          executedAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException(
          `Order ${claimedOrderId} is no longer pending`,
        );
      }
    }

    const order = claimedOrderId
      ? { id: claimedOrderId, status: 'EXECUTED' as const }
      : await tx.order.create({
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

  async cancelOrder(userId: string, orderId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, portfolioId: true, status: true },
    });
    if (!order || order.portfolioId !== portfolio.id) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Only pending limit orders can be cancelled (current: ${order.status})`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      select: { id: true, status: true },
    });

    this.logger.log(`Cancelled order ${orderId} for user=${userId}`);
    return updated;
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

    // Reset keeps the Portfolio row, so children are cleared explicitly.
    // Order matters: Transaction -> Order (FK Transaction.orderId, CASCADE as
    // backstop) -> Position. Parent deletes (User/Portfolio/Watchlist) rely on
    // schema-level ON DELETE CASCADE (migration 20260903000000).
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
