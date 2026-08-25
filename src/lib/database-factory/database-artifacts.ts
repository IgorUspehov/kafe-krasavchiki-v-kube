import type {
  DatabaseArtifactsSnapshot,
  DatabaseModuleManifest,
  DatabaseModuleReport,
} from "@/lib/database-factory/types";

export const DATABASE_ARTIFACT_BASE = "/artifacts/factory_output/database";
export const DATABASE_MODULE_BASE = "/artifacts/database";

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  return res.ok ? ((await res.json()) as T) : null;
}

async function fetchText(url: string): Promise<string | null> {
  const res = await fetch(url);
  return res.ok ? res.text() : null;
}

export async function fetchDatabaseArtifactsSnapshot(): Promise<DatabaseArtifactsSnapshot> {
  const base = DATABASE_ARTIFACT_BASE;
  const [
    databaseManifest,
    databaseReport,
    databaseRelations,
    migrationManifest,
    databaseConfig,
    databaseEnv,
    databasePorts,
    seedData,
    createTablesSql,
    createIndexesSql,
    constraintsSql,
    seedSql,
  ] = await Promise.all([
    fetchJson<DatabaseModuleManifest>(`${base}/database_manifest.json`),
    fetchJson<DatabaseModuleReport>(`${base}/database_report.json`),
    fetchJson<Record<string, unknown>>(`${base}/database_relations.json`),
    fetchJson<Record<string, unknown>>(`${base}/migration_manifest.json`),
    fetchJson<Record<string, unknown>>(`${base}/database_config.json`),
    fetchJson<Record<string, unknown>>(`${base}/database_env.json`),
    fetchJson<Record<string, unknown>>(`${base}/database_ports.json`),
    fetchJson<Record<string, unknown>>(`${base}/seed_data.json`),
    fetchText(`${base}/create_tables.sql`),
    fetchText(`${base}/create_indexes.sql`),
    fetchText(`${base}/constraints.sql`),
    fetchText(`${base}/seed.sql`),
  ]);

  if (databaseManifest && databaseReport) {
    return {
      databaseManifest,
      databaseReport,
      databaseRelations,
      migrationManifest,
      databaseConfig,
      databaseEnv,
      databasePorts,
      seedData,
      createTablesSql,
      createIndexesSql,
      constraintsSql,
      seedSql,
    };
  }

  const mod = DATABASE_MODULE_BASE;
  const [m, r, dr, mm, dc, de, dp, sd, ct, ci, cs, ss] = await Promise.all([
    fetchJson<DatabaseModuleManifest>(`${mod}/database_manifest.json`),
    fetchJson<DatabaseModuleReport>(`${mod}/database_report.json`),
    fetchJson<Record<string, unknown>>(`${mod}/database_relations.json`),
    fetchJson<Record<string, unknown>>(`${mod}/migration_manifest.json`),
    fetchJson<Record<string, unknown>>(`${mod}/database_config.json`),
    fetchJson<Record<string, unknown>>(`${mod}/database_env.json`),
    fetchJson<Record<string, unknown>>(`${mod}/database_ports.json`),
    fetchJson<Record<string, unknown>>(`${mod}/seed_data.json`),
    fetchText(`${mod}/create_tables.sql`),
    fetchText(`${mod}/create_indexes.sql`),
    fetchText(`${mod}/constraints.sql`),
    fetchText(`${mod}/seed.sql`),
  ]);

  return {
    databaseManifest: m,
    databaseReport: r,
    databaseRelations: dr,
    migrationManifest: mm,
    databaseConfig: dc,
    databaseEnv: de,
    databasePorts: dp,
    seedData: sd,
    createTablesSql: ct,
    createIndexesSql: ci,
    constraintsSql: cs,
    seedSql: ss,
  };
}
