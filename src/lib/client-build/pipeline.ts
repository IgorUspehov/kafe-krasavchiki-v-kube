import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export type ClientBuildStatusValue = "idle" | "building" | "ready" | "error";

export type ClientBuildStatus = {
  status: ClientBuildStatusValue;
  site_url?: string | null;
  /** @deprecated Use site_url. Kept for backward compatibility with older status files. */
  netlify_url?: string | null;
  step?: string;
  error?: string;
  started_at?: string;
  finished_at?: string;
  business_type?: string;
};

export const CLIENT_BUILD_STATUS_REL = "output/client_build_status.json";
export const SITE_DEPLOY_URL_REL = "artifacts/factory_output/cloudflare_deploy/deployment_url.txt";
/** @deprecated Use SITE_DEPLOY_URL_REL */
export const NETLIFY_DEPLOY_URL_REL = "artifacts/factory_output/netlify_deploy/deployment_url.txt";
export const PIPELINE_SCRIPT_REL = "scripts/run-client-build-pipeline.mjs";

export const PIPELINE_STEPS = [
  "client:deliver:v2",
  "client-build:generate",
  "deployment-choice:generate",
  "netlify-deploy:generate",
] as const;

function statusPath(root = process.cwd()) {
  return path.join(root, CLIENT_BUILD_STATUS_REL);
}

function siteDeployUrlPath(root = process.cwd()) {
  const cloudflarePath = path.join(root, SITE_DEPLOY_URL_REL);
  if (fs.existsSync(cloudflarePath)) {
    return cloudflarePath;
  }
  return path.join(root, NETLIFY_DEPLOY_URL_REL);
}

export function readSiteDeployUrl(root = process.cwd()): string | null {
  const candidate = siteDeployUrlPath(root);
  if (!fs.existsSync(candidate)) {
    return null;
  }
  try {
    const value = fs.readFileSync(candidate, "utf8").trim();
    return value || null;
  } catch {
    return null;
  }
}

/** @deprecated Use readSiteDeployUrl */
export function readNetlifyDeployUrl(root = process.cwd()): string | null {
  return readSiteDeployUrl(root);
}

export function readClientBuildStatus(root = process.cwd()): ClientBuildStatus {
  const filePath = statusPath(root);
  if (!fs.existsSync(filePath)) {
    return {
      status: "idle",
      site_url: readSiteDeployUrl(root),
    };
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as ClientBuildStatus;
    const siteUrl =
      data.site_url ??
      data.netlify_url ??
      (data.status === "ready" ? readSiteDeployUrl(root) : null);
    return {
      ...data,
      site_url: siteUrl,
      netlify_url: siteUrl,
    };
  } catch {
    return {
      status: "error",
      error: "Invalid client build status file",
      site_url: readSiteDeployUrl(root),
    };
  }
}

export function resolveClientBuildStatusForApi(): "ready" | "pending" | "error" {
  const record = readClientBuildStatus();
  if (record.status === "ready") {
    return "ready";
  }
  if (record.status === "error") {
    return "error";
  }
  return "pending";
}

export function writeClientBuildStatus(partial: ClientBuildStatus, root = process.cwd()): void {
  const filePath = statusPath(root);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const current = fs.existsSync(filePath) ? readClientBuildStatus(root) : { status: "idle" as const };
  const next: ClientBuildStatus = {
    ...current,
    ...partial,
    site_url: partial.site_url ?? partial.netlify_url ?? current.site_url ?? current.netlify_url ?? null,
    netlify_url: partial.site_url ?? partial.netlify_url ?? current.site_url ?? current.netlify_url ?? null,
  };
  fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

export function startClientBuildPipeline(root = process.cwd()): void {
  const scriptPath = path.join(root, PIPELINE_SCRIPT_REL);
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Pipeline script not found: ${PIPELINE_SCRIPT_REL}`);
  }

  writeClientBuildStatus(
    {
      status: "building",
      step: PIPELINE_STEPS[0],
      error: undefined,
      finished_at: undefined,
      started_at: new Date().toISOString(),
      site_url: null,
      netlify_url: null,
    },
    root,
  );

  const child = spawn(process.execPath, [scriptPath], {
    cwd: root,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}
