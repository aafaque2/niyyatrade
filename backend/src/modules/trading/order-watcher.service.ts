import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { TradingService } from './trading.service';

const POLL_MS = 2500;
const BATCH_SIZE = 100;
const LOCK_KEY = 'order-watcher:lock';
const LOCK_TTL_MS = 8000;

@Injectable()
export class OrderWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderWatcherService.name);
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketData: MarketDataService,
    private readonly trading: TradingService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  onModuleInit() {
    this.interval = setInterval(() => {
      void this.checkPendingOrders();
    }, POLL_MS);
    this.logger.log(`Order watcher started (interval: ${POLL_MS}ms)`);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkPendingOrders() {
    const token = randomUUID();
    let locked = false;
    try {
      // Distributed lock so multi-replica deploys don't double-poll/execute.
      try {
        const res = await this.redis.set(
          LOCK_KEY,
          token,
          'PX',
          LOCK_TTL_MS,
          'NX',
        );
        if (res !== 'OK') return;
        locked = true;
      } catch (err) {
        this.logger.warn(
          `Order watcher lock unavailable, skipping tick: ${(err as Error).message}`,
        );
        return;
      }

      const now = new Date();
      const pending = await this.prisma.order.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
        select: {
          id: true,
          portfolioId: true,
          assetTicker: true,
          side: true,
          quantity: true,
          targetPriceCents: true,
          expiresAt: true,
        },
      });

      if (pending.length === 0) return;

      for (const order of pending) {
        // Expired limit orders are cancelled (not failed) so history stays clean.
        if (order.expiresAt && order.expiresAt <= now) {
          this.logger.log(`Pending order ${order.id} expired, cancelling`);
          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'CANCELLED' },
          });
          continue;
        }

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

          // Market-hours gate: never fill limit orders from stale close
          // prices overnight/weekends. The order stays PENDING for next tick.
          if (quote.marketStatus === 'CLOSED') {
            continue;
          }

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
    } finally {
      if (locked) {
        try {
          // Release only if we still own the lock
          await this.redis.eval(
            `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
            1,
            LOCK_KEY,
            token,
          );
        } catch {
          // Lock expires on its own — safe to ignore release failures
        }
      }
    }
  }
}
