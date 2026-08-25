import { resolvePublicAppOrigin } from "@/lib/cloudflare/shared-project";

export type TenantShareLinks = {
  crm: string;
  admin: string;
  site: string;
  vacancies: string;
  booking: string;
};

function pickId(value: string | undefined): string {
  return String(value ?? "").trim();
}

/**
 * Share URLs for a paid tenant — always on the current deployment origin
 * (window.location.origin from the client, or request/env origin on the server).
 * Never hardcode crm-demo-sites.pages.dev / bake-time SaaS hosts for ZIP buyers.
 */
export function buildTenantShareLinks(input: {
  clientId: string;
  slug?: string;
  origin?: string;
}): TenantShareLinks {
  const clientId = pickId(input.clientId);
  const slug = pickId(input.slug);
  const origin = (input.origin || resolvePublicAppOrigin()).replace(/\/$/, "");
  const siteBase = clientId ? `${origin}/site/${encodeURIComponent(clientId)}` : "";
  const crm =
    slug && clientId
      ? `${origin}/demo/${encodeURIComponent(slug)}?clientId=${encodeURIComponent(clientId)}`
      : "";

  return {
    crm,
    admin: clientId ? `${origin}/admin/login?clientId=${encodeURIComponent(clientId)}` : "",
    site: siteBase,
    vacancies: siteBase ? `${siteBase}/job` : "",
    booking: siteBase ? `${siteBase}/booking` : "",
  };
}
