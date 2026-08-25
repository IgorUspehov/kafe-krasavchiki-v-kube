import type { BackendArtifactsSnapshot, BackendManifest, BackendReport } from "@/lib/backend/types";

export const BACKEND_ARTIFACT_BASE = "/artifacts/factory_output/backend";
export const BACKEND_MODULE_BASE = "/artifacts/backend";

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  return res.ok ? ((await res.json()) as T) : null;
}

export async function fetchBackendArtifactsSnapshot(): Promise<BackendArtifactsSnapshot> {
  const base = BACKEND_ARTIFACT_BASE;
  const [
    backendManifest,
    backendReport,
    databaseModels,
    schemaDefinitions,
    crudEndpoints,
    serviceLayer,
    controllerLayer,
    backendRoutes,
    authStructure,
    openapiStructure,
  ] = await Promise.all([
    fetchJson<BackendManifest>(`${base}/backend_manifest.json`),
    fetchJson<BackendReport>(`${base}/backend_report.json`),
    fetchJson<Record<string, unknown>>(`${base}/database_models.json`),
    fetchJson<Record<string, unknown>>(`${base}/schema_definitions.json`),
    fetchJson<Record<string, unknown>>(`${base}/crud_endpoints.json`),
    fetchJson<Record<string, unknown>>(`${base}/service_layer.json`),
    fetchJson<Record<string, unknown>>(`${base}/controller_layer.json`),
    fetchJson<Record<string, unknown>>(`${base}/backend_routes.json`),
    fetchJson<Record<string, unknown>>(`${base}/auth_structure.json`),
    fetchJson<Record<string, unknown>>(`${base}/openapi_structure.json`),
  ]);

  if (backendManifest && backendReport) {
    return {
      backendManifest,
      backendReport,
      databaseModels,
      schemaDefinitions,
      crudEndpoints,
      serviceLayer,
      controllerLayer,
      backendRoutes,
      authStructure,
      openapiStructure,
    };
  }

  const mod = BACKEND_MODULE_BASE;
  const [m, r, dm, sd, ce, sl, cl, br, au, oa] = await Promise.all([
    fetchJson<BackendManifest>(`${mod}/backend_manifest.json`),
    fetchJson<BackendReport>(`${mod}/backend_report.json`),
    fetchJson<Record<string, unknown>>(`${mod}/database_models.json`),
    fetchJson<Record<string, unknown>>(`${mod}/schema_definitions.json`),
    fetchJson<Record<string, unknown>>(`${mod}/crud_endpoints.json`),
    fetchJson<Record<string, unknown>>(`${mod}/service_layer.json`),
    fetchJson<Record<string, unknown>>(`${mod}/controller_layer.json`),
    fetchJson<Record<string, unknown>>(`${mod}/backend_routes.json`),
    fetchJson<Record<string, unknown>>(`${mod}/auth_structure.json`),
    fetchJson<Record<string, unknown>>(`${mod}/openapi_structure.json`),
  ]);

  return {
    backendManifest: m,
    backendReport: r,
    databaseModels: dm,
    schemaDefinitions: sd,
    crudEndpoints: ce,
    serviceLayer: sl,
    controllerLayer: cl,
    backendRoutes: br,
    authStructure: au,
    openapiStructure: oa,
  };
}
