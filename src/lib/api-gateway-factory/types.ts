export type ApiGatewayConfig = {
  gateway: {
    enabled: boolean;
    entry_point?: string;
    authentication: boolean;
    versioning: boolean;
    rate_limiting: boolean;
    service_discovery: boolean;
  };
  middleware?: {
    jwt_validation: boolean;
    session_validation: boolean;
    role_validation: boolean;
    tenant_validation: boolean;
  };
  versioning?: {
    current: string;
    supported: string[];
    v2_ready: boolean;
  };
  rate_limiting?: {
    enabled: boolean;
    per_user: boolean;
    per_tenant: boolean;
    per_api_key: boolean;
  };
};

export type ApiRoutesConfig = {
  routes: string[];
  route_registry?: Array<{ path: string; target: string; version: string }>;
};

export type ApiGatewayReport = {
  module: string;
  version: string;
  status: string;
  routes_count: number;
  middleware_enabled: boolean;
  versioning_enabled: boolean;
  rate_limiting_enabled: boolean;
  readiness_score: number;
};

export type ApiGatewayFactorySnapshot = {
  gateway: ApiGatewayConfig | null;
  routes: ApiRoutesConfig | null;
  report: ApiGatewayReport | null;
};
