import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
    // Lazy-connect: Prisma connects on first query. No eager $connect() here
    // so HTTP can listen while Postgres (also sleeping on free tier) wakes.
    // Warm the pool in the background without blocking bootstrap.
    void this.$connect().catch((e: Error) =>
      this.logger.warn(`Prisma background connect failed: ${e.message}`),
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
