import fs from "fs";
import os from "os";
import path from "path";

import { loadAdminManifest } from "@/lib/admin/persist";
import { slugifyProjectSegment } from "@/lib/cloudflare/deploy";
import { resolvePublicAppOrigin } from "@/lib/cloudflare/shared-project";
import {
  packDirectoryToTraditionalZipBuffer,
  type ZipExtraFile,
} from "@/lib/deployable-zip/traditional-zip";
import { buildDeployableZipReadme } from "@/lib/deployable-zip/readme";
import {
  collectClientIdMentions,
  sanitizeManifestForZip,
  sanitizeStagingDist,
} from "@/lib/deployable-zip/sanitize";
import {
  DeployableZipError,
  type BuildDeployableZipInput,
  type DeployableZipBuildResult,
  type DeployableZipIsolationReport,
  type DeployableZipSecurityReport,
} from "@/lib/deployable-zip/types";
import { loadClientManifest } from "@/lib/manifest/storage";
import {
  clientDistExists,
  resolveClientDistPath,
  resolveClientDistsRoot,
} from "@/lib/site-delivery/dist-store";

/** Top-level directories copied into the buyer source ZIP. */
const INCLUDE_DIRS = ["src", "public", "config"] as const;

/** Root config / lockfiles required to install and build. */
const INCLUDE_ROOT_FILES = [
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "next.config.js",
  "next.config.mjs",
  "tsconfig.json",
  ".env.example",
  ".env.local.example",
  ".gitignore",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "components.json",
  "eslint.config.mjs",
  "next-env.d.ts",
  "firebase.json",
  "firestore.rules",
  "netlify.toml",
] as const;

/** Optional buyer-facing script shipped in the ZIP when present on disk. */
const BOOTSTRAP_IMAGE_LIBRARY_REL = "scripts/bootstrap-image-library.mjs";

/** Never copy these directory names anywhere in the tree. */
const EXCLUDED_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  ".cursor",
  ".vercel",
  ".netlify",
  "tmp",
  "out",
  "coverage",
  ".turbo",
  ".cache",
]);

/** Never copy these basenames (real secrets / local env). */
const EXCLUDED_BASENAMES = new Set([
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".DS_Store",
]);

function assertSafeClientId(clientId: string): string {
  const id = String(clientId || "").trim();
  if (!id) {
    throw new DeployableZipError("INVALID_CLIENT_ID", "clientId is required");
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new DeployableZipError("INVALID_CLIENT_ID", "clientId has invalid characters");
  }
  return id;
}

/**
 * Ensure distPath resolves under this client's client-dists folder (data isolation).
 * Kept for callers that still validate static snapshots; the ZIP itself is source-based.
 */
export function assertDistBelongsToClient(clientId: string, distPath: string): string {
  const resolvedDist = path.resolve(distPath);
  const expectedRoot = path.resolve(resolveClientDistPath(clientId));
  const clientRoot = path.resolve(path.join(resolveClientDistsRoot(), clientId));

  if (resolvedDist !== expectedRoot && !resolvedDist.startsWith(`${clientRoot}${path.sep}`)) {
    throw new DeployableZipError(
      "DIST_ISOLATION",
      `distPath must be under client-dists/${clientId}; got ${resolvedDist}`,
    );
  }

  if (!fs.existsSync(path.join(resolvedDist, "index.html"))) {
    throw new DeployableZipError("DIST_MISSING", `index.html not found in ${resolvedDist}`);
  }

  return resolvedDist;
}

export function resolveDeployableDistPath(clientId: string, distPath?: string): string {
  const id = assertSafeClientId(clientId);
  if (distPath?.trim()) {
    return assertDistBelongsToClient(id, distPath.trim());
  }
  if (!clientDistExists(id)) {
    throw new DeployableZipError(
      "DIST_MISSING",
      `No client-dists snapshot for clientId=${id}`,
    );
  }
  return assertDistBelongsToClient(id, resolveClientDistPath(id));
}

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Resolve SaaS project root (package.json + src/). */
export function resolveProjectRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), "..")];
  for (const candidate of candidates) {
    if (
      fs.existsSync(path.join(candidate, "package.json")) &&
      fs.existsSync(path.join(candidate, "src"))
    ) {
      return candidate;
    }
  }
  throw new DeployableZipError(
    "PROJECT_ROOT_MISSING",
    "Cannot locate project root (package.json + src/)",
  );
}

/**
 * ZIP filename from business name, e.g. "Стоматология Ия" → "stomatologiya-iya.zip".
 */
export function buildDeployableZipFilename(
  businessName: string,
  fallbackClientId?: string,
): string {
  const fromName = slugifyProjectSegment(businessName || "");
  const fromId = slugifyProjectSegment(fallbackClientId || "") || "website";
  const slug = (fromName || fromId).slice(0, 80).replace(/-$/, "") || "website";
  return `${slug}.zip`;
}

function resolveReadmeContext(
  input: BuildDeployableZipInput,
  manifest: Record<string, unknown>,
): BuildDeployableZipInput["readme"] {
  const languageRaw = pickString(input.readme?.language) || pickString(manifest.language);
  const language =
    languageRaw === "ru" || languageRaw === "de" || languageRaw === "en" ? languageRaw : "en";

  return {
    businessName:
      input.readme?.businessName ||
      pickString(manifest.businessName) ||
      pickString(manifest.business_name) ||
      "Website + CRM",
    businessType:
      input.readme?.businessType ||
      pickString(manifest.businessType) ||
      pickString(manifest.business_type) ||
      "business",
    language,
    supportNote: input.readme?.supportNote,
  };
}

function shouldSkipDir(name: string): boolean {
  return EXCLUDED_DIR_NAMES.has(name);
}

function shouldSkipFile(basename: string): boolean {
  if (EXCLUDED_BASENAMES.has(basename)) return true;
  // Real env files only — keep *.example templates.
  if (/^\.env(\..+)?$/i.test(basename) && !/\.example$/i.test(basename)) {
    return true;
  }
  return false;
}

function copyDirFiltered(srcDir: string, destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue;
      copyDirFiltered(path.join(srcDir, entry.name), path.join(destDir, entry.name));
      continue;
    }
    if (!entry.isFile()) continue;
    if (shouldSkipFile(entry.name)) continue;
    fs.copyFileSync(path.join(srcDir, entry.name), path.join(destDir, entry.name));
  }
}

function scriptReferencesLocalScriptsDir(command: string): boolean {
  return /(?:^|[\s"'`=])scripts\//.test(command) || command.includes("scripts/");
}

function isBootstrapImageLibraryScript(name: string, command: string): boolean {
  return name.includes("bootstrap-image-library") || command.includes("bootstrap-image-library");
}

/**
 * ZIP package.json: buyer-ready scripts only.
 * Force `build`/`start`/`dev` to plain Next commands — SaaS pipelines
 * (react-mvp, verify:production-assets, image-library) are not shipped.
 * Pin Next to a Vercel-compatible release when the SaaS root drifts ahead.
 */
function sanitizePackageJsonForZip(
  packageJsonRaw: string,
  options: { includeBootstrapImageLibrary: boolean },
): string {
  const pkg = JSON.parse(packageJsonRaw) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    [key: string]: unknown;
  };

  if (pkg.scripts && typeof pkg.scripts === "object" && !Array.isArray(pkg.scripts)) {
    const next: Record<string, string> = {};
    for (const [name, command] of Object.entries(pkg.scripts)) {
      if (typeof command !== "string") continue;

      // Lifecycle scripts are rewritten below — skip SaaS pipeline variants.
      if (name === "build" || name === "build:railway" || name === "build:railway:deploy") {
        continue;
      }
      if (name === "start" || name === "dev") {
        continue;
      }

      if (isBootstrapImageLibraryScript(name, command)) {
        if (options.includeBootstrapImageLibrary) {
          next[name] = command;
        }
        continue;
      }

      // Other scripts/* references are SaaS/factory tooling — not shipped in the buyer ZIP.
      if (scriptReferencesLocalScriptsDir(command)) {
        continue;
      }

      // react-mvp / factory / verify pipelines need directories we do not ship.
      if (
        name.startsWith("react-mvp:") ||
        name.startsWith("verify:") ||
        command.includes("artifacts/") ||
        command.includes("--prefix artifacts")
      ) {
        continue;
      }

      next[name] = command;
    }

    next.dev = "next dev";
    next.build = "next build";
    next.start = "next start";
    pkg.scripts = next;
  }

  // Keep ZIP Next on the same major that Vercel Hobby builds reliably.
  if (pkg.dependencies && typeof pkg.dependencies.next === "string") {
    pkg.dependencies.next = "15.3.3";
  }
  if (pkg.devDependencies && typeof pkg.devDependencies["eslint-config-next"] === "string") {
    pkg.devDependencies["eslint-config-next"] = "15.3.3";
  }

  return `${JSON.stringify(pkg, null, 2)}\n`;
}

function writeSanitizedPackageJson(stagingPath: string, projectRoot: string): void {
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new DeployableZipError("SOURCE_MISSING", "package.json missing at project root");
  }

  const bootstrapSrc = path.join(projectRoot, BOOTSTRAP_IMAGE_LIBRARY_REL);
  const includeBootstrapImageLibrary = fs.existsSync(bootstrapSrc);

  const raw = fs.readFileSync(packageJsonPath, "utf8");
  const sanitized = sanitizePackageJsonForZip(raw, { includeBootstrapImageLibrary });
  fs.writeFileSync(path.join(stagingPath, "package.json"), sanitized, "utf8");

  if (includeBootstrapImageLibrary) {
    const destDir = path.join(stagingPath, "scripts");
    fs.mkdirSync(destDir, { recursive: true });
    const content = fs.readFileSync(bootstrapSrc);
    fs.writeFileSync(path.join(stagingPath, BOOTSTRAP_IMAGE_LIBRARY_REL), content);
  }
}

/**
 * Stage a runnable Next.js source tree (not a static Vite/client-dists bundle).
 */
function writeSourceStaging(projectRoot: string, clientId: string): string {
  const stagingPath = fs.mkdtempSync(path.join(os.tmpdir(), `deployable-zip-${clientId}-`));

  for (const dir of INCLUDE_DIRS) {
    const from = path.join(projectRoot, dir);
    if (!fs.existsSync(from)) {
      throw new DeployableZipError("SOURCE_MISSING", `Required directory missing: ${dir}/`);
    }
    copyDirFiltered(from, path.join(stagingPath, dir));
  }

  for (const file of INCLUDE_ROOT_FILES) {
    // package.json is rewritten (scripts sanitized + optional bootstrap script).
    if (file === "package.json") continue;
    const from = path.join(projectRoot, file);
    if (!fs.existsSync(from)) continue;
    if (shouldSkipFile(path.basename(file))) continue;
    fs.copyFileSync(from, path.join(stagingPath, file));
  }

  writeSanitizedPackageJson(stagingPath, projectRoot);

  // Prefer a single .env.example for buyers (merge local example if richer).
  ensureEnvExample(stagingPath, projectRoot);

  // Netlify: Next.js runtime (not static `out/` publish).
  fs.writeFileSync(
    path.join(stagingPath, "netlify.toml"),
    `[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
`,
    "utf8",
  );

  return stagingPath;
}

const DEPLOYABLE_ZIP_ENV_LINE = "IS_DEPLOYABLE_ZIP=true";

/** Ensure buyer ZIPs always document the stub gate env var. */
function ensureIsDeployableZipEnvLine(envExamplePath: string): void {
  let content = fs.existsSync(envExamplePath)
    ? fs.readFileSync(envExamplePath, "utf8")
    : "";

  if (/^IS_DEPLOYABLE_ZIP=/m.test(content)) {
    content = content.replace(/^IS_DEPLOYABLE_ZIP=.*$/m, DEPLOYABLE_ZIP_ENV_LINE);
  } else {
    content =
      content.trimEnd() +
      (content.trim() ? "\n\n" : "") +
      DEPLOYABLE_ZIP_ENV_LINE +
      "\n";
  }

  fs.writeFileSync(envExamplePath, content, "utf8");
}

function ensureEnvExample(stagingPath: string, projectRoot: string): void {
  const staged = path.join(stagingPath, ".env.example");
  const primary = path.join(projectRoot, ".env.example");
  const secondary = path.join(projectRoot, ".env.local.example");

  if (!fs.existsSync(staged)) {
    if (fs.existsSync(primary)) {
      fs.copyFileSync(primary, staged);
    } else if (fs.existsSync(secondary)) {
      fs.copyFileSync(secondary, staged);
    } else {
      fs.writeFileSync(
        staged,
        `# Copy to .env and fill in your values (never commit .env)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Firebase Admin (optional — CRM features)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Polar (optional — payments)
POLAR_WEBHOOK_SECRET=
POLAR_ACCESS_TOKEN=
`,
        "utf8",
      );
    }
  }

  ensureIsDeployableZipEnvLine(staged);
}

function cleanupStaging(stagingPath: string): void {
  try {
    fs.rmSync(stagingPath, { recursive: true, force: true });
  } catch (error) {
    console.warn("[deployable-zip] failed to cleanup staging", {
      stagingPath,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Deployable ZIP Builder — full Next.js source package for GitHub + Netlify.
 * Does not ship static client-dists bundles (assets/index.js without HTML).
 */
export async function buildDeployableZip(
  input: BuildDeployableZipInput,
): Promise<DeployableZipBuildResult> {
  const clientId = assertSafeClientId(input.clientId);
  const projectRoot = resolveProjectRoot();

  const rawManifest =
    input.manifest && typeof input.manifest === "object"
      ? input.manifest
      : loadClientManifest(clientId) ||
        (await loadAdminManifest(clientId)) ||
        {};

  const {
    manifest: sanitizedManifest,
    findings: manifestFindings,
    strippedKeys,
  } = sanitizeManifestForZip(rawManifest, clientId);

  const saasOrigin = resolvePublicAppOrigin();
  const publicManifest: Record<string, unknown> = {
    ...sanitizedManifest,
    clientId,
    client_id: clientId,
    paid: true,
    deployablePaid: true,
    publicSiteUrl:
      pickString(sanitizedManifest.publicSiteUrl) ||
      `${saasOrigin}/site/${encodeURIComponent(clientId)}`,
    siteUrl:
      pickString(sanitizedManifest.siteUrl) ||
      `${saasOrigin}/site/${encodeURIComponent(clientId)}`,
  };

  const stagingPath = writeSourceStaging(projectRoot, clientId);

  const zipManifest: Record<string, unknown> = {
    ...publicManifest,
    clientId: "",
    client_id: "",
  };

  try {
    fs.writeFileSync(
      path.join(stagingPath, "client-manifest.json"),
      `${JSON.stringify(zipManifest, null, 2)}\n`,
      "utf8",
    );

    const stagingSanitize = sanitizeStagingDist(stagingPath);
    const mentions = collectClientIdMentions(stagingPath, clientId);

    const isolation: DeployableZipIsolationReport = {
      expectedClientId: clientId,
      foreignClientIds: mentions.foreignClientIds,
      manifestClientId: mentions.manifestClientId,
      bakedClientId: mentions.bakedClientId,
      ok: mentions.foreignClientIds.length === 0,
    };

    if (!isolation.ok) {
      console.warn("[deployable-zip] foreign clientId mentions detected in staging", {
        clientId,
        foreignClientIds: isolation.foreignClientIds,
        bakedClientId: isolation.bakedClientId,
        manifestClientId: isolation.manifestClientId,
      });
    }

    const security: DeployableZipSecurityReport = {
      findings: [...manifestFindings, ...stagingSanitize.findings],
      excludedFiles: stagingSanitize.excludedFiles,
      redactedFiles: stagingSanitize.redactedFiles,
      strippedManifestKeys: strippedKeys,
    };

    const readmeContext = resolveReadmeContext(input, publicManifest);
    const readmeContent = buildDeployableZipReadme({
      clientId,
      mode: input.mode,
      context: readmeContext,
      saasOrigin,
    });

    // README always wins over any copied project README.md
    fs.writeFileSync(path.join(stagingPath, "README.md"), readmeContent, "utf8");

    // Required layout checks before packing.
    for (const required of [
      "src",
      "public",
      "package.json",
      "package-lock.json",
      "tsconfig.json",
      ".env.example",
      ".gitignore",
      "README.md",
    ]) {
      if (!fs.existsSync(path.join(stagingPath, required))) {
        throw new DeployableZipError(
          "SOURCE_INCOMPLETE",
          `Staging missing required path: ${required}`,
        );
      }
    }
    const hasNextConfig =
      fs.existsSync(path.join(stagingPath, "next.config.ts")) ||
      fs.existsSync(path.join(stagingPath, "next.config.js")) ||
      fs.existsSync(path.join(stagingPath, "next.config.mjs"));
    if (!hasNextConfig) {
      throw new DeployableZipError("SOURCE_INCOMPLETE", "Staging missing next.config.*");
    }

    const zipExtras: ZipExtraFile[] = [
      {
        name: "README.en.md",
        content: fs.readFileSync(path.join(projectRoot, "README.md"), "utf8"),
      },
      {
        name: "README.de.md",
        content: fs.readFileSync(path.join(projectRoot, "README.de.md"), "utf8"),
      },
      {
        name: "README.ru.md",
        content: fs.readFileSync(path.join(projectRoot, "README.ru.md"), "utf8"),
      },
    ];
    const buffer = packDirectoryToTraditionalZipBuffer(stagingPath, zipExtras);
    const filename = buildDeployableZipFilename(
      pickString(readmeContext?.businessName),
      clientId,
    );

    console.info("[deployable-zip] built source package", {
      clientId,
      mode: input.mode,
      filename,
      bytes: buffer.length,
      securityFindings: security.findings.length,
      isolationOk: isolation.ok,
    });

    return {
      clientId,
      mode: input.mode,
      filename,
      distPath: projectRoot,
      stagingPath: "",
      readmeContent,
      manifestJson: `${JSON.stringify(zipManifest, null, 2)}\n`,
      security,
      isolation,
      buffer,
    };
  } finally {
    cleanupStaging(stagingPath);
  }
}

/** Stream-friendly helper: build buffer then expose metadata without keeping staging. */
export async function buildDeployableZipBuffer(
  input: BuildDeployableZipInput,
): Promise<{ buffer: Buffer; filename: string; result: Omit<DeployableZipBuildResult, "buffer"> }> {
  const result = await buildDeployableZip(input);
  const { buffer, ...meta } = result;
  return { buffer, filename: result.filename, result: meta };
}
