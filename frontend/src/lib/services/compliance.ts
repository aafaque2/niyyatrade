import { api } from "@/lib/api";

export interface RuleResult {
  ruleId: string;
  name: string;
  passed: boolean;
  actualValue: string;
  thresholdValue: string;
  explanation: string;
}

export interface EvaluationReport {
  assetId: string;
  frameworkId: string;
  verdict: "COMPLIANT" | "NON_COMPLIANT";
  rules: RuleResult[];
}

export async function evaluateCompliance(
  ticker: string,
  frameworkId?: string,
): Promise<EvaluationReport> {
  const { data } = await api.get<{ data: EvaluationReport }>(
    "/compliance/evaluate",
    {
      params: {
        ticker,
        ...(frameworkId ? { frameworkId } : {}),
      },
    },
  );
  return data.data;
}
