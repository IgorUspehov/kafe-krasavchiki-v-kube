import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  buildAdminSessionValue,
  createAdminSession,
} from "@/lib/admin/session";
import { readRootClientManifest } from "@/lib/deployable-zip/buyer-setup";
import { resolveMagicLinkOrigin } from "@/lib/cloudflare/shared-project";
import { markClientAdminEdited } from "@/lib/site-delivery/dist-protection";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pickPackagedClientId(): string {
  const packaged = readRootClientManifest();
  if (!packaged) return "";
  const id = packaged.clientId ?? packaged.client_id;
  return typeof id === "string" ? id.trim() : "";
}

/**
 * Deployable ZIP only: create an admin session from clientId without email.
 * Used when Resend is unavailable on Vercel.
 *
 * GET /api/admin/bypass?clientId=…
 */
export async function GET(request: Request) {
  if (process.env.IS_DEPLOYABLE_ZIP !== "true") {
    return NextResponse.json({ ok: false, error: "Bypass disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const requested = (url.searchParams.get("clientId") || "").trim();
  const packagedId = pickPackagedClientId();
  const clientId = requested || packagedId;

  if (!clientId || !UUID_RE.test(clientId)) {
    return NextResponse.json({ ok: false, error: "clientId required" }, { status: 400 });
  }

  // Single-tenant ZIP: if packaged id exists, only allow that tenant.
  if (packagedId && packagedId !== clientId) {
    return NextResponse.json({ ok: false, error: "clientId mismatch" }, { status: 403 });
  }

  const packaged = readRootClientManifest();
  const emailRaw = packaged && typeof packaged.email === "string" ? packaged.email.trim().toLowerCase() : "";
  const email = emailRaw.includes("@") ? emailRaw : "owner@local.zip";

  const session = createAdminSession(clientId, email);
  markClientAdminEdited(clientId);

  let origin = resolveMagicLinkOrigin(request);
  try {
    origin = new URL(request.url).origin;
  } catch {
    /* keep */
  }

  const response = NextResponse.redirect(new URL("/admin", `${origin}/`));
  response.cookies.set(ADMIN_SESSION_COOKIE, buildAdminSessionValue(session), adminCookieOptions());
  return response;
}
