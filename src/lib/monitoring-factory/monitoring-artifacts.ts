import type {
  MonitoringConfig,
  MonitoringFactorySnapshot,
  MonitoringReport,
} from "@/lib/monitoring-factory/types";

export const MONITORING_FACTORY_BASE = "/artifacts/factory_output/runtime/monitoring";

export async function fetchMonitoringFactorySnapshot(): Promise<MonitoringFactorySnapshot> {
  const [monitoringRes, reportRes] = await Promise.all([
    fetch(`${MONITORING_FACTORY_BASE}/monitoring.json`),
    fetch(`${MONITORING_FACTORY_BASE}/monitoring_report.json`),
  ]);

  const monitoring = monitoringRes.ok ? ((await monitoringRes.json()) as MonitoringConfig) : null;
  const report = reportRes.ok ? ((await reportRes.json()) as MonitoringReport) : null;

  return { monitoring, report };
}
