/**
 * Factory Website+CRM bridge — pass only funnel fields, never templates/repos.
 * €499 / €999 handoff lands on Factory with query params; CRM Demo (€99) stays on Polar.
 */

export type FactoryBridgeTier = "factory_ready" | "factory_custom";

export type FactoryBridgePayload = {
  businessName?: string;
  ownerName?: string;
  niche?: string;
  city?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  language?: string;
  clientId?: string;
  tier: FactoryBridgeTier;
};

const ALLOWED_KEYS = [
  "businessName",
  "ownerName",
  "niche",
  "city",
  "phone",
  "email",
  "whatsapp",
  "language",
  "clientId",
  "tier",
] as const;

export function getFactoryWebsiteBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_FACTORY_WEBSITE_URL?.trim() ||
    process.env.FACTORY_WEBSITE_URL?.trim() ||
    "";
  return fromEnv.replace(/\/$/, "");
}

/** Sanitize and keep only the approved bridge fields. */
export function pickFactoryBridgeFields(
  input: Partial<FactoryBridgePayload> & Record<string, unknown>,
): FactoryBridgePayload {
  const tierRaw = String(input.tier || "").trim();
  const tier: FactoryBridgeTier =
    tierRaw === "factory_custom" || tierRaw === "999" || tierRaw === "crm_full"
      ? "factory_custom"
      : "factory_ready";

  const out: FactoryBridgePayload = { tier };
  for (const key of ALLOWED_KEYS) {
    if (key === "tier") continue;
    const value = input[key];
    if (typeof value === "string" && value.trim()) {
      out[key] = value.trim();
    }
  }
  return out;
}

/**
 * Build absolute Factory URL with bridge query params only.
 * Falls back to same-origin `/factory-handoff` when Factory base URL is not configured.
 */
export function buildFactoryBridgeUrl(
  input: Partial<FactoryBridgePayload> & Record<string, unknown>,
  options?: { siteOrigin?: string },
): string {
  const payload = pickFactoryBridgeFields(input);
  const params = new URLSearchParams();
  for (const key of ALLOWED_KEYS) {
    const value = payload[key];
    if (typeof value === "string" && value) {
      params.set(key, value);
    }
  }

  const factoryBase = getFactoryWebsiteBaseUrl();
  if (factoryBase) {
    const url = new URL(factoryBase.endsWith("/") ? factoryBase : `${factoryBase}/`);
    for (const [k, v] of params.entries()) {
      url.searchParams.set(k, v);
    }
    return url.toString();
  }

  const origin = (options?.siteOrigin || "").replace(/\/$/, "") || "";
  const path = `/factory-handoff?${params.toString()}`;
  return origin ? `${origin}${path}` : path;
}

export function factoryBridgeTierFromPrice(price: 499 | 999): FactoryBridgeTier {
  return price === 999 ? "factory_custom" : "factory_ready";
}
