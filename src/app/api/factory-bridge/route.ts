import { NextRequest, NextResponse } from "next/server";

import {
  buildFactoryBridgeUrl,
  pickFactoryBridgeFields,
} from "@/lib/factory-crm/bridge";
import { loadClientManifest } from "@/lib/manifest/storage";

export const runtime = "nodejs";

/**
 * Server-side Factory bridge: load manifest by clientId, pass only allowed fields.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const clientId = searchParams.get("clientId")?.trim() || "";
  const tier = searchParams.get("tier")?.trim() || "factory_ready";

  let fromManifest: Record<string, string> = {};
  if (clientId) {
    try {
      const manifest = loadClientManifest(clientId);
      if (manifest && typeof manifest === "object") {
        const m = manifest as Record<string, unknown>;
        fromManifest = {
          businessName: String(m.businessName || ""),
          ownerName: String(m.ownerName || ""),
          niche: String(m.niche || m.businessType || m.sectorId || ""),
          city: String(m.city || ""),
          phone: String(m.phone || ""),
          email: String(m.email || ""),
          whatsapp: String(m.whatsapp || ""),
          language: String(m.language || ""),
          clientId,
        };
      }
    } catch {
      /* continue with query overrides */
    }
  }

  const merged = pickFactoryBridgeFields({
    ...fromManifest,
    businessName: searchParams.get("businessName") || fromManifest.businessName,
    ownerName: searchParams.get("ownerName") || fromManifest.ownerName,
    niche: searchParams.get("niche") || fromManifest.niche,
    city: searchParams.get("city") || fromManifest.city,
    phone: searchParams.get("phone") || fromManifest.phone,
    email: searchParams.get("email") || fromManifest.email,
    whatsapp: searchParams.get("whatsapp") || fromManifest.whatsapp,
    language: searchParams.get("language") || fromManifest.language,
    clientId: clientId || fromManifest.clientId,
    tier,
  } as Record<string, unknown>);

  const siteOrigin = request.nextUrl.origin;
  const target = buildFactoryBridgeUrl(merged, { siteOrigin });
  return NextResponse.redirect(target, 302);
}
