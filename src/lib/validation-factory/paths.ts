export const VALIDATION_PATHS = {
  root: "artifacts/factory_output/validation",
  manifest: "artifacts/factory_output/validation/validation_manifest.json",
  report: "artifacts/factory_output/validation/validation_report.json",
  runtimeScore: "artifacts/factory_output/validation/runtime_score.json",
  buildValidation: "artifacts/factory_output/validation/build_validation.json",
  frontendValidation: "artifacts/factory_output/validation/frontend_validation.json",
  backendValidation: "artifacts/factory_output/validation/backend_validation.json",
  databaseValidation: "artifacts/factory_output/validation/database_validation.json",
  apiValidation: "artifacts/factory_output/validation/api_validation.json",
  healthValidation: "artifacts/factory_output/validation/health_validation.json",
} as const;
