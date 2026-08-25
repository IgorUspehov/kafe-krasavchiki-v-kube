export type MvpStructure = {
  version?: string;
  project_name: string;
  frontend: {
    pages: string[];
  };
  backend: {
    modules: string[];
  };
  database: {
    tables: string[];
  };
  deploy: {
    web: boolean;
    pwa: boolean;
    apk: boolean;
  };
  structure_ready: boolean;
  source?: {
    assembly_blueprint?: string;
    repository?: string;
    template?: string;
    ui?: string;
  };
};

export type MvpStructureSnapshot = {
  structure: MvpStructure | null;
};
