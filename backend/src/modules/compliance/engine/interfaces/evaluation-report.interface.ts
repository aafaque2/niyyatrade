import type { RuleResult } from './rule-result.interface';

export type Verdict = 'COMPLIANT' | 'NON_COMPLIANT';

export interface DataCoverage {
  total: number;
  withData: number;
  withoutData: number;
  percentage: number;
}

export interface EvaluationReport {
  assetId: string;
  frameworkId: string;
  verdict: Verdict;
  rules: RuleResult[];
  dataCoverage: DataCoverage;
}
