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

    if (fundamentals.totalDebt == null || fundamentals.totalAssets == null || fundamentals.totalAssets === 0) {
      return {
        ruleId: rule.ruleId,
        name: rule.name ?? 'Debt-to-Equity',
        passed: true,
        actualValue: 'N/A',
        thresholdValue: `< ${threshold.toFixed(0)}%`,
        explanation:
          'Debt or asset data unavailable — marked compliant pending data.',
        dataAvailable: false,
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
      dataAvailable: true,
    };
  }
}
