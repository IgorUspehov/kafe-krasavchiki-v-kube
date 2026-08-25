import { markTenantPaid, persistTenantPaid, isClientPaidInStore } from "@/lib/billing/paid-tenant";
import { hydrateDemoRecord } from "@/lib/cloudflare/demo-registry";
import { findPendingByClientId } from "@/lib/cloudflare/scheduler";
import { buildReadableDemoUrl } from "@/lib/cloudflare/shared-project";
import { buildMvpRedirectUrl } from "@/lib/manifest/storage";
import {
  getCheckoutReference,
  pickReferenceId,
  saveCheckoutReference,
} from "@/lib/polar/checkout-reference-store";
import {
  isPolarCheckoutSucceeded,
  resolveOrderClientId,
  resolveOrderEmail,
} from "@/lib/polar/order-context";
import { resolvePolarProductKind } from "@/lib/polar/product-match";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function polarFetchCheckout(checkoutId: string): Promise<Record<string, unknown> | null> {
  const token = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!token) return null;

  const response = await fetch(`https://api.polar.sh/v1/checkouts/${encodeURIComponent(checkoutId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveClientIdFromCheckout(checkout: Record<string, unknown>): string | null {
  return resolveOrderClientId(checkout) || pickReferenceId(checkout);
}

async function loadClientIdFromFirestoreByCheckout(checkoutId: string): Promise<string | null> {
  const id = pickString(checkoutId);
  if (!id) return null;

  try {
    const { getFirestoreDb } = await import("@/lib/firebase/admin");
    const db = getFirestoreDb();

    const byClient = await db.collection("clients").where("polarOrderId", "==", id).limit(1).get();
    if (!byClient.empty) {
      return byClient.docs[0]!.id;
    }

    const byEmail = await db.collection("paidEmails").where("polarOrderId", "==", id).limit(1).get();
    if (!byEmail.empty) {
      const lastClientId = pickString(byEmail.docs[0]!.data()?.lastClientId);
      if (lastClientId) return lastClientId;
    }
  } catch {
    /* ignore */
  }

  return null;
}

export async function resolveClientIdFromCheckoutId(checkoutId: string): Promise<string | null> {
  const id = pickString(checkoutId);
  if (!id) return null;

  const cached = getCheckoutReference(id);
  if (cached) return cached;

  const checkout = await polarFetchCheckout(id);
  if (checkout) {
    const clientId = resolveClientIdFromCheckout(checkout);
    if (clientId) {
      saveCheckoutReference(id, clientId);
      return clientId;
    }
  }

  return loadClientIdFromFirestoreByCheckout(id);
}

async function loadDemoUrlForClient(clientId: string): Promise<string | null> {
  const pending = findPendingByClientId(clientId);
  if (pending?.siteUrl) {
    return buildMvpRedirectUrl(pending.siteUrl, clientId);
  }

  const record = await hydrateDemoRecord({ clientId });
  if (record?.slug) {
    return buildReadableDemoUrl(record.slug, clientId);
  }

  try {
    const { getFirestoreDb } = await import("@/lib/firebase/admin");
    const snap = await getFirestoreDb().collection("clients").doc(clientId).get();
    const demoSlug = pickString(snap.data()?.demoSlug);
    if (demoSlug) {
      return buildReadableDemoUrl(demoSlug, clientId);
    }
  } catch {
    /* ignore */
  }

  return null;
}

function isCrmSubscriptionCheckout(kind: ReturnType<typeof resolvePolarProductKind>["kind"]): boolean {
  return kind === "crm_demo" || kind === "recurring" || kind === "unknown";
}

export type ClaimCrmDemoPaymentResult = {
  ready: boolean;
  clientId?: string;
  siteUrl?: string;
};

/**
 * Resolve Polar checkout → clientId, mark tenant paid, return /demo URL.
 * Used after €199/month success and by the processing-screen poller.
 */
export async function claimCrmDemoPayment(input: {
  checkoutId?: string;
  clientId?: string;
}): Promise<ClaimCrmDemoPaymentResult> {
  let clientId = pickString(input.clientId);

  if (!clientId && input.checkoutId) {
    clientId = (await resolveClientIdFromCheckoutId(input.checkoutId)) || "";
  }

  if (!clientId) {
    return { ready: false };
  }

  let paid = await isClientPaidInStore(clientId);

  if (input.checkoutId) {
    const checkout = await polarFetchCheckout(input.checkoutId);
    if (checkout) {
      const resolvedId = resolveClientIdFromCheckout(checkout);
      if (resolvedId) {
        clientId = resolvedId;
        saveCheckoutReference(input.checkoutId, clientId);
      }

      if (isPolarCheckoutSucceeded(checkout)) {
        const { kind } = resolvePolarProductKind(checkout);
        if (isCrmSubscriptionCheckout(kind)) {
          markTenantPaid(clientId);
          await persistTenantPaid({
            clientId,
            email: resolveOrderEmail(checkout),
            orderId: input.checkoutId,
            source: "checkout_claim",
          });
          paid = true;
        }
      }
    }
  }

  if (!paid) {
    const firestoreClientId = await loadClientIdFromFirestoreByCheckout(input.checkoutId || "");
    if (firestoreClientId) {
      clientId = firestoreClientId;
      paid = await isClientPaidInStore(clientId);
    }
  }

  if (!paid) {
    return { ready: false, clientId: clientId || undefined };
  }

  markTenantPaid(clientId);

  const siteUrl = await loadDemoUrlForClient(clientId);
  if (!siteUrl) {
    return { ready: false, clientId };
  }

  return { ready: true, clientId, siteUrl };
}
