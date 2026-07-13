import { api } from "@/lib/api";

export interface OrderHistoryItem {
  id: string;
  ticker: string;
  side: "BUY" | "SELL";
  quantity: number;
  priceCents: number | null;
  status: string;
  executedAt: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface ComplianceHistoryItem {
  id: string;
  ticker: string;
  verdict: string;
  evaluatedAt: string;
}

export async function fetchOrderHistory(
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<OrderHistoryItem>> {
  const { data } = await api.get<{ data: PaginatedResponse<OrderHistoryItem> }>(
    "/history/orders",
    { params: { page, limit } },
  );
  return data.data;
}

export async function fetchComplianceHistory(
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<ComplianceHistoryItem>> {
  const { data } = await api.get<{ data: PaginatedResponse<ComplianceHistoryItem> }>(
    "/history/compliance",
    { params: { page, limit } },
  );
  return data.data;
}
