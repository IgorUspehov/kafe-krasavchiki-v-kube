import { pickReferenceId } from "@/lib/polar/checkout-reference-store";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readMetadataClientId(source: Record<string, unknown> | undefined): string | null {
  if (!source) return null;
  for (const key of ["client_id", "clientId", "reference_id", "referenceId"]) {
    const value = pickString(source[key]);
    if (value) return value;
  }
  return null;
}

function readCustomFieldClientId(order: Record<string, unknown>): string | null {
  const customFieldData = order.customFieldData ?? order.custom_field_data;
  if (!customFieldData || typeof customFieldData !== "object") {
    return null;
  }

  const data = customFieldData as Record<string, unknown>;
  for (const key of ["client_id", "clientId"]) {
    const value = pickString(data[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

/**
 * Resolve tenant clientId from Polar order/checkout payload.
 * Uses explicit client_id and external_customer_id only — never stale reference_id
 * from static checkout links or the ephemeral checkout-reference-store (/tmp).
 */
export function resolveOrderClientId(order: Record<string, unknown>): string | null {
  const metadata = order.metadata as Record<string, unknown> | undefined;
  const checkout = order.checkout as Record<string, unknown> | undefined;
  const checkoutMetadata = checkout?.metadata as Record<string, unknown> | undefined;
  const customer = order.customer as Record<string, unknown> | undefined;
  const customerMetadata = customer?.metadata as Record<string, unknown> | undefined;
  const customerMeta =
    (order.customer_metadata as Record<string, unknown> | undefined) ||
    (order.customerMetadata as Record<string, unknown> | undefined);
  const checkoutCustomerMeta =
    (checkout?.customer_metadata as Record<string, unknown> | undefined) ||
    (checkout?.customerMetadata as Record<string, unknown> | undefined);

  const candidates = [
    metadata?.client_id,
    metadata?.clientId,
    checkoutMetadata?.client_id,
    checkoutMetadata?.clientId,
    checkout?.externalCustomerId,
    checkout?.external_customer_id,
    order.externalCustomerId,
    order.external_customer_id,
    customer?.externalId,
    customer?.external_id,
    customerMetadata?.client_id,
    customerMetadata?.clientId,
    readMetadataClientId(customerMeta),
    readMetadataClientId(checkoutCustomerMeta),
  ];

  for (const value of candidates) {
    const text = pickString(value);
    if (text) return text;
  }

  const fromCustomFields = readCustomFieldClientId(order);
  if (fromCustomFields) {
    return fromCustomFields;
  }

  // Static €199 checkout link sets reference_id per tenant — use only after explicit client_id paths.
  return pickReferenceId(order);
}

export function isPolarCheckoutSucceeded(checkout: Record<string, unknown>): boolean {
  const status = pickString(checkout.status).toLowerCase();
  return (
    status === "succeeded" ||
    status === "confirmed" ||
    status === "complete" ||
    status === "completed" ||
    status === "paid"
  );
}

export function isPolarOrderPaid(order: Record<string, unknown>): boolean {
  const status = pickString(order.status).toLowerCase();
  return status === "paid" || isPolarCheckoutSucceeded(order);
}

export function resolveOrderEmail(order: Record<string, unknown>): string {
  const customer = order.customer as { email?: string } | undefined;
  const fromCustomer = pickString(customer?.email);
  if (fromCustomer) {
    return fromCustomer;
  }

  return pickString(order.customerEmail ?? order.customer_email);
}

export function resolveOrderId(order: Record<string, unknown>): string | undefined {
  const orderId = pickString(order.id);
  return orderId || undefined;
}
