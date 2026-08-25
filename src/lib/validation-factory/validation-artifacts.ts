import type {
  ValidationArtifactsSnapshot,
  ValidationManifest,
  ValidationReport,
} from "@/lib/validation-factory/types";

export const VALIDATION_ARTIFACT_BASE = "/artifacts/factory_output/validation";
export const VALIDATION_MODULE_BASE = "/artifacts/validation";

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  return res.ok ? ((await res.json()) as T) : null;
}

export async function fetchValidationArtifactsSnapshot(): Promise<ValidationArtifactsSnapshot> {
  const base = VALIDATION_ARTIFACT_BASE;
  const [
    validationManifest,
    validationReport,
    runtimeScore,
    buildValidation,
    frontendValidation,
    backendValidation,
    databaseValidation,
    routeValidation,
    apiValidation,
    environmentValidation,
    healthValidation,
  ] = await Promise.all([
    fetchJson<ValidationManifest>(`${base}/validation_manifest.json`),
    fetchJson<ValidationReport>(`${base}/validation_report.json`),
    fetchJson<Record<string, unknown>>(`${base}/runtime_score.json`),
    fetchJson<Record<string, unknown>>(`${base}/build_validation.json`),
    fetchJson<Record<string, unknown>>(`${base}/frontend_validation.json`),
    fetchJson<Record<string, unknown>>(`${base}/backend_validation.json`),
    fetchJson<Record<string, unknown>>(`${base}/database_validation.json`),
    fetchJson<Record<string, unknown>>(`${base}/route_validation.json`),
    fetchJson<Record<string, unknown>>(`${base}/api_validation.json`),
    fetchJson<Record<string, unknown>>(`${base}/environment_validation.json`),
    fetchJson<Record<string, unknown>>(`${base}/health_validation.json`),
  ]);

  if (validationManifest && validationReport) {
    return {
      validationManifest,
      validationReport,
      runtimeScore,
      buildValidation,
      frontendValidation,
      backendValidation,
      databaseValidation,
      routeValidation,
      apiValidation,
      environmentValidation,
      healthValidation,
    };
  }

  const mod = VALIDATION_MODULE_BASE;
  const [m, r, rs, bv, fv, bev, dv, rv, av, ev, hv] = await Promise.all([
    fetchJson<ValidationManifest>(`${mod}/validation_manifest.json`),
    fetchJson<ValidationReport>(`${mod}/validation_report.json`),
    fetchJson<Record<string, unknown>>(`${mod}/runtime_score.json`),
    fetchJson<Record<string, unknown>>(`${mod}/build_validation.json`),
    fetchJson<Record<string, unknown>>(`${mod}/frontend_validation.json`),
    fetchJson<Record<string, unknown>>(`${mod}/backend_validation.json`),
    fetchJson<Record<string, unknown>>(`${mod}/database_validation.json`),
    fetchJson<Record<string, unknown>>(`${mod}/route_validation.json`),
    fetchJson<Record<string, unknown>>(`${mod}/api_validation.json`),
    fetchJson<Record<string, unknown>>(`${mod}/environment_validation.json`),
    fetchJson<Record<string, unknown>>(`${mod}/health_validation.json`),
  ]);

  return {
    validationManifest: m,
    validationReport: r,
    runtimeScore: rs,
    buildValidation: bv,
    frontendValidation: fv,
    backendValidation: bev,
    databaseValidation: dv,
    routeValidation: rv,
    apiValidation: av,
    environmentValidation: ev,
    healthValidation: hv,
  };
}
