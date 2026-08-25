import { NextResponse } from "next/server";

import { buildEmbedHtml, resolvePreviewId, readV2Manifest } from "@/lib/client-preview/preview-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const manifest = readV2Manifest();
  const resolvedId = resolvePreviewId(id, manifest);

  if (!resolvedId) {
    return NextResponse.json({ ok: false, error: "Preview not found" }, { status: 404 });
  }

  const html = buildEmbedHtml(resolvedId);
  if (!html) {
    return NextResponse.json({ ok: false, error: "dist/index.html not found" }, { status: 404 });
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
