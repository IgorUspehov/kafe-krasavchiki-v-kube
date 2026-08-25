import type { BillingConfig, BillingFactorySnapshot, BillingReport } from "@/lib/billing-factory/types";

export const BILLING_FACTORY_BASE = "/artifacts/factory_output/commercial/billing";

export async function fetchBillingFactorySnapshot(): Promise<BillingFactorySnapshot> {
  const [billingRes, reportRes] = await Promise.all([
    fetch(`${BILLING_FACTORY_BASE}/billing.json`),
    fetch(`${BILLING_FACTORY_BASE}/billing_report.json`),
  ]);

  const billing = billingRes.ok ? ((await billingRes.json()) as BillingConfig) : null;
  const report = reportRes.ok ? ((await reportRes.json()) as BillingReport) : null;

  return { billing, report };
}
