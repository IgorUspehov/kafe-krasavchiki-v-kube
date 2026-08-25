export interface ArtifactDefinition {
  name: string;
  apiKey: string;
  description: string;
}

export const ARTIFACT_DEFINITIONS: ArtifactDefinition[] = [
  {
    name: "PROJECT_TYPE.json",
    apiKey: "projectType",
    description: "POST /detect-project-type",
  },
  {
    name: "BEST_REPOSITORY.json",
    apiKey: "repository",
    description: "POST /rank-repositories",
  },
  {
    name: "BEST_TEMPLATE.json",
    apiKey: "template",
    description: "POST /rank-templates",
  },
  {
    name: "BEST_UI.json",
    apiKey: "ui",
    description: "POST /rank-ui",
  },
  {
    name: "COMPLEXITY.json",
    apiKey: "complexity",
    description: "POST /estimate-complexity",
  },
  {
    name: "COST_ESTIMATE.json",
    apiKey: "cost",
    description: "POST /estimate-cost",
  },
  {
    name: "PACKAGING.json",
    apiKey: "packaging",
    description: "POST /advise-packaging",
  },
  {
    name: "FACTORY_AUDIT.json",
    apiKey: "audit",
    description: "POST /factory-audit",
  },
  {
    name: "FINAL_REPORT.md",
    apiKey: "finalReport",
    description: "GET /status → outputs.FINAL_REPORT.md",
  },
];
