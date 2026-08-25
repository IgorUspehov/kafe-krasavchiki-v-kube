import type { DemoSiteRecord } from "@/lib/cloudflare/demo-registry";
import {
  getPublicSiteOrigin,
  getSharedPagesProjectName,
} from "@/lib/cloudflare/shared-project";

function isPagesDevHost(hostname: string): boolean {
  const host = String(hostname || "").toLowerCase();
  return host === "pages.dev" || host.endsWith(".pages.dev");
}

/**
 * Build the CRM iframe src with clientId for bootstrap.
 *
 * Deployable ZIP / self-host: always embed the current deployment origin
 * (Vercel / buyer domain) — never crm-demo-sites.pages.dev.
 *
 * SaaS production: use the shared Cloudflare Pages project alias when the
 * stored deploymentUrl belongs to that project; rewrite stale hash subdomains.
 */
export function buildDemoEmbedSrc(
  record: Pick<DemoSiteRecord, "deploymentUrl" | "clientId"> & {
    projectName?: string;
  },
  clientIdOverride?: string,
): string {
  const clientId = clientIdOverride || record.clientId;
  const publicOrigin = getPublicSiteOrigin();

  if (process.env.IS_DEPLOYABLE_ZIP === "true") {
    const url = new URL(publicOrigin);
    if (clientId) url.searchParams.set("clientId", clientId);
    return url.toString();
  }

  const sharedProject = getSharedPagesProjectName();
  const canonicalOrigin = `https://${sharedProject}.pages.dev`;

  let origin = canonicalOrigin;
  try {
    const stored = new URL(record.deploymentUrl);
    const host = stored.hostname.toLowerCase();
    const productionHost = `${sharedProject}.pages.dev`;
    const isSharedProjectHost =
      host === productionHost || host.endsWith(`.${productionHost}`);

    if (isSharedProjectHost) {
      origin = canonicalOrigin;
    } else if (isPagesDevHost(host)) {
      // Unknown / stale pages.dev → current public site, not a dead host.
      origin = publicOrigin;
    } else {
      origin = stored.origin;
    }
  } catch {
    origin = publicOrigin;
  }

  const url = new URL(origin);
  if (clientId) url.searchParams.set("clientId", clientId);
  return url.toString();
}
