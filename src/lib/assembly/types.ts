export const ASSEMBLY_FACTORY_VERSION = "4.4.0";

export type AssemblyReportStatus = "ASSEMBLY_READY" | "PENDING";

export type MvpProjectType =
  | "landing_page"
  | "dashboard_app"
  | "calculator"
  | "crm"
  | "directory"
  | "tool"
  | "generator"
  | "telegram_service"
  | "business_application"
  | "generic_mvp";

export interface AssemblyManifest {
  version: string;
  project_name: string;
  project_type: MvpProjectType;
  target_user: string;
  generated_pages: string[];
  generated_components: string[];
  generated_routes: string[];
  generated_features: string[];
}

export interface AssemblyReport {
  status: AssemblyReportStatus;
  pages_count: number;
  components_count: number;
  features_count: number;
  assembly_complete: boolean;
}

export interface AssemblyArtifactsSnapshot {
  assemblyManifest: AssemblyManifest | null;
  assemblyReport: AssemblyReport | null;
  routes: Record<string, unknown> | null;
  generatedPages: Record<string, unknown> | null;
  generatedComponents: Record<string, unknown> | null;
  generatedFeatures: Record<string, unknown> | null;
}
