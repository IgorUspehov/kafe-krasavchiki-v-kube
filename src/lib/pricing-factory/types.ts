export type PricingPlan = {
  name: string;
  monthly_price: number;
  annual_price: number;
};

export type PricingConfig = {
  pricing_engine: string;
  plans: PricingPlan[];
  commercial_analysis?: {
    pricing_score: number;
    commercial_readiness: number;
  };
};

export type PricingReport = {
  module: string;
  version: string;
  status: string;
  pricing_engine: string;
  plans_generated: number;
  comparison_matrix: boolean;
  upgrade_rules: boolean;
  commercial_readiness: number;
  pricing_score: number;
};

export type PricingFactorySnapshot = {
  pricing: PricingConfig | null;
  report: PricingReport | null;
};
