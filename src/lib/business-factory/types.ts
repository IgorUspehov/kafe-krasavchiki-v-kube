export type BusinessAdminDashboard = {
  version: string;
  module: string;
  idea: string;
  project_name: string;
  ui_stack: string[];
  react_route: string;
  sections: string[];
  overview: {
    clients_count: number;
    projects_count: number;
    revenue: string;
    system_status: string;
    business_ready?: boolean;
  };
  widgets: {
    clients: Array<{ name: string; status: string; email: string }>;
    projects: Array<{ name: string; type: string; status: string }>;
    payments: Array<{ provider: string; amount: string; status: string }>;
    subscription: { active_plan: string; status: string };
    users: Array<{ name: string; email: string; role: string }>;
    artifacts: Array<{ name: string; path: string }>;
    system?: Record<string, boolean>;
  };
  status: string;
  generated_at: string;
};

export type BusinessFactorySnapshot = {
  dashboard: BusinessAdminDashboard | null;
  crm: { pipeline_status?: string; projects?: Array<{ name: string; status: string }> } | null;
  subscription: { active_plan?: string; status?: string } | null;
};
