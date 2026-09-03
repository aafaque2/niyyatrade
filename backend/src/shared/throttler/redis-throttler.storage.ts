import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

interface ThrottlerRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Redis-backed fixed-window counter for @nestjs/throttler v6.
 * Replaces the default in-memory store so limits hold across replicas.
 * Fails open (not blocked) if Redis is unreachable, with a warning.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerRecord> {
    const redisKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${redisKey}:blocked`;
    try {
      // Already blocked? Stay blocked for the remaining block window.
      if (blockDuration > 0) {
        const blockedTtl = await this.redis.pttl(blockKey);
        if (blockedTtl > 0) {
          return {
            totalHits: limit + 1,
            timeToExpire: Math.ceil(blockedTtl / 1000),
            isBlocked: true,
            timeToBlockExpire: Math.ceil(blockedTtl / 1000),
          };
        }
      }

      const count = await this.redis.incr(redisKey);
      if (count === 1) {
        await this.redis.pexpire(redisKey, ttl);
      }
      const ttlMs = await this.redis.pttl(redisKey);
      const timeToExpire =
        ttlMs > 0 ? Math.ceil(ttlMs / 1000) : Math.ceil(ttl / 1000);
      const isBlocked = count > limit;

      let timeToBlockExpire = 0;
      if (isBlocked && blockDuration > 0) {
        await this.redis.set(blockKey, '1', 'PX', blockDuration, 'NX');
        const bttl = await this.redis.pttl(blockKey);
        timeToBlockExpire = bttl > 0 ? Math.ceil(bttl / 1000) : 0;
      }

      return { totalHits: count, timeToExpire, isBlocked, timeToBlockExpire };
    } catch (err) {
      this.logger.warn(
        `Throttler Redis unavailable, failing open: ${(err as Error).message}`,
      );
      return {
        totalHits: 0,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
