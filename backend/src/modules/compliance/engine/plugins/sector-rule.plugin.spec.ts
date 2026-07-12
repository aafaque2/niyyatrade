import { SectorRulePlugin } from './sector-rule.plugin';
import type { FinancialFundamentals } from '../../../market-data/acl/market-data.schemas';
import type { RuleSpec } from '../interfaces/rule-evaluator.interface';

const fundamentals = (sector: string): FinancialFundamentals => ({
  ticker: 'TEST',
  marketCap: 1_000_000_000_000,
  totalAssets: 500_000_000_000,
  totalDebt: 100_000_000_000,
  cashAndEquivalents: 50_000_000_000,
  interestIncome: 50_000_000,
  totalRevenue: 1_000_000_000,
  sector: sector as FinancialFundamentals['sector'],
  industry: 'Test Industry',
});

describe('SectorRulePlugin', () => {
  let plugin: SectorRulePlugin;
  let rule: RuleSpec;

  beforeEach(() => {
    plugin = new SectorRulePlugin();
    rule = {
      ruleId: 'sector_screen',
      name: 'Sector Screening',
      description: 'Check sector permissibility',
      type: 'sector',
      operator: 'not_in',
      bannedSectors: [
        'Conventional Financials',
        'Alcohol',
        'Gambling',
        'Adult Entertainment',
        'Tobacco',
        'Defense',
      ],
    };
  });

  it('should return true for canEvaluate when type is sector', () => {
    expect(plugin.canEvaluate(rule)).toBe(true);
  });

  it('should return false for canEvaluate when type is not sector', () => {
    expect(plugin.canEvaluate({ ...rule, type: 'percentage' })).toBe(false);
  });

  it('should pass a permissible sector like Technology', () => {
    const result = plugin.evaluate(fundamentals('Technology'), rule);
    expect(result.passed).toBe(true);
    expect(result.actualValue).toBe('Technology');
  });

  it('should fail a banned sector like Conventional Financials', () => {
    const result = plugin.evaluate(
      fundamentals('Conventional Financials'),
      rule,
    );
    expect(result.passed).toBe(false);
    expect(result.actualValue).toBe('Conventional Financials');
  });

  it('should fail for Conventional Financials sector (banned)', () => {
    const result = plugin.evaluate(
      fundamentals('Conventional Financials'),
      rule,
    );
    expect(result.passed).toBe(false);
  });

  it('should fail for a sector explicitly in bannedSectors array', () => {
    const customRule = { ...rule, bannedSectors: ['Financials'] };
    const result = plugin.evaluate(fundamentals('Financials'), customRule);
    expect(result.passed).toBe(false);
  });

  it('should pass an allowed sector not in default banned list', () => {
    const result = plugin.evaluate(fundamentals('Healthcare'), rule);
    expect(result.passed).toBe(true);
  });
});
