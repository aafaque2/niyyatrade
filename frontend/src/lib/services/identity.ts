import { api } from "@/lib/api";

export async function updateFrameworkPrefs(
  frameworkId: string,
  overrides?: Record<string, number>,
): Promise<void> {
  await api.put("/users/me/framework-prefs", { frameworkId, overrides });
}
