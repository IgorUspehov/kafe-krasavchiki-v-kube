/** Canonical public origin (Render + custom domain). */
export const DEFAULT_PUBLIC_ORIGIN = "https://webstudio-muenchen.com";

/** Legacy Railway production origin (kept for CSP / old bookmarks). */
export const DEFAULT_RAILWAY_ORIGIN =
  "https://saas-mvp-funnel-production.up.railway.app";

/** Custom domain that must also be allowed to embed crm-demo-sites. */
export const CUSTOM_SITE_FRAME_ANCESTOR = "https://webstudio-muenchen.com";

/**
 * Current public site origin (env override or production default).
 * Prefer FRAME_ANCESTORS when writing CSP — Live Preview must work from both hosts.
 */
export const RAILWAY_FRAME_ANCESTOR =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
  DEFAULT_PUBLIC_ORIGIN;

/**
 * All parents allowed to embed the Cloudflare Pages CRM iframe.
 * Always includes Railway + custom domain; also includes NEXT_PUBLIC_SITE_URL if set.
 */
export const FRAME_ANCESTORS: readonly string[] = (() => {
  const set = new Set<string>([DEFAULT_RAILWAY_ORIGIN, CUSTOM_SITE_FRAME_ANCESTOR]);
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) set.add(fromEnv);
  return Array.from(set);
})();

/** Space-separated list for CSP `frame-ancestors`. */
export const FRAME_ANCESTORS_CSP_VALUE = FRAME_ANCESTORS.join(" ");

/**
 * True when Pages edge serves a real response that Railway / custom domain may embed:
 * HTTP 2xx, no blocking X-Frame-Options, CSP frame-ancestors includes an allowed parent.
 */
export function isPagesIframeEmbedReady(response: {
  ok: boolean;
  headers: Headers;
}): boolean {
  if (!response.ok) {
    return false;
  }

  const xFrameOptions = response.headers.get("x-frame-options");
  if (xFrameOptions && /deny|sameorigin/i.test(xFrameOptions)) {
    return false;
  }

  const csp = response.headers.get("content-security-policy") ?? "";
  if (!/frame-ancestors/i.test(csp)) {
    return false;
  }

  return FRAME_ANCESTORS.some((origin) => csp.includes(origin));
}
