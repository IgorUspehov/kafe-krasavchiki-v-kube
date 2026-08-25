import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

import { resolveScreenshotPath } from "@/lib/client-preview/delivery-artifacts";

type RouteContext = {
  params: Promise<{ name: string }>;
};

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

export async function GET(_request: Request, context: RouteContext) {
  const { name } = await context.params;
  const screenshotPath = resolveScreenshotPath(name);

  if (!screenshotPath) {
    return NextResponse.json({ ok: false, error: "Screenshot not found" }, { status: 404 });
  }

  const file = fs.readFileSync(screenshotPath);
  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": contentTypeFor(screenshotPath),
      "Content-Disposition": `inline; filename="${path.basename(screenshotPath)}"`,
    },
  });
}
