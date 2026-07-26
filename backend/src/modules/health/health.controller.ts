import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const checks = await Promise.allSettled([
      this.checkDb(),
      this.checkRedis(),
    ]);

    const dbStatus = checks[0].status === 'fulfilled' && checks[0].value;
    const redisStatus = checks[1].status === 'fulfilled' && checks[1].value;

    const healthy = dbStatus && redisStatus;
    const status = healthy ? 'ok' : 'degraded';

    return {
      status,
      db: dbStatus ? 'connected' : 'disconnected',
      redis: redisStatus ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async readiness() {
    const checks = await Promise.allSettled([
      this.checkDb(),
      this.checkRedis(),
    ]);

    const dbStatus = checks[0].status === 'fulfilled' && checks[0].value;
    const redisStatus = checks[1].status === 'fulfilled' && checks[1].value;

    const ready = dbStatus && redisStatus;

    return {
      status: ready ? 'ok' : 'not_ready',
      db: dbStatus ? 'connected' : 'disconnected',
      redis: redisStatus ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDb(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
