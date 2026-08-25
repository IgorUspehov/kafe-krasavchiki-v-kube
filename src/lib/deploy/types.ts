export const DEPLOY_FACTORY_VERSION = "3.7.0";

export const DEPLOY_ARTIFACT_ROOT = "artifacts/deploy";

export type DeployReadyStatus = "READY" | "PENDING";
export type DeploymentStatus = "DEPLOY_READY" | "PENDING";

export interface NetlifyReport {
  status: DeployReadyStatus;
  config_path: string;
  build_command: string;
  publish_directory: string;
  node_version: string;
}

export interface VercelReport {
  status: DeployReadyStatus;
  config_path: string;
  framework: string;
  build_command: string;
  output_directory: string;
}

export interface DockerReport {
  status: DeployReadyStatus;
  dockerfile_path: string;
  compose_path: string;
  image: string;
  port: string;
  service_name: string;
}

export interface DeployManifest {
  version: string;
  netlify_ready: boolean;
  vercel_ready: boolean;
  docker_ready: boolean;
  deployment_ready: boolean;
}

export interface DeploymentReport {
  status: DeploymentStatus;
  netlify: DeployReadyStatus;
  vercel: DeployReadyStatus;
  docker: DeployReadyStatus;
  core_modified: boolean;
}

export interface DeployBundle {
  netlifyToml: string;
  netlifyReport: NetlifyReport;
  vercelJson: Record<string, unknown>;
  vercelReport: VercelReport;
  dockerfile: string;
  dockerCompose: string;
  dockerReport: DockerReport;
  deployManifest: DeployManifest;
  deploymentReport: DeploymentReport;
}

export interface DeployArtifactsSnapshot {
  deployManifest: DeployManifest | null;
  deploymentReport: DeploymentReport | null;
  netlifyReport: NetlifyReport | null;
  vercelReport: VercelReport | null;
  dockerReport: DockerReport | null;
}
