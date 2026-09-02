import { api } from "@/lib/api";
import type { SearchResult } from "./market-data";

export interface AssetSearchResponse {
  data: SearchResult[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function searchAssetsDB(params: {
  q?: string;
  sector?: string;
  exchange?: string;
  limit?: number;
  cursor?: string;
}): Promise<SearchResult[]> {
  const { data } = await api.get<AssetSearchResponse>("/assets/search", {
    params: {
      q: params.q,
      sector: params.sector !== "All Sectors" ? params.sector : undefined,
      exchange: params.exchange !== "all" ? params.exchange : undefined,
      limit: params.limit ?? 20,
      cursor: params.cursor,
    },
  });
  // API wraps in { data: { data, nextCursor } } via ResponseEnvelopeInterceptor — unwrap once
  const payload = (data as unknown as { data: AssetSearchResponse }).data ?? (data as unknown as AssetSearchResponse);
  return payload.data ?? [];
}
