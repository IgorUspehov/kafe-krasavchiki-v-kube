import type { HealthConfig, HealthFactorySnapshot, HealthReport } from "@/lib/health-factory/types";

export const HEALTH_FACTORY_BASE = "/artifacts/factory_output/runtime/health";

export async function fetchHealthFactorySnapshot(): Promise<HealthFactorySnapshot> {
  const [healthRes, reportRes] = await Promise.all([
    fetch(`${HEALTH_FACTORY_BASE}/health.json`),
    fetch(`${HEALTH_FACTORY_BASE}/health_report.json`),
  ]);

  const health = healthRes.ok ? ((await healthRes.json()) as HealthConfig) : null;
  const report = reportRes.ok ? ((await reportRes.json()) as HealthReport) : null;

  return { health, report };
}

export function isServiceHealthy(health: HealthConfig | null, key: keyof HealthConfig["health"]): boolean {
  if (!health?.health) return false;
  const value = health.health[key];
  return typeof value === "boolean" ? value : false;
}
