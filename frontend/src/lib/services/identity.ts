import { api } from "@/lib/api";

export interface RuleSpec {
  type: string;
  operator?: string;
  name?: string;
  ruleId?: string;
  threshold?: number;
  bannedSectors?: string[];
  bannedTickers?: string[];
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
): Promise<{ id: string; email: string; name: string | null; activeFrameworkId: string | null; currency: string }> {
  const { data } = await api.put("/users/me/frameworks/active", { frameworkId });
  return data.data;
}

export async function deactivateFramework(): Promise<{ id: string; email: string; name: string | null; activeFrameworkId: string | null; currency: string }> {
  const { data } = await api.delete("/users/me/frameworks/active");
  return data.data;
}

export async function updateFrameworkPrefs(
  frameworkId: string,
  overrides?: Record<string, unknown>,
): Promise<void> {
  await api.put("/users/me/framework-prefs", { frameworkId, overrides });
}

export async function updateProfile(name: string, currency?: string): Promise<{ id: string; email: string; name: string | null; activeFrameworkId: string | null; currency: string }> {
  const { data } = await api.put("/users/me/profile", { name, ...(currency !== undefined ? { currency } : {}) });
  return data.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string; token: string }> {
  const { data } = await api.put<{ message: string; token: string }>(
    "/users/me/password",
    { currentPassword, newPassword },
  );
  return data;
}

export async function resetPortfolio(): Promise<void> {
  await api.post("/portfolio/reset", { confirm: true });
}
