import { Injectable } from '@nestjs/common';
import type {
  IRuleEvaluator,
  RuleSpec,
} from '../interfaces/rule-evaluator.interface';
import type { RuleResult } from '../interfaces/rule-result.interface';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';

const conventionalSectors = ['Financials', 'Conventional Financials'];

@Injectable()
export class SectorRulePlugin implements IRuleEvaluator {
  canEvaluate(rule: RuleSpec): boolean {
    return rule.type === 'sector';
  }

  evaluate(fundamentals: FinancialFundamentals, rule: RuleSpec): RuleResult {
    const banned = rule.bannedSectors ?? conventionalSectors;
    const passed = !banned.includes(fundamentals.sector);

    return {
      ruleId: rule.ruleId,
      name: rule.name ?? 'Sector Screening',
      passed,
      actualValue: fundamentals.sector,
      thresholdValue: `Not in: ${banned.join(', ')}`,
      explanation: '',
    };
  }
}
