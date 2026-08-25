export type UsersRuntime = {
  users: {
    multi_user: boolean;
    ownership: boolean;
    profile?: boolean;
    roles: string[];
    status_tracking?: boolean;
  };
  user_records?: Array<{ id: string; role: string; status: string }>;
  ownership_chain?: string[];
};

export type TenantsConfig = {
  tenants: {
    enabled: boolean;
    workspace_isolation: boolean;
    tenant_isolation: boolean;
    ownership_model: boolean;
    multiple_workspaces?: boolean;
  };
  tenant_records?: Array<{
    id: string;
    workspaces: Array<{ id: string; name: string }>;
  }>;
};

export type MultiUserReport = {
  module: string;
  version: string;
  status: string;
  users_supported: boolean;
  tenants_supported: boolean;
  workspace_support: boolean;
  ownership_model: boolean;
  readiness_score: number;
};

export type MultiUserFactorySnapshot = {
  usersRuntime: UsersRuntime | null;
  tenants: TenantsConfig | null;
  report: MultiUserReport | null;
};
