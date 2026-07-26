import { EsgInsufficientDataPlugin } from './esg-insufficient-data.plugin';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';
import type { RuleSpec } from '../interfaces/rule-evaluator.interface';

const fundamentals = (): FinancialFundamentals => ({
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
});

describe('EsgInsufficientDataPlugin', () => {
  let plugin: EsgInsufficientDataPlugin;
  let rule: RuleSpec;

  beforeEach(() => {
    plugin = new EsgInsufficientDataPlugin();
    rule = {
      ruleId: 'esg_pending',
      name: 'Pending Data',
      description: 'Awaiting ESG data integration',
      type: 'esg_insufficient_data',
      operator: 'always_pass',
    };
  });

  it('should return true for canEvaluate when type is esg_insufficient_data', () => {
    expect(plugin.canEvaluate(rule)).toBe(true);
  });

  it('should return false for canEvaluate when type is not esg_insufficient_data', () => {
    expect(plugin.canEvaluate({ ...rule, type: 'percentage' })).toBe(false);
  });

  it('should always pass regardless of fundamentals', () => {
    const result = plugin.evaluate(fundamentals(), rule);
    expect(result.passed).toBe(true);
    expect(result.dataAvailable).toBe(false);
    expect(result.actualValue).toBe('Data pending');
  });

  it('should include explanation about insufficient data', () => {
    const result = plugin.evaluate(fundamentals(), rule);
    expect(result.explanation).toContain('insufficient data');
  });
});
