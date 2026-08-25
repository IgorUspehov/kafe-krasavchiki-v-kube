export type DeployableZipMode =
  | "owner"
  | "subscription_export"
  | "marketplace"
  | "internal_test";

export type DeployableZipLanguage = "en" | "de" | "ru";

export type DeployableZipReadmeContext = {
  businessName?: string;
  businessType?: string;
  language?: DeployableZipLanguage;
  supportNote?: string;
};

export type BuildDeployableZipInput = {
  clientId: string;
  /** Defaults to `client-dists/{clientId}/dist`. */
  distPath?: string;
  mode: DeployableZipMode;
  /** Raw or public manifest; secrets are stripped before packing. */
  manifest?: Record<string, unknown> | null;
  readme?: DeployableZipReadmeContext;
};

export type SecretFinding = {
  path: string;
  reason: string;
  action: "excluded" | "redacted" | "stripped_key";
};

export type DeployableZipSecurityReport = {
  findings: SecretFinding[];
  excludedFiles: string[];
  redactedFiles: string[];
  strippedManifestKeys: string[];
};

export type DeployableZipIsolationReport = {
  expectedClientId: string;
  foreignClientIds: string[];
  manifestClientId?: string;
  bakedClientId?: string;
  ok: boolean;
};

export type DeployableZipBuildResult = {
  clientId: string;
  mode: DeployableZipMode;
  filename: string;
  distPath: string;
  stagingPath: string;
  readmeContent: string;
  manifestJson: string;
  security: DeployableZipSecurityReport;
  isolation: DeployableZipIsolationReport;
  buffer: Buffer;
};

export class DeployableZipError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DeployableZipError";
    this.code = code;
  }
}
