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

    if (
      result.ruleId === 'debt_to_equity' &&
      fundamentals.totalDebt != null &&
      fundamentals.totalAssets != null
    ) {
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
      fundamentals.interestIncome != null &&
      fundamentals.totalRevenue != null
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
      explanation = `Company operates in the "${fundamentals.sector ?? 'N/A'}" sector. ${
        result.passed
          ? 'This sector is permissible under the selected framework.'
          : 'This sector is not permissible under the selected framework.'
      }`;
    }

    if (result.ruleId === 'esg_carbon') {
      const highCarbon = ['Energy', 'Utilities', 'Basic Materials'];
      const sectorStr = fundamentals.sector ?? 'N/A';
      if (fundamentals.sector == null) {
        explanation =
          'Sector data unavailable — cannot assess carbon exposure. Marked compliant pending data.';
      } else {
        const isHighCarbon = highCarbon.includes(sectorStr);
        explanation = `The company operates in the "${sectorStr}" sector. ${
          isHighCarbon
            ? `This sector is considered high-carbon (${sectorStr}). The ESG framework excludes companies with significant carbon exposure.`
            : `This sector (${sectorStr}) is not classified as high-carbon. The company passes the carbon emissions screen.`
        }`;
      }
    }

    if (result.ruleId === 'esg_weapons') {
      explanation = `Company operates in the "${fundamentals.sector ?? 'N/A'}" sector. ${
        result.passed
          ? 'This sector does not indicate direct involvement in weapons or defense manufacturing.'
          : 'The Industrials sector may include companies involved in weapons or defense contracting. This screen flags such exposure.'
      }`;
    }

    if (result.ruleId === 'esg_tobacco_alcohol') {
      explanation = `Company operates in the "${fundamentals.sector ?? 'N/A'}" sector. ${
        result.passed
          ? 'This sector does not indicate involvement in tobacco or alcohol production.'
          : 'The Consumer Defensive sector may include companies involved in tobacco or alcohol production. This screen flags such exposure.'
      }`;
    }

    if (result.ruleId === 'bds_companies') {
      explanation = result.passed
        ? `This company (${fundamentals.ticker ?? 'N/A'}) is not on the BDS divestment shortlist.`
        : `This company (${fundamentals.ticker ?? 'N/A'}) is on the BDS divestment shortlist — identified by the BDS movement as complicit in the Israeli occupation, apartheid, or settlements. Consider divesting per the BDS movement's call.`;
    }

    return { ...result, explanation };
  });
}
