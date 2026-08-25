export type CommercialApiResponse = {
  status: string;
  commercial_readiness_score: number;
  modules_completed: number;
  modules_total: number;
  billing_status: string;
  subscription_status: string;
  pricing_status: string;
  license_status: string;
  customer_status: string;
  sales_status: string;
  revenue_models_count: number;
  pricing_plans_count: number;
  customers_count: number;
  active_customers: number;
  conversion_rate: number;
  mrr: number;
  arr: number;
};

export type CommercialReport = CommercialApiResponse & {
  module: string;
  version: string;
};

export type CommercialFactorySnapshot = {
  commercial: CommercialApiResponse | null;
  report: CommercialReport | null;
};
