export type HealthConfig = {
  health: {
    enabled: boolean;
    frontend: boolean;
    backend: boolean;
    database: boolean;
    api_gateway: boolean;
    queue: boolean;
    storage: boolean;
    overall_health_score: number;
  };
};

export type HealthReport = {
  module: string;
  version: string;
  status: string;
  checked_services: number;
  overall_health_score: number;
  services_total: number;
  services_healthy: number;
  readiness_score: number;
};

export type HealthFactorySnapshot = {
  health: HealthConfig | null;
  report: HealthReport | null;
};
