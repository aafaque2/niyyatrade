import { Injectable } from '@nestjs/common';
import type {
  IRuleEvaluator,
  RuleSpec,
} from '../interfaces/rule-evaluator.interface';
import type { RuleResult } from '../interfaces/rule-result.interface';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';

@Injectable()
export class EsgSectorPlugin implements IRuleEvaluator {
  canEvaluate(rule: RuleSpec): boolean {
    return rule.type === 'esg_sector';
  }

  evaluate(fundamentals: FinancialFundamentals, rule: RuleSpec): RuleResult {
    const banned = rule.bannedSectors ?? [];

    if (fundamentals.sector == null) {
      return {
        ruleId: rule.ruleId,
        name: rule.name ?? 'ESG Sector Screen',
        passed: true,
        actualValue: 'N/A',
        thresholdValue: `Excluded sectors: ${banned.join(', ')}`,
        explanation: 'No sector data available. Defaulting to compliant.',
      };
    }

    const passed = !banned.includes(fundamentals.sector);

    return {
      ruleId: rule.ruleId,
      name: rule.name ?? 'ESG Sector Screen',
      passed,
      actualValue: fundamentals.sector,
      thresholdValue: `Excluded sectors: ${banned.join(', ')}`,
      explanation: '',
    };
  }
}
