import {
  POLAR_CHECKOUT_DEPLOYABLE_ZIP,
  POLAR_CHECKOUT_WEBSTUDIO_199,
  isFactoryOwnedCrmFullCheckout,
} from "@/lib/polar/constants";
import type { TariffContext } from "@/lib/tariffs/copy";

export function buildTariffsPagePath(ctx: Partial<TariffContext> & { lang?: string }): string {
  const params = new URLSearchParams();
  if (ctx.clientId) params.set("clientId", ctx.clientId);
  if (ctx.lang) params.set("lang", ctx.lang);
  if (ctx.businessName) params.set("businessName", ctx.businessName);
  if (ctx.ownerName) params.set("ownerName", ctx.ownerName);
  if (ctx.niche) params.set("niche", ctx.niche);
  if (ctx.city) params.set("city", ctx.city);
  if (ctx.phone) params.set("phone", ctx.phone);
  if (ctx.email) params.set("email", ctx.email);
  if (ctx.whatsapp) params.set("whatsapp", ctx.whatsapp);
  if (ctx.language) params.set("language", ctx.language);
  if (ctx.demoUrl) params.set("demo_url", ctx.demoUrl);
  const q = params.toString();
  return q ? `/tariffs?${q}` : "/tariffs";
}

export function buildTariffsPageUrl(
  ctx: Partial<TariffContext> & { lang?: string },
  siteOrigin?: string,
): string {
  const path = buildTariffsPagePath(ctx);
  // Same-host relative by default. Pass siteOrigin only for emails / cross-origin links.
  // Do NOT fall back to NEXT_PUBLIC_SITE_URL here — it is bake-time and may still be Railway.
  const origin = (siteOrigin || "").replace(/\/$/, "");
  return origin ? `${origin}${path}` : path;
}

function applyPolarLocale(url: URL, locale?: string): void {
  const lang = (locale || "").toLowerCase();
  if (lang.startsWith("ru")) url.searchParams.set("locale", "ru");
  else if (lang.startsWith("de")) url.searchParams.set("locale", "de");
  else if (lang.startsWith("en")) url.searchParams.set("locale", "en");
}

export function buildCrmDemoPolarUrl(
  clientId: string,
  email?: string,
  locale?: string,
): string {
  const url = new URL(POLAR_CHECKOUT_WEBSTUDIO_199);
  if (clientId) {
    url.searchParams.set("reference_id", clientId);
    url.searchParams.set("metadata[client_id]", clientId);
    url.searchParams.set("metadata[reference_id]", clientId);
  }
  if (email?.trim()) url.searchParams.set("customer_email", email.trim());
  if (email?.trim()) url.searchParams.set("prefilled_email", email.trim());
  applyPolarLocale(url, locale);
  return url.toString();
}

/** Static Polar checkout for €999 Deployable ZIP (SaaS success URL only — never Factory). */
export function buildDeployableZipPolarUrl(
  clientId: string,
  email?: string,
  locale?: string,
): string | null {
  const base = POLAR_CHECKOUT_DEPLOYABLE_ZIP.trim();
  if (!base || isFactoryOwnedCrmFullCheckout(base)) {
    return null;
  }
  const url = new URL(base);
  if (clientId) {
    url.searchParams.set("reference_id", clientId);
    url.searchParams.set("metadata[client_id]", clientId);
    url.searchParams.set("metadata[reference_id]", clientId);
    url.searchParams.set("metadata[product_kind]", "deployable_zip");
  }
  if (email?.trim()) {
    url.searchParams.set("customer_email", email.trim());
    url.searchParams.set("prefilled_email", email.trim());
  }
  applyPolarLocale(url, locale);
  return url.toString();
}

export function buildFactoryBridgeApiPath(input: {
  clientId?: string;
  tier: "factory_ready" | "factory_custom";
  language?: string;
}): string {
  const params = new URLSearchParams();
  if (input.clientId) params.set("clientId", input.clientId);
  params.set("tier", input.tier);
  if (input.language) params.set("language", input.language);
  return `/api/factory-bridge?${params.toString()}`;
}
