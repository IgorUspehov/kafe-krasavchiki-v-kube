import type { DataArtifactsSnapshot, DataManifest, DataReport } from "@/lib/data/types";

export const DATA_ARTIFACT_BASE = "/artifacts/factory_output/data";
export const DATA_MODULE_BASE = "/artifacts/data";

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  return res.ok ? ((await res.json()) as T) : null;
}

export async function fetchDataArtifactsSnapshot(): Promise<DataArtifactsSnapshot> {
  const base = DATA_ARTIFACT_BASE;
  const [
    dataManifest,
    dataReport,
    entities,
    entityRelations,
    databaseSchema,
    apiEndpoints,
    forms,
    tables,
    dataFlow,
  ] = await Promise.all([
    fetchJson<DataManifest>(`${base}/data_manifest.json`),
    fetchJson<DataReport>(`${base}/data_report.json`),
    fetchJson<Record<string, { fields: string[] }>>(`${base}/entities.json`),
    fetchJson<{ relations: Array<Record<string, unknown>> }>(`${base}/entity_relations.json`),
    fetchJson<Record<string, unknown>>(`${base}/database_schema.json`),
    fetchJson<Record<string, unknown>>(`${base}/api_endpoints.json`),
    fetchJson<Record<string, unknown>>(`${base}/forms.json`),
    fetchJson<Record<string, unknown>>(`${base}/tables.json`),
    fetchJson<Record<string, unknown>>(`${base}/data_flow.json`),
  ]);

  if (dataManifest && dataReport) {
    return {
      dataManifest,
      dataReport,
      entities,
      entityRelations,
      databaseSchema,
      apiEndpoints,
      forms,
      tables,
      dataFlow,
    };
  }

  const mod = DATA_MODULE_BASE;
  const [m, r, e, er, ds, api, f, t, df] = await Promise.all([
    fetchJson<DataManifest>(`${mod}/data_manifest.json`),
    fetchJson<DataReport>(`${mod}/data_report.json`),
    fetchJson<Record<string, { fields: string[] }>>(`${mod}/entities.json`),
    fetchJson<{ relations: Array<Record<string, unknown>> }>(`${mod}/entity_relations.json`),
    fetchJson<Record<string, unknown>>(`${mod}/database_schema.json`),
    fetchJson<Record<string, unknown>>(`${mod}/api_endpoints.json`),
    fetchJson<Record<string, unknown>>(`${mod}/forms.json`),
    fetchJson<Record<string, unknown>>(`${mod}/tables.json`),
    fetchJson<Record<string, unknown>>(`${mod}/data_flow.json`),
  ]);

  return {
    dataManifest: m,
    dataReport: r,
    entities: e,
    entityRelations: er,
    databaseSchema: ds,
    apiEndpoints: api,
    forms: f,
    tables: t,
    dataFlow: df,
  };
}
