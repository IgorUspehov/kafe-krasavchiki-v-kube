import type { BusinessAdminDashboard, BusinessFactorySnapshot } from "@/lib/business-factory/types";

export const BUSINESS_FACTORY_BASE = "/artifacts/factory_output/business";

export async function fetchBusinessFactorySnapshot(): Promise<BusinessFactorySnapshot> {
  const [dashboardRes, crmRes, subscriptionRes] = await Promise.all([
    fetch(`${BUSINESS_FACTORY_BASE}/admin/admin_dashboard.json`),
    fetch(`${BUSINESS_FACTORY_BASE}/crm/crm.json`),
    fetch(`${BUSINESS_FACTORY_BASE}/subscription/subscription_state.json`),
  ]);

  const dashboard = dashboardRes.ok
    ? ((await dashboardRes.json()) as BusinessAdminDashboard)
    : null;

  const crm = crmRes.ok
    ? ((await crmRes.json()) as BusinessFactorySnapshot["crm"])
    : null;

  const subscription = subscriptionRes.ok
    ? ((await subscriptionRes.json()) as BusinessFactorySnapshot["subscription"])
    : null;

  return { dashboard, crm, subscription };
}
