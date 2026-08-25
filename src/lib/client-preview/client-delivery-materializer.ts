import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import type { ActiveArtifactAssessment, ArtifactIdentity } from "@/lib/client-preview/active-artifact-context";
import { getLegacyClientDeliveryPaths } from "@/lib/client-preview/active-artifact-context";
import {
  patchJsonCanonicalBusinessType,
  rebuildZipWithCanonicalBusinessType,
  validateZipBusinessTypeConsistency,
} from "@/lib/client-preview/business-type-canonical";
import type { V2Manifest } from "@/lib/client-preview/types";

export const LIVE_DIR = path.join(process.cwd(), "output", "client_delivery_live");
export const LIVE_ZIP = path.join(LIVE_DIR, "final_package.zip");
export const LIVE_README = path.join(LIVE_DIR, "README_CLIENT.txt");
const STAMP_FILE = path.join(LIVE_DIR, ".generation_stamp");

const V2_DIR = path.join(process.cwd(), "artifacts", "factory_output", "client_delivery_v2");
const V2_MANIFEST = path.join(V2_DIR, "manifest.json");
const V2_REACT_MVP = path.join(V2_DIR, "react_mvp");

type Questionnaire = {
  business_name?: string;
  business_type?: string;
  email?: string;
  phone?: string;
  language?: string;
  currency?: string;
  address?: string;
};

function readManifest(): V2Manifest | null {
  if (!fs.existsSync(V2_MANIFEST)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(V2_MANIFEST, "utf-8")) as V2Manifest;
  } catch {
    return null;
  }
}

function readQuestionnaire(): Questionnaire | null {
  const questionnairePath = path.join(process.cwd(), "input/client_onboarding_questionnaire.json");
  if (!fs.existsSync(questionnairePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(questionnairePath, "utf-8")) as Questionnaire;
  } catch {
    return null;
  }
}

function readNetlifyUrl(): string | null {
  const candidate = path.join(process.cwd(), "artifacts/factory_output/netlify_deploy/deployment_url.txt");
  if (!fs.existsSync(candidate)) {
    return null;
  }
  try {
    return fs.readFileSync(candidate, "utf-8").trim() || null;
  } catch {
    return null;
  }
}

export function buildClientReadmeContent(
  identity: ArtifactIdentity,
  extras?: { email?: string; phone?: string; language?: string; generated_at?: string },
): string {
  return [
    `# ${identity.business_name} — Client MVP Package`,
    "",
    `Generated: ${extras?.generated_at ?? new Date().toISOString()}`,
    "",
    "## Client",
    `- Business: ${identity.business_name}`,
    `- Email: ${extras?.email ?? "—"}`,
    `- Phone: ${extras?.phone ?? "—"}`,
    `- Language: ${extras?.language ?? "—"}`,
    `- Business type: ${identity.business_type}`,
    "",
    "## MVP",
    `- Template: ${identity.template_id}`,
    `- Modules: ${identity.modules.length > 0 ? identity.modules.join(", ") : "—"}`,
    "",
    "## Package contents",
    "- manifest.json",
    "- client_data/",
    "- app/client_package/",
    "- demo/",
    "- deploy/",
    "",
  ].join("\n");
}

function copyRecursive(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function removeRecursive(target: string): void {
  if (!fs.existsSync(target)) {
    return;
  }
  fs.rmSync(target, { recursive: true, force: true });
}

function buildStamp(assessment: ActiveArtifactAssessment): string {
  return [
    assessment.preview_id,
    assessment.canonical?.fingerprint ?? "none",
    assessment.canonical?.business_type ?? "none",
    assessment.materialize_source ?? "none",
  ].join("|");
}

function isMaterializationCurrent(stamp: string): boolean {
  if (!fs.existsSync(STAMP_FILE) || !fs.existsSync(LIVE_ZIP) || !fs.existsSync(LIVE_README)) {
    return false;
  }
  try {
    return fs.readFileSync(STAMP_FILE, "utf-8").trim() === stamp;
  } catch {
    return false;
  }
}

function materializeLegacyPackage(assessment: ActiveArtifactAssessment): { ok: boolean; error?: string } {
  const legacy = getLegacyClientDeliveryPaths();
  const canonical = assessment.canonical;
  if (!canonical || !fs.existsSync(legacy.zip)) {
    return { ok: false, error: "Legacy client package not found" };
  }

  const profile = fs.existsSync(legacy.profile)
    ? (JSON.parse(fs.readFileSync(legacy.profile, "utf-8")) as Questionnaire)
    : null;
  const readme = buildClientReadmeContent(canonical, {
    email: profile?.email,
    phone: profile?.phone,
    language: profile?.language,
    generated_at: fs.existsSync(legacy.manifest)
      ? ((JSON.parse(fs.readFileSync(legacy.manifest, "utf-8")) as { created_at?: string }).created_at ??
        undefined)
      : undefined,
  });

  fs.mkdirSync(LIVE_DIR, { recursive: true });
  const readmeStaging = path.join(LIVE_DIR, "README_CLIENT.txt.staging");
  fs.writeFileSync(readmeStaging, readme, "utf-8");

  const rebuilt = rebuildZipWithCanonicalBusinessType({
    sourceZip: legacy.zip,
    destinationZip: LIVE_ZIP,
    canonicalBusinessType: canonical.business_type,
    readmePath: readmeStaging,
  });

  fs.rmSync(readmeStaging, { force: true });

  if (!rebuilt.ok) {
    return { ok: false, error: rebuilt.error ?? "Legacy ZIP canonical rebuild failed" };
  }

  fs.writeFileSync(LIVE_README, readme, "utf-8");

  if (fs.existsSync(legacy.demo)) {
    fs.mkdirSync(path.join(LIVE_DIR, "demo"), { recursive: true });
    fs.copyFileSync(legacy.demo, path.join(LIVE_DIR, "demo", "demo.mp4"));
  }

  fs.writeFileSync(STAMP_FILE, buildStamp(assessment), "utf-8");
  return { ok: true };
}

function materializeV2Package(assessment: ActiveArtifactAssessment): { ok: boolean; error?: string } {
  const manifest = readManifest();
  const canonical = assessment.canonical;
  if (!manifest || !canonical) {
    return { ok: false, error: "V2 manifest not found" };
  }

  const questionnaire = readQuestionnaire();
  const readme = buildClientReadmeContent(canonical, {
    email: manifest.client_contacts?.email ?? questionnaire?.email,
    phone: manifest.client_contacts?.phone ?? questionnaire?.phone,
    language: manifest.language ?? questionnaire?.language,
    generated_at: manifest.generated_at,
  });

  const stagingDir = path.join(LIVE_DIR, "_staging");
  try {
    removeRecursive(stagingDir);
    fs.mkdirSync(stagingDir, { recursive: true });
    fs.writeFileSync(path.join(stagingDir, "README_CLIENT.txt"), readme, "utf-8");
    fs.writeFileSync(path.join(stagingDir, "README.md"), readme, "utf-8");

    const manifestRaw = JSON.parse(fs.readFileSync(V2_MANIFEST, "utf-8")) as Record<string, unknown>;
    const manifestForZip = patchJsonCanonicalBusinessType(manifestRaw, canonical.business_type) as Record<
      string,
      unknown
    >;
    manifestForZip.business_type = canonical.business_type;
    const packageMetadata =
      manifestForZip.package_metadata && typeof manifestForZip.package_metadata === "object"
        ? (manifestForZip.package_metadata as Record<string, unknown>)
        : {};
    packageMetadata.business_type = canonical.business_type;
    manifestForZip.package_metadata = packageMetadata;
    fs.writeFileSync(path.join(stagingDir, "manifest.json"), `${JSON.stringify(manifestForZip, null, 2)}\n`, "utf-8");

    const clientDataDir = path.join(stagingDir, "client_data");
    fs.mkdirSync(clientDataDir, { recursive: true });
    fs.writeFileSync(path.join(clientDataDir, "README_CLIENT.txt"), readme, "utf-8");
    fs.writeFileSync(
      path.join(clientDataDir, "client_profile.json"),
      JSON.stringify(
        {
          business_name: canonical.business_name,
          business_type: canonical.business_type,
          selected_business_category: canonical.business_type,
          template_id: canonical.template_id,
          modules: canonical.modules,
          language: manifest.language ?? questionnaire?.language,
          email: manifest.client_contacts?.email ?? questionnaire?.email,
        },
        null,
        2,
      ),
      "utf-8",
    );

    if (fs.existsSync(V2_REACT_MVP)) {
      copyRecursive(V2_REACT_MVP, path.join(stagingDir, "app", "client_package"));
    }

    const legacyDemo = getLegacyClientDeliveryPaths().demo;
    if (fs.existsSync(legacyDemo)) {
      fs.mkdirSync(path.join(stagingDir, "demo"), { recursive: true });
      fs.copyFileSync(legacyDemo, path.join(stagingDir, "demo", "demo.mp4"));
    }

    const deployDir = path.join(stagingDir, "deploy");
    fs.mkdirSync(deployDir, { recursive: true });
    fs.writeFileSync(
      path.join(deployDir, "deploy_report.json"),
      JSON.stringify(
        {
          netlify_url: readNetlifyUrl(),
          business_name: canonical.business_name,
          business_type: canonical.business_type,
          template_id: canonical.template_id,
          generated_at: manifest.generated_at ?? null,
        },
        null,
        2,
      ),
      "utf-8",
    );

    fs.mkdirSync(LIVE_DIR, { recursive: true });
    removeRecursive(LIVE_ZIP);
    execSync(`cd "${stagingDir}" && zip -qr "${LIVE_ZIP}" .`, { stdio: "pipe" });

    const zipValidation = validateZipBusinessTypeConsistency(LIVE_ZIP, canonical.business_type);
    if (!zipValidation.ok) {
      return { ok: false, error: zipValidation.mismatches.join("; ") };
    }

    fs.writeFileSync(LIVE_README, readme, "utf-8");
    fs.writeFileSync(STAMP_FILE, buildStamp(assessment), "utf-8");
    removeRecursive(stagingDir);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "V2 materialization failed" };
  }
}

export function ensureClientDeliveryMaterialized(
  assessment: ActiveArtifactAssessment,
): { ok: boolean; error?: string } {
  if (!assessment.consistent || !assessment.canonical || !assessment.materialize_source) {
    return { ok: false, error: assessment.sync_warning || "Artifacts are out of sync" };
  }

  const stamp = buildStamp(assessment);
  if (isMaterializationCurrent(stamp)) {
    const zipValidation = validateZipBusinessTypeConsistency(LIVE_ZIP, assessment.canonical.business_type);
    if (zipValidation.ok) {
      return { ok: true };
    }
  }

  if (assessment.materialize_source === "legacy_client_delivery") {
    return materializeLegacyPackage(assessment);
  }

  return materializeV2Package(assessment);
}

export function getLiveClientZipPath(): string | null {
  if (fs.existsSync(LIVE_ZIP) && fs.statSync(LIVE_ZIP).isFile()) {
    return LIVE_ZIP;
  }
  return null;
}

export function getLiveClientReadmePath(): string | null {
  if (fs.existsSync(LIVE_README) && fs.statSync(LIVE_README).isFile()) {
    return LIVE_README;
  }
  return null;
}

export function getLiveDemoPath(): string | null {
  const liveDemo = path.join(LIVE_DIR, "demo", "demo.mp4");
  if (fs.existsSync(liveDemo)) {
    return liveDemo;
  }
  const legacyDemo = getLegacyClientDeliveryPaths().demo;
  return fs.existsSync(legacyDemo) ? legacyDemo : null;
}

export function isClientGithubPackageReady(manifest: V2Manifest | null): boolean {
  if (!manifest) {
    return false;
  }
  const packageReadme = path.join(
    process.cwd(),
    "artifacts/factory_output/github_delivery/github_delivery_package/README.md",
  );
  const manifestPath = path.join(process.cwd(), "artifacts/factory_output/github_delivery/github_delivery_manifest.json");
  if (!fs.existsSync(packageReadme) || !fs.existsSync(manifestPath)) {
    return false;
  }
  try {
    const githubManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as {
      status?: string;
      business_type?: string;
    };
    if (githubManifest.status !== "PASS") {
      return false;
    }
    const currentType = manifest.business_type ?? "";
    return !currentType || githubManifest.business_type === currentType;
  } catch {
    return false;
  }
}
