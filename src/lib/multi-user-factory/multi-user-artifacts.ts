import type {
  MultiUserFactorySnapshot,
  MultiUserReport,
  TenantsConfig,
  UsersRuntime,
} from "@/lib/multi-user-factory/types";

export const MULTI_USER_FACTORY_BASE = "/artifacts/factory_output/runtime/multi_user";

export async function fetchMultiUserFactorySnapshot(): Promise<MultiUserFactorySnapshot> {
  const [usersRes, tenantsRes, reportRes] = await Promise.all([
    fetch(`${MULTI_USER_FACTORY_BASE}/users_runtime.json`),
    fetch(`${MULTI_USER_FACTORY_BASE}/tenants.json`),
    fetch(`${MULTI_USER_FACTORY_BASE}/multi_user_report.json`),
  ]);

  const usersRuntime = usersRes.ok ? ((await usersRes.json()) as UsersRuntime) : null;
  const tenants = tenantsRes.ok ? ((await tenantsRes.json()) as TenantsConfig) : null;
  const report = reportRes.ok ? ((await reportRes.json()) as MultiUserReport) : null;

  return { usersRuntime, tenants, report };
}
