export const RUNTIME_FACTORY_VERSION = "4.1.0";

export const RUNTIME_ARTIFACT_ROOT = "artifacts/runtime";

export type RuntimeReportStatus = "RUNTIME_READY" | "PENDING";

export interface RuntimeManifest {
  version: string;
  project_name: string;
  runtime_ready: boolean;
  package_path: string;
  files_generated: number;
  scripts: string[];
  core_modified: boolean;
}

export interface RuntimeReport {
  status: RuntimeReportStatus;
  package_generated: boolean;
  files_count: number;
  start_script: boolean;
  stop_script: boolean;
  status_script: boolean;
  manifest_yml: boolean;
  readme_txt: boolean;
}

export interface RuntimeArtifactsSnapshot {
  runtimeManifest: RuntimeManifest | null;
  runtimeReport: RuntimeReport | null;
}
