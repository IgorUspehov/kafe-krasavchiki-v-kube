import { AUTH_FACTORY_BASE } from "@/lib/auth-factory/paths";
import type { AuthConfig, AuthFactorySnapshot, AuthReport } from "@/lib/auth-factory/types";

export async function fetchAuthFactorySnapshot(): Promise<AuthFactorySnapshot> {
  const [configRes, reportRes] = await Promise.all([
    fetch(`${AUTH_FACTORY_BASE}/auth_config.json`),
    fetch(`${AUTH_FACTORY_BASE}/auth_report.json`),
  ]);

  const config = configRes.ok ? ((await configRes.json()) as AuthConfig) : null;
  const report = reportRes.ok ? ((await reportRes.json()) as AuthReport) : null;

  return { config, report };
}
