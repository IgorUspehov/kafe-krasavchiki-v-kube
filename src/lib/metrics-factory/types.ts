export type MetricsConfig = {
  metrics: {
    enabled: boolean;
    requests: boolean;
    users: boolean;
    projects: boolean;
    artifacts: boolean;
    runtime_statistics: boolean;
  };
  tracked_metrics?: Array<{ metric: string; value: number; unit: string }>;
  runtime_statistics?: {
    project_generation_count: number;
    artifact_generation_count: number;
    queue_execution_count: number;
    api_usage_count: number;
    user_activity_count: number;
  };
};

export type MetricsReport = {
  module: string;
  version: string;
  status: string;
  tracked_metrics: number;
  aggregation_enabled: boolean;
  runtime_statistics_enabled: boolean;
  readiness_score: number;
};

export type MetricsFactorySnapshot = {
  metrics: MetricsConfig | null;
  report: MetricsReport | null;
};
