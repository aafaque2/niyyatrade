import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import Redis from 'ioredis';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import type {
  IRuleEvaluator,
  RuleSpec,
} from './engine/interfaces/rule-evaluator.interface';
import type { RuleResult } from './engine/interfaces/rule-result.interface';
import type {
  EvaluationReport,
  Verdict,
  DataCoverage,
} from './engine/interfaces/evaluation-report.interface';
import { generateExplanations } from './engine/template-engine';

const CACHE_TTL_EVALUATION = 86400;

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketDataService: MarketDataService,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    @Inject('COMPLIANCE_RULE_PLUGINS')
    private readonly plugins: IRuleEvaluator[],
  ) {}

  private async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? (JSON.parse(cached) as T) : null;
    } catch (err) {
      this.logger.warn(
        `Redis get failed for key ${key}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private async cacheSet(
    key: string,
    ttl: number,
    data: unknown,
  ): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (err) {
      this.logger.warn(
        `Redis set failed for key ${key}: ${(err as Error).message}`,
      );
    }
  }

  async invalidateUserCache(
    userId: string,
    frameworkId: string,
  ): Promise<void> {
    try {
      // SCAN (not KEYS) — KEYS blocks the Redis event loop on large keyspaces.
      const pattern = `compliance:eval:*:${frameworkId}:${userId}`;
      const found: string[] = [];
      let cursor = '0';
      do {
        const [next, batch] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = next;
        found.push(...batch);
        // Cap a single invalidation pass to avoid runaway deletes
        if (found.length >= 5000) break;
      } while (cursor !== '0');
      if (found.length > 0) {
        // DEL in chunks to stay under arg limits
        for (let i = 0; i < found.length; i += 500) {
          await this.redis.del(...found.slice(i, i + 500));
        }
        this.logger.log(
          `Invalidated ${found.length} compliance cache entries for user=${userId} framework=${frameworkId}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate compliance cache: ${(err as Error).message}`,
      );
    }
  }

  async evaluate(
    ticker: string,
    frameworkId?: string,
    userId?: string,
  ): Promise<EvaluationReport> {
    const [fundamentals, framework] = await Promise.all([
      this.marketDataService.getFundamentals(ticker),
      this.resolveFramework(frameworkId),
    ]);

    const cacheKey = `compliance:eval:${ticker.toUpperCase()}:${framework.id}:${userId ?? 'anon'}`;

    const cached = await this.cacheGet<EvaluationReport>(cacheKey);
    if (cached) return cached;

    const rulesSpecs = framework.defaultRules as {
      rules: Record<string, RuleSpec>;
    };
    const ruleEntries = Object.entries(rulesSpecs.rules);

    let overrides: Record<string, number> | null = null;
    let excludedTickers: string[] | null = null;
    if (userId) {
      const userOverride = await this.prisma.frameworkOverride.findUnique({
        where: { userId_frameworkId: { userId, frameworkId: framework.id } },
      });
      if (userOverride) {
        const raw = userOverride.customThresholds as Record<string, unknown>;
        const excluded = raw['__excludedTickers'];
        if (Array.isArray(excluded)) {
          excludedTickers = excluded.map((t) => String(t).toUpperCase());
        }
        const { __excludedTickers: _ignored, ...rest } = raw;
        void _ignored;
        overrides = rest as Record<string, number>;
      }
    }

    const ruleResults: RuleResult[] = [];
    for (const [ruleId, spec] of ruleEntries) {
      let mergedSpec =
        overrides && overrides[ruleId] != null
          ? { ...spec, threshold: overrides[ruleId], ruleId }
          : { ...spec, ruleId };

      if (
        excludedTickers &&
        spec.type === 'ticker_list' &&
        spec.bannedTickers
      ) {
        mergedSpec = {
          ...mergedSpec,
          bannedTickers: spec.bannedTickers.filter(
            (t) => !excludedTickers.includes(t.toUpperCase()),
          ),
        };
      }

      const plugin = this.plugins.find((p) => p.canEvaluate(mergedSpec));
      if (!plugin) {
        this.logger.warn(`No plugin found for rule: ${ruleId}`);
        continue;
      }

      const result = plugin.evaluate(fundamentals, mergedSpec);
      ruleResults.push(result);
    }

    const enrichedResults = generateExplanations(
      ruleResults,
      fundamentals,
      rulesSpecs.rules,
    );

    const verdict: Verdict = enrichedResults.every((r) => r.passed)
      ? 'COMPLIANT'
      : 'NON_COMPLIANT';

    const totalRules = enrichedResults.length;
    const withData = enrichedResults.filter((r) => r.dataAvailable).length;
    const dataCoverage: DataCoverage = {
      total: totalRules,
      withData,
      withoutData: totalRules - withData,
      percentage:
        totalRules > 0 ? Math.round((withData / totalRules) * 100) : 0,
    };

    const report: EvaluationReport = {
      assetId: ticker.toUpperCase(),
      frameworkId: framework.id,
      verdict,
      rules: enrichedResults,
      dataCoverage,
    };

    await this.cacheSet(cacheKey, CACHE_TTL_EVALUATION, report);

    if (userId) {
      try {
        await this.prisma.asset.upsert({
          where: { ticker: ticker.toUpperCase() },
          create: {
            ticker: ticker.toUpperCase(),
            name: ticker.toUpperCase(),
            sector: fundamentals.sector ?? 'Other',
            industry: fundamentals.industry,
          },
          update: {},
        });
        await this.prisma.complianceAudit.create({
          data: {
            userId,
            assetTicker: ticker.toUpperCase(),
            frameworkId: framework.id,
            verdict: report.verdict,
            rules: JSON.parse(
              JSON.stringify(report.rules),
            ) as Prisma.InputJsonValue,
          },
        });
      } catch (err) {
        this.logger.warn(
          `Failed to save compliance audit: ${(err as Error).message}`,
        );
      }
    }

    return report;
  }

  async listFrameworks() {
    return this.prisma.framework.findMany({
      select: { id: true, slug: true, name: true, defaultRules: true },
    });
  }

  private async resolveFramework(frameworkId?: string) {
    if (frameworkId) {
      let framework: {
        id: string;
        slug: string;
        name: string;
        defaultRules: unknown;
      } | null = null;
      try {
        framework = await this.prisma.framework.findUnique({
          where: { id: frameworkId },
        });
      } catch {
        // not a valid UUID, try slug
      }
      if (!framework) {
        framework = await this.prisma.framework.findFirst({
          where: { slug: frameworkId },
        });
      }
      if (!framework) {
        throw new NotFoundException(`Framework ${frameworkId} not found`);
      }
      return framework;
    }

    const framework = await this.prisma.framework.findFirst({
      where: { slug: 'esg' },
    });
    if (!framework) {
      throw new NotFoundException('No default framework found');
    }
    return framework;
  }
}
