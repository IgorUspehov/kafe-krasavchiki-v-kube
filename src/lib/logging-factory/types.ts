export type LoggingConfig = {
  logging: {
    enabled: boolean;
    application_logs: boolean;
    error_logs: boolean;
    audit_logs: boolean;
    retention_policy: boolean;
  };
  log_sources?: Array<{ source: string; enabled: boolean }>;
  retention_policy?: {
    enabled: boolean;
    retention_days: number;
  };
};

export type LogsReport = {
  module: string;
  version: string;
  status: string;
  log_sources: number;
  log_levels: string[];
  audit_logs_enabled: boolean;
  retention_policy_enabled: boolean;
  readiness_score: number;
};

export type LoggingFactorySnapshot = {
  logging: LoggingConfig | null;
  report: LogsReport | null;
};
