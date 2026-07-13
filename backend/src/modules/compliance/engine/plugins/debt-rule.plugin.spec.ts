import { DebtRulePlugin } from './debt-rule.plugin';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';
import type { RuleSpec } from '../interfaces/rule-evaluator.interface';

const fundamentals = (
  overrides?: Partial<FinancialFundamentals>,
): FinancialFundamentals => ({
  ticker: 'TEST',
  marketCap: 1_000_000_000_000,
  totalAssets: 500_000_000_000,
  totalDebt: 100_000_000_000,
  cashAndEquivalents: 50_000_000_000,
  interestIncome: 50_000_000,
  totalRevenue: 1_000_000_000,
  sector: 'Technology',
  industry: 'Test Industry',
  peRatio: null,
  dividendYield: null,
  volume: null,
  week52High: null,
  week52Low: null,
  ...overrides,
});

describe('DebtRulePlugin', () => {
  let plugin: DebtRulePlugin;
  let rule: RuleSpec;

  beforeEach(() => {
    plugin = new DebtRulePlugin();
    rule = {
      ruleId: 'debt_to_equity',
      name: 'Debt-to-Equity',
      description: 'Total Debt must be < 33.33% of total assets',
      type: 'percentage',
      operator: 'less_than',
      threshold: 33.33,
    };
  });

  it('should return true for canEvaluate when type is percentage and ruleId matches', () => {
    expect(plugin.canEvaluate(rule)).toBe(true);
  });

  it('should return false for canEvaluate when ruleId does not match', () => {
    expect(plugin.canEvaluate({ ...rule, ruleId: 'other_rule' })).toBe(false);
  });

  it('should pass when debt ratio is below threshold', () => {
    const f = fundamentals({
      totalDebt: 100_000_000_000,
      totalAssets: 500_000_000_000,
    });
    const result = plugin.evaluate(f, rule);
    expect(result.passed).toBe(true);
    expect(result.actualValue).toBe('20.0%');
    expect(result.thresholdValue).toBe('< 33%');
  });

  it('should fail when debt ratio exceeds threshold', () => {
    const f = fundamentals({
      totalDebt: 200_000_000_000,
      totalAssets: 500_000_000_000,
    });
    const result = plugin.evaluate(f, rule);
    expect(result.passed).toBe(false);
    expect(result.actualValue).toBe('40.0%');
  });

  it('should pass with N/A when debt data is null', () => {
    const f = fundamentals({ totalDebt: null });
    const result = plugin.evaluate(f, rule);
    expect(result.passed).toBe(true);
    expect(result.actualValue).toBe('N/A');
  });
});
