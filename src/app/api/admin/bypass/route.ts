import { NextResponse } from "next/server";

import { buildZipAdminEnterPath } from "@/lib/admin/zip-client-session";
import { isDeployableZipRuntime } from "@/lib/deployable-zip/runtime";
import { readRootClientManifest } from "@/lib/deployable-zip/buyer-setup";
import { resolveMagicLinkOrigin } from "@/lib/cloudflare/shared-project";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pickPackagedClientId(): string {
  try {
    const packaged = readRootClientManifest();
    if (!packaged) return "";
    const id = packaged.clientId ?? packaged.client_id;
    return typeof id === "string" ? id.trim() : "";
  } catch {
    return "";
  }
}

function resolveOrigin(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return resolveMagicLinkOrigin(request);
  }
}

/**
 * Legacy Deployable ZIP entry. Does not create a server session anymore —
 * redirects to the client `/admin/enter` page so login never depends on this
 * route (and never 500s from cookie/HMAC/disk side effects).
 *
 * GET /api/admin/bypass?clientId=…
 */
export async function GET(request: Request) {
  try {
    if (!isDeployableZipRuntime()) {
      return NextResponse.json({ ok: false, error: "Bypass disabled" }, { status: 403 });
    }

    const url = new URL(request.url);
    const requested = (url.searchParams.get("clientId") || "").trim();
    const packagedId = pickPackagedClientId();
    const clientId = requested || packagedId;
    const origin = resolveOrigin(request);

    if (!clientId || !UUID_RE.test(clientId)) {
      return NextResponse.redirect(new URL("/admin/login", `${origin}/`));
    }

    if (packagedId && packagedId !== clientId) {
      return NextResponse.redirect(new URL("/admin/login", `${origin}/`));
    }

    return NextResponse.redirect(new URL(buildZipAdminEnterPath(clientId), `${origin}/`));
  } catch (error) {
    console.error("[admin/bypass] failed — redirecting to login", {
      message: error instanceof Error ? error.message : String(error),
    });
    try {
      const origin = resolveOrigin(request);
      const clientId = new URL(request.url).searchParams.get("clientId")?.trim() || "";
      if (clientId) {
        return NextResponse.redirect(new URL(buildZipAdminEnterPath(clientId), `${origin}/`));
      }
      return NextResponse.redirect(new URL("/admin/login", `${origin}/`));
    } catch {
      return NextResponse.json({ ok: true, redirect: "/admin/login" });
    }
  }
}
