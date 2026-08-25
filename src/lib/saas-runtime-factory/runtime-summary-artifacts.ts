import type { RuntimeSummary, SaasRuntimeFactorySnapshot } from "@/lib/saas-runtime-factory/types";

export const SAAS_RUNTIME_FACTORY_BASE = "/artifacts/factory_output/runtime";

export async function fetchSaasRuntimeFactorySnapshot(): Promise<SaasRuntimeFactorySnapshot> {
  const res = await fetch(`${SAAS_RUNTIME_FACTORY_BASE}/runtime_summary.json`);
  const summary = res.ok ? ((await res.json()) as RuntimeSummary) : null;
  return { summary };
}
