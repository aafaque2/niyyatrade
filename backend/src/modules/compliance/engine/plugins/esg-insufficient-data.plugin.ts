import { Injectable } from '@nestjs/common';
import type {
  IRuleEvaluator,
  RuleSpec,
} from '../interfaces/rule-evaluator.interface';
import type { RuleResult } from '../interfaces/rule-result.interface';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';

@Injectable()
export class EsgInsufficientDataPlugin implements IRuleEvaluator {
  canEvaluate(rule: RuleSpec): boolean {
    return rule.type === 'esg_insufficient_data';
  }

  evaluate(_fundamentals: FinancialFundamentals, rule: RuleSpec): RuleResult {
    return {
      ruleId: rule.ruleId,
      name: rule.name ?? 'Pending Data',
      passed: true,
      actualValue: 'Data pending',
      thresholdValue: rule.description ?? 'Awaiting data integration',
      explanation:
        'We are working on integrating specialized ESG data sources to evaluate this criterion. Currently marked as compliant due to insufficient data.',
      dataAvailable: false,
    };
  }
}
