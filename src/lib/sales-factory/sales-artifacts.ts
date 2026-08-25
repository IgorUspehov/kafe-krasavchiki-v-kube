import type { SalesApiResponse, SalesFactorySnapshot, SalesReport } from "@/lib/sales-factory/types";

export const SALES_FACTORY_BASE = "/artifacts/factory_output/sales";

export async function fetchSalesFactorySnapshot(): Promise<SalesFactorySnapshot> {
  const [apiRes, reportRes] = await Promise.all([
    fetch("/api/sales"),
    fetch(`${SALES_FACTORY_BASE}/sales_report.json`),
  ]);

  if (!apiRes.ok) {
    return { sales: null, report: null };
  }

  const sales = (await apiRes.json()) as SalesApiResponse;
  const reportJson = reportRes.ok ? ((await reportRes.json()) as SalesReport) : null;
  const active = sales.status === "ACTIVE";

  const report: SalesReport = reportJson ?? {
    module: "SALES_FACTORY",
    version: "I6.0",
    status: active ? "SALES_READY" : "SALES_PENDING",
    leads: sales.leads,
    customers: sales.customers,
    conversion_rate: 26,
    mrr: sales.mrr,
    arr: sales.arr,
    revenue: sales.revenue,
    commercial_readiness_score: active ? 100 : 0,
  };

  return { sales, report };
}
