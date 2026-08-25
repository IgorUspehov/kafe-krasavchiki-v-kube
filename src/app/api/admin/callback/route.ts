import { NextResponse } from "next/server";

import { consumeMagicLink } from "@/lib/admin/magic-link";
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  buildAdminSessionValue,
  createAdminSession,
} from "@/lib/admin/session";
import { resolveMagicLinkOrigin } from "@/lib/cloudflare/shared-project";
import { markClientAdminEdited } from "@/lib/site-delivery/dist-protection";

export const runtime = "nodejs";

function redirectWithError(request: Request, reason: string): NextResponse {
  const url = new URL("/admin/login", `${resolveMagicLinkOrigin(request)}/`);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const consumed = consumeMagicLink(token);
  if (!consumed.ok) {
    return redirectWithError(request, consumed.reason);
  }

  const session = createAdminSession(consumed.clientId, consumed.email);
  markClientAdminEdited(consumed.clientId);
  const response = NextResponse.redirect(new URL("/admin", `${resolveMagicLinkOrigin(request)}/`));
  response.cookies.set(ADMIN_SESSION_COOKIE, buildAdminSessionValue(session), adminCookieOptions());
  return response;
}
