import { NextResponse } from "next/server";

import { verifyMvpProStatusAccess } from "@/lib/mvp-pro/entitlement-store";
import { claimMvpProZipUnlock } from "@/lib/mvp-pro/claim-unlock";

/**
 * Public unlock/status poll for /success after Polar €999 payment.
 * Prefer checkout_id → Polar metadata.client_id over a possibly stale URL clientId.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId")?.trim() ?? "";
  const email = searchParams.get("email")?.trim() ?? "";
  const checkoutId =
    searchParams.get("checkout_id")?.trim() ||
    searchParams.get("checkoutId")?.trim() ||
    "";

  if (!clientId && !checkoutId) {
    return NextResponse.json(
      { error: "clientId or checkout_id is required" },
      { status: 400 },
    );
  }

  if (email && clientId) {
    const access = verifyMvpProStatusAccess({ clientId, email });
    if (access.ok) {
      return NextResponse.json({
        ready: true,
        zipUnlocked: true,
        status: access.entitlement.status,
        downloadToken: access.entitlement.downloadToken,
        paidAt: access.entitlement.paidAt,
        language: access.entitlement.language,
        zipUnlockReason: "entitlement",
        clientId,
        resolvedClientId: clientId,
      });
    }
  }

  const claim = await claimMvpProZipUnlock({ clientId, email, checkoutId });
  if (claim.ready && claim.downloadToken) {
    return NextResponse.json({
      ready: true,
      zipUnlocked: true,
      downloadToken: claim.downloadToken,
      zipUnlockReason: claim.zipUnlockReason,
      clientId: claim.resolvedClientId,
      resolvedClientId: claim.resolvedClientId,
    });
  }

  return NextResponse.json({
    ready: false,
    zipUnlocked: claim.zipUnlocked,
    zipUnlockReason: claim.zipUnlockReason,
    clientId: claim.resolvedClientId || clientId,
    resolvedClientId: claim.resolvedClientId || clientId,
  });
}
