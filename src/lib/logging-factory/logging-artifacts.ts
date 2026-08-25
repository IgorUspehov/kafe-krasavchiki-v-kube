import type { LoggingConfig, LoggingFactorySnapshot, LogsReport } from "@/lib/logging-factory/types";

export const LOGGING_FACTORY_BASE = "/artifacts/factory_output/runtime/logging";

export async function fetchLoggingFactorySnapshot(): Promise<LoggingFactorySnapshot> {
  const [loggingRes, reportRes] = await Promise.all([
    fetch(`${LOGGING_FACTORY_BASE}/logging.json`),
    fetch(`${LOGGING_FACTORY_BASE}/logs_report.json`),
  ]);

  const logging = loggingRes.ok ? ((await loggingRes.json()) as LoggingConfig) : null;
  const report = reportRes.ok ? ((await reportRes.json()) as LogsReport) : null;

  return { logging, report };
}
