/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
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
export class AssetSyncService {
  private readonly logger = new Logger(AssetSyncService.name);
  constructor(private readonly prisma: PrismaService) {}

  async syncFromSeed(): Promise<{ upserted: number }> {
    const seedPath = path.join(__dirname, 'data', 'asset-universe.json');
    if (!fs.existsSync(seedPath)) {
      this.logger.warn(`Seed file not found: ${seedPath}`);
      return { upserted: 0 };
    }
    const raw = fs.readFileSync(seedPath, 'utf-8');
    const assets: SeedAsset[] = JSON.parse(raw);
    let count = 0;
    for (const a of assets) {
      await this.prisma.asset.upsert({
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
      });
      count += 1;
    }
    this.logger.log(`Asset sync: upserted ${count} from seed`);
    return { upserted: count };
  }

  // Placeholder for weekly CSV ingestion (NSE EQUITY_L.csv + NASDAQ) — to be expanded to fetch remote CSVs
  async syncFromRemote(): Promise<{ upserted: number }> {
    return this.syncFromSeed();
  }
}
