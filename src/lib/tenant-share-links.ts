import {
  buildReadableDemoUrl,
  buildReadablePublicSiteUrlByClientId,
  resolvePublicAppOrigin,
} from "@/lib/cloudflare/shared-project";

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

/** Canonical share URLs for a paid tenant (CRM, admin, public site, forms). */
export function buildTenantShareLinks(input: {
  clientId: string;
  slug?: string;
  origin?: string;
}): TenantShareLinks {
  const clientId = pickId(input.clientId);
  const slug = pickId(input.slug);
  const origin = (input.origin || resolvePublicAppOrigin()).replace(/\/$/, "");
  const site = clientId ? buildReadablePublicSiteUrlByClientId(clientId) : "";
  const siteBase = site || (clientId ? `${origin}/site/${encodeURIComponent(clientId)}` : "");

  return {
    crm: slug && clientId ? buildReadableDemoUrl(slug, clientId) : "",
    admin: clientId ? `${origin}/admin/login?clientId=${encodeURIComponent(clientId)}` : "",
    site: siteBase,
    vacancies: siteBase ? `${siteBase.replace(/\/$/, "")}/job` : "",
    booking: siteBase ? `${siteBase.replace(/\/$/, "")}/booking` : "",
  };
}
