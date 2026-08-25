import type { BindingArtifactsSnapshot, BindingManifest, BindingReport } from "@/lib/binding/types";

export const BINDING_ARTIFACT_BASE = "/artifacts/factory_output/binding";
export const BINDING_MODULE_BASE = "/artifacts/binding";

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  return res.ok ? ((await res.json()) as T) : null;
}

export async function fetchBindingArtifactsSnapshot(): Promise<BindingArtifactsSnapshot> {
  const base = BINDING_ARTIFACT_BASE;
  const [
    bindingManifest,
    bindingReport,
    frontendRoutes,
    entityBinding,
    apiBinding,
    routeBinding,
    formBinding,
    tableBinding,
    dashboardBinding,
    errorHandling,
    services,
    hooks,
    formComponents,
    tableComponents,
  ] = await Promise.all([
    fetchJson<BindingManifest>(`${base}/binding_manifest.json`),
    fetchJson<BindingReport>(`${base}/binding_report.json`),
    fetchJson<Record<string, unknown>>(`${base}/frontend_routes.json`),
    fetchJson<Record<string, unknown>>(`${base}/entity_binding.json`),
    fetchJson<Record<string, unknown>>(`${base}/api_binding.json`),
    fetchJson<Record<string, unknown>>(`${base}/route_binding.json`),
    fetchJson<Record<string, unknown>>(`${base}/form_binding.json`),
    fetchJson<Record<string, unknown>>(`${base}/table_binding.json`),
    fetchJson<Record<string, unknown>>(`${base}/dashboard_binding.json`),
    fetchJson<Record<string, unknown>>(`${base}/error_handling.json`),
    fetchJson<Record<string, unknown>>(`${base}/services.json`),
    fetchJson<Record<string, unknown>>(`${base}/hooks.json`),
    fetchJson<Record<string, unknown>>(`${base}/form_components.json`),
    fetchJson<Record<string, unknown>>(`${base}/table_components.json`),
  ]);

  if (bindingManifest && bindingReport) {
    return {
      bindingManifest,
      bindingReport,
      frontendRoutes,
      entityBinding,
      apiBinding,
      routeBinding,
      formBinding,
      tableBinding,
      dashboardBinding,
      errorHandling,
      services,
      hooks,
      formComponents,
      tableComponents,
    };
  }

  const mod = BINDING_MODULE_BASE;
  const [m, r, fr, eb, ab, rb, fb, tb, db, eh, sv, hk, fc, tc] = await Promise.all([
    fetchJson<BindingManifest>(`${mod}/binding_manifest.json`),
    fetchJson<BindingReport>(`${mod}/binding_report.json`),
    fetchJson<Record<string, unknown>>(`${mod}/frontend_routes.json`),
    fetchJson<Record<string, unknown>>(`${mod}/entity_binding.json`),
    fetchJson<Record<string, unknown>>(`${mod}/api_binding.json`),
    fetchJson<Record<string, unknown>>(`${mod}/route_binding.json`),
    fetchJson<Record<string, unknown>>(`${mod}/form_binding.json`),
    fetchJson<Record<string, unknown>>(`${mod}/table_binding.json`),
    fetchJson<Record<string, unknown>>(`${mod}/dashboard_binding.json`),
    fetchJson<Record<string, unknown>>(`${mod}/error_handling.json`),
    fetchJson<Record<string, unknown>>(`${mod}/services.json`),
    fetchJson<Record<string, unknown>>(`${mod}/hooks.json`),
    fetchJson<Record<string, unknown>>(`${mod}/form_components.json`),
    fetchJson<Record<string, unknown>>(`${mod}/table_components.json`),
  ]);

  return {
    bindingManifest: m,
    bindingReport: r,
    frontendRoutes: fr,
    entityBinding: eb,
    apiBinding: ab,
    routeBinding: rb,
    formBinding: fb,
    tableBinding: tb,
    dashboardBinding: db,
    errorHandling: eh,
    services: sv,
    hooks: hk,
    formComponents: fc,
    tableComponents: tc,
  };
}
