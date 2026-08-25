export type CustomerApiResponse = {
  customers_total: number;
  active_customers: number;
  trial_customers: number;
  status: string;
  plans_count?: number;
  commercial_readiness_score?: number;
};

export type CustomerReport = {
  module: string;
  version: string;
  status: string;
  customers_total: number;
  active_customers: number;
  trial_customers: number;
  plans_count: number;
  commercial_readiness_score: number;
};

export type CustomerFactorySnapshot = {
  customer: CustomerApiResponse | null;
  report: CustomerReport | null;
};
