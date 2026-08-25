import { findDemoByClientId, hydrateDemoRecord } from "@/lib/cloudflare/demo-registry";
import { findPendingByClientId } from "@/lib/cloudflare/scheduler";
import {
  buildReadableDemoUrl,
  buildReadablePublicSiteUrlByClientId,
} from "@/lib/cloudflare/shared-project";
import { hydrateClientManifest } from "@/lib/admin/lookup";
import { POLAR_CHECKOUT_WEBSTUDIO_199 } from "@/lib/polar/constants";
import { buildTariffsPagePath } from "@/lib/tariffs/urls";

export type DemoAccessStatus = {
  clientId: string;
  paid: boolean;
  found: boolean;
  /** Localized tariff chooser (not Polar directly). */
  checkoutUrl: string;
  /** Direct Polar Web Studio checkout (€199/month). */
  polarCheckoutUrl: string;
  /** Canonical Railway CRM entry for this tenant (never a foreign pages.dev bake). */
  crmUrl: string | null;
  /** Public visitor site for Maps/Instagram — /site/{slug}, no query params. */
  publicSiteUrl: string | null;
  slug: string | null;
};

export function buildCrmDemoCheckoutUrl(clientId: string): string {
  const url = new URL(POLAR_CHECKOUT_WEBSTUDIO_199);
  if (clientId) {
    url.searchParams.set("reference_id", clientId);
    url.searchParams.set("metadata[client_id]", clientId);
    url.searchParams.set("metadata[reference_id]", clientId);
  }
  return url.toString();
}

/**
 * Payment gate for CRM demos.
 * `paid` is true only when registry or pending-deletion record is marked paid
 * (Polar/LemonSqueezy webhook via cancelDeletion / markDemoPaid).
 * Unknown clientId → unpaid (fail closed).
 * Banner CTA opens the tariff chooser; €199/month uses Polar.
 */
export function resolveDemoAccess(clientId: string): DemoAccessStatus {
  const id = String(clientId ?? "").trim();
  const polarCheckoutUrl = buildCrmDemoCheckoutUrl(id);
  // Relative path — always stays on the current host (Render / custom domain).
  // Absolute NEXT_PUBLIC_SITE_URL is bake-time and used to leak Railway after migrations.
  const checkoutUrl = buildTariffsPagePath({ clientId: id });

  if (!id) {
    return {
      clientId: "",
      paid: false,
      found: false,
      checkoutUrl,
      polarCheckoutUrl,
      crmUrl: null,
      publicSiteUrl: null,
      slug: null,
    };
  }

  const demo = findDemoByClientId(id);
  const pending = findPendingByClientId(id);
  const found = Boolean(demo || pending);
  const paid = demo?.paid === true || pending?.paid === true;
  const slug = demo?.slug || pending?.slug || null;
  const crmUrl = slug ? buildReadableDemoUrl(slug, id) : null;
  // Prefer clientId URLs — immune to slug typos (a03c vs a83c) and cold Render /tmp.
  const publicSiteUrl = buildReadablePublicSiteUrlByClientId(id);

  return {
    clientId: id,
    paid,
    found,
    checkoutUrl,
    polarCheckoutUrl,
    crmUrl,
    publicSiteUrl,
    slug,
  };
}

/** Cold-start safe access resolver — rehydrates demo-registry + manifest from Firestore. */
export async function resolveDemoAccessHydrated(clientId: string): Promise<DemoAccessStatus> {
  const id = String(clientId ?? "").trim();
  if (!id) {
    return resolveDemoAccess("");
  }

  await hydrateDemoRecord({ clientId: id });
  await hydrateClientManifest(id);
  return resolveDemoAccess(id);
}
