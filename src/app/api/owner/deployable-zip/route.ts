import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { AdminUnauthorizedError, requireAdminSession, unauthorizedResponse } from "@/lib/admin/authorize";
import { buildDeployableZip, DeployableZipError } from "@/lib/deployable-zip";
import { resolveZipUnlock } from "@/lib/mvp-pro/zip-access";

export const runtime = "nodejs";

/**
 * Deployable ZIP download for the authenticated admin session.
 *
 * Gated by €999 Polar entitlement (or DEPLOYABLE_ZIP_OWNER_BYPASS=1).
 * clientId is taken ONLY from the signed session.
 */
export async function GET(request: Request) {
  try {
    const session = requireAdminSession(request);
    const clientId = session.clientId;

    const url = new URL(request.url);
    const queried = url.searchParams.get("clientId")?.trim();
    if (queried && queried !== clientId) {
      console.warn("[owner/deployable-zip] ignored foreign clientId query param", {
        sessionClientId: clientId,
        queriedClientId: queried,
      });
    }

    const access = await resolveZipUnlock(clientId);
    if (!access.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Deployable ZIP requires €999 payment",
          code: "PAYMENT_REQUIRED",
          checkout: "/api/polar/deployable-zip-checkout",
        },
        { status: 402 },
      );
    }

    const result = await buildDeployableZip({
      clientId,
      mode: access.reason === "bypass" ? "owner" : "subscription_export",
    });

    if (result.clientId !== clientId) {
      console.error("[owner/deployable-zip] builder clientId mismatch", {
        sessionClientId: clientId,
        resultClientId: result.clientId,
      });
      return NextResponse.json({ ok: false, error: "Isolation failure" }, { status: 500 });
    }

    const webStream = Readable.toWeb(Readable.from(result.buffer)) as ReadableStream;
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
        "X-Deployable-Zip-Client-Id": result.clientId,
        "X-Deployable-Zip-Mode": result.mode,
        "X-Deployable-Zip-Isolation-Ok": result.isolation.ok ? "1" : "0",
      },
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    if (error instanceof DeployableZipError) {
      const status =
        error.code === "DIST_MISSING" || error.code === "MANIFEST_MISSING" ? 404 : 400;
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to build owner ZIP";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
