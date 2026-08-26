import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { TradingService } from './trading.service';

@Injectable()
export class OrderWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderWatcherService.name);
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketData: MarketDataService,
    private readonly trading: TradingService,
  ) {}

  onModuleInit() {
    this.interval = setInterval(() => {
      void this.checkPendingOrders();
    }, 2500);
    this.logger.log('Order watcher started (interval: 2.5s)');
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkPendingOrders() {
    try {
      const pending = await this.prisma.order.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          portfolioId: true,
          assetTicker: true,
          side: true,
          quantity: true,
          targetPriceCents: true,
        },
      });

      if (pending.length === 0) return;

      for (const order of pending) {
        if (!order.targetPriceCents) {
          this.logger.warn(
            `Pending order ${order.id} has no target price, marking FAILED`,
          );
          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'FAILED' },
          });
          continue;
        }

        try {
          const quote = await this.marketData.getQuote(order.assetTicker);
          const currentPriceCents = quote.priceCents;

          const target = Number(order.targetPriceCents);
          const shouldExecute =
            order.side === 'BUY'
              ? currentPriceCents <= target
              : currentPriceCents >= target;

          if (shouldExecute) {
            this.logger.log(
              `Executing pending order ${order.id} (${order.side} ${order.assetTicker} at ${currentPriceCents}, target ${target})`,
            );
            await this.trading.executePendingOrder({
              id: order.id,
              portfolioId: order.portfolioId,
              assetTicker: order.assetTicker,
              side: order.side,
              quantity: Number(order.quantity),
              targetPriceCents: Number(order.targetPriceCents),
            });
          }
        } catch (err) {
          this.logger.warn(
            `Failed to check price for pending order ${order.id}: ${(err as Error).message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Order watcher error: ${(err as Error).message}`);
    }
  }
}
