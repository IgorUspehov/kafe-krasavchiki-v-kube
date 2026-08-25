export type AuthConfig = {
  version: string;
  module: string;
  project_name: string;
  authentication: {
    login: boolean;
    logout: boolean;
    session_management: boolean;
    jwt: boolean;
    refresh_tokens: boolean;
    password_reset: boolean;
    email_verification: boolean;
    role_mapping: boolean;
  };
  roles: string[];
  generated_at: string;
};

export type AuthReport = {
  module: string;
  version: string;
  status: string;
  generated_files: string[];
  supported_features: string[];
  supported_roles: string[];
  readiness_score: number;
};

export type AuthFactorySnapshot = {
  config: AuthConfig | null;
  report: AuthReport | null;
};
