import { api } from "@/lib/api";
import type { SearchResult } from "./market-data";

export interface AssetSearchResponse {
  data: SearchResult[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export async function searchAssetsDB(params: {
  q?: string;
  sector?: string;
  exchange?: string;
  limit?: number;
  cursor?: string;
}): Promise<AssetSearchResponse> {
  const { data } = await api.get<AssetSearchResponse>("/assets/search", {
    params: {
      q: params.q,
      sector: params.sector !== "All Sectors" ? params.sector : undefined,
      exchange: params.exchange !== "all" ? params.exchange : undefined,
      limit: params.limit ?? 20,
      cursor: params.cursor,
    },
  });
  const payload = (data as unknown as { data: AssetSearchResponse }).data ?? (data as unknown as AssetSearchResponse);
  return {
    data: payload.data ?? [],
    nextCursor: payload.nextCursor ?? null,
    hasMore: payload.hasMore ?? false,
    total: payload.total ?? payload.data?.length ?? 0,
  };
}
