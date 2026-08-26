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
      name: 'Debt-to-Market-Cap',
      description:
        'Total Debt must be < 33.33% of trailing 12-month average market cap',
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

  describe('market-cap basis (AAOIFI methodology)', () => {
    it('should pass when debt/market-cap is below threshold', () => {
      const f = fundamentals({
        totalDebt: 100_000_000_000,
        marketCap: 1_000_000_000_000, // 10%
        totalAssets: 500_000_000_000,
      });
      const result = plugin.evaluate(f, rule);
      expect(result.passed).toBe(true);
      expect(result.actualValue).toBe('10.0%');
      expect(result.thresholdValue).toBe('< 33%');
      expect(result.dataAvailable).toBe(true);
      expect(result.explanation).toBe('');
    });

    it('should fail when debt/market-cap exceeds threshold', () => {
      const f = fundamentals({
        totalDebt: 400_000_000_000,
        marketCap: 1_000_000_000_000, // 40%
        totalAssets: 2_000_000_000_000, // would pass on assets — must not be used
      });
      const result = plugin.evaluate(f, rule);
      expect(result.passed).toBe(false);
      expect(result.actualValue).toBe('40.0%');
      expect(result.dataAvailable).toBe(true);
    });

    it('should return N/A when debt exceeds both market cap and total assets', () => {
      const f = fundamentals({
        totalDebt: 1_500_000_000_000,
        marketCap: 1_000_000_000_000,
        totalAssets: 500_000_000_000,
      });
      const result = plugin.evaluate(f, rule);
      // Debt larger than every available denominator means the ratio cannot
      // be meaningfully computed here — treat as missing data.
      expect(result.dataAvailable).toBe(false);
      expect(result.actualValue).toBe('N/A');
    });
  });

  describe('total-assets fallback', () => {
    it('should use total assets when market cap is unavailable', () => {
      const f = fundamentals({
        totalDebt: 100_000_000_000,
        marketCap: null,
        totalAssets: 500_000_000_000, // 20%
      });
      const result = plugin.evaluate(f, rule);
      expect(result.passed).toBe(true);
      expect(result.actualValue).toBe('20.0%');
      expect(result.explanation).toContain('total assets');
    });

    it('should fail via fallback when debt/assets exceeds threshold', () => {
      const f = fundamentals({
        totalDebt: 200_000_000_000,
        marketCap: null,
        totalAssets: 500_000_000_000, // 40%
      });
      const result = plugin.evaluate(f, rule);
      expect(result.passed).toBe(false);
      expect(result.actualValue).toBe('40.0%');
    });
  });

  describe('missing data', () => {
    it('should pass with N/A when debt data is null', () => {
      const f = fundamentals({ totalDebt: null });
      const result = plugin.evaluate(f, rule);
      expect(result.passed).toBe(true);
      expect(result.actualValue).toBe('N/A');
      expect(result.thresholdValue).toBe('< 33%');
      expect(result.dataAvailable).toBe(false);
    });

    it('should pass with N/A when both market cap and assets are null', () => {
      const f = fundamentals({ marketCap: null, totalAssets: null });
      const result = plugin.evaluate(f, rule);
      expect(result.passed).toBe(true);
      expect(result.actualValue).toBe('N/A');
      expect(result.dataAvailable).toBe(false);
    });

    it('should pass with N/A when market cap is zero', () => {
      const f = fundamentals({ marketCap: 0, totalAssets: null });
      const result = plugin.evaluate(f, rule);
      expect(result.passed).toBe(true);
      expect(result.actualValue).toBe('N/A');
      expect(result.dataAvailable).toBe(false);
    });
  });
});
