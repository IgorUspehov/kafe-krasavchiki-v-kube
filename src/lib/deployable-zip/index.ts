export {
  buildDeployableZip,
  buildDeployableZipBuffer,
  buildDeployableZipFilename,
  resolveDeployableDistPath,
  resolveProjectRoot,
  assertDistBelongsToClient,
} from "@/lib/deployable-zip/builder";

export { rebuildClientDistFromTemplate } from "@/lib/deployable-zip/rebuild-client-dist";

export { DeployableZipError } from "@/lib/deployable-zip/types";

export { buildDeployableZipReadme } from "@/lib/deployable-zip/readme";

export {
  sanitizeManifestForZip,
  sanitizeStagingDist,
  shouldExcludeBasename,
  findContentSecretReasons,
  collectClientIdMentions,
} from "@/lib/deployable-zip/sanitize";

export type {
  BuildDeployableZipInput,
  DeployableZipBuildResult,
  DeployableZipMode,
  DeployableZipLanguage,
  DeployableZipReadmeContext,
  DeployableZipSecurityReport,
  DeployableZipIsolationReport,
  SecretFinding,
} from "@/lib/deployable-zip/types";
