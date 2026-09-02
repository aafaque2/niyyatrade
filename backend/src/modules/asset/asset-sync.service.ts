/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

interface SeedAsset {
  ticker: string;
  name: string;
  sector: string;
  industry?: string;
  exchange: string;
  currency: string;
}

@Injectable()
export class AssetSyncService implements OnModuleInit {
  private readonly logger = new Logger(AssetSyncService.name);
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.asset.count();
      if (count < 100) {
        this.logger.log(`Asset table has ${count} rows, seeding universe...`);
        const res = await this.syncFromSeed();
        this.logger.log(`Auto-seed completed: ${res.upserted}`);
      }
    } catch (e) {
      this.logger.warn(`Auto-seed check failed: ${(e as Error).message}`);
    }
  }

  private resolveSeedPath(): string | null {
    const candidates = [
      path.join(__dirname, 'data', 'asset-universe.json'),
      path.join(
        __dirname,
        '..',
        '..',
        'modules',
        'asset',
        'data',
        'asset-universe.json',
      ),
      path.join(
        process.cwd(),
        'src',
        'modules',
        'asset',
        'data',
        'asset-universe.json',
      ),
      path.join(
        process.cwd(),
        'backend',
        'src',
        'modules',
        'asset',
        'data',
        'asset-universe.json',
      ),
      path.join(
        process.cwd(),
        'dist',
        'modules',
        'asset',
        'data',
        'asset-universe.json',
      ),
    ];
    for (const p of candidates) if (fs.existsSync(p)) return p;
    return null;
  }

  async syncFromSeed(): Promise<{ upserted: number }> {
    const seedPath = this.resolveSeedPath();
    if (!seedPath) {
      this.logger.warn(`Seed file not found in candidates`);
      return { upserted: 0 };
    }
    const raw = fs.readFileSync(seedPath, 'utf-8');
    const assets: SeedAsset[] = JSON.parse(raw);
    let count = 0;
    // batch upserts 100 at a time to avoid 2595 sequential round-trips storm
    const batchSize = 100;
    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize);
      await Promise.all(
        batch.map((a) =>
          this.prisma.asset.upsert({
            where: { ticker: a.ticker },
            update: {
              name: a.name,
              sector: a.sector,
              industry: a.industry ?? null,
              exchange: a.exchange,
              currency: a.currency,
              isActive: true,
            },
            create: {
              ticker: a.ticker,
              name: a.name,
              sector: a.sector,
              industry: a.industry ?? null,
              exchange: a.exchange,
              currency: a.currency,
              isActive: true,
            },
          }),
        ),
      );
      count += batch.length;
    }
    this.logger.log(`Asset sync: upserted ${count} from seed ${seedPath}`);
    return { upserted: count };
  }

  // Placeholder for weekly CSV ingestion (NSE EQUITY_L.csv + NASDAQ) — to be expanded to fetch remote CSVs
  async syncFromRemote(): Promise<{ upserted: number }> {
    return this.syncFromSeed();
  }
}
