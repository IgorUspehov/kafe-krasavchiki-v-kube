import type { MetricsConfig, MetricsFactorySnapshot, MetricsReport } from "@/lib/metrics-factory/types";

export const METRICS_FACTORY_BASE = "/artifacts/factory_output/runtime/metrics";

export async function fetchMetricsFactorySnapshot(): Promise<MetricsFactorySnapshot> {
  const [metricsRes, reportRes] = await Promise.all([
    fetch(`${METRICS_FACTORY_BASE}/metrics.json`),
    fetch(`${METRICS_FACTORY_BASE}/metrics_report.json`),
  ]);

  const metrics = metricsRes.ok ? ((await metricsRes.json()) as MetricsConfig) : null;
  const report = reportRes.ok ? ((await reportRes.json()) as MetricsReport) : null;

  return { metrics, report };
}

function getMetricValue(
  metrics: MetricsConfig | null,
  name: string
): number {
  return metrics?.tracked_metrics?.find((m) => m.metric === name)?.value ?? 0;
}

export function getTotalRequests(metrics: MetricsConfig | null): number {
  return getMetricValue(metrics, "total_requests");
}

export function getTotalUsers(metrics: MetricsConfig | null): number {
  return getMetricValue(metrics, "total_users");
}

export function getTotalProjects(metrics: MetricsConfig | null): number {
  return getMetricValue(metrics, "total_projects");
}

export function getGeneratedArtifacts(metrics: MetricsConfig | null): number {
  return getMetricValue(metrics, "generated_artifacts");
}
