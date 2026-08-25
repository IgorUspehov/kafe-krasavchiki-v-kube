import { NextResponse } from "next/server";

import { normalizeManifestMedia } from "@/lib/manifest/normalize-manifest-media";
import { loadClientManifestAsync } from "@/lib/manifest/storage";
import { stripLeadsSecrets } from "@/lib/leads/read-secret";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await context.params;
  // Render stores manifests under /tmp — after each deploy disk is empty.
  // Rehydrate from Firestore; never treat a cold disk as "deleted client".
  const manifest = await loadClientManifestAsync(clientId);

  if (!manifest) {
    return NextResponse.json(
      { error: "Manifest not found" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(stripLeadsSecrets(normalizeManifestMedia(manifest)), {
    headers: CORS_HEADERS,
  });
}
