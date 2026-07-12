import type { RuleResult } from './rule-result.interface';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';

export interface RuleSpec {
  ruleId: string;
  name: string;
  description: string;
  type: string;
  operator: string;
  threshold?: number;
  bannedSectors?: string[];
}

export interface IRuleEvaluator {
  canEvaluate(rule: RuleSpec): boolean;
  evaluate(fundamentals: FinancialFundamentals, rule: RuleSpec): RuleResult;
}
