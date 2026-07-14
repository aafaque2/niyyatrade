import { api } from "@/lib/api";

export interface RuleSpec {
  type: string;
  operator?: string;
  name?: string;
  ruleId?: string;
  threshold?: number;
  bannedSectors?: string[];
  description: string;
}

export interface Framework {
  id: string;
  slug: string;
  name: string;
  defaultRules: { rules: Record<string, RuleSpec> };
}

export interface FrameworkPref {
  frameworkId: string;
  customThresholds: Record<string, number>;
  framework: { slug: string; name: string };
}

export async function fetchFrameworks(): Promise<Framework[]> {
  const { data } = await api.get<{ data: Framework[] }>("/compliance");
  return data.data;
}

export async function fetchFrameworkPrefs(): Promise<FrameworkPref[]> {
  const { data } = await api.get<{ data: FrameworkPref[] }>(
    "/users/me/framework-prefs",
  );
  return data.data;
}

export async function activateFramework(
  frameworkId: string,
): Promise<{ id: string; email: string; name: string | null; activeFrameworkId: string | null }> {
  const { data } = await api.put("/users/me/frameworks/active", { frameworkId });
  return data.data;
}

export async function updateFrameworkPrefs(
  frameworkId: string,
  overrides?: Record<string, number>,
): Promise<void> {
  await api.put("/users/me/framework-prefs", { frameworkId, overrides });
}

export async function updateProfile(name: string): Promise<void> {
  await api.put("/users/me/profile", { name });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.put("/users/me/password", { currentPassword, newPassword });
}

export async function resetPortfolio(): Promise<void> {
  await api.post("/portfolio/reset", { confirm: true });
}
