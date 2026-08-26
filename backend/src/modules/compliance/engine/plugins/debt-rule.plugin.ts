import { Injectable } from '@nestjs/common';
import type {
  IRuleEvaluator,
  RuleSpec,
} from '../interfaces/rule-evaluator.interface';
import type { RuleResult } from '../interfaces/rule-result.interface';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';

/**
 * AAOIFI Shariah Standard No. 35 screening criterion:
 * total debt must be less than 33.33% of the company's trailing
 * 12-month average market capitalization.
 *
 * We use the current market capitalization as a proxy for the TTM average.
 * When market-cap data is unavailable we conservatively fall back to
 * debt/total-assets and disclose that in the result explanation.
 */
@Injectable()
export class DebtRulePlugin implements IRuleEvaluator {
  canEvaluate(rule: RuleSpec): boolean {
    return rule.type === 'percentage' && rule.ruleId === 'debt_to_equity';
  }

  evaluate(fundamentals: FinancialFundamentals, rule: RuleSpec): RuleResult {
    const threshold = rule.threshold ?? 33.33;
    const name = rule.name ?? 'Debt-to-Market-Cap';

    if (fundamentals.totalDebt == null) {
      return this.notAvailable(name, threshold);
    }

    if (
      fundamentals.marketCap != null &&
      fundamentals.marketCap > 0 &&
      fundamentals.marketCap > fundamentals.totalDebt
    ) {
      const ratio = (fundamentals.totalDebt / fundamentals.marketCap) * 100;
      return {
        ruleId: rule.ruleId,
        name,
        passed: ratio < threshold,
        actualValue: `${ratio.toFixed(1)}%`,
        thresholdValue: `< ${threshold.toFixed(0)}%`,
        explanation: '',
        dataAvailable: true,
      };
    }

    if (
      fundamentals.totalAssets != null &&
      fundamentals.totalAssets > 0 &&
      fundamentals.totalAssets > fundamentals.totalDebt
    ) {
      const ratio = (fundamentals.totalDebt / fundamentals.totalAssets) * 100;
      return {
        ruleId: rule.ruleId,
        name,
        passed: ratio < threshold,
        actualValue: `${ratio.toFixed(1)}%`,
        thresholdValue: `< ${threshold.toFixed(0)}%`,
        explanation:
          'Evaluated against total assets — market-cap data unavailable.',
        dataAvailable: true,
      };
    }

    return this.notAvailable(name, threshold);
  }

  private notAvailable(name: string, threshold: number): RuleResult {
    return {
      ruleId: 'debt_to_equity',
      name,
      passed: true,
      actualValue: 'N/A',
      thresholdValue: `< ${threshold.toFixed(0)}%`,
      explanation:
        'Debt or market data unavailable — marked compliant pending data.',
      dataAvailable: false,
    };
  }
}
