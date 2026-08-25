import { NextResponse } from "next/server";

import { persistTenantUnpaid } from "@/lib/billing/paid-tenant";
import { findDemoByClientId, markDemoUnpaidByClientId } from "@/lib/cloudflare/demo-registry";
import { resolveDemoAccess } from "@/lib/cloudflare/demo-access";

export const runtime = "nodejs";

/**
 * Re-lock demo paywall (tariff + promo) for a clientId.
 * Use when a demo was falsely unlocked (e.g. paid-email inherit).
 *
 * Auth: header `x-storage-cleanup-secret` or `?secret=` = STORAGE_CLEANUP_SECRET
 * (or DEPLOYABLE_ZIP_TEST_SECRET). Not available without secret in production.
 */
function isAuthorized(request: Request): boolean {
  const secret =
    process.env.STORAGE_CLEANUP_SECRET?.trim() ||
    process.env.DEPLOYABLE_ZIP_TEST_SECRET?.trim() ||
    "";
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header =
    request.headers.get("x-storage-cleanup-secret") ||
    request.headers.get("x-deployable-zip-test-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");
  return header === secret || querySecret === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let clientId = "";
  try {
    const body = (await request.json()) as { clientId?: string };
    clientId = String(body.clientId || "").trim();
  } catch {
    clientId = new URL(request.url).searchParams.get("clientId")?.trim() || "";
  }

  if (!clientId) {
    return NextResponse.json({ ok: false, error: "clientId required" }, { status: 400 });
  }

  markDemoUnpaidByClientId(clientId);
  await persistTenantUnpaid(clientId);
  const demo = findDemoByClientId(clientId);
  const access = resolveDemoAccess(clientId);

  return NextResponse.json({
    ok: true,
    clientId,
    paid: access.paid,
    slug: demo?.slug || access.slug,
    checkoutUrl: access.checkoutUrl,
  });
}
