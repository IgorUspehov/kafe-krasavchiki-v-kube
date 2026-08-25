export type SubscriptionPlan = {
  id: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  max_users: number;
  max_projects: number;
  max_storage: string;
  enabled_features: string[];
};

export type SubscriptionsConfig = {
  subscriptions: {
    enabled: boolean;
    plans: SubscriptionPlan[];
    upgrade_paths: string[];
    renewal_models: string[];
  };
};

export type SubscriptionReport = {
  module: string;
  version: string;
  status: string;
  available_plans: number;
  upgrade_paths: string[];
  renewal_models: string[];
  commercial_readiness_score: number;
};

export type SubscriptionFactorySnapshot = {
  subscriptions: SubscriptionsConfig | null;
  report: SubscriptionReport | null;
};
