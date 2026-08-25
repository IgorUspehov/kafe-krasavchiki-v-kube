import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import {
  buildDeployableZip,
  DeployableZipError,
  type DeployableZipMode,
} from "@/lib/deployable-zip";

export const runtime = "nodejs";

/**
 * Internal verification endpoint for Deployable ZIP Builder V2.
 * Does NOT replace /api/download-site, /api/download-zip, or /api/admin/download-zip.
 *
 * Auth: header `x-deployable-zip-test-secret` or `?secret=` matching
 * DEPLOYABLE_ZIP_TEST_SECRET (preferred) or STORAGE_CLEANUP_SECRET.
 * If neither env is set, allowed only when NODE_ENV !== "production".
 */
function isAuthorized(request: Request): boolean {
  const secret =
    process.env.DEPLOYABLE_ZIP_TEST_SECRET?.trim() ||
    process.env.STORAGE_CLEANUP_SECRET?.trim() ||
    "";

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("x-deployable-zip-test-secret");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  return header === secret || querySecret === secret;
}

function parseMode(raw: string | null): DeployableZipMode {
  if (
    raw === "owner" ||
    raw === "subscription_export" ||
    raw === "marketplace" ||
    raw === "internal_test"
  ) {
    return raw;
  }
  return "internal_test";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId")?.trim() ?? "";
  const mode = parseMode(searchParams.get("mode"));
  const metaOnly = searchParams.get("meta") === "1" || searchParams.get("meta") === "true";

  if (!clientId) {
    return NextResponse.json({ ok: false, error: "clientId is required" }, { status: 400 });
  }

  try {
    const result = await buildDeployableZip({ clientId, mode });

    if (metaOnly) {
      return NextResponse.json({
        ok: true,
        clientId: result.clientId,
        mode: result.mode,
        filename: result.filename,
        distPath: result.distPath,
        bytes: result.buffer.length,
        security: result.security,
        isolation: result.isolation,
        readmePreview: result.readmeContent.slice(0, 500),
      });
    }

    const webStream = Readable.toWeb(Readable.from(result.buffer)) as ReadableStream;
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
        "X-Deployable-Zip-Client-Id": result.clientId,
        "X-Deployable-Zip-Isolation-Ok": result.isolation.ok ? "1" : "0",
        "X-Deployable-Zip-Security-Findings": String(result.security.findings.length),
      },
    });
  } catch (error) {
    if (error instanceof DeployableZipError) {
      const status = error.code === "DIST_MISSING" ? 404 : 400;
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status });
    }
    const message = error instanceof Error ? error.message : "Failed to build deployable ZIP";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
