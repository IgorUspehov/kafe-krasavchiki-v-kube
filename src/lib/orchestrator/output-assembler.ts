import type {
  ExecutionReport,
  FactoryManifest,
  FactoryOutputSnapshot,
  FactoryReport,
} from "@/lib/orchestrator/types";

export const FACTORY_OUTPUT_BASE = "/artifacts/factory_output";

export const FACTORY_OUTPUT_PATHS = {
  root: "artifacts/factory_output",
  presentation: "artifacts/factory_output/presentation",
  package: "artifacts/factory_output/package",
  release: "artifacts/factory_output/release",
  github: "artifacts/factory_output/github",
  deploy: "artifacts/factory_output/deploy",
  client: "artifacts/factory_output/client",
  runtime: "artifacts/factory_output/runtime",
  app: "artifacts/factory_output/app",
  appManifest: "artifacts/factory_output/app/app_manifest.json",
  appReport: "artifacts/factory_output/app/app_report.json",
  scaffold: "artifacts/factory_output/scaffold",
  scaffoldManifest: "artifacts/factory_output/scaffold/scaffold_manifest.json",
  scaffoldReport: "artifacts/factory_output/scaffold/scaffold_report.json",
  assembly: "artifacts/factory_output/assembly",
  assemblyManifest: "artifacts/factory_output/assembly/assembly_manifest.json",
  assemblyReport: "artifacts/factory_output/assembly/assembly_report.json",
  assemblyRoutes: "artifacts/factory_output/assembly/routes.json",
  data: "artifacts/factory_output/data",
  dataManifest: "artifacts/factory_output/data/data_manifest.json",
  dataReport: "artifacts/factory_output/data/data_report.json",
  backend: "artifacts/factory_output/backend",
  backendManifest: "artifacts/factory_output/backend/backend_manifest.json",
  backendReport: "artifacts/factory_output/backend/backend_report.json",
  binding: "artifacts/factory_output/binding",
  bindingManifest: "artifacts/factory_output/binding/binding_manifest.json",
  bindingReport: "artifacts/factory_output/binding/binding_report.json",
  execution: "artifacts/factory_output/execution",
  executionManifest: "artifacts/factory_output/execution/execution_manifest.json",
  executionModuleReport: "artifacts/factory_output/execution/execution_report.json",
  database: "artifacts/factory_output/database",
  databaseManifest: "artifacts/factory_output/database/database_manifest.json",
  databaseModuleReport: "artifacts/factory_output/database/database_report.json",
  validation: "artifacts/factory_output/validation",
  validationManifest: "artifacts/factory_output/validation/validation_manifest.json",
  validationReport: "artifacts/factory_output/validation/validation_report.json",
  runtimeScore: "artifacts/factory_output/validation/runtime_score.json",
  runtimeManifest: "artifacts/factory_output/runtime/runtime_manifest.json",
  runtimeReport: "artifacts/factory_output/runtime/runtime_report.json",
  factoryManifest: "artifacts/factory_output/factory_manifest.json",
  factoryReport: "artifacts/factory_output/factory_report.json",
  executionReport: "artifacts/factory_output/execution_report.json",
  readme: "artifacts/factory_output/presentation/README.md",
  demoVideo: "artifacts/factory_output/presentation/demo.mp4",
  releaseBundle: "artifacts/factory_output/release/bundle/project_bundle.zip",
  clientPackage: "artifacts/factory_output/client/client_package.zip",
} as const;

export async function fetchFactoryOutputSnapshot(): Promise<FactoryOutputSnapshot> {
  const [manifestRes, reportRes, executionRes] = await Promise.all([
    fetch(`${FACTORY_OUTPUT_BASE}/factory_manifest.json`),
    fetch(`${FACTORY_OUTPUT_BASE}/factory_report.json`),
    fetch(`${FACTORY_OUTPUT_BASE}/execution_report.json`),
  ]);

  const factoryManifest = manifestRes.ok
    ? ((await manifestRes.json()) as FactoryManifest)
    : null;

  const factoryReport = reportRes.ok
    ? ((await reportRes.json()) as FactoryReport)
    : null;

  const executionReport = executionRes.ok
    ? ((await executionRes.json()) as ExecutionReport)
    : null;

  return {
    factoryManifest,
    factoryReport,
    executionReport,
  };
}
