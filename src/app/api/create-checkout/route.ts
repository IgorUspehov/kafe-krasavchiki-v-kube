import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { NextResponse } from "next/server";

let lemonSqueezyConfigured = false;

function ensureLemonSqueezyConfigured() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY is not configured");
  }

  if (!lemonSqueezyConfigured) {
    lemonSqueezySetup({ apiKey });
    lemonSqueezyConfigured = true;
  }
}

type CheckoutBody = {
  client_email?: string;
  client_name?: string;
  demo_url?: string;
  site_id?: string;
  client_id?: string;
};

export async function POST(request: Request) {
  try {
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

    if (!storeId || !variantId) {
      return NextResponse.json(
        { error: "LemonSqueezy store or variant is not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as CheckoutBody;
    const clientEmail = String(body.client_email ?? "").trim();
    const clientName = String(body.client_name ?? "").trim();
    const demoUrl = String(body.demo_url ?? "").trim();
    const siteId = String(body.site_id ?? "").trim();
    const clientId = String(body.client_id ?? "").trim();

    if (!clientEmail || !clientName || !demoUrl) {
      return NextResponse.json(
        { error: "client_email, client_name and demo_url are required" },
        { status: 400 },
      );
    }

    ensureLemonSqueezyConfigured();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://webstudio-muenchen.com";

    const result = await createCheckout(storeId, variantId, {
      productOptions: {
        name: "Сайт + CRM + Бронирование — постоянный сайт",
        description: "Ваш демо-сайт остаётся навсегда. Разовый платёж без подписки.",
        redirectUrl: `${siteUrl}/success`,
      },
      checkoutData: {
        email: clientEmail,
        name: clientName,
        custom: {
          demo_url: demoUrl,
          ...(siteId ? { site_id: siteId } : {}),
          ...(clientId ? { client_id: clientId } : {}),
        },
      },
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const checkoutUrl = result.data?.data?.attributes?.url;
    if (!checkoutUrl) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ checkout_url: checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
