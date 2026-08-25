import type {
  AssemblyArtifactsSnapshot,
  AssemblyManifest,
  AssemblyReport,
} from "@/lib/assembly/types";

export const ASSEMBLY_ARTIFACT_BASE = "/artifacts/factory_output/assembly";
export const ASSEMBLY_MODULE_BASE = "/artifacts/assembly";

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  return res.ok ? ((await res.json()) as T) : null;
}

export async function fetchAssemblyArtifactsSnapshot(): Promise<AssemblyArtifactsSnapshot> {
  const base = ASSEMBLY_ARTIFACT_BASE;
  const [
    assemblyManifest,
    assemblyReport,
    routes,
    generatedPages,
    generatedComponents,
    generatedFeatures,
  ] = await Promise.all([
    fetchJson<AssemblyManifest>(`${base}/assembly_manifest.json`),
    fetchJson<AssemblyReport>(`${base}/assembly_report.json`),
    fetchJson<Record<string, unknown>>(`${base}/routes.json`),
    fetchJson<Record<string, unknown>>(`${base}/generated_pages.json`),
    fetchJson<Record<string, unknown>>(`${base}/generated_components.json`),
    fetchJson<Record<string, unknown>>(`${base}/generated_features.json`),
  ]);

  if (assemblyManifest && assemblyReport) {
    return {
      assemblyManifest,
      assemblyReport,
      routes,
      generatedPages,
      generatedComponents,
      generatedFeatures,
    };
  }

  const mod = ASSEMBLY_MODULE_BASE;
  const [m, r, rt, gp, gc, gf] = await Promise.all([
    fetchJson<AssemblyManifest>(`${mod}/assembly_manifest.json`),
    fetchJson<AssemblyReport>(`${mod}/assembly_report.json`),
    fetchJson<Record<string, unknown>>(`${mod}/routes.json`),
    fetchJson<Record<string, unknown>>(`${mod}/generated_pages.json`),
    fetchJson<Record<string, unknown>>(`${mod}/generated_components.json`),
    fetchJson<Record<string, unknown>>(`${mod}/generated_features.json`),
  ]);

  return {
    assemblyManifest: m,
    assemblyReport: r,
    routes: rt,
    generatedPages: gp,
    generatedComponents: gc,
    generatedFeatures: gf,
  };
}
