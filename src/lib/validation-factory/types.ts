export const RUNTIME_VALIDATION_FACTORY_VERSION = "5.0.0";

export type ValidationReportStatus = "RUNTIME_VALID" | "PENDING";

export interface ValidationManifest {
  version: string;
  project_name: string;
  checks_total: number;
  checks_passed: number;
  checks_failed: number;
  overall_score: number;
}

export interface ValidationReport {
  status: ValidationReportStatus;
  runtime_valid: boolean;
  build_valid: boolean;
  frontend_valid: boolean;
  backend_valid: boolean;
  database_valid: boolean;
  api_valid: boolean;
  overall_score: number;
}

export interface ValidationArtifactsSnapshot {
  validationManifest: ValidationManifest | null;
  validationReport: ValidationReport | null;
  runtimeScore: Record<string, unknown> | null;
  buildValidation: Record<string, unknown> | null;
  frontendValidation: Record<string, unknown> | null;
  backendValidation: Record<string, unknown> | null;
  databaseValidation: Record<string, unknown> | null;
  routeValidation: Record<string, unknown> | null;
  apiValidation: Record<string, unknown> | null;
  environmentValidation: Record<string, unknown> | null;
  healthValidation: Record<string, unknown> | null;
}
