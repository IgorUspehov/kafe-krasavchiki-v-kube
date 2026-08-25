import crypto from "crypto";
import fs from "fs";
import path from "path";

import type { ClientPreviewDemoFlow, ClientPreviewPayload, ClientResultPayload, DeliveryOption, V2Manifest } from "@/lib/client-preview/types";
import { assessActiveArtifacts, normalizeCategory } from "@/lib/client-preview/active-artifact-context";
import {
  CUSTOM_DOMAIN_GUIDE_PATH,
  getActiveArtifactAssessment,
  readNetlifyDeployUrl,
  listClientScreenshots,
  resolveDeliveryZipDownloadHref,
  resolveDemoPath,
} from "@/lib/client-preview/delivery-artifacts";
import { isClientGithubPackageReady } from "@/lib/client-preview/client-delivery-materializer";
import { buildDemoFlowData } from "@/lib/client-preview/demo-flow-data";
import { assessDemoVideoSync } from "@/lib/client-preview/demo-video-sync";

export const PREVIEW_ID_LATEST = "latest";

const QUESTIONNAIRE_PATH = path.join(process.cwd(), "input", "client_onboarding_questionnaire.json");
const V2_DIR = path.join(process.cwd(), "artifacts", "factory_output", "client_delivery_v2");
const MANIFEST_PATH = path.join(V2_DIR, "manifest.json");
const DIST_DIR = path.join(V2_DIR, "react_mvp", "dist");
const CLIENT_BUILD_STATUS_PATH = path.join(process.cwd(), "output", "client_build_status.json");
const V2_ZIP_PATH = path.join(
  process.cwd(),
  "artifacts",
  "factory_output",
  "client_delivery_v2",
  "final_package.zip",
);
const ALT_ZIP_PATH = path.join(
  process.cwd(),
  "artifacts",
  "factory_output",
  "final_package",
  "final_package.zip",
);
const NETLIFY_DEPLOY_URL_PATH = path.join(
  process.cwd(),
  "artifacts",
  "factory_output",
  "netlify_deploy",
  "deployment_url.txt",
);

const READY_STATUSES = new Set(["DELIVERY_READY", "READY"]);

const BEAUTY_SALON_DEMO_MODULES = ["clients", "services", "stylists", "bookings"];

export type RuntimeQuestionnaireIdentity = {
  business_name: string;
  business_type: string;
  language: string;
  selected_template: string;
  email: string;
  phone: string;
};

function inferTemplateFromBusinessType(category: string): string {
  const normalized = normalizeCategory(category);
  const map: Record<string, string> = {
    beauty_salon: "beauty_salon_crm",
    dentist: "medical_crm",
    restaurant: "restaurant_crm",
    fitness: "fitness_crm",
    fitness_club: "fitness_crm",
    real_estate: "real_estate_crm",
    education: "education_crm",
    ecommerce: "ecommerce_crm",
  };
  return map[normalized] ?? `${normalized}_crm`;
}

export function readRuntimeQuestionnaire(): Record<string, unknown> | null {
  if (!fs.existsSync(QUESTIONNAIRE_PATH)) {
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(QUESTIONNAIRE_PATH, "utf-8")) as Record<string, unknown>;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

export function resolveQuestionnaireIdentity(
  questionnaire: Record<string, unknown>,
): RuntimeQuestionnaireIdentity {
  const rawBusinessType = String(questionnaire.business_type ?? "").trim();
  const business_type = normalizeCategory(rawBusinessType);
  return {
    business_name: String(questionnaire.business_name ?? "").trim(),
    business_type,
    language: String(questionnaire.language ?? "en").trim().toLowerCase(),
    selected_template: inferTemplateFromBusinessType(rawBusinessType || business_type),
    email: String(questionnaire.email ?? "").trim(),
    phone: String(questionnaire.phone ?? "").trim(),
  };
}

function resolveDisplayModules(businessType: string, modules: string[]): string[] {
  if (modules.length > 0) {
    return modules;
  }
  if (businessType === "beauty_salon") {
    return BEAUTY_SALON_DEMO_MODULES;
  }
  return modules;
}

function buildDemoFlowFromQuestionnaire(
  identity: RuntimeQuestionnaireIdentity,
  assessment: ReturnType<typeof assessActiveArtifacts>,
  manifest: V2Manifest | null,
): ClientPreviewDemoFlow {
  return {
    questionnaire: {
      business_name: identity.business_name,
      business_category: identity.business_type,
      language: identity.language,
      email: identity.email,
      phone: identity.phone,
    },
    sphere: {
      selected_sphere: identity.business_type,
      template: identity.selected_template,
      modules: resolveDisplayModules(identity.business_type, []),
    },
    manifest_card: {
      business_name: identity.business_name,
      business_type: identity.business_type,
      selected_template: identity.selected_template,
      language: identity.language,
      delivery_ready: isDeliveryReady(manifest),
      artifacts_in_sync: assessment.consistent,
    },
  };
}

function applyQuestionnaireIdentity<T extends ClientPreviewPayload | ClientResultPayload>(
  payload: T,
  identity: RuntimeQuestionnaireIdentity | null,
): T {
  if (!identity) {
    return payload;
  }
  return {
    ...payload,
    business_name: identity.business_name || payload.business_name,
    business_type: identity.business_type,
    language: identity.language,
    selected_template: identity.selected_template,
  };
}

export function getV2Dir(): string {
  return V2_DIR;
}

export function getDistDir(): string {
  return DIST_DIR;
}

export function readV2Manifest(): V2Manifest | null {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8")) as V2Manifest;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

export function slugifyPreviewSegment(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "mvp";
}

export function computePreviewId(manifest: V2Manifest): string {
  if (manifest.preview?.preview_id) {
    return manifest.preview.preview_id;
  }

  const businessName = manifest.client_contacts?.business_name ?? manifest.business_type ?? "mvp";
  const slug = slugifyPreviewSegment(businessName);
  const hash = crypto
    .createHash("sha256")
    .update(`${manifest.generated_at ?? ""}|${manifest.template_id ?? ""}`)
    .digest("hex")
    .slice(0, 6);

  return `${slug}-${hash}`;
}

export function resolvePreviewId(routeId: string, manifest: V2Manifest | null): string | null {
  if (!manifest) {
    return null;
  }

  const assessment = assessActiveArtifacts(routeId);
  const activeId = assessment.preview_id;
  const computed = computePreviewId(manifest);

  if (routeId === PREVIEW_ID_LATEST || routeId === activeId || routeId === computed) {
    return activeId || computed;
  }

  if (manifest.preview?.preview_id === routeId) {
    return routeId;
  }

  return null;
}

export function isDeliveryReady(manifest: V2Manifest | null): boolean {
  if (!manifest) {
    return false;
  }
  return READY_STATUSES.has(String(manifest.status ?? ""));
}

type ClientBuildStatus = {
  status?: string;
  netlify_url?: string;
};

function readClientBuildStatus(): ClientBuildStatus | null {
  if (!fs.existsSync(CLIENT_BUILD_STATUS_PATH)) {
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(CLIENT_BUILD_STATUS_PATH, "utf-8")) as ClientBuildStatus;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

function isClientBuildReady(): boolean {
  return String(readClientBuildStatus()?.status ?? "").toLowerCase() === "ready";
}

function zipArtifactExists(): boolean {
  return fs.existsSync(V2_ZIP_PATH) || fs.existsSync(ALT_ZIP_PATH);
}

function resolveZipDownloadHref(
  zipOption: ReturnType<typeof resolveDeliveryZipDownloadHref>,
): string | undefined {
  if (zipOption.href) {
    return zipOption.href;
  }
  if (fs.existsSync(V2_ZIP_PATH)) {
    return "/api/client-delivery-v2/download";
  }
  if (fs.existsSync(ALT_ZIP_PATH)) {
    return "/api/client-delivery/download";
  }
  return undefined;
}

function isNetlifyDeployReady(netlifyUrl: string | null): boolean {
  return fs.existsSync(NETLIFY_DEPLOY_URL_PATH) && Boolean(netlifyUrl);
}

export function distIndexExists(): boolean {
  return fs.existsSync(path.join(DIST_DIR, "index.html"));
}

export function resolvePreviewEmbedUrl(resolvedId: string, manifest: V2Manifest): string {
  const stored = manifest.preview?.preview_url;
  if (stored) {
    if (stored.startsWith("http://") || stored.startsWith("https://")) {
      return stored;
    }
    if (stored.startsWith("/")) {
      return stored;
    }
  }
  return `/api/client-preview/embed/${resolvedId}`;
}

export function buildPreviewPayload(routeId: string): ClientPreviewPayload {
  const manifest = readV2Manifest();
  const assessment = assessActiveArtifacts(routeId);
  const resolvedId = assessment.preview_id || resolvePreviewId(routeId, manifest);

  if (!manifest || !resolvedId) {
    return {
      ok: false,
      preview_id: routeId,
      business_name: "",
      business_type: "",
      language: "",
      selected_modules: [],
      selected_template: "",
      preview_url: "",
      manifest_status: "",
      delivery_ready: false,
      dist_available: false,
      error: "Preview not found or manifest missing",
    };
  }

  const canonical = assessment.canonical;
  const netlifyUrl = readNetlifyDeployUrl();
  const distAvailable = distIndexExists();
  const useLegacyNetlifyPreview =
    assessment.consistent &&
    assessment.materialize_source === "legacy_client_delivery" &&
    Boolean(netlifyUrl);

  const previewUrl = useLegacyNetlifyPreview
    ? netlifyUrl!
    : distAvailable
      ? resolvePreviewEmbedUrl(resolvedId, manifest)
      : netlifyUrl ?? "";

  const questionnaire = readRuntimeQuestionnaire();
  const qIdentity = questionnaire ? resolveQuestionnaireIdentity(questionnaire) : null;

  const screenshots = listClientScreenshots();
  const demoSync = assessDemoVideoSync(assessment.canonical);
  const demoVideoAvailable = demoSync.synced && Boolean(resolveDemoPath(routeId));

  const payload: ClientPreviewPayload = {
    ok: true,
    preview_id: resolvedId,
    business_name: canonical?.business_name ?? manifest.client_contacts?.business_name ?? "",
    business_type: canonical?.business_type ?? manifest.business_type ?? "",
    language: manifest.language ?? "en",
    selected_modules: canonical
      ? canonical.modules
      : Array.isArray(manifest.modules)
        ? manifest.modules.map(String)
        : [],
    selected_template: canonical?.template_id ?? manifest.template_id ?? "",
    preview_url: previewUrl,
    manifest_status: manifest.status ?? "",
    delivery_ready: isDeliveryReady(manifest),
    dist_available: useLegacyNetlifyPreview || distAvailable,
    screenshots,
    demo_video_available: demoVideoAvailable,
    demo_video_url: demoVideoAvailable ? "/api/client-result/demo" : undefined,
    demo_flow: qIdentity
      ? buildDemoFlowFromQuestionnaire(qIdentity, assessment, manifest)
      : buildDemoFlowData(routeId),
    error:
      useLegacyNetlifyPreview || distAvailable
        ? undefined
        : "react_mvp/dist/index.html not found",
  };

  return applyQuestionnaireIdentity(payload, qIdentity);
}

export function buildDeliveryOptions(routeId = "latest"): ClientResultPayload["delivery_options"] {
  const manifest = readV2Manifest();
  const assessment = getActiveArtifactAssessment(routeId);
  const buildStatus = readClientBuildStatus();
  const clientBuildReady = isClientBuildReady();
  const netlifyUrl =
    readNetlifyDeployUrl() ??
    (clientBuildReady ? String(buildStatus?.netlify_url ?? "").trim() || null : null);
  const zipOption = resolveDeliveryZipDownloadHref(routeId);
  const zipHref = resolveZipDownloadHref(zipOption);
  const demoSync = assessDemoVideoSync(assessment.canonical);
  const demoAvailable = demoSync.synced && Boolean(resolveDemoPath(routeId));
  const zipAvailable = clientBuildReady || zipArtifactExists();
  const netlifyAvailable = clientBuildReady || isNetlifyDeployReady(netlifyUrl);

  const options: DeliveryOption[] = [
    {
      key: "zip",
      label: "ZIP",
      available: zipAvailable,
      href: zipHref,
      description: "final_package.zip",
    },
    {
      key: "netlify",
      label: "Deploy link",
      available: netlifyAvailable,
      href: netlifyUrl ?? undefined,
      description: netlifyUrl ?? "Live deploy link",
    },
    {
      key: "custom_domain",
      label: "Свой домен",
      available: true,
      href: CUSTOM_DOMAIN_GUIDE_PATH,
      description: "Custom domain setup guide",
    },
    {
      key: "readme",
      label: "README",
      available: true,
      href: "/api/client-result/readme",
      description: "Client README",
    },
    {
      key: "demo_mp4",
      label: "demo.mp4",
      available: demoAvailable,
      href: demoAvailable ? "/api/client-result/demo" : undefined,
      description: "Demo video",
    },
  ];

  if (isClientGithubPackageReady(manifest)) {
    options.push({
      key: "github",
      label: "GitHub",
      available: true,
      href: "/api/client-result/github",
      description: "GitHub delivery package",
    });
  }

  return options;
}

export function buildResultPayload(routeId: string): ClientResultPayload {
  const assessment = assessActiveArtifacts(routeId);
  const manifest = readV2Manifest();
  const resolvedId = assessment.preview_id;

  if (!manifest || !resolvePreviewId(routeId, manifest)) {
    const delivery_options = buildDeliveryOptions(routeId);
    let buildReady = false;
    try {
      const s = JSON.parse(fs.readFileSync(CLIENT_BUILD_STATUS_PATH, "utf-8")) as { status?: string };
      buildReady = s.status === "ready";
    } catch {}
    if (buildReady) {
      delivery_options.forEach((opt) => {
        if (["zip", "netlify", "custom_domain", "readme"].includes(opt.key)) {
          opt.available = true;
        }
      });
    }

    return {
      ok: false,
      preview_id: routeId,
      business_name: "",
      business_type: "",
      language: "",
      selected_template: "",
      selected_modules: [],
      delivery_options,
      artifacts_in_sync: assessment.consistent,
      artifacts_sync_warning: assessment.consistent ? undefined : assessment.sync_warning,
      artifact_mismatches: assessment.mismatches,
      factory_drift: assessment.factory_drift,
      error: "Result not found or manifest missing",
    };
  }

  const canonical = assessment.canonical;
  const demoSync = assessDemoVideoSync(canonical);
  const questionnaire = readRuntimeQuestionnaire();
  const qIdentity = questionnaire ? resolveQuestionnaireIdentity(questionnaire) : null;

  const delivery_options = buildDeliveryOptions(routeId);
  let buildReady = false;
  try {
    const s = JSON.parse(fs.readFileSync(CLIENT_BUILD_STATUS_PATH, "utf-8")) as { status?: string };
    buildReady = s.status === "ready";
  } catch {}
  if (buildReady) {
    delivery_options.forEach((opt) => {
      if (["zip", "netlify", "custom_domain", "readme"].includes(opt.key)) {
        opt.available = true;
      }
    });
  }

  const payload: ClientResultPayload = {
    ok: true,
    preview_id: resolvedId,
    business_name: canonical?.business_name ?? manifest.client_contacts?.business_name ?? "",
    business_type: canonical?.business_type ?? manifest.business_type ?? "",
    language: manifest.language ?? "en",
    selected_template: canonical?.template_id ?? manifest.template_id ?? "",
    selected_modules: canonical
      ? canonical.modules
      : Array.isArray(manifest.modules)
        ? manifest.modules.map(String)
        : [],
    delivery_options,
    artifacts_in_sync: assessment.consistent,
    artifacts_sync_warning: assessment.consistent ? undefined : assessment.sync_warning,
    artifact_mismatches: assessment.mismatches,
    factory_drift: assessment.factory_drift,
    demo_video_synced: demoSync.synced,
    demo_video_warning: demoSync.synced ? undefined : demoSync.warning,
  };

  return applyQuestionnaireIdentity(payload, qIdentity);
}

export function readDistFile(assetPath: string): { buffer: Buffer; contentType: string } | null {
  const normalized = path.normalize(assetPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.join(DIST_DIR, normalized);

  if (!fullPath.startsWith(DIST_DIR) || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return null;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType =
    ext === ".html"
      ? "text/html; charset=utf-8"
      : ext === ".js"
        ? "application/javascript; charset=utf-8"
        : ext === ".css"
          ? "text/css; charset=utf-8"
          : ext === ".svg"
            ? "image/svg+xml"
            : ext === ".png"
              ? "image/png"
              : ext === ".json"
                ? "application/json; charset=utf-8"
                : "application/octet-stream";

  return { buffer: fs.readFileSync(fullPath), contentType };
}

export function buildEmbedHtml(resolvedId: string): string | null {
  const indexPath = path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(indexPath)) {
    return null;
  }

  const assetPrefix = `/api/client-preview/assets/${resolvedId}`;
  let html = fs.readFileSync(indexPath, "utf-8");
  html = html.replace(/src="\/assets\//g, `src="${assetPrefix}/assets/`);
  html = html.replace(/href="\/assets\//g, `href="${assetPrefix}/assets/`);
  return html;
}

export function assertPreviewIdForAssets(routeId: string): string | null {
  const manifest = readV2Manifest();
  return resolvePreviewId(routeId, manifest);
}
