export const GITHUB_FACTORY_VERSION = "3.6.0";

export const GITHUB_ARTIFACT_ROOT = "artifacts/github";

export type GithubPublishStatus = "READY_TO_PUBLISH" | "PENDING";

export interface GithubTopics {
  topics: string[];
}

export interface GithubReleaseTag {
  version: string;
  tag: string;
  status: "READY" | "PENDING";
}

export interface GithubRepositoryManifest {
  repository_name: string;
  version: string;
  build_status: string;
  demo_video: boolean;
  screenshots_count: number;
  pwa_ready: boolean;
  apk_ready: boolean;
  release_ready: boolean;
}

export interface GithubPublishReport {
  status: GithubPublishStatus;
  github_ready: boolean;
  release_ready: boolean;
  readme_ready: boolean;
}

export interface GithubSourceContext {
  projectName: string;
  idea: string;
  version: string;
  demoVideo: boolean;
  screenshotsCount: number;
  pwaReady: boolean;
  apkReady: boolean;
  releaseReady: boolean;
  buildStatus: string;
}

export interface GithubPackageBundle {
  readmeReady: string;
  license: string;
  gitignore: string;
  repoDescription: string;
  topics: GithubTopics;
  releaseTag: GithubReleaseTag;
  releaseBody: string;
  repositoryManifest: GithubRepositoryManifest;
  publishReport: GithubPublishReport;
}

export interface GithubArtifactsSnapshot {
  publishReport: GithubPublishReport | null;
  repositoryManifest: GithubRepositoryManifest | null;
  topics: GithubTopics | null;
  releaseTag: GithubReleaseTag | null;
}
