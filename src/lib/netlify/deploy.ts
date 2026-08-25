/**
 * @deprecated Netlify hosting is removed. All deploys go through Cloudflare Pages.
 * This module re-exports Cloudflare helpers under legacy names so any leftover
 * imports cannot hit api.netlify.com.
 */
import {
  createPagesProject,
  deletePagesDeployment,
  deployDistToPages,
  deployToCloudflarePages,
  resolveMvpDistPath as resolveCloudflareMvpDistPath,
} from "@/lib/cloudflare/deploy";
import { getSharedPagesProjectName } from "@/lib/cloudflare/shared-project";

export type NetlifyDeployResult = {
  siteId: string;
  siteUrl: string;
  deployId: string;
};

export const resolveMvpDistPath = resolveCloudflareMvpDistPath;

export async function createNetlifySite(
  clientId: string,
  meta?: { businessType?: string; businessName?: string },
): Promise<{ siteId: string; siteUrl: string }> {
  const { projectName, siteUrl } = await createPagesProject({
    clientId,
    businessType: meta?.businessType,
    businessName: meta?.businessName,
  });
  return { siteId: projectName, siteUrl };
}

export async function uploadAndDeploy(
  siteId: string,
  distPath: string,
): Promise<{ deployId: string }> {
  const { deploymentId } = await deployDistToPages(siteId, distPath);
  return { deployId: deploymentId };
}

export async function deployToNetlify(
  clientId: string,
  distPath: string,
): Promise<NetlifyDeployResult> {
  const result = await deployToCloudflarePages(clientId, distPath);
  return {
    siteId: result.deploymentId,
    siteUrl: result.siteUrl,
    deployId: result.deploymentId,
  };
}

export async function deleteNetlifySite(siteId: string): Promise<void> {
  // Shared-project model: siteId is a deployment id.
  await deletePagesDeployment(getSharedPagesProjectName(), siteId);
}

export function monitorDeployInBackground(_deployId: string, _siteId: string): void {
  // Cloudflare deploy already waits for ready state in deployDistToPages.
}
