export type BillingConfig = {
  billing: {
    enabled: boolean;
    invoices: boolean;
    billing_cycles: boolean;
    usage_billing: boolean;
    recurring_billing: boolean;
  };
  billing_cycles?: {
    default_cycle: string;
    supported: string[];
  };
};

export type BillingReport = {
  module: string;
  version: string;
  status: string;
  invoices_enabled: boolean;
  billing_cycles_enabled: boolean;
  usage_billing_enabled: boolean;
  recurring_billing_enabled: boolean;
  readiness_score: number;
};

export type BillingFactorySnapshot = {
  billing: BillingConfig | null;
  report: BillingReport | null;
};
