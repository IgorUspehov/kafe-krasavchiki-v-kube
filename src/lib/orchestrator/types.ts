export const FACTORY_ORCHESTRATOR_VERSION = "5.0.0";

export const FACTORY_OUTPUT_ROOT = "artifacts/factory_output";

export const FACTORY_MODULES = [
  "presentation",
  "package",
  "release",
  "github",
  "deploy",
  "client",
  "runtime",
  "app",
  "scaffold",
  "assembly",
  "data",
  "backend",
  "binding",
  "execution",
  "database",
  "validation",
] as const;

export type FactoryModule = (typeof FACTORY_MODULES)[number];

export type ModuleReadyStatus = "READY" | "PENDING";
export type FactoryStatus = "FACTORY_READY" | "PENDING";
export type ExecutionStatus = "SUCCESS" | "PENDING";

export interface FactoryManifest {
  version: string;
  presentation: boolean;
  package: boolean;
  release: boolean;
  github: boolean;
  deploy: boolean;
  client: boolean;
  runtime: boolean;
  app: boolean;
  scaffold: boolean;
  assembly: boolean;
  data: boolean;
  backend: boolean;
  binding: boolean;
  execution: boolean;
  database: boolean;
  validation: boolean;
  factory_ready: boolean;
}

export interface FactoryReport {
  status: FactoryStatus;
  presentation: ModuleReadyStatus;
  package: ModuleReadyStatus;
  release: ModuleReadyStatus;
  github: ModuleReadyStatus;
  deploy: ModuleReadyStatus;
  client: ModuleReadyStatus;
  runtime: ModuleReadyStatus;
  app: ModuleReadyStatus;
  scaffold: ModuleReadyStatus;
  assembly: ModuleReadyStatus;
  data: ModuleReadyStatus;
  backend: ModuleReadyStatus;
  binding: ModuleReadyStatus;
  execution: ModuleReadyStatus;
  database: ModuleReadyStatus;
  validation: ModuleReadyStatus;
}

export interface ExecutionReport {
  generated_at: string;
  modules_executed: number;
  status: ExecutionStatus;
  core_modified: boolean;
}

export interface ModuleAvailability {
  presentation: boolean;
  package: boolean;
  release: boolean;
  github: boolean;
  deploy: boolean;
  client: boolean;
  runtime: boolean;
  app: boolean;
  scaffold: boolean;
  assembly: boolean;
  data: boolean;
  backend: boolean;
  binding: boolean;
  execution: boolean;
  database: boolean;
  validation: boolean;
}

export interface FactoryOutputBundle {
  factoryManifest: FactoryManifest;
  factoryReport: FactoryReport;
  executionReport: ExecutionReport;
}

export interface FactoryOutputSnapshot {
  factoryManifest: FactoryManifest | null;
  factoryReport: FactoryReport | null;
  executionReport: ExecutionReport | null;
}
