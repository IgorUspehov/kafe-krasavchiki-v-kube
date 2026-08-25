export const AUTH_FACTORY_BASE = "/artifacts/factory_output/runtime/auth";

export const AUTH_PATHS = {
  config: `${AUTH_FACTORY_BASE}/auth_config.json`,
  report: `${AUTH_FACTORY_BASE}/auth_report.json`,
} as const;
