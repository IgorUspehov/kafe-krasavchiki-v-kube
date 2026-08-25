import { generateDockerCompose, generateDockerfile, generateDockerReport } from "@/lib/deploy/docker-generator";
import { generateNetlifyReport, generateNetlifyToml } from "@/lib/deploy/netlify-generator";
import { generateVercelJson, generateVercelReport } from "@/lib/deploy/vercel-generator";
import {
  DEPLOY_ARTIFACT_ROOT,
  DEPLOY_FACTORY_VERSION,
  type DeployBundle,
  type DeployManifest,
  type DeploymentReport,
} from "@/lib/deploy/types";

export const DEPLOY_PATHS = {
  root: DEPLOY_ARTIFACT_ROOT,
  netlifyToml: `${DEPLOY_ARTIFACT_ROOT}/netlify/netlify.toml`,
  netlifyReport: `${DEPLOY_ARTIFACT_ROOT}/netlify/netlify_report.json`,
  vercelJson: `${DEPLOY_ARTIFACT_ROOT}/vercel/vercel.json`,
  vercelReport: `${DEPLOY_ARTIFACT_ROOT}/vercel/vercel_report.json`,
  dockerfile: `${DEPLOY_ARTIFACT_ROOT}/docker/Dockerfile`,
  dockerCompose: `${DEPLOY_ARTIFACT_ROOT}/docker/docker-compose.yml`,
  dockerReport: `${DEPLOY_ARTIFACT_ROOT}/docker/docker_report.json`,
  deployManifest: `${DEPLOY_ARTIFACT_ROOT}/deploy_manifest.json`,
  deploymentReport: `${DEPLOY_ARTIFACT_ROOT}/deployment_report.json`,
} as const;

export function generateDeployManifest(): DeployManifest {
  return {
    version: DEPLOY_FACTORY_VERSION,
    netlify_ready: true,
    vercel_ready: true,
    docker_ready: true,
    deployment_ready: true,
  };
}

export function generateDeploymentReport(): DeploymentReport {
  return {
    status: "DEPLOY_READY",
    netlify: "READY",
    vercel: "READY",
    docker: "READY",
    core_modified: false,
  };
}

export function generateDeployBundle(): DeployBundle {
  return {
    netlifyToml: generateNetlifyToml(),
    netlifyReport: generateNetlifyReport(),
    vercelJson: generateVercelJson(),
    vercelReport: generateVercelReport(),
    dockerfile: generateDockerfile(),
    dockerCompose: generateDockerCompose(),
    dockerReport: generateDockerReport(),
    deployManifest: generateDeployManifest(),
    deploymentReport: generateDeploymentReport(),
  };
}
