import { NextRequest, NextResponse } from "next/server";

import { claimCrmDemoPayment } from "@/lib/polar/claim-crm-demo-payment";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const checkoutId =
    request.nextUrl.searchParams.get("checkout_id")?.trim() ||
    request.nextUrl.searchParams.get("customer_session_token")?.trim() ||
    "";
  const clientId =
    request.nextUrl.searchParams.get("clientId")?.trim() ||
    request.nextUrl.searchParams.get("client_id")?.trim() ||
    "";

  if (!checkoutId && !clientId) {
    return NextResponse.json({ ready: false, error: "checkout_id or clientId required" }, { status: 400 });
  }

  const result = await claimCrmDemoPayment({ checkoutId: checkoutId || undefined, clientId: clientId || undefined });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
