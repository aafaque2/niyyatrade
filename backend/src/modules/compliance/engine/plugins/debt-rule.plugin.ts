import { Injectable } from '@nestjs/common';
import type {
  IRuleEvaluator,
  RuleSpec,
} from '../interfaces/rule-evaluator.interface';
import type { RuleResult } from '../interfaces/rule-result.interface';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';

@Injectable()
export class DebtRulePlugin implements IRuleEvaluator {
  canEvaluate(rule: RuleSpec): boolean {
    return rule.type === 'percentage' && rule.ruleId === 'debt_to_equity';
  }

  evaluate(fundamentals: FinancialFundamentals, rule: RuleSpec): RuleResult {
    const threshold = rule.threshold ?? 33.33;

    if (fundamentals.totalDebt == null || fundamentals.totalAssets == null) {
      return {
        ruleId: rule.ruleId,
        name: rule.name ?? 'Debt-to-Equity',
        passed: false,
        actualValue: 'N/A',
        thresholdValue: `< ${threshold.toFixed(0)}%`,
        explanation:
          'Insufficient debt data available — cannot verify compliance.',
      };
    }

    if (fundamentals.totalAssets === 0) {
      return {
        ruleId: rule.ruleId,
        name: rule.name ?? 'Debt-to-Equity',
        passed: false,
        actualValue: 'N/A',
        thresholdValue: `< ${threshold.toFixed(0)}%`,
        explanation:
          'Total assets is zero — unable to calculate debt-to-equity ratio.',
      };
    }

    const ratio = (fundamentals.totalDebt / fundamentals.totalAssets) * 100;
    const passed = ratio < threshold;

    return {
      ruleId: rule.ruleId,
      name: rule.name ?? 'Debt-to-Equity',
      passed,
      actualValue: `${ratio.toFixed(1)}%`,
      thresholdValue: `< ${threshold.toFixed(0)}%`,
      explanation: '',
    };
  }
}
