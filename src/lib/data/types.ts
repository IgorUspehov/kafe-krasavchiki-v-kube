export const DATA_MODEL_FACTORY_VERSION = "4.5.0";

export type DataReportStatus = "DATA_MODEL_READY" | "PENDING";

export type MvpProjectType =
  | "landing_page"
  | "dashboard_app"
  | "calculator"
  | "crm"
  | "directory"
  | "tool"
  | "generator"
  | "telegram_service"
  | "business_application"
  | "generic_mvp";

export interface DataManifest {
  version: string;
  project_name: string;
  project_type: MvpProjectType | string;
  entities_count: number;
  relations_count: number;
  tables_count: number;
  api_count: number;
  forms_count: number;
}

export interface DataReport {
  status: DataReportStatus;
  entities_count: number;
  relations_count: number;
  api_count: number;
  tables_count: number;
  forms_count: number;
  data_model_complete: boolean;
}

export interface DataArtifactsSnapshot {
  dataManifest: DataManifest | null;
  dataReport: DataReport | null;
  entities: Record<string, { fields: string[] }> | null;
  entityRelations: { relations: Array<Record<string, unknown>> } | null;
  databaseSchema: Record<string, unknown> | null;
  apiEndpoints: Record<string, unknown> | null;
  forms: Record<string, unknown> | null;
  tables: Record<string, unknown> | null;
  dataFlow: Record<string, unknown> | null;
}
