import { blake3 } from "@noble/hashes/blake3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import fs from "fs";
import path from "path";

import { isPagesIframeEmbedReady } from "@/lib/cloudflare/iframe-ready";
import { getSharedPagesProjectName } from "@/lib/cloudflare/shared-project";

const CF_API = "https://api.cloudflare.com/client/v4";
const MAX_BUCKET_BYTES = 50 * 1024 * 1024;
const MAX_BUCKET_FILES = 100;

export type CloudflareDeployResult = {
  projectName: string;
  siteUrl: string;
  deploymentId: string;
};

type CloudflareConfig = {
  accountId: string;
  token: string;
};

type DistFile = {
  relativePath: string;
  absolutePath: string;
  contentType: string;
  sizeInBytes: number;
  hash: string;
  buffer: Buffer;
};

type DeploymentApiResult = {
  id?: string;
  url?: string;
  latest_stage?: { name?: string; status?: string };
  stages?: Array<{ name?: string; status?: string }>;
};

function getCloudflareConfig(): CloudflareConfig {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !token) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN not configured");
  }
  return { accountId, token };
}

/** Temporary diagnostic — never logs secret values. */
export function logCloudflareEnvPresence(context = "cloudflare-env"): void {
  console.log(`[${context}]`, {
    cloudflareAccountIdPresent: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID?.trim()),
    cloudflareApiTokenPresent: Boolean(process.env.CLOUDFLARE_API_TOKEN?.trim()),
    cloudflareAccountIdLength: process.env.CLOUDFLARE_ACCOUNT_ID?.trim().length ?? 0,
    cloudflareApiTokenLength: process.env.CLOUDFLARE_API_TOKEN?.trim().length ?? 0,
  });
}

export function isCloudflareDeployConfigured(): boolean {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() && process.env.CLOUDFLARE_API_TOKEN?.trim());
}

const CF_PROJECT_NAME_MAX = 58;

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  і: "i",
  ї: "yi",
  є: "ye",
  ґ: "g",
};

/** Lowercase slug: Cyrillic translit, Latin diacritics stripped, non-alnum → `-`. */
export function slugifyProjectSegment(value: string): string {
  const lower = String(value ?? "").trim().toLowerCase();
  let out = "";
  for (const char of lower) {
    if (CYRILLIC_TO_LATIN[char] !== undefined) {
      out += CYRILLIC_TO_LATIN[char];
      continue;
    }
    out += char;
  }
  return out
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type PagesProjectNameInput = {
  clientId: string;
  businessType?: string;
  businessName?: string;
};

/**
 * Readable demo slug (not a Cloudflare project name):
 * `{businessNameSlug}-{shortId}` or `{businessType}-{shortId}` when name missing.
 */
export function buildDemoSlug(input: PagesProjectNameInput): string {
  const shortId = String(input.clientId ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 4);
  if (!shortId) {
    throw new Error("clientId is required to build demo slug");
  }

  const nameSlug = slugifyProjectSegment(input.businessName || "");
  const typeSlug = slugifyProjectSegment(input.businessType || "business") || "business";
  const primary = nameSlug || typeSlug;

  const suffix = `-${shortId}`;
  const maxPrimary = Math.max(1, CF_PROJECT_NAME_MAX - suffix.length);
  const truncated = primary.slice(0, maxPrimary).replace(/-$/, "");
  return `${truncated}${suffix}`;
}

/** @deprecated Use buildDemoSlug — kept for transitional imports. */
export function buildPagesProjectName(input: PagesProjectNameInput): string {
  return buildDemoSlug(input);
}

export function buildPreviewBranch(slug: string): string {
  return slugifyProjectSegment(slug).slice(0, 58) || `demo-${Date.now()}`;
}

/** Matches wrangler pages hashFile: blake3(base64(contents) + extension).hex.slice(0, 32) */
function hashPagesAsset(buffer: Buffer, relativePath: string): string {
  const base64Contents = buffer.toString("base64");
  const extension = path.extname(relativePath).substring(1);
  return bytesToHex(blake3(new TextEncoder().encode(base64Contents + extension))).slice(0, 32);
}

function getContentType(relativePath: string): string {
  const ext = path.extname(relativePath).toLowerCase();
  const map: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".txt": "text/plain; charset=utf-8",
    ".map": "application/json",
    ".xml": "application/xml",
  };
  return map[ext] ?? "application/octet-stream";
}

/** Same as wrangler pages validate IGNORE_LIST — these are deployment FormData fields, not assets. */
const PAGES_SPECIAL_FILES = new Set(["_headers", "_redirects"]);

function walkDistFiles(distPath: string, base = distPath): DistFile[] {
  const entries: DistFile[] = [];
  for (const entry of fs.readdirSync(distPath, { withFileTypes: true })) {
    const absolutePath = path.join(distPath, entry.name);
    const relativePath = path.relative(base, absolutePath).split(path.sep).join("/");
    if (entry.isDirectory()) {
      entries.push(...walkDistFiles(absolutePath, base));
      continue;
    }
    // Do not hash/upload _headers/_redirects as regular assets (wrangler IGNORE_LIST).
    if (PAGES_SPECIAL_FILES.has(entry.name) && !relativePath.includes("/")) {
      continue;
    }
    const buffer = fs.readFileSync(absolutePath);
    entries.push({
      relativePath,
      absolutePath,
      contentType: getContentType(relativePath),
      sizeInBytes: buffer.length,
      hash: hashPagesAsset(buffer, relativePath),
      buffer,
    });
  }
  return entries;
}

function readPagesSpecialFile(distPath: string, fileName: "_headers" | "_redirects"): string | null {
  const filePath = path.join(distPath, fileName);
  if (!fs.existsSync(filePath)) return null;
  const contents = fs.readFileSync(filePath, "utf8").trim();
  return contents.length > 0 ? `${contents}\n` : null;
}

function resolveSiteUrl(subdomain: string | undefined, projectName: string): string {
  if (!subdomain) {
    return `https://${projectName}.pages.dev`;
  }
  if (subdomain.startsWith("http://") || subdomain.startsWith("https://")) {
    return subdomain;
  }
  if (subdomain.includes(".")) {
    return `https://${subdomain}`;
  }
  return `https://${subdomain}.pages.dev`;
}

function maskAccountId(accountId: string): string {
  if (accountId.length <= 8) return "***";
  return `${accountId.slice(0, 4)}…${accountId.slice(-4)}`;
}

async function readJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text.slice(0, 2000) };
  }
}

async function fetchUploadJwt(accountId: string, token: string, projectName: string): Promise<string> {
  const response = await fetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${projectName}/upload-token`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  const body = await readJsonSafe(response);
  console.log("[cloudflare/deploy] upload-token response", {
    status: response.status,
    ok: response.ok,
    success:
      typeof body === "object" && body && "success" in body
        ? (body as { success?: boolean }).success
        : undefined,
  });
  if (!response.ok) {
    throw new Error(`Failed to get Cloudflare upload token: ${JSON.stringify(body)}`);
  }
  const jwt = (body as { result?: { jwt?: string } })?.result?.jwt;
  if (!jwt) {
    throw new Error("Cloudflare upload-token response missing jwt");
  }
  return jwt;
}

async function checkMissingHashes(jwt: string, hashes: string[]): Promise<string[]> {
  const response = await fetch(`${CF_API}/pages/assets/check-missing`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ hashes }),
  });
  const body = await readJsonSafe(response);
  console.log("[cloudflare/deploy] check-missing response", {
    status: response.status,
    ok: response.ok,
    missingCount: Array.isArray((body as { result?: unknown })?.result)
      ? (body as { result: string[] }).result.length
      : undefined,
  });
  if (!response.ok) {
    throw new Error(`Failed check-missing: ${JSON.stringify(body)}`);
  }
  const missing = (body as { result?: string[] })?.result;
  return Array.isArray(missing) ? missing : hashes;
}

function buildUploadBuckets(files: DistFile[]): DistFile[][] {
  const buckets: DistFile[][] = [[]];
  let currentSize = 0;

  for (const file of files) {
    const bucket = buckets[buckets.length - 1];
    const wouldExceed =
      bucket.length >= MAX_BUCKET_FILES ||
      (bucket.length > 0 && currentSize + file.sizeInBytes > MAX_BUCKET_BYTES);
    if (wouldExceed) {
      buckets.push([file]);
      currentSize = file.sizeInBytes;
      continue;
    }
    bucket.push(file);
    currentSize += file.sizeInBytes;
  }

  return buckets.filter((bucket) => bucket.length > 0);
}

async function uploadAssetBuckets(jwt: string, files: DistFile[]): Promise<void> {
  const buckets = buildUploadBuckets(files);
  console.log("[cloudflare/deploy] uploading asset buckets", {
    buckets: buckets.length,
    files: files.length,
  });

  for (const [index, bucket] of buckets.entries()) {
    const payload = bucket.map((file) => ({
      key: file.hash,
      value: file.buffer.toString("base64"),
      metadata: { contentType: file.contentType },
      base64: true,
    }));

    const response = await fetch(`${CF_API}/pages/assets/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const body = await readJsonSafe(response);
    console.log("[cloudflare/deploy] assets/upload response", {
      bucket: index + 1,
      of: buckets.length,
      status: response.status,
      ok: response.ok,
      fileCount: bucket.length,
    });
    if (!response.ok) {
      throw new Error(`Failed pages assets upload: ${JSON.stringify(body)}`);
    }
  }
}

async function upsertHashes(jwt: string, hashes: string[]): Promise<void> {
  const response = await fetch(`${CF_API}/pages/assets/upsert-hashes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ hashes }),
  });
  const body = await readJsonSafe(response);
  console.log("[cloudflare/deploy] upsert-hashes response", {
    status: response.status,
    ok: response.ok,
  });
  if (!response.ok) {
    console.warn("[cloudflare/deploy] upsert-hashes failed (non-fatal)", {
      body: typeof body === "object" ? body : String(body).slice(0, 500),
    });
  }
}

async function getDeployment(
  accountId: string,
  token: string,
  projectName: string,
  deploymentId: string,
): Promise<DeploymentApiResult> {
  const response = await fetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  const body = await readJsonSafe(response);
  console.log("[cloudflare/deploy] get deployment response", {
    status: response.status,
    ok: response.ok,
    deploymentId,
    latest_stage: (body as { result?: DeploymentApiResult })?.result?.latest_stage,
    url: (body as { result?: DeploymentApiResult })?.result?.url,
  });
  if (!response.ok) {
    throw new Error(`Failed to get Cloudflare deployment: ${JSON.stringify(body)}`);
  }
  return (body as { result?: DeploymentApiResult })?.result ?? {};
}

async function waitForDeploymentReady(
  accountId: string,
  token: string,
  projectName: string,
  deploymentId: string,
  timeoutMs = 180_000,
): Promise<DeploymentApiResult> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await getDeployment(accountId, token, projectName, deploymentId);
    const status = result.latest_stage?.status;

    if (status === "success") {
      return result;
    }

    if (status === "failure" || status === "canceled") {
      throw new Error(
        `Cloudflare deployment ${status}: stage=${result.latest_stage?.name ?? "unknown"}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Cloudflare deployment timed out waiting for ready state");
}

/**
 * Pages edge often returns 522 (with X-Frame-Options: SAMEORIGIN) for a short window
 * after deploy success. Wait until the production URL serves embeddable HTML
 * (200 + CSP frame-ancestors for Railway, no blocking XFO).
 */
async function waitForPagesEdgeReady(siteUrl: string, timeoutMs = 120_000): Promise<void> {
  const startedAt = Date.now();
  let attempt = 0;

  while (Date.now() - startedAt < timeoutMs) {
    attempt += 1;
    try {
      const response = await fetch(siteUrl, {
        method: "GET",
        redirect: "follow",
        headers: { Accept: "text/html" },
      });
      const contentType = response.headers.get("content-type") ?? "";
      const csp = response.headers.get("content-security-policy");
      const xFrameOptions = response.headers.get("x-frame-options");
      const embedReady = isPagesIframeEmbedReady(response);
      console.log("[cloudflare/deploy] edge probe", {
        attempt,
        status: response.status,
        contentType,
        xFrameOptions,
        embedReady,
        frameAncestors: csp?.match(/frame-ancestors[^;]*/i)?.[0] ?? null,
      });
      if (embedReady && /text\/html/i.test(contentType)) {
        return;
      }
    } catch (error) {
      console.log("[cloudflare/deploy] edge probe error", {
        attempt,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.warn("[cloudflare/deploy] edge not ready within timeout — continuing", { siteUrl, timeoutMs });
}

export function resolveMvpDistPath(): string {
  const candidates = [
    process.env.MVP_DIST_PATH,
    path.join(process.cwd(), "client-template/dist"),
    path.join(process.cwd(), "artifacts/factory_output/react_mvp/dist"),
    path.join(process.cwd(), "mvp-template/dist"),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      return candidate;
    }
  }

  throw new Error("MVP dist folder not found. Build or copy react_mvp/dist to mvp-template/dist.");
}

export async function ensureSharedPagesProject(): Promise<{
  projectName: string;
  productionUrl: string;
}> {
  const { accountId, token } = getCloudflareConfig();
  const projectName = getSharedPagesProjectName();

  const getOnce = async () => {
    const response = await fetch(
      `${CF_API}/accounts/${accountId}/pages/projects/${projectName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
    const body = await readJsonSafe(response);
    return { response, body };
  };

  let { response, body } = await getOnce();
  if (response.ok) {
    const payload = body as { result?: { name?: string; subdomain?: string } };
    const name = payload.result?.name ?? projectName;
    return { projectName: name, productionUrl: resolveSiteUrl(payload.result?.subdomain, name) };
  }

  if (response.status !== 404) {
    throw new Error(`Failed to get Cloudflare Pages project: ${JSON.stringify(body)}`);
  }

  console.log("[cloudflare/deploy] creating shared project once", {
    projectName,
    accountIdMasked: maskAccountId(accountId),
  });
  const createRes = await fetch(`${CF_API}/accounts/${accountId}/pages/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      production_branch: "main",
    }),
  });
  const createBody = await readJsonSafe(createRes);

  if (!createRes.ok) {
    // Race: another request created it — retry GET.
    const retry = await getOnce();
    if (retry.response.ok) {
      const payload = retry.body as { result?: { name?: string; subdomain?: string } };
      const name = payload.result?.name ?? projectName;
      return { projectName: name, productionUrl: resolveSiteUrl(payload.result?.subdomain, name) };
    }
    throw new Error(`Failed to create shared Cloudflare Pages project: ${JSON.stringify(createBody)}`);
  }

  const payload = createBody as { result?: { name?: string; subdomain?: string } };
  const name = payload.result?.name ?? projectName;
  console.log("[cloudflare/deploy] shared project ready", { projectName: name });
  return { projectName: name, productionUrl: resolveSiteUrl(payload.result?.subdomain, name) };
}

/** @deprecated Prefer ensureSharedPagesProject — no longer creates per-client projects. */
export async function createPagesProject(
  _input?: PagesProjectNameInput | string,
): Promise<{ projectName: string; siteUrl: string }> {
  const shared = await ensureSharedPagesProject();
  return { projectName: shared.projectName, siteUrl: shared.productionUrl };
}

/**
 * Official Pages Direct Upload flow (same as wrangler pages deploy):
 * 1) upload-token JWT
 * 2) blake3 asset hashes + check-missing
 * 3) POST /pages/assets/upload for missing files
 * 4) upsert-hashes
 * 5) POST .../deployments with manifest + optional _headers/_redirects FormData fields
 *
 * Pass previewBranch ≠ production_branch to get a unique preview deployment URL.
 */
export async function deployDistToPages(
  projectName: string,
  distPath: string,
  options?: { previewBranch?: string },
): Promise<{ deploymentId: string; deploymentUrl: string }> {
  if (!fs.existsSync(distPath)) {
    throw new Error(`Dist path does not exist: ${distPath}`);
  }

  const { accountId, token } = getCloudflareConfig();
  const files = walkDistFiles(distPath);
  if (files.length === 0) {
    throw new Error(`Dist path is empty: ${distPath}`);
  }

  const indexFile = files.find((file) => file.relativePath === "index.html");
  if (!indexFile) {
    throw new Error(`Missing index.html in dist: ${distPath}`);
  }

  const headersContents = readPagesSpecialFile(distPath, "_headers");
  const redirectsContents = readPagesSpecialFile(distPath, "_redirects");

  const manifest: Record<string, string> = {};
  for (const file of files) {
    manifest[`/${file.relativePath}`] = file.hash;
  }

  console.log("[cloudflare/deploy] preparing upload", {
    projectName,
    previewBranch: options?.previewBranch,
    fileCount: files.length,
    hasIndexHtml: true,
    indexHtmlBytes: indexFile.sizeInBytes,
    indexHtmlHash: indexFile.hash,
    hasHeadersFile: Boolean(headersContents),
    hasRedirectsFile: Boolean(redirectsContents),
    accountIdMasked: maskAccountId(accountId),
  });

  const jwt = await fetchUploadJwt(accountId, token, projectName);
  const allHashes = files.map((file) => file.hash);
  const missingHashes = await checkMissingHashes(jwt, allHashes);
  const missingSet = new Set(missingHashes);
  const filesToUpload = files.filter((file) => missingSet.has(file.hash));

  console.log("[cloudflare/deploy] missing assets", {
    total: files.length,
    missing: filesToUpload.length,
    cached: files.length - filesToUpload.length,
  });

  if (filesToUpload.length > 0) {
    await uploadAssetBuckets(jwt, filesToUpload);
  }

  await upsertHashes(jwt, allHashes);

  const form = new FormData();
  form.append("manifest", JSON.stringify(manifest));
  if (options?.previewBranch) {
    form.append("branch", options.previewBranch);
  }
  if (headersContents) {
    form.append("_headers", new File([headersContents], "_headers"));
    console.log("[cloudflare/deploy] attaching _headers FormData field", {
      bytes: Buffer.byteLength(headersContents, "utf8"),
    });
  }
  if (redirectsContents) {
    form.append("_redirects", new File([redirectsContents], "_redirects"));
    console.log("[cloudflare/deploy] attaching _redirects FormData field", {
      bytes: Buffer.byteLength(redirectsContents, "utf8"),
    });
  }

  console.log("[cloudflare/deploy] creating deployment with manifest", {
    projectName,
    previewBranch: options?.previewBranch,
    manifestEntries: Object.keys(manifest).length,
    headersAttached: Boolean(headersContents),
    redirectsAttached: Boolean(redirectsContents),
  });

  const response = await fetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    },
  );

  const body = await readJsonSafe(response);
  console.log("[cloudflare/deploy] create deployment response", {
    status: response.status,
    ok: response.ok,
    deploymentId: (body as { result?: DeploymentApiResult })?.result?.id,
    deploymentUrl: (body as { result?: DeploymentApiResult })?.result?.url,
    latest_stage: (body as { result?: DeploymentApiResult })?.result?.latest_stage,
  });

  if (!response.ok) {
    throw new Error(`Failed to deploy to Cloudflare Pages: ${JSON.stringify(body)}`);
  }

  const deployment = (body as { result?: DeploymentApiResult })?.result;
  const deploymentId = deployment?.id;
  if (!deploymentId) {
    throw new Error("Cloudflare deployment created but no deployment id was returned");
  }

  const ready = await waitForDeploymentReady(accountId, token, projectName, deploymentId);
  const deploymentUrl = ready.url ?? deployment?.url;
  if (!deploymentUrl) {
    throw new Error("Cloudflare deployment missing url");
  }
  await waitForPagesEdgeReady(deploymentUrl);
  console.log("[cloudflare/deploy] deployment ready", {
    deploymentId,
    deploymentUrl,
    latest_stage: ready.latest_stage,
  });

  return { deploymentId, deploymentUrl };
}

export async function deployToCloudflarePages(
  clientId: string,
  distPath: string,
  meta?: Omit<PagesProjectNameInput, "clientId">,
): Promise<CloudflareDeployResult> {
  console.log("[cloudflare/deploy] start", { clientId, distPath, ...meta });
  const { projectName } = await ensureSharedPagesProject();
  const slug = buildDemoSlug({
    clientId,
    businessType: meta?.businessType,
    businessName: meta?.businessName,
  });
  const { deploymentId, deploymentUrl } = await deployDistToPages(projectName, distPath, {
    previewBranch: buildPreviewBranch(slug),
  });
  const result = {
    projectName,
    siteUrl: deploymentUrl,
    deploymentId,
  };
  console.log("[cloudflare/deploy] success", { ...result, slug });
  return result;
}

export async function deletePagesDeployment(
  projectName: string,
  deploymentId: string,
): Promise<void> {
  const { accountId, token } = getCloudflareConfig();
  const response = await fetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}?force=true`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Failed to delete Cloudflare deployment ${deploymentId}: ${await response.text()}`,
    );
  }
}

export async function listPagesDeployments(
  projectName: string,
  page = 1,
): Promise<Array<{ id?: string; created_on?: string; url?: string; environment?: string }>> {
  const { accountId, token } = getCloudflareConfig();
  const response = await fetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${projectName}/deployments?page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  const body = await readJsonSafe(response);
  if (!response.ok) {
    throw new Error(`Failed to list Cloudflare deployments: ${JSON.stringify(body)}`);
  }
  const result = (body as { result?: unknown }).result;
  return Array.isArray(result)
    ? (result as Array<{ id?: string; created_on?: string; url?: string; environment?: string }>)
    : [];
}

/** Fetch all deployment pages (Cloudflare default page size is 10). */
export async function listAllPagesDeployments(
  projectName: string,
  maxPages = 50,
): Promise<Array<{ id?: string; created_on?: string; url?: string; environment?: string }>> {
  const all: Array<{ id?: string; created_on?: string; url?: string; environment?: string }> = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await listPagesDeployments(projectName, page);
    all.push(...batch);
    if (batch.length < 10) break;
  }
  return all;
}

export async function pruneOldDeployments(
  projectName: string,
  keep: number,
  protectIds: Set<string>,
): Promise<number> {
  const deployments = await listAllPagesDeployments(projectName);
  // Newest first — keep the latest `keep` deletable deployments.
  const sorted = [...deployments].sort((a, b) =>
    String(b.created_on || "").localeCompare(String(a.created_on || "")),
  );
  const deletable = sorted.filter((d) => d.id && !protectIds.has(d.id));
  const toDelete = deletable.slice(keep);
  let removed = 0;
  for (const item of toDelete) {
    if (!item.id) continue;
    try {
      await deletePagesDeployment(projectName, item.id);
      removed += 1;
    } catch (error) {
      console.error("[cloudflare/deploy] prune failed", { id: item.id, error });
    }
  }
  console.log("[cloudflare/deploy] pruneOldDeployments", {
    projectName,
    keep,
    removed,
    total: deployments.length,
  });
  return removed;
}

export async function deletePagesProject(projectName: string): Promise<void> {
  const shared = getSharedPagesProjectName();
  if (projectName === shared) {
    console.warn("[cloudflare/deploy] refusing to delete shared Pages project", { projectName });
    return;
  }
  const { accountId, token } = getCloudflareConfig();
  const response = await fetch(`${CF_API}/accounts/${accountId}/pages/projects/${projectName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Cloudflare Pages project ${projectName}: ${await response.text()}`);
  }
}
