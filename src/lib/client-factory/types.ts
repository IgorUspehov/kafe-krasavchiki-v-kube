export type ClientFactoryDashboard = {
  version: string;
  module: string;
  idea: string;
  project_name: string;
  ui_stack: string[];
  react_route: string;
  widgets: {
    projects: Array<{ name: string; type: string; status: string; idea: string }>;
    downloads: Array<{ name: string; path: string; type: string }>;
    invoices: Array<{
      invoice_id: string;
      amount_label: string;
      status: string;
      project: string;
      client: string;
    }>;
    history: Array<{
      project_name: string;
      date: string;
      version: string;
      status: string;
      artifact_paths: string[];
    }>;
    status: {
      current: string;
      progress_percent: number;
      sales_ready: boolean;
      product_ready: boolean;
    };
  };
  status: string;
  generated_at: string;
};

export type ProjectTracking = {
  current_status: string;
  progress_percent: number;
  timeline: Array<{ status: string; completed: boolean; artifact_path: string }>;
};

export type ClientFactorySnapshot = {
  dashboard: ClientFactoryDashboard | null;
  tracking: ProjectTracking | null;
};
