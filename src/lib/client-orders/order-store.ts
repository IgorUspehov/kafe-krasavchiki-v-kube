import fs from "fs";
import path from "path";

import {
  readAcceptanceFromQuestionnaire,
  writeTermsSnapshot,
} from "@/lib/legal/legal-service";
import {
  readCommercialData,
  readProfileCommercialContext,
  type PaymentStatus,
} from "@/lib/payment/payment-service";

export type { PaymentStatus };
export type DeliveryStatus = "PASS" | "FAIL" | "PENDING";

export type OrderRecord = {
  order_id: string;
  business_name: string;
  email: string;
  created_at: string;
  plan: string;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  package_available: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  accepted_at: string | null;
};

const ORDERS_PATH = path.join(process.cwd(), "artifacts/factory_output/client_orders/orders.json");
const METADATA_FIELDS = [
  "order_id",
  "business_name",
  "email",
  "created_at",
  "plan",
  "amount",
  "currency",
  "payment_status",
  "delivery_status",
  "package_available",
  "terms_accepted",
  "privacy_accepted",
  "accepted_at",
] as const;

const PACKAGE_PATH = path.join(process.cwd(), "output/client_delivery/final_package.zip");

function ensureOrdersFile() {
  fs.mkdirSync(path.dirname(ORDERS_PATH), { recursive: true });
  if (!fs.existsSync(ORDERS_PATH)) {
    fs.writeFileSync(ORDERS_PATH, "[]\n", "utf8");
  }
}

export function readOrders(): OrderRecord[] {
  ensureOrdersFile();
  try {
    const data = JSON.parse(fs.readFileSync(ORDERS_PATH, "utf8")) as unknown;
    return Array.isArray(data) ? (data as OrderRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeOrders(orders: OrderRecord[]) {
  ensureOrdersFile();
  const sanitized = orders.map((order) => {
    const record: Record<string, unknown> = {};
    for (const field of METADATA_FIELDS) {
      record[field] = order[field as keyof OrderRecord];
    }
    return record as OrderRecord;
  });
  fs.writeFileSync(ORDERS_PATH, `${JSON.stringify(sanitized, null, 2)}\n`, "utf8");
}

export function nextOrderId(orders: OrderRecord[]): string {
  const maxNumber = orders.reduce((max, order) => {
    const match = order.order_id.match(/^ORD-(\d+)$/);
    if (!match) {
      return max;
    }
    return Math.max(max, Number.parseInt(match[1], 10));
  }, 0);
  return `ORD-${String(maxNumber + 1).padStart(6, "0")}`;
}

export function appendOrderRecord(options: {
  delivery_status: DeliveryStatus;
  package_available: boolean;
  payment_status?: PaymentStatus;
}): OrderRecord {
  const profile = readProfileCommercialContext();
  const commercial = readCommercialData(true);
  const acceptance = readAcceptanceFromQuestionnaire();
  const acceptedAt = acceptance.accepted_at ?? new Date().toISOString();
  const orders = readOrders();
  const order: OrderRecord = {
    order_id: nextOrderId(orders),
    business_name: profile.business_name,
    email: profile.email,
    created_at: new Date().toISOString(),
    plan: commercial.plan,
    amount: commercial.amount,
    currency: commercial.currency,
    payment_status: options.payment_status ?? commercial.payment_status,
    delivery_status: options.delivery_status,
    package_available: options.package_available,
    terms_accepted: acceptance.terms_accepted,
    privacy_accepted: acceptance.privacy_accepted,
    accepted_at: acceptedAt,
  };
  writeOrders([order, ...orders]);
  writeTermsSnapshot({
    order_id: order.order_id,
    language: acceptance.language,
    accepted_at: acceptedAt,
  });
  return order;
}

export function isPackageAvailable(): boolean {
  try {
    return fs.existsSync(PACKAGE_PATH) && fs.statSync(PACKAGE_PATH).size > 0;
  } catch {
    return false;
  }
}
