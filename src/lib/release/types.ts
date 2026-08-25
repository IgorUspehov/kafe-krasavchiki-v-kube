export const RELEASE_FACTORY_VERSION = "3.5";

export const RELEASE_ARTIFACT_ROOT = "artifacts/release";

export interface ReleaseManifest {
  project_name: string;
  version: string;
  readme: boolean;
  demo_video: boolean;
  screenshots: boolean;
  project_card: boolean;
  package_artifacts: boolean;
  bundle_ready: boolean;
}

export interface ReleaseReport {
  bundle_ready: boolean;
  zip_path: string;
  files_included: string[];
  generated_at: string;
  factory_version: string;
}

export interface RepositoryManifest {
  repository_name: string;
  repository_description: string;
  topics: string[];
  default_branch: string;
  license: string;
}

export interface GithubPublishReport {
  github_ready: boolean;
  release_ready: boolean;
  bundle_ready: boolean;
}

export interface ReleasePresentationFields {
  release_ready: boolean;
  bundle_path: string;
  release_manifest: string;
  release_notes: string;
}

export interface ReleaseBundle {
  releaseManifest: ReleaseManifest;
  releaseReport: ReleaseReport;
  repositoryManifest: RepositoryManifest;
  githubPublishReport: GithubPublishReport;
  releaseNotes: string;
  presentationFields: ReleasePresentationFields;
}

export interface ReleaseArtifactsSnapshot {
  releaseManifest: ReleaseManifest | null;
  releaseReport: ReleaseReport | null;
  githubReport: GithubPublishReport | null;
  presentation: ReleasePresentationFields | null;
}
