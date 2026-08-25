export interface ProjectCard {
  project_name: string;
  project_type: string;
  repository: string;
  template: string;
  ui_library: string;
  complexity: string;
  estimated_cost: string;
  estimated_time: string;
  audit_status: string;
  presentation_ready: boolean;
}

export interface ScreenshotsManifest {
  dashboard: string;
  projects: string;
  pipeline: string;
  research: string;
  options: string;
  builds: string;
  artifacts: string;
  presentation: string;
  settings: string;
}

export type PresentationStatus = "SELF_PRESENTING_READY";
export type DemoStatus = "READY" | "FFMPEG_NOT_FOUND" | "PENDING";

export interface PresentationManifest {
  project_name: string;
  screenshots: string[];
  readme: string;
  project_card: string;
  status: PresentationStatus;
  demo_video?: string;
  demo_status?: DemoStatus;
  web_status?: "READY" | "PENDING";
  pwa_status?: "READY" | "PENDING";
  apk_status?: "READY" | "PENDING";
  web_artifact_path?: string;
  pwa_artifact_path?: string;
  apk_artifact_path?: string;
  release_ready?: boolean;
  bundle_path?: string;
  release_manifest?: string;
  release_notes?: string;
}

export interface PresentationSourceData {
  projectName: string;
  idea: string;
  factoryVersion: string;
  mvpStatus: string;
  projectType: string;
  repository: string;
  template: string;
  uiLibrary: string;
  complexity: string;
  estimatedCost: string;
  estimatedTime: string;
  auditStatus: string;
  features: string[];
  stack: string[];
}

export interface PresentationBundle {
  readme: string;
  projectCard: ProjectCard;
  presentation: PresentationManifest;
  screenshots: ScreenshotsManifest;
}

export type TranslateFn = (key: string) => string;
