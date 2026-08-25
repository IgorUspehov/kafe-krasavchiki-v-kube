export const DATABASE_FACTORY_VERSION = "4.9.0";

export type DatabaseReportStatus = "DATABASE_READY" | "PENDING";

export interface DatabaseModuleManifest {
  version: string;
  project_name: string;
  database_type: string;
  entities_count: number;
  tables_count: number;
  relations_count: number;
  migrations_count: number;
}

export interface DatabaseModuleReport {
  status: DatabaseReportStatus;
  database_ready: boolean;
  models_count: number;
  tables_count: number;
  relations_count: number;
  migration_count: number;
}

export interface DatabaseArtifactsSnapshot {
  databaseManifest: DatabaseModuleManifest | null;
  databaseReport: DatabaseModuleReport | null;
  databaseRelations: Record<string, unknown> | null;
  migrationManifest: Record<string, unknown> | null;
  databaseConfig: Record<string, unknown> | null;
  databaseEnv: Record<string, unknown> | null;
  databasePorts: Record<string, unknown> | null;
  seedData: Record<string, unknown> | null;
  createTablesSql: string | null;
  createIndexesSql: string | null;
  constraintsSql: string | null;
  seedSql: string | null;
}
