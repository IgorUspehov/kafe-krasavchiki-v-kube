import { Polar } from "@polar-sh/sdk";
import { NextResponse } from "next/server";

import {
  POLAR_CHECKOUT_DEPLOYABLE_ZIP,
  POLAR_PRODUCT_DEPLOYABLE_ZIP,
  isFactoryOwnedCrmFullCheckout,
} from "@/lib/polar/constants";
import { saveCheckoutReference } from "@/lib/polar/checkout-reference-store";

export const runtime = "nodejs";

/**
 * Create a Polar checkout for Deployable ZIP (€999 one-time).
 * Success URL always embeds the questionnaire clientId so webhook + /success stay in sync.
 */
export async function POST(request: Request) {
  let body: { clientId?: string; email?: string; locale?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const clientId = String(body.clientId ?? "").trim();
  const email = String(body.email ?? "").trim();
  const localeRaw = String(body.locale ?? "en").toLowerCase();
  const locale = localeRaw.startsWith("ru")
    ? "ru"
    : localeRaw.startsWith("de")
      ? "de"
      : "en";

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const productId =
    process.env.NEXT_PUBLIC_POLAR_PRODUCT_DEPLOYABLE_ZIP?.trim() ||
    process.env.POLAR_PRODUCT_DEPLOYABLE_ZIP?.trim() ||
    POLAR_PRODUCT_DEPLOYABLE_ZIP;

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://webstudio-muenchen.com";

  // clientId in success URL must match metadata.client_id / externalCustomerId (questionnaire id).
  const successUrl = `${site}/success?clientId=${encodeURIComponent(clientId)}&tier=mvp_pro${
    email ? `&email=${encodeURIComponent(email)}` : ""
  }&lang=${locale}&checkout_id={CHECKOUT_ID}`;

  const token = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (token && productId) {
    try {
      const polar = new Polar({ accessToken: token });
      const checkout = await polar.checkouts.create({
        products: [productId],
        successUrl,
        externalCustomerId: clientId,
        customerEmail: email || undefined,
        metadata: {
          reference_id: clientId,
          client_id: clientId,
          product_kind: "deployable_zip",
        },
      });

      const url = checkout.url;
      const checkoutId = typeof checkout.id === "string" ? checkout.id : "";
      if (!url) {
        return NextResponse.json({ error: "No checkout URL returned" }, { status: 502 });
      }

      if (checkoutId) {
        saveCheckoutReference(checkoutId, clientId);
      }

      console.log("[polar/deployable-zip-checkout] session created", {
        clientId,
        checkoutId: checkoutId || null,
        productId,
        successUrlHasClientId: successUrl.includes(encodeURIComponent(clientId)),
      });

      const out = new URL(url);
      out.searchParams.set("locale", locale);
      out.searchParams.set("reference_id", clientId);

      return NextResponse.json({
        checkout_url: out.toString(),
        product_id: productId,
        checkout_id: checkoutId || null,
        client_id: clientId,
        is_recurring: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Polar checkout failed";
      console.error("[polar/deployable-zip-checkout] API checkout failed — refusing static fallback without matching success URL", {
        clientId,
        productId,
        message,
      });
      // Do not fall through to a static Polar link: its success_url is fixed in the
      // Polar dashboard and often lacks / mismatches questionnaire clientId, which
      // unlocks zip_unlocked for metadata id while /success polls a different id.
      return NextResponse.json(
        {
          error:
            "Deployable ZIP checkout API failed. Check POLAR_ACCESS_TOKEN scopes (checkouts:write) and POLAR_PRODUCT_DEPLOYABLE_ZIP on Render. Static checkout links are disabled for ZIP because success URL clientId must match metadata.client_id.",
          detail: message,
          client_id: clientId,
        },
        { status: 502 },
      );
    }
  }

  const staticCheckout =
    process.env.NEXT_PUBLIC_POLAR_CHECKOUT_DEPLOYABLE_ZIP?.trim() ||
    process.env.POLAR_CHECKOUT_DEPLOYABLE_ZIP?.trim() ||
    POLAR_CHECKOUT_DEPLOYABLE_ZIP;

  if (staticCheckout && !isFactoryOwnedCrmFullCheckout(staticCheckout) && !token) {
    // Only when API token is missing entirely (misconfigured env) — last resort.
    // Success page must rely on checkout_id → metadata.client_id reconciliation.
    const out = new URL(staticCheckout);
    out.searchParams.set("reference_id", clientId);
    out.searchParams.set("metadata[client_id]", clientId);
    out.searchParams.set("metadata[reference_id]", clientId);
    out.searchParams.set("metadata[product_kind]", "deployable_zip");
    if (email) {
      out.searchParams.set("customer_email", email);
      out.searchParams.set("prefilled_email", email);
    }
    out.searchParams.set("locale", locale);
    console.warn("[polar/deployable-zip-checkout] using static link without API token", {
      clientId,
      note: "Ensure Polar link success_url includes checkout_id={CHECKOUT_ID}; /success will resolve clientId from metadata",
    });
    return NextResponse.json({
      checkout_url: out.toString(),
      product_id: productId || null,
      client_id: clientId,
      is_recurring: false,
      static: true,
    });
  }

  return NextResponse.json(
    {
      error:
        "Deployable ZIP Polar checkout is not configured for SaaS. Set POLAR_ACCESS_TOKEN + product id with success URL on webstudio-muenchen.com (do not reuse Factory CRM Full link).",
      client_id: clientId,
    },
    { status: 503 },
  );
}
