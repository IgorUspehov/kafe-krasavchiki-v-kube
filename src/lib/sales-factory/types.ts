export type SalesApiResponse = {
  leads: number;
  customers: number;
  mrr: number;
  arr: number;
  revenue: number;
  status: string;
};

export type SalesReport = {
  module: string;
  version: string;
  status: string;
  leads: number;
  customers: number;
  conversion_rate: number;
  mrr: number;
  arr: number;
  revenue: number;
  commercial_readiness_score: number;
};

export type SalesFactorySnapshot = {
  sales: SalesApiResponse | null;
  report: SalesReport | null;
};
