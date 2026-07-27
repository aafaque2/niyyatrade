import { Injectable } from '@nestjs/common';
import type {
  IRuleEvaluator,
  RuleSpec,
} from '../interfaces/rule-evaluator.interface';
import type { RuleResult } from '../interfaces/rule-result.interface';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';

@Injectable()
export class TickerListRulePlugin implements IRuleEvaluator {
  canEvaluate(rule: RuleSpec): boolean {
    return rule.type === 'ticker_list';
  }

  evaluate(fundamentals: FinancialFundamentals, rule: RuleSpec): RuleResult {
    const banned = (rule.bannedTickers ?? []).map((t) => t.toUpperCase());
    const ticker = fundamentals.ticker?.toUpperCase();

    if (!ticker) {
      return {
        ruleId: rule.ruleId,
        name: rule.name ?? 'Ticker List Screening',
        passed: true,
        actualValue: 'N/A',
        thresholdValue: `Not in: ${banned.length} flagged companies`,
        explanation: 'Ticker data unavailable — marked compliant pending data.',
        dataAvailable: false,
      };
    }

    const passed = !banned.includes(ticker);

    return {
      ruleId: rule.ruleId,
      name: rule.name ?? 'Ticker List Screening',
      passed,
      actualValue: ticker,
      thresholdValue: `Not in: ${banned.length} flagged companies`,
      explanation: '',
      dataAvailable: true,
    };
  }
}
