export type AssemblyBlueprint = {
  version?: string;
  project_type: string;
  repository: string;
  template: string;
  ui: string;
  layout: string;
  pages: string[];
  components: string[];
  backend: {
    framework: string;
  };
  database: {
    type: string;
  };
  assembly_ready: boolean;
  source?: string;
};

export type AssemblyBlueprintSnapshot = {
  blueprint: AssemblyBlueprint | null;
};
