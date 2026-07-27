import { api } from "@/lib/api";

export interface Position {
  ticker: string;
  quantity: number;
  avgPriceCents: number;
  currentPriceCents: number;
  returnCents: number;
  returnPercent: number;
  changePercent?: number;
  complianceVerdict?: string;
  currency?: string;
}

export interface RecentOrder {
  id: string;
  ticker: string;
  side: "BUY" | "SELL";
  quantity: number;
  priceCents: number;
  status: string;
  createdAt: string;
}

export interface Portfolio {
  id: string;
  buyingPowerCents: number;
  totalValueCents: number;
  overallComplianceScore: number;
  dailyChangePercent?: number;
  positions: Position[];
  recentOrders: RecentOrder[];
}

export interface OrderResult {
  orderId: string;
  status: string;
  executedPriceCents: number;
}

export interface CreateOrderPayload {
  assetTicker: string;
  side: "BUY" | "SELL";
  quantity: number;
}

export async function fetchPortfolio(
  includeCompliance?: boolean,
): Promise<Portfolio> {
  const { data } = await api.get<{ data: Portfolio }>("/portfolio", {
    params: includeCompliance ? { includeCompliance: "true" } : {},
  });
  return data.data;
}

export async function placeOrder(
  payload: CreateOrderPayload,
): Promise<OrderResult> {
  const { data } = await api.post<{ data: OrderResult }>(
    "/portfolio/orders",
    payload,
  );
  return data.data;
}
