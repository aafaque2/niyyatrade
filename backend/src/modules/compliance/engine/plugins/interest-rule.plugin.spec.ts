import { InterestRulePlugin } from './interest-rule.plugin';
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

describe('InterestRulePlugin', () => {
  let plugin: InterestRulePlugin;
  let rule: RuleSpec;

  beforeEach(() => {
    plugin = new InterestRulePlugin();
    rule = {
      ruleId: 'interest_income',
      name: 'Interest Income',
      description: 'Interest income must be < 5% of total revenue',
      type: 'percentage',
      operator: 'less_than',
      threshold: 5,
    };
  });

  it('should return true for canEvaluate when type is percentage and ruleId matches', () => {
    expect(plugin.canEvaluate(rule)).toBe(true);
  });

  it('should return false for canEvaluate when ruleId does not match', () => {
    expect(plugin.canEvaluate({ ...rule, ruleId: 'other_rule' })).toBe(false);
  });

  it('should pass when interest ratio is below threshold', () => {
    const f = fundamentals({
      interestIncome: 30_000_000,
      totalRevenue: 1_000_000_000,
    });
    const result = plugin.evaluate(f, rule);
    expect(result.passed).toBe(true);
    expect(result.actualValue).toBe('3.0%');
    expect(result.dataAvailable).toBe(true);
  });

  it('should fail when interest ratio exceeds threshold', () => {
    const f = fundamentals({
      interestIncome: 100_000_000,
      totalRevenue: 1_000_000_000,
    });
    const result = plugin.evaluate(f, rule);
    expect(result.passed).toBe(false);
    expect(result.actualValue).toBe('10.0%');
    expect(result.dataAvailable).toBe(true);
  });

  it('should pass with N/A when interest data is null', () => {
    const f = fundamentals({ interestIncome: null });
    const result = plugin.evaluate(f, rule);
    expect(result.passed).toBe(true);
    expect(result.actualValue).toBe('N/A');
    expect(result.dataAvailable).toBe(false);
  });
});
