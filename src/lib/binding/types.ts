export const FRONTEND_BINDING_FACTORY_VERSION = "4.7.0";

export type BindingReportStatus = "BINDING_READY" | "PENDING";

export interface BindingManifest {
  version: string;
  project_name: string;
  stack: string;
  services_count: number;
  hooks_count: number;
  forms_count: number;
  tables_count: number;
  bindings_count: number;
}

export interface BindingReport {
  status: BindingReportStatus;
  frontend_bound: boolean;
  services_count: number;
  hooks_count: number;
  forms_count: number;
  tables_count: number;
  binding_complete: boolean;
}

export interface BindingArtifactsSnapshot {
  bindingManifest: BindingManifest | null;
  bindingReport: BindingReport | null;
  frontendRoutes: Record<string, unknown> | null;
  entityBinding: Record<string, unknown> | null;
  apiBinding: Record<string, unknown> | null;
  routeBinding: Record<string, unknown> | null;
  formBinding: Record<string, unknown> | null;
  tableBinding: Record<string, unknown> | null;
  dashboardBinding: Record<string, unknown> | null;
  errorHandling: Record<string, unknown> | null;
  services: Record<string, unknown> | null;
  hooks: Record<string, unknown> | null;
  formComponents: Record<string, unknown> | null;
  tableComponents: Record<string, unknown> | null;
}
