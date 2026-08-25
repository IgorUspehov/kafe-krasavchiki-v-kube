import fs from "fs";
import path from "path";

import { execSync } from "child_process";

import { normalizeCategory } from "@/lib/client-preview/active-artifact-context";

export function canonicalBusinessType(value: string): string {
  return normalizeCategory(value);
}

type ZipBusinessTypeFields = {
  manifestBusinessType?: string;
  packageMetadataBusinessType?: string;
  clientProfileBusinessType?: string;
};

function readZipJsonEntry(zipPath: string, entry: string): Record<string, unknown> | null {
  try {
    const raw = execSync(`unzip -p "${zipPath}" "${entry}"`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readZipBusinessTypeFields(zipPath: string): ZipBusinessTypeFields | null {
  if (!fs.existsSync(zipPath)) {
    return null;
  }

  const manifest = readZipJsonEntry(zipPath, "manifest.json");
  const profile = readZipJsonEntry(zipPath, "client_data/client_profile.json");
  const packageMetadata =
    manifest?.package_metadata && typeof manifest.package_metadata === "object"
      ? (manifest.package_metadata as Record<string, unknown>)
      : null;

  return {
    manifestBusinessType: typeof manifest?.business_type === "string" ? manifest.business_type : undefined,
    packageMetadataBusinessType:
      typeof packageMetadata?.business_type === "string" ? packageMetadata.business_type : undefined,
    clientProfileBusinessType: typeof profile?.business_type === "string" ? profile.business_type : undefined,
  };
}

export function validateZipBusinessTypeConsistency(
  zipPath: string,
  expectedCanonical: string,
): { ok: boolean; mismatches: string[] } {
  const expected = canonicalBusinessType(expectedCanonical);
  const fields = readZipBusinessTypeFields(zipPath);
  const mismatches: string[] = [];

  if (!fields) {
    return { ok: false, mismatches: ["zip business_type fields not readable"] };
  }

  const checks: Array<[string, string | undefined]> = [
    ["manifest.business_type", fields.manifestBusinessType],
    ["package_metadata.business_type", fields.packageMetadataBusinessType],
    ["client_profile.business_type", fields.clientProfileBusinessType],
  ];

  for (const [label, value] of checks) {
    if (!value) {
      mismatches.push(`${label} missing`);
      continue;
    }
    if (canonicalBusinessType(value) !== expected) {
      mismatches.push(`${label}(${value}) != canonical(${expected})`);
    }
    if (value !== expected) {
      mismatches.push(`${label}(${value}) != canonical literal(${expected})`);
    }
  }

  return { ok: mismatches.length === 0, mismatches };
}

export function validateActivePreviewBusinessTypeConsistency(input: {
  activePreviewBusinessType: string;
  zipPath?: string | null;
}): { ok: boolean; mismatches: string[] } {
  const expected = canonicalBusinessType(input.activePreviewBusinessType);
  const mismatches: string[] = [];

  if (input.activePreviewBusinessType !== expected) {
    mismatches.push(
      `active_preview.business_type(${input.activePreviewBusinessType}) != canonical(${expected})`,
    );
  }

  if (input.zipPath) {
    const zipCheck = validateZipBusinessTypeConsistency(input.zipPath, expected);
    mismatches.push(...zipCheck.mismatches);
  }

  return { ok: mismatches.length === 0, mismatches };
}

export function patchJsonCanonicalBusinessType(value: unknown, canonical: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => patchJsonCanonicalBusinessType(entry, canonical));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, nested] of Object.entries(source)) {
      if (key === "business_type" || key === "selected_business_category") {
        result[key] = canonical;
      } else {
        result[key] = patchJsonCanonicalBusinessType(nested, canonical);
      }
    }

    return result;
  }

  return value;
}

function patchJsonFile(filePath: string, canonical: string): void {
  if (!fs.existsSync(filePath) || !filePath.endsWith(".json")) {
    return;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
    const patched = patchJsonCanonicalBusinessType(parsed, canonical) as Record<string, unknown>;

    if (path.basename(filePath) === "manifest.json" && !("business_type" in patched)) {
      patched.business_type = canonical;
    }

    fs.writeFileSync(filePath, `${JSON.stringify(patched, null, 2)}\n`, "utf-8");
  } catch {
    // skip unreadable json
  }
}

function walkJsonFiles(rootDir: string, visitor: (filePath: string) => void): void {
  if (!fs.existsSync(rootDir)) {
    return;
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkJsonFiles(fullPath, visitor);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      visitor(fullPath);
    }
  }
}

export function rebuildZipWithCanonicalBusinessType(input: {
  sourceZip: string;
  destinationZip: string;
  canonicalBusinessType: string;
  readmePath?: string;
}): { ok: boolean; error?: string } {
  const canonical = canonicalBusinessType(input.canonicalBusinessType);
  const stagingDir = path.join(path.dirname(input.destinationZip), "_zip_staging");

  try {
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
    fs.mkdirSync(stagingDir, { recursive: true });

    execSync(`unzip -q "${input.sourceZip}" -d "${stagingDir}"`, { stdio: "pipe" });

    walkJsonFiles(stagingDir, (filePath) => patchJsonFile(filePath, canonical));

    if (input.readmePath && fs.existsSync(input.readmePath)) {
      fs.copyFileSync(input.readmePath, path.join(stagingDir, "README_CLIENT.txt"));
      fs.copyFileSync(input.readmePath, path.join(stagingDir, "README.md"));
      const clientDataReadme = path.join(stagingDir, "client_data", "README_CLIENT.txt");
      if (fs.existsSync(path.dirname(clientDataReadme))) {
        fs.copyFileSync(input.readmePath, clientDataReadme);
      }
    }

    if (fs.existsSync(input.destinationZip)) {
      fs.rmSync(input.destinationZip, { force: true });
    }

    execSync(`cd "${stagingDir}" && zip -qr "${input.destinationZip}" .`, { stdio: "pipe" });

    const validation = validateZipBusinessTypeConsistency(input.destinationZip, canonical);
    if (!validation.ok) {
      return { ok: false, error: validation.mismatches.join("; ") };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "ZIP canonical rebuild failed",
    };
  } finally {
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
  }
}
