import crypto from "crypto";

import { NextResponse } from "next/server";

import { markDemoPaidByClientId } from "@/lib/cloudflare/demo-registry";
import {
  cancelDeletion,
  findPendingByClientId,
  findPendingBySiteUrl,
} from "@/lib/cloudflare/scheduler";
import { LEMONSQUEEZY_VARIANT_CRM_FULL } from "@/lib/crm-full/constants";
import { fulfillCrmFullOrder } from "@/lib/crm-full/fulfillment";
import { LEMONSQUEEZY_VARIANT_MVP_PRO } from "@/lib/mvp-pro/constants";
import { fulfillMvpProOrder } from "@/lib/mvp-pro/fulfillment";
import { markClientDistPaid } from "@/lib/site-delivery/dist-protection";

function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return digest === signature;
  }
}

function extractCustomData(payload: Record<string, unknown>): Record<string, unknown> {
  const data = payload.data;
  if (!data || typeof data !== "object") {
    return {};
  }

  const attributes = (data as { attributes?: Record<string, unknown> }).attributes;
  if (!attributes || typeof attributes !== "object") {
    return {};
  }

  const custom =
    attributes.custom_data ??
    attributes.checkout_data ??
    (attributes.first_order_item as { custom_data?: Record<string, unknown> } | undefined)
      ?.custom_data;

  return custom && typeof custom === "object" ? (custom as Record<string, unknown>) : {};
}

function extractVariantId(payload: Record<string, unknown>): string | null {
  const meta = payload.meta as Record<string, unknown> | undefined;
  const metaCustom = meta?.custom_data as Record<string, unknown> | undefined;
  if (metaCustom?.variant_id != null) {
    return String(metaCustom.variant_id);
  }

  const data = payload.data as { attributes?: Record<string, unknown> } | undefined;
  const attributes = data?.attributes;
  if (!attributes || typeof attributes !== "object") {
    return null;
  }

  if (attributes.variant_id != null) {
    return String(attributes.variant_id);
  }

  const firstOrderItem = attributes.first_order_item as { variant_id?: number | string } | undefined;
  if (firstOrderItem?.variant_id != null) {
    return String(firstOrderItem.variant_id);
  }

  return null;
}

function extractClientId(custom: Record<string, unknown>): string | null {
  const clientId = custom.client_id ?? custom.clientId;
  return clientId ? String(clientId) : null;
}

function extractCustomerEmail(payload: Record<string, unknown>, custom: Record<string, unknown>): string {
  const data = payload.data as { attributes?: Record<string, unknown> } | undefined;
  const attributes = data?.attributes ?? {};
  const fromAttributes = attributes.user_email ?? attributes.customer_email;
  if (typeof fromAttributes === "string" && fromAttributes.trim()) {
    return fromAttributes.trim();
  }

  const fromCustom = custom.email ?? custom.client_email;
  if (typeof fromCustom === "string" && fromCustom.trim()) {
    return fromCustom.trim();
  }

  return "";
}

function extractOrderId(payload: Record<string, unknown>): string | undefined {
  const data = payload.data as { id?: string | number } | undefined;
  if (data?.id != null) {
    return String(data.id);
  }
  return undefined;
}

function resolveSiteIdFromPayload(custom: Record<string, unknown>): string | null {
  const siteId = custom.site_id ?? custom.siteId;
  if (siteId) {
    return String(siteId);
  }

  const demoUrl = custom.demo_url ?? custom.demoUrl;
  if (demoUrl) {
    return findPendingBySiteUrl(String(demoUrl))?.siteId ?? null;
  }

  const clientId = custom.client_id ?? custom.clientId;
  if (clientId) {
    return findPendingByClientId(String(clientId))?.siteId ?? null;
  }

  return null;
}

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (secret && !verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventName = String((payload.meta as { event_name?: string } | undefined)?.event_name ?? "");
  const paidEvents = new Set(["order_created", "subscription_payment_success"]);

  if (eventName && !paidEvents.has(eventName)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const custom = extractCustomData(payload);
  const variantId = extractVariantId(payload);
  const clientId = extractClientId(custom);
  const customerEmail = extractCustomerEmail(payload, custom);
  const siteId = resolveSiteIdFromPayload(custom);
  let cancelled = false;

  if (siteId) {
    cancelled = cancelDeletion(siteId);
  }
  if (clientId) {
    markDemoPaidByClientId(clientId);
    markClientDistPaid(clientId);
    const pending = findPendingByClientId(clientId);
    if (pending?.siteId && pending.siteId !== siteId) {
      cancelled = cancelDeletion(pending.siteId) || cancelled;
    }
  }

  let mvpProFulfilled = false;
  if (variantId === LEMONSQUEEZY_VARIANT_MVP_PRO && clientId && customerEmail) {
    await fulfillMvpProOrder({
      clientId,
      email: customerEmail,
      orderId: extractOrderId(payload),
      variantId,
    });
    mvpProFulfilled = true;
  }

  let crmFullProvisioned = false;
  if (variantId === LEMONSQUEEZY_VARIANT_CRM_FULL && clientId) {
    await fulfillCrmFullOrder({
      clientId,
      email: customerEmail || undefined,
      orderId: extractOrderId(payload),
      variantId,
    });
    crmFullProvisioned = true;
  }

  return NextResponse.json({
    ok: true,
    cancelled,
    siteId,
    mvpProFulfilled,
    crmFullProvisioned,
    variantId,
    clientId,
  });
}
