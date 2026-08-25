import { NextResponse } from "next/server";

import { AdminUnauthorizedError, requireAdminSession, unauthorizedResponse } from "@/lib/admin/authorize";
import { persistClientManifest, requireClientManifest } from "@/lib/admin/persist";
import { applySiteContentPatch, parseSiteContentPatch, readSiteContent } from "@/lib/admin/site-content";
import { resolveDemoAccess } from "@/lib/cloudflare/demo-access";
import { findDemoByClientId } from "@/lib/cloudflare/demo-registry";
import {
  buildReadableDemoUrl,
  buildReadablePublicSiteUrlByClientId,
} from "@/lib/cloudflare/shared-project";
import { markClientAdminEdited } from "@/lib/site-delivery/dist-protection";

export const runtime = "nodejs";

function sitePayload(clientId: string, manifest: Record<string, unknown>) {
  const demo = findDemoByClientId(clientId);
  const access = resolveDemoAccess(clientId);
  const slug = demo?.slug || access.slug;
  return {
    ok: true,
    clientId,
    slug,
    paid: access.paid,
    publicSiteUrl: buildReadablePublicSiteUrlByClientId(clientId),
    crmUrl: slug ? buildReadableDemoUrl(slug, clientId) : access.crmUrl,
    content: readSiteContent(manifest),
  };
}

export async function GET(request: Request) {
  try {
    const session = requireAdminSession(request);
    const manifest = await requireClientManifest(session.clientId);
    return NextResponse.json(sitePayload(session.clientId, manifest), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load site" },
      { status: 404 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireAdminSession(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = parseSiteContentPatch(body);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const manifest = await requireClientManifest(session.clientId);
    const next = applySiteContentPatch(manifest, parsed.patch);
    await persistClientManifest(session.clientId, next);
    markClientAdminEdited(session.clientId);
    return NextResponse.json(sitePayload(session.clientId, next));
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save site" },
      { status: 400 },
    );
  }
}
