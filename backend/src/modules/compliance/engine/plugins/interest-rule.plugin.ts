import { Injectable } from '@nestjs/common';
import type {
  IRuleEvaluator,
  RuleSpec,
} from '../interfaces/rule-evaluator.interface';
import type { RuleResult } from '../interfaces/rule-result.interface';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';

@Injectable()
export class InterestRulePlugin implements IRuleEvaluator {
  canEvaluate(rule: RuleSpec): boolean {
    return rule.type === 'percentage' && rule.ruleId === 'interest_income';
  }

  evaluate(fundamentals: FinancialFundamentals, rule: RuleSpec): RuleResult {
    const threshold = rule.threshold ?? 5;

    if (fundamentals.interestIncome == null) {
      return {
        ruleId: rule.ruleId,
        name: rule.name ?? 'Interest Income',
        passed: true,
        actualValue: 'N/A',
        thresholdValue: `< ${threshold.toFixed(0)}% of revenue`,
        explanation:
          'No interest income data available. Defaulting to compliant.',
      };
    }

    if (fundamentals.totalRevenue === 0) {
      return {
        ruleId: rule.ruleId,
        name: rule.name ?? 'Interest Income',
        passed: true,
        actualValue: 'N/A',
        thresholdValue: `< ${threshold.toFixed(0)}% of revenue`,
        explanation:
          'Total revenue is zero. Unable to calculate ratio. Defaulting to compliant.',
      };
    }

    const ratio =
      (fundamentals.interestIncome / fundamentals.totalRevenue) * 100;
    const passed = ratio < threshold;

    return {
      ruleId: rule.ruleId,
      name: rule.name ?? 'Interest Income',
      passed,
      actualValue: `${ratio.toFixed(1)}%`,
      thresholdValue: `< ${threshold.toFixed(0)}% of revenue`,
      explanation: '',
    };
  }
}
