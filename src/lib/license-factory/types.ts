export type LicenseApiResponse = {
  license_type: string;
  status: string;
  commercial_use: boolean;
  api_access?: boolean;
  deployment?: boolean;
  export_allowed?: boolean;
};

export type LicenseReport = {
  module: string;
  version: string;
  status: string;
  commercial_readiness_score: number;
};

export type LicenseFactorySnapshot = {
  license: LicenseApiResponse | null;
  report: LicenseReport | null;
};
