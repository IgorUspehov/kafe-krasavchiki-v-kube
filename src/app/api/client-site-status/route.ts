import { NextRequest, NextResponse } from "next/server";

import { claimCrmDemoPayment } from "@/lib/polar/claim-crm-demo-payment";

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("clientId")?.trim();
  const checkoutId =
    request.nextUrl.searchParams.get("checkout_id")?.trim() ||
    request.nextUrl.searchParams.get("customer_session_token")?.trim() ||
    "";

  if (!clientId && !checkoutId) {
    return NextResponse.json({ error: "Missing clientId or checkout_id" }, { status: 400 });
  }

  const claim = await claimCrmDemoPayment({
    clientId: clientId || undefined,
    checkoutId: checkoutId || undefined,
  });

  if (claim.ready && claim.siteUrl) {
    return NextResponse.json({
      ready: true,
      siteUrl: claim.siteUrl,
      clientId: claim.clientId,
    });
  }

  return NextResponse.json({
    ready: false,
    clientId: claim.clientId || clientId || undefined,
  });
}
