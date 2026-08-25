export const BACKEND_PATHS = {
  root: "artifacts/factory_output/backend",
  manifest: "artifacts/factory_output/backend/backend_manifest.json",
  report: "artifacts/factory_output/backend/backend_report.json",
  databaseModels: "artifacts/factory_output/backend/database_models.json",
  schemaDefinitions: "artifacts/factory_output/backend/schema_definitions.json",
  crudEndpoints: "artifacts/factory_output/backend/crud_endpoints.json",
  serviceLayer: "artifacts/factory_output/backend/service_layer.json",
  controllerLayer: "artifacts/factory_output/backend/controller_layer.json",
  backendRoutes: "artifacts/factory_output/backend/backend_routes.json",
  authStructure: "artifacts/factory_output/backend/auth_structure.json",
  openapiStructure: "artifacts/factory_output/backend/openapi_structure.json",
} as const;
