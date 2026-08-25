import fs from "fs";
import path from "path";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "FREE";

export type PricingPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
};

export type CommercialData = {
  plan_id: string;
  plan: string;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
};

const CATALOG_PATH = path.join(process.cwd(), "config/pricing_catalog.json");
const QUESTIONNAIRE_PATH = path.join(process.cwd(), "input/client_onboarding_questionnaire.json");
const ORDERS_PATH = path.join(process.cwd(), "artifacts/factory_output/client_orders/orders.json");
const PROFILE_PATHS = [
  "output/client_delivery/client_profile.json",
  "artifacts/factory_output/client_data/client_profile.json",
  "input/client_onboarding_questionnaire.json",
];

const DEFAULT_PLAN_ID = "professional";

function readJson(pathValue: string): Record<string, unknown> | null {
  if (!fs.existsSync(pathValue)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(pathValue, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readProfile(): Record<string, unknown> {
  for (const rel of PROFILE_PATHS) {
    const data = readJson(path.join(process.cwd(), rel));
    if (data) {
      return data;
    }
  }
  return {};
}

export function loadPricingCatalog(): { plans: PricingPlan[] } {
  const data = readJson(CATALOG_PATH);
  const plans = Array.isArray(data?.plans) ? (data?.plans as PricingPlan[]) : [];
  return { plans };
}

export function resolvePlanById(planId: string): PricingPlan | null {
  const { plans } = loadPricingCatalog();
  return plans.find((plan) => plan.id === planId) ?? null;
}

export function resolveQuestionnairePaymentStatus(plan: PricingPlan): PaymentStatus {
  if (plan.price <= 0 || plan.id === "free") {
    return "FREE";
  }
  return "PENDING";
}

export function resolveOrderPaymentStatus(plan: PricingPlan): PaymentStatus {
  if (plan.price <= 0 || plan.id === "free") {
    return "FREE";
  }
  return "PAID";
}

export function buildCommercialData(
  planId: string,
  currencyOverride?: string,
  forOrder = false,
): CommercialData {
  const plan = resolvePlanById(planId) ?? resolvePlanById(DEFAULT_PLAN_ID);
  if (!plan) {
    return {
      plan_id: DEFAULT_PLAN_ID,
      plan: "Professional",
      amount: 99,
      currency: currencyOverride ?? "EUR",
      payment_status: forOrder ? "PAID" : "PENDING",
    };
  }
  const currency = String(currencyOverride ?? plan.currency ?? "EUR").trim().toUpperCase() || "EUR";
  return {
    plan_id: plan.id,
    plan: plan.name,
    amount: plan.price,
    currency,
    payment_status: forOrder ? resolveOrderPaymentStatus(plan) : resolveQuestionnairePaymentStatus(plan),
  };
}

export function readCommercialData(forOrder = false): CommercialData {
  const questionnaire = readJson(QUESTIONNAIRE_PATH) ?? {};
  const planId = String(questionnaire.plan_id ?? DEFAULT_PLAN_ID).trim() || DEFAULT_PLAN_ID;
  const currency = String(questionnaire.currency ?? "EUR").trim().toUpperCase() || "EUR";
  return buildCommercialData(planId, currency, forOrder);
}

export function readLatestOrderCommercialData(): CommercialData | null {
  if (!fs.existsSync(ORDERS_PATH)) {
    return null;
  }
  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_PATH, "utf8")) as unknown;
    if (!Array.isArray(orders) || orders.length === 0) {
      return null;
    }
    const latest = orders[0] as Record<string, unknown>;
    return {
      plan_id: String(latest.plan_id ?? latest.plan ?? "professional").toLowerCase(),
      plan: String(latest.plan ?? "Professional"),
      amount: Number(latest.amount ?? 0),
      currency: String(latest.currency ?? "EUR"),
      payment_status: String(latest.payment_status ?? "PENDING") as PaymentStatus,
    };
  } catch {
    return null;
  }
}

export function readPaymentStatusResponse(): CommercialData {
  const fromOrder = readLatestOrderCommercialData();
  if (fromOrder) {
    return fromOrder;
  }
  return readCommercialData(false);
}

export function readProfileCommercialContext() {
  const profile = readProfile();
  const commercial = readCommercialData(false);
  return {
    business_name: String(profile.business_name ?? "Unknown Business").trim() || "Unknown Business",
    email: String(profile.email ?? "unknown@example.com").trim() || "unknown@example.com",
    ...commercial,
  };
}
