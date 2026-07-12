export interface RuleResult {
  ruleId: string;
  name: string;
  passed: boolean;
  actualValue: string;
  thresholdValue: string;
  explanation: string;
}
