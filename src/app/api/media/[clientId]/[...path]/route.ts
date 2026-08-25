import fs from "fs";

import { NextResponse } from "next/server";

import { resolveClientMediaFile } from "@/lib/admin/media-store";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ clientId: string; path: string[] }> },
) {
  const { clientId, path: segments } = await context.params;
  const filename = (segments || []).join("/");
  try {
    const filePath = resolveClientMediaFile(clientId, filename);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
    const body = fs.readFileSync(filePath);
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
