export const SCAFFOLD_FACTORY_VERSION = "4.3.0";

export type ScaffoldReportStatus = "SCAFFOLD_READY" | "PENDING";

export interface ScaffoldManifest {
  version: string;
  project_name: string;
  project_type: string;
  framework: string;
  ui_library: string;
  generated_files: string[];
  generated_folders: string[];
}

export interface ScaffoldReport {
  generated: boolean;
  framework: string;
  ui_system: string;
  components_count: number;
  files_count: number;
  status: ScaffoldReportStatus;
}

export interface ScaffoldArtifactsSnapshot {
  scaffoldManifest: ScaffoldManifest | null;
  scaffoldReport: ScaffoldReport | null;
}
