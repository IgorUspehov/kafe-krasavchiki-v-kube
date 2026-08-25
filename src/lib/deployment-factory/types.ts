export type DeploymentManifest = {
  version: string;
  branch: string;
  idea: string;
  project_name: string;
  project_type: string;
  domain_name: string;
  modules: Record<string, boolean>;
  deployment_ready: boolean;
  generated_at: string;
};

export type ProductionCheck = {
  production_score: number;
  checks: Array<{ check: string; passed: boolean; path: string }>;
  checks_passed: number;
  checks_total: number;
  production_ready: boolean;
};

export type DeploymentSnapshot = {
  manifest: DeploymentManifest | null;
  production: ProductionCheck | null;
  hosting: { selected_target?: string; selection_score?: number } | null;
  domain: { deployment_url?: string; domain_name?: string } | null;
};
