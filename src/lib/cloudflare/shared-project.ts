import { RAILWAY_FRAME_ANCESTOR } from "@/lib/cloudflare/iframe-ready";

/**
 * Cloudflare Pages account project limit varies; free plans often allow ~100.
 * This account previously failed near 20 — keep headroom but do not create per-client projects.
 */
export const DEFAULT_SHARED_PAGES_PROJECT = "crm-demo-sites";
export const DEFAULT_DEPLOYMENT_KEEP = 40;

export function getSharedPagesProjectName(): string {
  const raw = process.env.CLOUDFLARE_PAGES_PROJECT_NAME?.trim() || DEFAULT_SHARED_PAGES_PROJECT;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 58);
}

export function getDeploymentKeepCount(): number {
  const raw = Number(process.env.CLOUDFLARE_DEPLOYMENT_KEEP ?? DEFAULT_DEPLOYMENT_KEEP);
  if (!Number.isFinite(raw) || raw < 5) return DEFAULT_DEPLOYMENT_KEEP;
  return Math.floor(raw);
}

function isLoopbackOrigin(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function getPublicSiteOrigin(): string {
  // Never emit localhost / :10000 — use public NEXT_PUBLIC_SITE_URL only when non-loopback.
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "";
  if (fromEnv && !isLoopbackOrigin(fromEnv)) return fromEnv;

  // Deployable ZIP on Vercel — prefer the live deployment host.
  if (process.env.IS_DEPLOYABLE_ZIP === "true") {
    const vercel = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "");
    if (vercel) return `https://${vercel}`;
  }

  return RAILWAY_FRAME_ANCESTOR;
}

/** Public https origin for emails and redirects. Never localhost / :10000. */
export function resolvePublicAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "";
  if (fromEnv && !isLoopbackOrigin(fromEnv)) return fromEnv;

  if (process.env.IS_DEPLOYABLE_ZIP === "true") {
    const vercel = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "");
    if (vercel) return `https://${vercel}`;
  }

  return "https://webstudio-muenchen.com";
}

/**
 * Origin for admin magic-link / callback URLs.
 * Always prefers NEXT_PUBLIC_SITE_URL (non-loopback). Never returns localhost:10000.
 */
export function resolveMagicLinkOrigin(request: Request): string {
  if (process.env.NODE_ENV !== "production") {
    try {
      const origin = new URL(request.url).origin;
      if (origin && !isLoopbackOrigin(origin)) return origin;
    } catch {
      /* fall through */
    }
  }
  return resolvePublicAppOrigin();
}

export function buildReadableDemoUrl(slug: string, clientId?: string): string {
  const base = `${getPublicSiteOrigin()}/demo/${slug}`;
  if (!clientId) return base;
  const url = new URL(base);
  url.searchParams.set("clientId", clientId);
  return url.toString();
}

/** Public visitor site (Google Maps / Instagram / card) — same slug as /demo/{slug}. */
export function buildReadablePublicSiteUrl(slug: string, lang?: string): string {
  const base = `${getPublicSiteOrigin()}/site/${encodeURIComponent(slug)}`;
  if (!lang) return base;
  const url = new URL(base);
  url.searchParams.set("lang", lang);
  return url.toString();
}

/**
 * Stable public site URL keyed by clientId (survives slug typos and /tmp registry wipes).
 * `/site/{uuid}` hydrates from Firestore and redirects to the canonical slug when needed.
 */
export function buildReadablePublicSiteUrlByClientId(clientId: string, lang?: string): string {
  const id = String(clientId ?? "").trim();
  if (!id) return buildReadablePublicSiteUrl("");
  const base = `${getPublicSiteOrigin()}/site/${encodeURIComponent(id)}`;
  if (!lang) return base;
  const url = new URL(base);
  url.searchParams.set("lang", lang);
  return url.toString();
}
