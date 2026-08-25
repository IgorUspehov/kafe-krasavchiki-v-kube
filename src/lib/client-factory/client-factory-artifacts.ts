import type { ClientFactoryDashboard, ClientFactorySnapshot, ProjectTracking } from "@/lib/client-factory/types";

export const CLIENT_FACTORY_BASE = "/artifacts/factory_output/client_factory";

export async function fetchClientFactorySnapshot(): Promise<ClientFactorySnapshot> {
  const [dashboardRes, trackingRes] = await Promise.all([
    fetch(`${CLIENT_FACTORY_BASE}/dashboard/dashboard.json`),
    fetch(`${CLIENT_FACTORY_BASE}/tracking/project_tracking.json`),
  ]);

  const dashboard = dashboardRes.ok
    ? ((await dashboardRes.json()) as ClientFactoryDashboard)
    : null;

  const tracking = trackingRes.ok
    ? ((await trackingRes.json()) as ProjectTracking)
    : null;

  return { dashboard, tracking };
}
