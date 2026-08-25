export type MonitoringConfig = {
  monitoring: {
    enabled: boolean;
    runtime_monitoring: boolean;
    service_status: boolean;
    alerts_ready: boolean;
    uptime_tracking: boolean;
  };
  monitored_services?: Array<{ service: string; status: string; uptime_percent: number }>;
  alerts?: {
    enabled: boolean;
    alert_channels_ready: boolean;
    incident_escalation_ready: boolean;
  };
};

export type MonitoringReport = {
  module: string;
  version: string;
  status: string;
  monitored_services: number;
  status_levels: string[];
  alerts_ready: boolean;
  uptime_tracking: boolean;
  readiness_score: number;
};

export type MonitoringFactorySnapshot = {
  monitoring: MonitoringConfig | null;
  report: MonitoringReport | null;
};
