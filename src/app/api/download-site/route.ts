import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { createMvpProZipStream, readManifestJson } from "@/lib/mvp-pro/zip-stream";
import { verifySiteDownloadAccess } from "@/lib/site-delivery/download-access";
import { clientDistExists, resolveClientDistPath } from "@/lib/site-delivery/dist-store";

export const runtime = "nodejs";

function buildZipFilename(clientId: string): string {
  const safeId = clientId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `site-${safeId || "mvp"}.zip`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";

  console.log("[download-site] clientId=", clientId || "(empty)");

  if (!clientId || !token) {
    return NextResponse.json({ error: "clientId and token are required" }, { status: 400 });
  }

  const access = verifySiteDownloadAccess(clientId, token);
  console.log("[download-site] tokenMatch=", access.tokenMatch);
  console.log("[download-site] tokenExpired=", access.tokenExpired);

  if (!access.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const distPath = resolveClientDistPath(clientId);
  const distExists = clientDistExists(clientId);
  console.log("[download-site] distExists=", distExists);
  console.log("[download-site] distPath=", distPath);

  if (!distExists) {
    return NextResponse.json({ error: "DIST_MISSING" }, { status: 404 });
  }

  try {
    const manifestJson = readManifestJson(clientId);
    const zipStream = createMvpProZipStream({
      distPath,
      readmeContent: "Website + CRM + Booking — exported site files\n",
      manifestJson,
    });
    const webStream = Readable.toWeb(zipStream) as ReadableStream;

    console.log("[download-site] zipStreamStarted=", true);

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${buildZipFilename(clientId)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.log("[download-site] zipStreamStarted=", false);
    const message = error instanceof Error ? error.message : "Failed to build ZIP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
