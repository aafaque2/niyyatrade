import { EsgSectorPlugin } from './esg-sector.plugin';
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

describe('EsgSectorPlugin', () => {
  let plugin: EsgSectorPlugin;
  let rule: RuleSpec;

  beforeEach(() => {
    plugin = new EsgSectorPlugin();
    rule = {
      ruleId: 'esg_sector',
      name: 'ESG Sector Screen',
      description: 'Exclude certain sectors per ESG criteria',
      type: 'esg_sector',
      operator: 'not_in',
      bannedSectors: ['Energy', 'Basic Materials'],
    };
  });

  it('should return true for canEvaluate when type is esg_sector', () => {
    expect(plugin.canEvaluate(rule)).toBe(true);
  });

  it('should return false for canEvaluate when type is not esg_sector', () => {
    expect(plugin.canEvaluate({ ...rule, type: 'percentage' })).toBe(false);
  });

  it('should pass a permissible sector like Technology', () => {
    const result = plugin.evaluate(
      fundamentals({ sector: 'Technology' }),
      rule,
    );
    expect(result.passed).toBe(true);
    expect(result.actualValue).toBe('Technology');
    expect(result.dataAvailable).toBe(true);
  });

  it('should fail a banned sector like Energy', () => {
    const result = plugin.evaluate(fundamentals({ sector: 'Energy' }), rule);
    expect(result.passed).toBe(false);
    expect(result.actualValue).toBe('Energy');
    expect(result.dataAvailable).toBe(true);
  });

  it('should pass with dataAvailable=false when sector is null', () => {
    const result = plugin.evaluate(fundamentals({ sector: null }), rule);
    expect(result.passed).toBe(true);
    expect(result.actualValue).toBe('N/A');
    expect(result.dataAvailable).toBe(false);
  });

  it('should fail a sector explicitly in bannedSectors array', () => {
    const customRule = { ...rule, bannedSectors: ['Financials'] };
    const result = plugin.evaluate(
      fundamentals({ sector: 'Financials' }),
      customRule,
    );
    expect(result.passed).toBe(false);
    expect(result.dataAvailable).toBe(true);
  });

  it('should pass an allowed sector not in default banned list', () => {
    const result = plugin.evaluate(
      fundamentals({ sector: 'Healthcare' }),
      rule,
    );
    expect(result.passed).toBe(true);
    expect(result.dataAvailable).toBe(true);
  });
});
