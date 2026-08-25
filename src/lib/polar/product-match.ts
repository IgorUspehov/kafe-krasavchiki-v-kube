import {
  POLAR_PRODUCT_CRM_DEMO,
  POLAR_PRODUCT_CRM_FULL,
  POLAR_PRODUCT_DEPLOYABLE_ZIP,
  POLAR_PRODUCT_RECURRING,
} from "@/lib/polar/constants";

export type PolarProductKind =
  | "crm_demo"
  | "crm_full"
  | "recurring"
  | "deployable_zip"
  | "unknown";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readMetadataProductKind(order: Record<string, unknown>): PolarProductKind | null {
  const metadata = order.metadata as Record<string, unknown> | undefined;
  const checkout = order.checkout as Record<string, unknown> | undefined;
  const checkoutMetadata = checkout?.metadata as Record<string, unknown> | undefined;
  const candidates = [metadata?.product_kind, checkoutMetadata?.product_kind];

  for (const value of candidates) {
    const text = pickString(value).toLowerCase();
    if (text === "deployable_zip" || text === "mvp_pro") {
      return "deployable_zip";
    }
    if (text === "crm_full") {
      return "crm_full";
    }
    if (text === "crm_demo") {
      return "crm_demo";
    }
  }

  return null;
}

function matchesDeployableZipName(nameLower: string): boolean {
  if (!nameLower) return false;
  if (nameLower.includes("deployable") && nameLower.includes("zip")) return true;
  if (nameLower.includes("mvp pro")) return true;
  if (nameLower.includes("website export")) return true;
  if (nameLower.includes("site export") && nameLower.includes("999")) return true;
  if (nameLower.includes("999") && nameLower.includes("zip")) return true;
  return false;
}

export function resolvePolarProductKind(order: Record<string, unknown>): {
  kind: PolarProductKind;
  productId: string;
  productName: string;
} {
  const product = order.product as { id?: string; name?: string } | undefined;
  const productId = pickString(order.productId ?? order.product_id ?? product?.id);
  const productName = pickString(product?.name);
  const nameLower = productName.toLowerCase();

  const metadataKind = readMetadataProductKind(order);
  if (metadataKind === "deployable_zip") {
    return { kind: "deployable_zip", productId, productName };
  }
  if (metadataKind === "crm_full") {
    return { kind: "crm_full", productId, productName };
  }
  if (metadataKind === "crm_demo") {
    return { kind: "crm_demo", productId, productName };
  }

  if (POLAR_PRODUCT_DEPLOYABLE_ZIP && productId === POLAR_PRODUCT_DEPLOYABLE_ZIP) {
    // Same id as CRM Full by default → treat as ZIP unlock
    return { kind: "crm_full", productId, productName };
  }
  if (productId === POLAR_PRODUCT_CRM_DEMO) {
    return { kind: "crm_demo", productId, productName };
  }
  if (productId === POLAR_PRODUCT_CRM_FULL) {
    return { kind: "crm_full", productId, productName };
  }
  if (productId === POLAR_PRODUCT_RECURRING) {
    return { kind: "recurring", productId, productName };
  }

  if (matchesDeployableZipName(nameLower)) {
    return { kind: "deployable_zip", productId, productName };
  }
  if (
    nameLower.includes("crm demo") ||
    nameLower === "crm demo monthly" ||
    (nameLower.includes("crm") && nameLower.includes("demo") && nameLower.includes("month")) ||
    (nameLower.includes("web studio") && nameLower.includes("199")) ||
    (nameLower.includes("website") && nameLower.includes("199"))
  ) {
    return { kind: "crm_demo", productId, productName };
  }
  if (nameLower.includes("crm full")) {
    return { kind: "crm_full", productId, productName };
  }
  if (productName === "Recurring" || nameLower.includes("recurring")) {
    return { kind: "recurring", productId, productName };
  }

  return { kind: "unknown", productId, productName };
}

/** True for Deployable ZIP / CRM Full (€999) / matching Polar product ids. */
export function shouldUnlockDeployableZip(kind: PolarProductKind, productId: string): boolean {
  if (kind === "deployable_zip" || kind === "crm_full" || kind === "recurring") {
    return true;
  }
  if (POLAR_PRODUCT_DEPLOYABLE_ZIP && productId === POLAR_PRODUCT_DEPLOYABLE_ZIP) {
    return true;
  }
  if (productId === POLAR_PRODUCT_CRM_FULL) {
    return true;
  }
  return false;
}

/** €999 one-time Deployable ZIP list price in cents (Polar fixed price). */
export function isDeployableZipAmountCents(payload: Record<string, unknown>): boolean {
  const candidates = [
    payload.amount,
    payload.total_amount,
    payload.totalAmount,
    payload.net_amount,
    payload.netAmount,
    payload.price_amount,
    payload.priceAmount,
  ];

  for (const value of candidates) {
    const amount = typeof value === "number" ? value : Number(value);
    if (amount === 99900) return true;
  }

  const product = payload.product as { price?: { amount?: number } } | undefined;
  if (product?.price?.amount === 99900) return true;

  return false;
}

export function shouldUnlockDeployableZipFromPayload(payload: Record<string, unknown>): boolean {
  const { kind, productId } = resolvePolarProductKind(payload);
  return shouldUnlockDeployableZip(kind, productId) || isDeployableZipAmountCents(payload);
}
