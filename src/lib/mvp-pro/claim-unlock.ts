import { markTenantPaid, persistTenantPaid, persistZipUnlocked } from "@/lib/billing/paid-tenant";
import { loadClientManifest } from "@/lib/manifest/storage";
import { ensureMvpProEntitlement } from "@/lib/mvp-pro/entitlement-store";
import { fulfillMvpProOrder } from "@/lib/mvp-pro/fulfillment";
import { polarFetchCheckout, resolvePolarClientId } from "@/lib/polar/hydrate-checkout";
import { resolveZipUnlock } from "@/lib/mvp-pro/zip-access";
import {
  isPolarCheckoutSucceeded,
  isPolarOrderPaid,
  resolveOrderClientId,
  resolveOrderEmail,
} from "@/lib/polar/order-context";
import { getCheckoutReference, saveCheckoutReference } from "@/lib/polar/checkout-reference-store";
import {
  resolvePolarProductKind,
  shouldUnlockDeployableZipFromPayload,
} from "@/lib/polar/product-match";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isUsableCheckoutId(value: string): boolean {
  const id = pickString(value);
  if (!id) return false;
  if (id.includes("{") || id.includes("}")) return false;
  if (id.toUpperCase() === "CHECKOUT_ID") return false;
  return true;
}

function resolveManifestEmail(clientId: string): string {
  const manifest = loadClientManifest(clientId);
  return (
    pickString(manifest?.email) ||
    pickString(manifest?.contactEmail) ||
    pickString(manifest?.ownerEmail) ||
    ""
  );
}

async function polarFetch(path: string): Promise<Record<string, unknown> | null> {
  const token = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!token) return null;
  const response = await fetch(`https://api.polar.sh/v1${path}`, {
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

function listPolarItems(payload: Record<string, unknown> | null): Record<string, unknown>[] {
  if (!payload) return [];
  if (Array.isArray(payload.items)) {
    return payload.items as Record<string, unknown>[];
  }
  if (Array.isArray(payload.data)) {
    return payload.data as Record<string, unknown>[];
  }
  return [];
}

export type ClaimMvpProZipResult = {
  ready: boolean;
  zipUnlocked: boolean;
  downloadToken?: string;
  zipUnlockReason?: string;
  /** Canonical tenant id from Polar metadata / webhook — may differ from success URL. */
  resolvedClientId: string;
};

async function unlockPaidClient(input: {
  clientId: string;
  email?: string;
  orderId?: string;
  variantId: string;
}): Promise<boolean> {
  const email = pickString(input.email) || resolveManifestEmail(input.clientId) || "buyer@unknown.local";
  markTenantPaid(input.clientId);
  await persistTenantPaid({
    clientId: input.clientId,
    email,
    orderId: input.orderId,
    source: "success_claim",
  });
  await persistZipUnlocked({
    clientId: input.clientId,
    email,
    orderId: input.orderId,
    source: "success_claim",
  });
  await fulfillMvpProOrder({
    clientId: input.clientId,
    email,
    orderId: input.orderId,
    variantId: input.variantId,
  });
  return true;
}

async function unlockFromPolarPayload(payload: Record<string, unknown>): Promise<string | null> {
  const clientId = resolveOrderClientId(payload) || (await resolvePolarClientId(payload));
  if (!clientId) return null;

  const succeeded = isPolarCheckoutSucceeded(payload) || isPolarOrderPaid(payload);
  if (!succeeded) return null;
  if (!shouldUnlockDeployableZipFromPayload(payload)) return null;

  const { kind } = resolvePolarProductKind(payload);
  const orderId =
    pickString(payload.id) ||
    pickString(payload.checkoutId) ||
    pickString(payload.checkout_id) ||
    undefined;

  if (orderId && isUsableCheckoutId(orderId)) {
    saveCheckoutReference(orderId, clientId);
  }

  await unlockPaidClient({
    clientId,
    email: resolveOrderEmail(payload),
    orderId,
    variantId:
      kind === "deployable_zip"
        ? "polar_deployable_zip"
        : kind === "recurring"
          ? "polar_recurring"
          : "polar_crm_full",
  });

  return clientId;
}

/**
 * Resolve the questionnaire clientId that Polar checkout was created with.
 * Prefer checkout metadata over a possibly-stale success URL clientId.
 */
async function resolveCanonicalClientId(input: {
  clientId?: string;
  checkoutId?: string;
}): Promise<string> {
  const urlClientId = pickString(input.clientId);
  const checkoutId = pickString(input.checkoutId);

  if (isUsableCheckoutId(checkoutId)) {
    const cached = getCheckoutReference(checkoutId);
    if (cached) {
      if (urlClientId && cached !== urlClientId) {
        console.warn("[mvp-pro] success URL clientId differs from checkout reference — using Polar id", {
          urlClientId,
          polarClientId: cached,
          checkoutId,
        });
      }
      return cached;
    }

    const checkout = await polarFetchCheckout(checkoutId);
    if (checkout) {
      const fromCheckout = resolveOrderClientId(checkout) || (await resolvePolarClientId(checkout));
      if (fromCheckout) {
        saveCheckoutReference(checkoutId, fromCheckout);
        if (urlClientId && fromCheckout !== urlClientId) {
          console.warn("[mvp-pro] success URL clientId differs from checkout metadata — using Polar id", {
            urlClientId,
            polarClientId: fromCheckout,
            checkoutId,
            metadata: checkout.metadata ?? null,
            externalCustomerId: checkout.externalCustomerId ?? checkout.external_customer_id ?? null,
          });
        }
        return fromCheckout;
      }
    }
  }

  return urlClientId;
}

async function tryClaimFromPolar(input: {
  clientId: string;
  checkoutId?: string;
}): Promise<string | null> {
  const checkoutId = pickString(input.checkoutId);
  if (isUsableCheckoutId(checkoutId)) {
    const checkout = await polarFetchCheckout(checkoutId);
    if (checkout) {
      const unlocked = await unlockFromPolarPayload(checkout);
      if (unlocked) return unlocked;
    }
  }

  const listed = await polarFetch(
    `/checkouts?external_customer_id=${encodeURIComponent(input.clientId)}&limit=10`,
  );
  let checkoutItems = listPolarItems(listed);

  if (checkoutItems.length === 0) {
    const recent = await polarFetch("/checkouts?limit=25");
    checkoutItems = listPolarItems(recent).filter((item) => {
      const resolved = resolveOrderClientId(item);
      return !resolved || resolved === input.clientId;
    });
  }

  for (const checkout of checkoutItems) {
    const resolved = resolveOrderClientId(checkout);
    if (resolved && resolved !== input.clientId) continue;
    const unlocked = await unlockFromPolarPayload(checkout);
    if (unlocked) return unlocked;
  }

  const ordersListed = await polarFetch("/orders?limit=25");
  for (const order of listPolarItems(ordersListed)) {
    const resolved = resolveOrderClientId(order);
    if (resolved && resolved !== input.clientId) continue;
    const unlocked = await unlockFromPolarPayload(order);
    if (unlocked) return unlocked;
  }

  return null;
}

async function grantEntitlementFromUnlock(clientId: string, email?: string): Promise<boolean> {
  const entitlement = await ensureMvpProEntitlement(clientId);
  if (entitlement?.downloadToken) return true;

  const resolvedEmail = pickString(email) || resolveManifestEmail(clientId) || "buyer@unknown.local";
  await fulfillMvpProOrder({
    clientId,
    email: resolvedEmail,
    variantId: "polar_deployable_zip",
  });

  const refreshed = await ensureMvpProEntitlement(clientId);
  return Boolean(refreshed?.downloadToken);
}

export async function claimMvpProZipUnlock(input: {
  clientId: string;
  email?: string;
  checkoutId?: string;
}): Promise<ClaimMvpProZipResult> {
  const canonicalClientId = await resolveCanonicalClientId({
    clientId: input.clientId,
    checkoutId: input.checkoutId,
  });

  if (!canonicalClientId) {
    return { ready: false, zipUnlocked: false, resolvedClientId: "" };
  }

  let entitlement = await ensureMvpProEntitlement(canonicalClientId);
  if (entitlement?.downloadToken) {
    return {
      ready: true,
      zipUnlocked: true,
      downloadToken: entitlement.downloadToken,
      zipUnlockReason: "entitlement",
      resolvedClientId: canonicalClientId,
    };
  }

  const zipAccess = await resolveZipUnlock(canonicalClientId);
  if (zipAccess.allowed) {
    if (await grantEntitlementFromUnlock(canonicalClientId, input.email)) {
      entitlement = await ensureMvpProEntitlement(canonicalClientId);
      if (entitlement?.downloadToken) {
        return {
          ready: true,
          zipUnlocked: true,
          downloadToken: entitlement.downloadToken,
          zipUnlockReason: zipAccess.reason,
          resolvedClientId: canonicalClientId,
        };
      }
    }
  }

  const claimedId = await tryClaimFromPolar({
    clientId: canonicalClientId,
    checkoutId: pickString(input.checkoutId) || undefined,
  });
  const effectiveId = claimedId || canonicalClientId;
  if (claimedId) {
    entitlement = await ensureMvpProEntitlement(effectiveId);
    if (entitlement?.downloadToken) {
      return {
        ready: true,
        zipUnlocked: true,
        downloadToken: entitlement.downloadToken,
        zipUnlockReason: "success_claim",
        resolvedClientId: effectiveId,
      };
    }
  }

  return {
    ready: false,
    zipUnlocked: zipAccess.allowed,
    zipUnlockReason: zipAccess.reason,
    resolvedClientId: effectiveId,
  };
}
