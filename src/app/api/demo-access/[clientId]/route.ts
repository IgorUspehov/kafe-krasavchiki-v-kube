import { NextResponse } from "next/server";

import { resolveDemoAccessHydrated } from "@/lib/cloudflare/demo-access";

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
  const { clientId: raw } = await context.params;
  const clientId = decodeURIComponent(raw || "").trim();

  if (!clientId) {
    return NextResponse.json(
      { error: "clientId required", paid: false },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const access = await resolveDemoAccessHydrated(clientId);
  return NextResponse.json(
    {
      clientId: access.clientId,
      paid: access.paid,
      found: access.found,
      checkoutUrl: access.checkoutUrl,
      crmUrl: access.crmUrl,
      publicSiteUrl: access.publicSiteUrl,
      slug: access.slug,
    },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "no-store",
      },
    },
  );
}
