import { Global, Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

function createRedisClient(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });
}

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );
        const client = createRedisClient(url);
        // Non-blocking: let HTTP listen first so Render health checks pass
        // while Redis (also sleeping on free tier) wakes up. Commands queue
        // until ready; failures are handled per-call-site.
        void client.connect().catch(() => undefined);
        client.on('error', () => undefined);
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
