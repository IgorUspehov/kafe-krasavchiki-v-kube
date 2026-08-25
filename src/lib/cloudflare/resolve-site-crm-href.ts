import { buildDemoSlug } from "@/lib/cloudflare/deploy";
import type { DemoSiteRecord } from "@/lib/cloudflare/demo-registry";

/**
 * Public-site → CRM entry URL.
 * Always use Railway `/demo/{slug}` (iframe + leads bridge), never bare `/demo?clientId=`.
 */
export function resolveSiteCrmHref(input: {
  clientId: string;
  demo?: DemoSiteRecord | null;
  businessName?: string;
  businessType?: string;
}): string | null {
  const clientId = String(input.clientId || "").trim();
  if (!clientId) return null;

  const slug =
    (input.demo?.slug && String(input.demo.slug).trim()) ||
    buildDemoSlug({
      clientId,
      businessName: input.businessName,
      businessType: input.businessType,
    });

  if (!slug) return null;
  return `/demo/${encodeURIComponent(slug)}?clientId=${encodeURIComponent(clientId)}`;
}
