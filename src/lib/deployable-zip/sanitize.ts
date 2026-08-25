import fs from "fs";
import path from "path";

import { stripLeadsSecrets } from "@/lib/leads/read-secret";

import type { SecretFinding } from "@/lib/deployable-zip/types";

const SECRET_MANIFEST_KEYS = new Set([
  "leadsReadSecret",
  "leads_read_secret",
  "firebasePrivateKey",
  "firebase_private_key",
  "privateKey",
  "private_key",
  "apiKey",
  "api_key",
  "accessToken",
  "access_token",
  "polarAccessToken",
  "polar_access_token",
  "refreshToken",
  "refresh_token",
  "webhookSecret",
  "webhook_secret",
  "clientSecret",
  "client_secret",
  "password",
  "secret",
  "token",
  "credentials",
  "serviceAccount",
  "service_account",
]);

function isSecretManifestKey(key: string): boolean {
  if (SECRET_MANIFEST_KEYS.has(key)) return true;
  return /secret|password|private[_-]?key|credential|(^|_)token$|access[_-]?token|api[_-]?key/i.test(
    key,
  );
}

const EXCLUDED_BASENAME_PATTERNS: RegExp[] = [
  /^\.env(\..+)?$/i,
  /^\.env\.local$/i,
  /credentials/i,
  /service[-_]?account/i,
  /\.pem$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /^id_rsa$/i,
  /^id_ed25519$/i,
  /\.key$/i,
  /^secrets?\.json$/i,
  /^firebase-adminsdk/i,
];

const CONTENT_SECRET_PATTERNS: Array<{ reason: string; pattern: RegExp }> = [
  { reason: "private_key_block", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { reason: "firebase_private_key", pattern: /FIREBASE_PRIVATE_KEY\s*=/i },
  { reason: "polar_secret", pattern: /POLAR_(?:WEBHOOK_SECRET|ACCESS_TOKEN)\s*=/ },
  { reason: "resend_api_key", pattern: /RESEND_API_KEY\s*=/ },
  { reason: "cloudflare_token", pattern: /CLOUDFLARE_API_TOKEN\s*=/ },
  { reason: "railway_secret", pattern: /RAILWAY_(?:TOKEN|API)/i },
  { reason: "redis_url_creds", pattern: /redis(?:s)?:\/\/[^/\s]+:[^/\s]+@/i },
  { reason: "postgres_url_creds", pattern: /postgres(?:ql)?:\/\/[^/\s]+:[^/\s]+@/i },
  { reason: "mongodb_url_creds", pattern: /mongodb(?:\+srv)?:\/\/[^/\s]+:[^/\s]+@/i },
  { reason: "google_service_account", pattern: /"type"\s*:\s*"service_account"/ },
  { reason: "leads_read_secret_field", pattern: /"leadsReadSecret"\s*:/ },
  { reason: "leads_read_secret_snake", pattern: /"leads_read_secret"\s*:/ },
  {
    reason: "url_with_embedded_credentials",
    pattern: /https?:\/\/[^/\s:@]+:[^/\s:@]+@[^/\s]+/i,
  },
];

const TEXT_EXTENSIONS = new Set([
  ".html",
  ".htm",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".json",
  ".txt",
  ".md",
  ".map",
  ".svg",
  ".xml",
  ".yml",
  ".yaml",
  ".toml",
  ".env",
  ".headers",
]);

export function shouldExcludeBasename(basename: string): string | null {
  // Keep template env files for buyers; strip real secrets only.
  if (/\.example$/i.test(basename) && /^\.env/i.test(basename)) {
    return null;
  }
  for (const pattern of EXCLUDED_BASENAME_PATTERNS) {
    if (pattern.test(basename)) {
      return `excluded_basename:${basename}`;
    }
  }
  return null;
}

export function findContentSecretReasons(content: string): string[] {
  const reasons: string[] = [];
  for (const entry of CONTENT_SECRET_PATTERNS) {
    if (entry.pattern.test(content)) {
      reasons.push(entry.reason);
    }
  }
  return reasons;
}

function isProbablyTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  const base = path.basename(filePath);
  return base === "_headers" || base.startsWith(".env");
}

function redactSecretContent(content: string): string {
  let next = content;
  next = next.replace(/-----BEGIN [\s\S]*?-----END [\s\S]*?-----/g, "[REDACTED_PRIVATE_KEY]");
  next = next.replace(/"leadsReadSecret"\s*:\s*"[^"]*"/g, '"leadsReadSecret":"[REDACTED]"');
  next = next.replace(/"leads_read_secret"\s*:\s*"[^"]*"/g, '"leads_read_secret":"[REDACTED]"');
  next = next.replace(
    /(FIREBASE_PRIVATE_KEY|POLAR_WEBHOOK_SECRET|POLAR_ACCESS_TOKEN|RESEND_API_KEY|CLOUDFLARE_API_TOKEN)\s*=\s*.*/gi,
    "$1=[REDACTED]",
  );
  next = next.replace(/https?:\/\/[^/\s:@]+:[^/\s:@]+@[^/\s]+/gi, "[REDACTED_URL_WITH_CREDENTIALS]");
  next = next.replace(/redis(?:s)?:\/\/[^/\s]+/gi, "[REDACTED_REDIS_URL]");
  next = next.replace(/postgres(?:ql)?:\/\/[^/\s]+/gi, "[REDACTED_DB_URL]");
  next = next.replace(/mongodb(?:\+srv)?:\/\/[^/\s]+/gi, "[REDACTED_DB_URL]");
  return next;
}

function stripSecretKeysFromObject(
  value: unknown,
  findings: SecretFinding[],
  pathPrefix: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      stripSecretKeysFromObject(item, findings, `${pathPrefix}[${index}]`),
    );
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(record)) {
    if (isSecretManifestKey(key)) {
      findings.push({
        path: `${pathPrefix}.${key}`,
        reason: `manifest_secret_key:${key}`,
        action: "stripped_key",
      });
      continue;
    }
    next[key] = stripSecretKeysFromObject(child, findings, `${pathPrefix}.${key}`);
  }
  return next;
}

/** Public manifest safe for ZIP root / client-manifest.json. */
export function sanitizeManifestForZip(
  manifest: Record<string, unknown> | null | undefined,
  clientId: string,
): { manifest: Record<string, unknown>; findings: SecretFinding[]; strippedKeys: string[] } {
  const findings: SecretFinding[] = [];
  const source = { ...(manifest ?? {}) };
  for (const key of ["leadsReadSecret", "leads_read_secret"] as const) {
    if (key in source) {
      findings.push({
        path: `manifest.${key}`,
        reason: `manifest_secret_key:${key}`,
        action: "stripped_key",
      });
    }
  }
  const base = stripLeadsSecrets(source);
  const cleaned = stripSecretKeysFromObject(base, findings, "manifest") as Record<string, unknown>;

  const id = String(clientId || "").trim();
  if (id) {
    cleaned.clientId = id;
    if (!cleaned.client_id) {
      cleaned.client_id = id;
    }
  }

  const strippedKeys = [
    ...new Set(
      findings
        .filter((f) => f.action === "stripped_key")
        .map((f) => f.path.replace(/^manifest\./, "")),
    ),
  ];

  return { manifest: cleaned, findings, strippedKeys };
}

export type SanitizeStagingResult = {
  findings: SecretFinding[];
  excludedFiles: string[];
  redactedFiles: string[];
};

/**
 * Walk a staging dist tree: exclude secret filenames, redact text that looks like credentials.
 */
export function sanitizeStagingDist(stagingDir: string): SanitizeStagingResult {
  const findings: SecretFinding[] = [];
  const excludedFiles: string[] = [];
  const redactedFiles: string[] = [];

  const walk = (dir: string, relativeBase = ""): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.posix.join(relativeBase, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath, relativePath);
        continue;
      }

      const excludeReason = shouldExcludeBasename(entry.name);
      if (excludeReason) {
        fs.rmSync(fullPath, { force: true });
        excludedFiles.push(relativePath);
        findings.push({ path: relativePath, reason: excludeReason, action: "excluded" });
        console.warn("[deployable-zip] excluded secret-like file from ZIP", {
          path: relativePath,
          reason: excludeReason,
        });
        continue;
      }

      // Keep .env.example placeholders (KEY=) readable for buyers.
      if (/\.example$/i.test(entry.name)) {
        continue;
      }

      if (!isProbablyTextFile(fullPath)) {
        continue;
      }

      let content: string;
      try {
        content = fs.readFileSync(fullPath, "utf8");
      } catch {
        continue;
      }

      const reasons = findContentSecretReasons(content);
      if (reasons.length === 0) {
        continue;
      }

      const redacted = redactSecretContent(content);
      fs.writeFileSync(fullPath, redacted, "utf8");
      redactedFiles.push(relativePath);
      for (const reason of reasons) {
        findings.push({ path: relativePath, reason, action: "redacted" });
      }
      console.warn("[deployable-zip] redacted secret-like content in ZIP staging", {
        path: relativePath,
        reasons,
      });
    }
  };

  walk(stagingDir);
  return { findings, excludedFiles, redactedFiles };
}

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

/**
 * Isolation gate focuses on personalization surfaces (baked bootstrap + client-manifest).
 * Full-tree UUID scans would false-positive on shared demo seed content inside assets/.
 */
export function collectClientIdMentions(stagingDir: string, expectedClientId: string): {
  foreignClientIds: string[];
  bakedClientId?: string;
  manifestClientId?: string;
} {
  const expected = expectedClientId.trim().toLowerCase();
  const foreign = new Set<string>();
  let bakedClientId: string | undefined;
  let manifestClientId: string | undefined;

  const indexPath = path.join(stagingDir, "index.html");
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, "utf8");
    const bakedMatch = html.match(/__CRM_DEMO_CLIENT_ID__\s*=\s*["']([^"']+)["']/);
    if (bakedMatch?.[1]) {
      bakedClientId = bakedMatch[1].trim();
      if (bakedClientId.toLowerCase() !== expected) {
        foreign.add(bakedClientId.toLowerCase());
      }
      for (const match of html.matchAll(UUID_RE)) {
        const id = match[0].toLowerCase();
        if (id !== expected) foreign.add(id);
      }
    }
  }

  const manifestPath = path.join(stagingDir, "client-manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
      const id = String(parsed.clientId || parsed.client_id || "").trim();
      if (id) {
        manifestClientId = id;
        if (id.toLowerCase() !== expected) {
          foreign.add(id.toLowerCase());
        }
      }
    } catch {
      /* ignore */
    }
  }

  return {
    foreignClientIds: [...foreign],
    bakedClientId,
    manifestClientId,
  };
}
