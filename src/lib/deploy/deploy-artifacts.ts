import type {
  DeployArtifactsSnapshot,
  DeployManifest,
  DeploymentReport,
  DockerReport,
  NetlifyReport,
  VercelReport,
} from "@/lib/deploy/types";

export const DEPLOY_ARTIFACT_BASE = "/artifacts/deploy";

export async function fetchDeployArtifactsSnapshot(): Promise<DeployArtifactsSnapshot> {
  const [manifestRes, reportRes, netlifyRes, vercelRes, dockerRes] = await Promise.all([
    fetch(`${DEPLOY_ARTIFACT_BASE}/deploy_manifest.json`),
    fetch(`${DEPLOY_ARTIFACT_BASE}/deployment_report.json`),
    fetch(`${DEPLOY_ARTIFACT_BASE}/netlify/netlify_report.json`),
    fetch(`${DEPLOY_ARTIFACT_BASE}/vercel/vercel_report.json`),
    fetch(`${DEPLOY_ARTIFACT_BASE}/docker/docker_report.json`),
  ]);

  const deployManifest = manifestRes.ok
    ? ((await manifestRes.json()) as DeployManifest)
    : null;

  const deploymentReport = reportRes.ok
    ? ((await reportRes.json()) as DeploymentReport)
    : null;

  const netlifyReport = netlifyRes.ok
    ? ((await netlifyRes.json()) as NetlifyReport)
    : null;

  const vercelReport = vercelRes.ok
    ? ((await vercelRes.json()) as VercelReport)
    : null;

  const dockerReport = dockerRes.ok
    ? ((await dockerRes.json()) as DockerReport)
    : null;

  return {
    deployManifest,
    deploymentReport,
    netlifyReport,
    vercelReport,
    dockerReport,
  };
}
