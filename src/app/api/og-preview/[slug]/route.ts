import { NextResponse } from "next/server";

import { renderPublicSiteOgJpeg } from "@/lib/site/render-public-site-og-jpeg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const jpeg = await renderPublicSiteOgJpeg(decodeURIComponent(slug || ""));

  return new NextResponse(new Uint8Array(jpeg), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
