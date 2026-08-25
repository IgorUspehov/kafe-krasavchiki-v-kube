export type MvpPackage = {
  status: string;
  project_type: string;
  repository: string;
  template: string;
  ui: string;
  pages: string[];
  api: string[];
  database: string[];
  package_ready: boolean;
};

export type MvpPackageSnapshot = {
  package: MvpPackage | null;
};
