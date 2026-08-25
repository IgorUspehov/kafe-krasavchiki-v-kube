import type {
  CustomerApiResponse,
  CustomerFactorySnapshot,
  CustomerReport,
} from "@/lib/customer-factory/types";

export async function fetchCustomerFactorySnapshot(): Promise<CustomerFactorySnapshot> {
  const res = await fetch("/api/customer");
  if (!res.ok) {
    return { customer: null, report: null };
  }

  const customer = (await res.json()) as CustomerApiResponse;
  const active = customer.status === "ACTIVE";
  const report: CustomerReport = {
    module: "CUSTOMER_FACTORY",
    version: "I5.0",
    status: active ? "CUSTOMER_READY" : "CUSTOMER_PENDING",
    customers_total: customer.customers_total,
    active_customers: customer.active_customers,
    trial_customers: customer.trial_customers,
    plans_count: 4,
    commercial_readiness_score: active ? 100 : 0,
  };

  return { customer, report };
}
