import type { RuleSpec } from './interfaces/rule-evaluator.interface';
import type { FinancialFundamentals } from '../../market-data/acl/market-data.schemas';
import type { RuleResult } from './interfaces/rule-result.interface';

function formatCents(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${value.toLocaleString()}`;
}

export function generateExplanations(
  results: RuleResult[],
  fundamentals: FinancialFundamentals,
  rules: Record<string, RuleSpec>,
): RuleResult[] {
  return results.map((result) => {
    const spec = rules[result.ruleId];
    if (!spec) return result;

    let explanation = result.explanation;

    if (result.ruleId === 'debt_to_equity' && fundamentals.totalDebt != null) {
      const debtRatio =
        (fundamentals.totalDebt / fundamentals.totalAssets) * 100;
      explanation = `Total debt of ${formatCents(fundamentals.totalDebt)} divided by total assets of ${formatCents(fundamentals.totalAssets)} equals ${debtRatio.toFixed(1)}%. ${
        result.passed
          ? `This is below the ${spec.threshold?.toFixed(0)}% threshold.`
          : `This exceeds the ${spec.threshold?.toFixed(0)}% threshold.`
      }`;
    }

    if (
      result.ruleId === 'interest_income' &&
      fundamentals.interestIncome != null
    ) {
      const interestRatio =
        (fundamentals.interestIncome / fundamentals.totalRevenue) * 100;
      explanation = `Interest income of ${formatCents(fundamentals.interestIncome)} divided by total revenue of ${formatCents(fundamentals.totalRevenue)} equals ${interestRatio.toFixed(1)}%. ${
        result.passed
          ? `This is below the ${spec.threshold?.toFixed(0)}% threshold.`
          : `This exceeds the ${spec.threshold?.toFixed(0)}% threshold.`
      }`;
    }

    if (result.ruleId === 'sector_screen') {
      explanation = `Company operates in the "${fundamentals.sector}" sector. ${
        result.passed
          ? 'This sector is permissible under the selected framework.'
          : 'This sector is not permissible under the selected framework.'
      }`;
    }

    return { ...result, explanation };
  });
}
