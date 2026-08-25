import { NextRequest, NextResponse } from "next/server";

import { claimCrmDemoPayment, resolveClientIdFromCheckoutId } from "@/lib/polar/claim-crm-demo-payment";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://webstudio-muenchen.com";

const CACHE_LOOKUP_RETRIES = 6;
const CACHE_LOOKUP_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveClientIdWithRetry(checkoutId: string): Promise<string | null> {
  for (let attempt = 0; attempt < CACHE_LOOKUP_RETRIES; attempt++) {
    const clientId = await resolveClientIdFromCheckoutId(checkoutId);
    if (clientId) {
      return clientId;
    }

    if (attempt < CACHE_LOOKUP_RETRIES - 1) {
      await sleep(CACHE_LOOKUP_DELAY_MS);
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const checkoutId = request.nextUrl.searchParams.get("checkout_id");

  if (!checkoutId) {
    return NextResponse.redirect(new URL("/client", SITE_URL));
  }

  const clientId = await resolveClientIdWithRetry(checkoutId);

  if (!clientId) {
    console.warn("[checkout-lookup] no clientId for checkout", { checkoutId });
    return NextResponse.redirect(
      new URL(`/client?payment=processing&checkout_id=${encodeURIComponent(checkoutId)}`, SITE_URL),
    );
  }

  const claim = await claimCrmDemoPayment({ checkoutId, clientId });

  if (claim.ready && claim.siteUrl) {
    return NextResponse.redirect(claim.siteUrl);
  }

  const processingUrl = new URL("/client", SITE_URL);
  processingUrl.searchParams.set("payment", "processing");
  processingUrl.searchParams.set("clientId", clientId);
  processingUrl.searchParams.set("checkout_id", checkoutId);
  return NextResponse.redirect(processingUrl);
}
