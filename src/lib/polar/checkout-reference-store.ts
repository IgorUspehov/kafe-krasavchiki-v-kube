import fs from "fs";
import path from "path";

import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";

const CHECKOUT_REFERENCES_PATH = path.join(resolvePersistentDataDir(), "checkout-references.json");

export type CheckoutReference = {
  checkoutId: string;
  clientId: string;
  savedAt: string;
};

function readCheckoutReferences(): CheckoutReference[] {
  if (!fs.existsSync(CHECKOUT_REFERENCES_PATH)) {
    return [];
  }

  try {
    const raw = JSON.parse(fs.readFileSync(CHECKOUT_REFERENCES_PATH, "utf8")) as CheckoutReference[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeCheckoutReferences(entries: CheckoutReference[]): void {
  fs.mkdirSync(path.dirname(CHECKOUT_REFERENCES_PATH), { recursive: true });
  fs.writeFileSync(CHECKOUT_REFERENCES_PATH, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

export function saveCheckoutReference(checkoutId: string, clientId: string): void {
  const record: CheckoutReference = {
    checkoutId,
    clientId,
    savedAt: new Date().toISOString(),
  };

  const entries = readCheckoutReferences().filter((item) => item.checkoutId !== checkoutId);
  entries.push(record);
  writeCheckoutReferences(entries);
}

export function getCheckoutReference(checkoutId: string): string | null {
  const entry = readCheckoutReferences().find((item) => item.checkoutId === checkoutId);
  return entry?.clientId ?? null;
}

export function pickReferenceId(data: Record<string, unknown>): string | null {
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const checkout = data.checkout as Record<string, unknown> | undefined;
  const checkoutMetadata = checkout?.metadata as Record<string, unknown> | undefined;
  const customer = data.customer as Record<string, unknown> | undefined;
  const customerMetadata = customer?.metadata as Record<string, unknown> | undefined;

  // Prefer explicit client_id + checkout session external id over stale reference_id
  // (static Polar links often carry an old reference_id from a prior demo).
  const candidates = [
    metadata?.client_id,
    metadata?.clientId,
    checkoutMetadata?.client_id,
    checkoutMetadata?.clientId,
    checkout?.externalCustomerId,
    checkout?.external_customer_id,
    data.externalCustomerId,
    data.external_customer_id,
    customer?.externalId,
    customer?.external_id,
    customerMetadata?.client_id,
    customerMetadata?.clientId,
    metadata?.reference_id,
    metadata?.referenceId,
    data.referenceId,
    data.reference_id,
    checkout?.referenceId,
    checkout?.reference_id,
    checkoutMetadata?.reference_id,
    checkoutMetadata?.referenceId,
    customerMetadata?.reference_id,
    customerMetadata?.referenceId,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
