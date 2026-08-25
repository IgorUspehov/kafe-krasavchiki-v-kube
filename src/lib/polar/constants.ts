/**
 * Polar product / checkout constants.
 *
 * CRM Demo (€99) must be a monthly subscription. Override via env after creating
 * the recurring product + checkout link in Polar (or via scripts/setup-polar-crm-demo-monthly.mjs):
 *   POLAR_PRODUCT_CRM_DEMO / NEXT_PUBLIC_POLAR_PRODUCT_CRM_DEMO
 *   POLAR_CHECKOUT_CRM_DEMO / NEXT_PUBLIC_POLAR_CHECKOUT_CRM_DEMO
 */

const env = (key: string) =>
  (typeof process !== "undefined" && process.env?.[key]?.trim()) || "";

/** One-time legacy product — replaced by monthly when env override is set. */
const LEGACY_PRODUCT_CRM_DEMO_ONETIME = "e8ca446a-5956-4add-bfc7-42c2401625e0";
const LEGACY_CHECKOUT_CRM_DEMO_ONETIME =
  "https://buy.polar.sh/polar_cl_uUpNQRXBAVubDpDO3zwLa5SAswkU0Jkr2835A04UF1F";

export const POLAR_PRODUCT_CRM_DEMO =
  env("NEXT_PUBLIC_POLAR_PRODUCT_CRM_DEMO") ||
  env("POLAR_PRODUCT_CRM_DEMO") ||
  LEGACY_PRODUCT_CRM_DEMO_ONETIME;

export const POLAR_PRODUCT_RECURRING = "118dc1ba-7c1d-4f2e-bf3a-278cfa5b8164";
/** CRM Full — €999 one-time (already in Polar catalogue). */
export const POLAR_PRODUCT_CRM_FULL = "3aefa6b9-720b-47da-9d66-07d4bc0cb757";

/**
 * Deployable ZIP product id. May share CRM Full (€999) catalogue product;
 * checkout session must still set SaaS successUrl (never Factory static link).
 */
export const POLAR_PRODUCT_DEPLOYABLE_ZIP =
  env("NEXT_PUBLIC_POLAR_PRODUCT_DEPLOYABLE_ZIP") ||
  env("POLAR_PRODUCT_DEPLOYABLE_ZIP") ||
  POLAR_PRODUCT_CRM_FULL;

export const POLAR_CHECKOUT_CRM_DEMO =
  env("NEXT_PUBLIC_POLAR_CHECKOUT_CRM_DEMO") ||
  env("POLAR_CHECKOUT_CRM_DEMO") ||
  LEGACY_CHECKOUT_CRM_DEMO_ONETIME;

/** Alias used in wizard and /pay */
export const POLAR_CHECKOUT_99 = POLAR_CHECKOUT_CRM_DEMO;

/** Web Studio €199/month recurring — primary public checkout. */
export const POLAR_CHECKOUT_WEBSTUDIO_199 =
  "https://buy.polar.sh/polar_cl_BJ6Vl6ueOpNfWgBJ2hdqsaSK9PPrbdEpEzoTW3FvzEX";

export const POLAR_CHECKOUT_RECURRING =
  "https://buy.polar.sh/polar_cl_LgroIdJNay4kFrrasqJMxAgL0jKrhngvgFzsU083GHe";

/** Same as CRM Full checkout — Admin “Buy ZIP €999” uses this. */
export const POLAR_CHECKOUT_CRM_FULL =
  "https://buy.polar.sh/polar_cl_qVHaJpa4Zon7ZJjZNAI6UNDt7vkLdV0enAUZc085fTu";

/**
 * Factory Website+CRM owns this checkout link — its Polar success URL lands on
 * webstudio-sdk-muenchen.com/manifest. Never reuse it for SaaS Deployable ZIP.
 */
export const POLAR_CHECKOUT_FACTORY_CRM_FULL = POLAR_CHECKOUT_CRM_FULL;

/**
 * SaaS Deployable ZIP checkout link. Must be a Polar link whose success URL is
 * https://webstudio-muenchen.com/success (create via setup-polar-deployable-zip-999.mjs).
 * Do NOT default to POLAR_CHECKOUT_CRM_FULL — that redirects buyers to Factory SDK.
 */
export const POLAR_CHECKOUT_DEPLOYABLE_ZIP =
  env("NEXT_PUBLIC_POLAR_CHECKOUT_DEPLOYABLE_ZIP") ||
  env("POLAR_CHECKOUT_DEPLOYABLE_ZIP") ||
  "";

export const POLAR_WEBHOOK_PATH = "/api/webhooks/polar";

/** True when checkout still points at the legacy one-time CRM Demo product. */
export function isLegacyCrmDemoOneTimeCheckout(): boolean {
  return POLAR_CHECKOUT_CRM_DEMO === LEGACY_CHECKOUT_CRM_DEMO_ONETIME;
}

/** Reject Factory’s shared €999 link so SaaS never sends payers to the SDK site. */
export function isFactoryOwnedCrmFullCheckout(url: string): boolean {
  const raw = url.trim();
  if (!raw) return false;
  try {
    const a = new URL(raw);
    const b = new URL(POLAR_CHECKOUT_FACTORY_CRM_FULL);
    return a.origin === b.origin && a.pathname === b.pathname;
  } catch {
    return raw === POLAR_CHECKOUT_FACTORY_CRM_FULL;
  }
}
