import { api } from "@/lib/api";

export interface FxSnapshot {
  date: string;
  base: string;
  rates: Record<string, number>;
  source: string;
  fetchedAt: string;
}

export async function fetchFxLatest(): Promise<FxSnapshot> {
  const { data } = await api.get<{ data: FxSnapshot }>("/fx/latest");
  return data.data;
}
