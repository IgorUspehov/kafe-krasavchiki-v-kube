export const EXECUTION_FACTORY_VERSION = "4.8.0";

export type ExecutionFactoryStatus = "EXECUTION_READY" | "PENDING";

export interface ExecutionModuleManifest {
  version: string;
  project_name: string;
  frontend_enabled: boolean;
  backend_enabled: boolean;
  scripts_generated: number;
  healthchecks_generated: number;
  environment_generated: boolean;
}

export interface ExecutionModuleReport {
  status: ExecutionFactoryStatus;
  execution_ready: boolean;
  scripts_count: number;
  healthchecks_count: number;
  logs_count: number;
  execution_complete: boolean;
}

export interface ExecutionArtifactsSnapshot {
  executionManifest: ExecutionModuleManifest | null;
  executionReport: ExecutionModuleReport | null;
  runReport: Record<string, unknown> | null;
  healthReport: Record<string, unknown> | null;
  startupSequence: Record<string, unknown> | null;
  shutdownSequence: Record<string, unknown> | null;
  executionMatrix: Record<string, unknown> | null;
  installManifest: Record<string, unknown> | null;
  environment: Record<string, unknown> | null;
  ports: Record<string, unknown> | null;
  runScripts: {
    start: string | null;
    stop: string | null;
    status: string | null;
    healthcheck: string | null;
  };
}
