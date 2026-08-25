import { getCheckoutReference, saveCheckoutReference } from "@/lib/polar/checkout-reference-store";
import { resolveOrderClientId } from "@/lib/polar/order-context";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Fetch checkout session from Polar API (needs POLAR_ACCESS_TOKEN on Render).
 */
export async function polarFetchCheckout(checkoutId: string): Promise<Record<string, unknown> | null> {
  const id = pickString(checkoutId);
  if (!id) return null;

  const token = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!token) {
    console.warn("[polar] POLAR_ACCESS_TOKEN missing — cannot hydrate checkout", { checkoutId: id });
    return null;
  }

  const response = await fetch(`https://api.polar.sh/v1/checkouts/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.warn("[polar] checkout fetch failed", { checkoutId: id, status: response.status });
    return null;
  }

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function pickPolarCheckoutId(payload: Record<string, unknown>): string | null {
  const checkoutId = pickString(payload.checkoutId) || pickString(payload.checkout_id);
  if (checkoutId) return checkoutId;

  // Checkout session objects (checkout.created/updated) use `id` as session id.
  if (pickString(payload.client_secret) || pickString(payload.clientSecret)) {
    return pickString(payload.id) || null;
  }

  return null;
}

/**
 * Resolve tenant clientId from webhook payload; hydrate checkout from Polar API when metadata is missing on order.
 */
export async function resolvePolarClientId(payload: Record<string, unknown>): Promise<string | null> {
  const direct = resolveOrderClientId(payload);
  if (direct) return direct;

  const checkoutId = pickPolarCheckoutId(payload);
  if (!checkoutId) return null;

  const cached = getCheckoutReference(checkoutId);
  if (cached) return cached;

  const checkout = await polarFetchCheckout(checkoutId);
  if (!checkout) return null;

  const fromCheckout = resolveOrderClientId(checkout);
  if (fromCheckout) {
    saveCheckoutReference(checkoutId, fromCheckout);
    return fromCheckout;
  }

  return null;
}

/**
 * Merge order webhook payload with hydrated checkout for product/metadata resolution.
 */
export async function mergePolarOrderContext(
  order: Record<string, unknown>,
): Promise<{ clientId: string | null; checkout: Record<string, unknown> | null }> {
  const checkoutId = pickPolarCheckoutId(order);
  let checkout: Record<string, unknown> | null = null;

  if (checkoutId) {
    checkout = await polarFetchCheckout(checkoutId);
  }

  const clientId = resolveOrderClientId(order) || (checkout ? resolveOrderClientId(checkout) : null);

  if (clientId && checkoutId) {
    saveCheckoutReference(checkoutId, clientId);
  }

  return { clientId, checkout };
}
