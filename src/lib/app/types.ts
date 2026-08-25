export const APP_BUILDER_VERSION = "4.2.0";

export type AppTemplateType =
  | "landing"
  | "dashboard"
  | "calculator"
  | "form"
  | "tool"
  | "mvp";

export type AppReportStatus = "APP_READY" | "PENDING";

export interface AppManifest {
  version: string;
  project_name: string;
  project_type: string;
  template_type: AppTemplateType;
  generated_files: string[];
  entrypoint: string;
}

export interface AppReport {
  generated: boolean;
  template_used: AppTemplateType;
  files_count: number;
  status: AppReportStatus;
}

export interface AppArtifactsSnapshot {
  appManifest: AppManifest | null;
  appReport: AppReport | null;
}
