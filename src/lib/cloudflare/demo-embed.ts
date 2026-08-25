import type { DemoSiteRecord } from "@/lib/cloudflare/demo-registry";
import { getSharedPagesProjectName } from "@/lib/cloudflare/shared-project";

/**
 * Build the Cloudflare Pages iframe src with clientId for CRM bootstrap.
 *
 * Always use the shared project production alias (`https://crm-demo-sites.pages.dev`)
 * when the stored deploymentUrl belongs to that project — never freeze a per-deploy
 * hash subdomain (`https://abc123.crm-demo-sites.pages.dev`) in the Railway iframe.
 * Hash URLs go stale when preview deployments are pruned or the shared CRM SPA is redeployed.
 *
 * Wizard Live Preview must iframe Railway `/demo/{slug}?clientId=…` (readable URL), not this
 * Pages URL directly — `/demo/[slug]` calls this helper for the nested CRM frame.
 */
export function buildDemoEmbedSrc(
  record: Pick<DemoSiteRecord, "deploymentUrl" | "clientId"> & {
    projectName?: string;
  },
  clientIdOverride?: string,
): string {
  const clientId = clientIdOverride || record.clientId;
  const sharedProject = getSharedPagesProjectName();
  const canonicalOrigin = `https://${sharedProject}.pages.dev`;

  let origin = canonicalOrigin;
  try {
    const stored = new URL(record.deploymentUrl);
    const host = stored.hostname.toLowerCase();
    const productionHost = `${sharedProject}.pages.dev`;
    const isSharedProjectHost =
      host === productionHost || host.endsWith(`.${productionHost}`);
    // Shared-project hosts (production alias OR ephemeral `{hash}.project.pages.dev`)
    // always resolve to the stable production alias — never return a raw hash URL.
    origin = isSharedProjectHost ? canonicalOrigin : stored.origin;
  } catch {
    origin = canonicalOrigin;
  }

  const url = new URL(origin);
  if (clientId) url.searchParams.set("clientId", clientId);
  return url.toString();
}
