import type {
  SubscriptionFactorySnapshot,
  SubscriptionReport,
  SubscriptionsConfig,
} from "@/lib/subscription-factory/types";

export const SUBSCRIPTION_FACTORY_BASE = "/artifacts/factory_output/commercial/subscriptions";

export async function fetchSubscriptionFactorySnapshot(): Promise<SubscriptionFactorySnapshot> {
  const [subscriptionsRes, reportRes] = await Promise.all([
    fetch(`${SUBSCRIPTION_FACTORY_BASE}/subscriptions.json`),
    fetch(`${SUBSCRIPTION_FACTORY_BASE}/subscription_report.json`),
  ]);

  const subscriptions = subscriptionsRes.ok
    ? ((await subscriptionsRes.json()) as SubscriptionsConfig)
    : null;
  const report = reportRes.ok ? ((await reportRes.json()) as SubscriptionReport) : null;

  return { subscriptions, report };
}
