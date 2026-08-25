import fs from "fs";
import path from "path";

import {
  assessActiveArtifacts,
  type ActiveArtifactAssessment,
} from "@/lib/client-preview/active-artifact-context";
import {
  ensureClientDeliveryMaterialized,
  getLiveClientReadmePath,
  getLiveClientZipPath,
  getLiveDemoPath,
} from "@/lib/client-preview/client-delivery-materializer";
import { assessDemoVideoSync } from "@/lib/client-preview/demo-video-sync";

const LEGACY_CLIENT_ZIP = path.join(process.cwd(), "output", "client_delivery", "final_package.zip");
const V2_ZIP = path.join(process.cwd(), "artifacts", "factory_output", "client_delivery_v2", "final_package.zip");

export const CUSTOM_DOMAIN_GUIDE_PATH = "/client-result/custom-domain";

let cachedAssessment: ActiveArtifactAssessment | null = null;

export function getActiveArtifactAssessment(routeId = "latest"): ActiveArtifactAssessment {
  cachedAssessment = assessActiveArtifacts(routeId);
  return cachedAssessment;
}

export function resolveDeliveryZipDownloadHref(routeId = "latest"): {
  available: boolean;
  href?: string;
} {
  const assessment = getActiveArtifactAssessment(routeId);
  if (!assessment.consistent) {
    return { available: false };
  }

  ensureClientDeliveryMaterialized(assessment);
  if (getLiveClientZipPath()) {
    return { available: true, href: "/api/client-delivery/download" };
  }
  if (assessment.materialize_source === "legacy_client_delivery" && fs.existsSync(LEGACY_CLIENT_ZIP)) {
    return { available: true, href: "/api/client-delivery/download" };
  }
  if (assessment.materialize_source === "v2_delivery" && fs.existsSync(V2_ZIP)) {
    return { available: true, href: "/api/client-delivery-v2/download" };
  }
  return { available: false };
}

export function resolveReadmePath(routeId = "latest"): string | null {
  const assessment = getActiveArtifactAssessment(routeId);
  if (!assessment.consistent) {
    return null;
  }
  ensureClientDeliveryMaterialized(assessment);
  return getLiveClientReadmePath();
}

export function resolveDemoPath(routeId = "latest"): string | null {
  const assessment = getActiveArtifactAssessment(routeId);
  if (!assessment.consistent) {
    return null;
  }

  const demoSync = assessDemoVideoSync(assessment.canonical);
  if (!demoSync.synced) {
    return null;
  }

  ensureClientDeliveryMaterialized(assessment);
  return getLiveDemoPath();
}

const CLIENT_SCREENSHOT_DIRS = [
  path.join(process.cwd(), "output", "client_delivery", "screenshots"),
  path.join(process.cwd(), "artifacts", "factory_output", "client_delivery", "screenshots"),
];

export type ClientScreenshotItem = {
  name: string;
  label: string;
  url: string;
};

function formatScreenshotLabel(filename: string): string {
  return filename
    .replace(/^\d+_/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/_/g, " ");
}

export function resolveScreenshotsDir(): string | null {
  for (const dir of CLIENT_SCREENSHOT_DIRS) {
    if (!fs.existsSync(dir)) {
      continue;
    }
    const hasImage = fs
      .readdirSync(dir)
      .some((entry) => /\.(png|jpe?g|webp)$/i.test(entry));
    if (hasImage) {
      return dir;
    }
  }
  return null;
}

export function listClientScreenshots(): ClientScreenshotItem[] {
  const dir = resolveScreenshotsDir();
  if (!dir) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((entry) => /\.(png|jpe?g|webp)$/i.test(entry))
    .sort()
    .map((name) => ({
      name,
      label: formatScreenshotLabel(name),
      url: `/api/client-result/screenshot/${encodeURIComponent(name)}`,
    }));
}

export function resolveScreenshotPath(name: string): string | null {
  const dir = resolveScreenshotsDir();
  if (!dir) {
    return null;
  }

  const safeName = path.basename(name);
  if (!/\.(png|jpe?g|webp)$/i.test(safeName)) {
    return null;
  }

  const fullPath = path.join(dir, safeName);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fullPath;
}

export function readNetlifyDeployUrl(): string | null {
  const candidate = path.join(process.cwd(), "artifacts/factory_output/netlify_deploy/deployment_url.txt");
  if (!fs.existsSync(candidate)) {
    return null;
  }
  try {
    const value = fs.readFileSync(candidate, "utf-8").trim();
    return value || null;
  } catch {
    return null;
  }
}
