import { NextResponse } from "next/server";

import { assertPreviewIdForAssets, readDistFile } from "@/lib/client-preview/preview-service";

type RouteContext = {
  params: Promise<{ id: string; path: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id, path: assetParts } = await context.params;
  const resolvedId = assertPreviewIdForAssets(id);

  if (!resolvedId) {
    return NextResponse.json({ ok: false, error: "Preview not found" }, { status: 404 });
  }

  const assetPath = assetParts.join("/");
  const file = readDistFile(assetPath);

  if (!file) {
    return NextResponse.json({ ok: false, error: "Asset not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
