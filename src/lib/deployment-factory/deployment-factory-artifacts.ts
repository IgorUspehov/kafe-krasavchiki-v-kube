import type { DeploymentManifest, DeploymentSnapshot, ProductionCheck } from "@/lib/deployment-factory/types";

export const DEPLOYMENT_FACTORY_BASE = "/artifacts/factory_output/deployment";

export async function fetchDeploymentSnapshot(): Promise<DeploymentSnapshot> {
  const [manifestRes, productionRes, hostingRes, domainRes] = await Promise.all([
    fetch(`${DEPLOYMENT_FACTORY_BASE}/deployment_manifest.json`),
    fetch(`${DEPLOYMENT_FACTORY_BASE}/production_check/production_check.json`),
    fetch(`${DEPLOYMENT_FACTORY_BASE}/hosting/hosting_config.json`),
    fetch(`${DEPLOYMENT_FACTORY_BASE}/domain/domain_config.json`),
  ]);

  const manifest = manifestRes.ok ? ((await manifestRes.json()) as DeploymentManifest) : null;
  const production = productionRes.ok ? ((await productionRes.json()) as ProductionCheck) : null;
  const hosting = hostingRes.ok
    ? ((await hostingRes.json()) as DeploymentSnapshot["hosting"])
    : null;
  const domain = domainRes.ok
    ? ((await domainRes.json()) as DeploymentSnapshot["domain"])
    : null;

  return { manifest, production, hosting, domain };
}
