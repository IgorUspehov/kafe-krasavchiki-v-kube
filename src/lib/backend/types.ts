export const BACKEND_FACTORY_VERSION = "4.6.0";

export type BackendReportStatus = "BACKEND_READY" | "PENDING";

export interface BackendManifest {
  version: string;
  project_name: string;
  stack: string;
  entities_count: number;
  models_count: number;
  routes_count: number;
  services_count: number;
  controllers_count: number;
}

export interface BackendReport {
  status: BackendReportStatus;
  backend_complete: boolean;
  models_count: number;
  routes_count: number;
  controllers_count: number;
  services_count: number;
}

export interface BackendArtifactsSnapshot {
  backendManifest: BackendManifest | null;
  backendReport: BackendReport | null;
  databaseModels: Record<string, unknown> | null;
  schemaDefinitions: Record<string, unknown> | null;
  crudEndpoints: Record<string, unknown> | null;
  serviceLayer: Record<string, unknown> | null;
  controllerLayer: Record<string, unknown> | null;
  backendRoutes: Record<string, unknown> | null;
  authStructure: Record<string, unknown> | null;
  openapiStructure: Record<string, unknown> | null;
}
