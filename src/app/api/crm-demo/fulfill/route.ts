import { NextRequest, NextResponse } from "next/server";

import { fulfillCrmDemoDeliveryTest, fulfillCrmDemoOrder } from "@/lib/crm-demo/fulfillment";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRM_DEMO_FULFILL_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const header = request.headers.get("x-crm-demo-fulfill-secret");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  return header === secret || querySecret === secret;
}

type FulfillBody = {
  clientId?: string;
  email?: string;
  orderId?: string;
  deliveryTest?: boolean;
};

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: FulfillBody;
  try {
    body = (await request.json()) as FulfillBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const clientId = String(body.clientId ?? "").trim();
  if (!clientId) {
    return NextResponse.json({ ok: false, error: "clientId is required" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : undefined;
  const orderId =
    typeof body.orderId === "string" && body.orderId.trim()
      ? body.orderId.trim()
      : `manual-test-${Date.now()}`;

  console.log("[crm-demo] manual fulfill request", {
    clientId,
    email: email ?? null,
    orderId,
    deliveryTest: Boolean(body.deliveryTest),
  });

  const result = body.deliveryTest
    ? await fulfillCrmDemoDeliveryTest({ clientId, email, orderId })
    : await fulfillCrmDemoOrder({ clientId, email, orderId });

  return NextResponse.json({
    ok: result.emailSent,
    EMAIL_SENT: result.emailSent,
    ...result,
  });
}
