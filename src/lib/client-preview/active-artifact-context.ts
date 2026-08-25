import fs from "fs";
import path from "path";

import type { V2Manifest } from "@/lib/client-preview/types";
import { readV2Manifest } from "@/lib/client-preview/preview-service";

const ALIASES_PATH = path.join(process.cwd(), "config", "client_delivery_v2_category_aliases.json");
const V2_DOMAIN_UI = path.join(
  process.cwd(),
  "artifacts/factory_output/client_delivery_v2/react_mvp/src/data/domain_ui.json",
);
const LEGACY_DELIVERY_MANIFEST = path.join(process.cwd(), "output/client_delivery/delivery_manifest.json");
const LEGACY_CLIENT_PROFILE = path.join(process.cwd(), "output/client_delivery/client_profile.json");
const NETLIFY_REPORT = path.join(process.cwd(), "artifacts/factory_output/netlify_deploy/netlify_deploy_report.json");
const LEGACY_ZIP = path.join(process.cwd(), "output/client_delivery/final_package.zip");
const LEGACY_README = path.join(process.cwd(), "output/client_delivery/README_CLIENT.txt");
const LEGACY_DEMO = path.join(process.cwd(), "output/client_delivery/demo.mp4");

export type ArtifactIdentity = {
  source: string;
  business_name: string;
  business_type: string;
  normalized_category: string;
  template_id: string;
  modules: string[];
  fingerprint: string;
};

export type ActiveArtifactAssessment = {
  consistent: boolean;
  preview_id: string;
  canonical: ArtifactIdentity | null;
  preview_meta: ArtifactIdentity | null;
  preview_ui: ArtifactIdentity | null;
  netlify: ArtifactIdentity | null;
  demo: ArtifactIdentity | null;
  legacy_package: ArtifactIdentity | null;
  mismatches: string[];
  factory_drift: string[];
  sync_warning: string;
  materialize_source: "legacy_client_delivery" | "v2_delivery" | null;
};

type CategoryAliases = {
  business_type_to_normalized?: Record<string, string>;
};

let cachedAliases: CategoryAliases | null = null;

function readAliases(): CategoryAliases {
  if (cachedAliases) {
    return cachedAliases;
  }
  try {
    cachedAliases = JSON.parse(fs.readFileSync(ALIASES_PATH, "utf-8")) as CategoryAliases;
  } catch {
    cachedAliases = {};
  }
  return cachedAliases;
}

export function normalizeCategory(value: string): string {
  const aliases = readAliases().business_type_to_normalized ?? {};
  const key = value.trim().toLowerCase();
  return aliases[key] ?? key;
}

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function buildFingerprint(parts: {
  normalized_category: string;
  template_id: string;
  modules: string[];
}): string {
  return `${parts.normalized_category}|${parts.template_id}|${[...parts.modules].sort().join(",")}`;
}

function inferTemplateFromCategory(category: string): string {
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

function buildIdentity(
  source: string,
  input: {
    business_name?: string;
    business_type?: string;
    normalized_category?: string;
    selected_business_category?: string;
    template_id?: string;
    template?: string;
    modules?: string[];
  },
): ArtifactIdentity | null {
  const businessType = input.business_type ?? input.selected_business_category ?? "";
  const normalized =
    input.normalized_category ??
    input.selected_business_category ??
    normalizeCategory(businessType);
  const templateId = input.template_id ?? input.template ?? inferTemplateFromCategory(normalized || businessType);
  const modules = Array.isArray(input.modules) ? input.modules.map(String) : [];

  if (!normalized && !templateId) {
    return null;
  }

  const normalizedCategory = normalizeCategory(normalized || businessType);
  const fingerprint = buildFingerprint({
    normalized_category: normalizedCategory,
    template_id: templateId,
    modules,
  });

  return {
    source,
    business_name: input.business_name ?? "",
    business_type: normalizedCategory,
    normalized_category: normalizedCategory,
    template_id: templateId,
    modules,
    fingerprint,
  };
}

export function readPreviewMetaIdentity(): ArtifactIdentity | null {
  const manifest = readV2Manifest();
  if (!manifest) {
    return null;
  }
  return buildIdentity("preview_meta", {
    business_name: manifest.client_contacts?.business_name,
    business_type: manifest.business_type,
    normalized_category: (manifest as V2Manifest & { normalized_category?: string }).normalized_category,
    template_id: manifest.template_id,
    modules: manifest.modules,
  });
}

export function readPreviewUiIdentity(): ArtifactIdentity | null {
  const domainUi = readJson<{
    business_type?: string;
    normalized_category?: string;
    template?: string;
    modules?: string[];
    dashboard_title?: string;
  }>(V2_DOMAIN_UI);

  const legacyManifest = readJson<{ business_name?: string; selected_business_category?: string }>(
    LEGACY_DELIVERY_MANIFEST,
  );
  const legacyProfile = readJson<{ business_name?: string; selected_business_category?: string }>(
    LEGACY_CLIENT_PROFILE,
  );
  const legacyCategory =
    legacyManifest?.selected_business_category ?? legacyProfile?.selected_business_category ?? "";

  const legacyUi =
    legacyCategory || legacyManifest?.business_name
      ? buildIdentity("preview_ui_legacy", {
          business_name: legacyManifest?.business_name ?? legacyProfile?.business_name,
          normalized_category: legacyCategory,
          template_id: inferTemplateFromCategory(legacyCategory),
          modules: [],
        })
      : null;

  const v2Ui = domainUi
    ? buildIdentity("preview_ui", {
        business_name: domainUi.dashboard_title,
        business_type: domainUi.business_type,
        normalized_category: domainUi.normalized_category,
        template_id: domainUi.template,
        modules: domainUi.modules,
      })
    : null;

  const netlify = readNetlifyIdentity();
  const demo = readDemoIdentity();

  if (
    legacyUi &&
    netlify &&
    demo &&
    legacyUi.fingerprint === netlify.fingerprint &&
    legacyUi.fingerprint === demo.fingerprint
  ) {
    return legacyUi;
  }

  return v2Ui ?? legacyUi;
}

export function readNetlifyIdentity(): ArtifactIdentity | null {
  const report = readJson<{ business_type?: string }>(NETLIFY_REPORT);
  if (!report?.business_type) {
    return null;
  }

  return buildIdentity("netlify", {
    business_type: report.business_type,
    normalized_category: report.business_type,
    template_id: inferTemplateFromCategory(report.business_type),
    modules: [],
  });
}

export function readDemoIdentity(): ArtifactIdentity | null {
  const manifest = readJson<{ business_name?: string; selected_business_category?: string }>(LEGACY_DELIVERY_MANIFEST);
  const profile = readJson<{
    business_name?: string;
    business_type?: string;
    selected_business_category?: string;
  }>(LEGACY_CLIENT_PROFILE);

  const category = manifest?.selected_business_category ?? profile?.selected_business_category ?? profile?.business_type;
  if (!category && !manifest?.business_name) {
    return null;
  }

  return buildIdentity("demo", {
    business_name: manifest?.business_name ?? profile?.business_name,
    business_type: profile?.business_type ?? category,
    normalized_category: category,
    template_id: inferTemplateFromCategory(category ?? ""),
    modules: [],
  });
}

export function readLegacyPackageIdentity(): ArtifactIdentity | null {
  const manifest = readJson<{ business_name?: string; selected_business_category?: string }>(LEGACY_DELIVERY_MANIFEST);
  const profile = readJson<{ business_type?: string; selected_business_category?: string }>(LEGACY_CLIENT_PROFILE);
  const category = manifest?.selected_business_category ?? profile?.selected_business_category ?? profile?.business_type;

  if (!category && !manifest?.business_name) {
    return null;
  }

  return buildIdentity("legacy_package", {
    business_name: manifest?.business_name,
    business_type: profile?.business_type ?? category,
    normalized_category: category,
    template_id: inferTemplateFromCategory(category ?? ""),
    modules: [],
  });
}

export function assessActiveArtifacts(routeId = "latest"): ActiveArtifactAssessment {
  const manifest = readV2Manifest();
  const resolvedId = manifest
    ? routeId === "latest"
      ? (manifest.preview?.preview_id ??
        `${(manifest.client_contacts?.business_name ?? "mvp").toLowerCase().replace(/\s+/g, "-")}`)
      : routeId
    : routeId;

  let previewMeta = readPreviewMetaIdentity();
  let previewUi = readPreviewUiIdentity();
  const netlify = readNetlifyIdentity();
  const demo = readDemoIdentity();
  const legacyPackage = readLegacyPackageIdentity();

  if (manifest && previewMeta) {
    previewMeta = {
      ...previewMeta,
      business_name: manifest.client_contacts?.business_name ?? previewMeta.business_name,
    };
  }

  if (manifest && previewUi?.source === "preview_ui") {
    previewUi = {
      ...previewUi,
      business_name: manifest.client_contacts?.business_name ?? previewUi.business_name,
    };
  }
  const activePreview = previewUi ?? previewMeta;
  const mismatches: string[] = [];
  const factoryDrift: string[] = [];

  if (!activePreview) {
    return {
      consistent: false,
      preview_id: resolvedId,
      canonical: null,
      preview_meta: previewMeta,
      preview_ui: previewUi,
      netlify,
      demo,
      legacy_package: legacyPackage,
      mismatches: ["active preview identity not found"],
      factory_drift: [],
      sync_warning: "Artifacts are out of sync",
      materialize_source: null,
    };
  }

  const clientSources = [activePreview, netlify, demo, legacyPackage].filter(Boolean) as ArtifactIdentity[];
  const reference = activePreview;
  for (const identity of clientSources) {
    if (identity.fingerprint !== reference.fingerprint) {
      mismatches.push(
        `${identity.source}(${identity.normalized_category}/${identity.template_id}) != active preview(${reference.normalized_category}/${reference.template_id})`,
      );
    }
  }

  if (previewMeta && previewMeta.fingerprint !== activePreview.fingerprint) {
    factoryDrift.push(
      `factory_manifest(${previewMeta.normalized_category}/${previewMeta.template_id}) != active preview(${activePreview.normalized_category}/${activePreview.template_id})`,
    );
  }

  const canonicalBusinessType = activePreview.business_type;
  for (const identity of clientSources) {
    if (identity.business_type !== canonicalBusinessType) {
      mismatches.push(
        `${identity.source}.business_type(${identity.business_type}) != active_preview.business_type(${canonicalBusinessType})`,
      );
    }
  }

  const consistent = mismatches.length === 0;
  const canonical = consistent ? activePreview : null;

  let materialize_source: ActiveArtifactAssessment["materialize_source"] = null;
  if (consistent && canonical) {
    if (
      legacyPackage &&
      canonical.fingerprint === legacyPackage.fingerprint &&
      fs.existsSync(LEGACY_ZIP)
    ) {
      materialize_source = "legacy_client_delivery";
    } else {
      materialize_source = "v2_delivery";
    }
  }

  return {
    consistent,
    preview_id: resolvedId,
    canonical,
    preview_meta: previewMeta,
    preview_ui: previewUi,
    netlify,
    demo,
    legacy_package: legacyPackage,
    mismatches,
    factory_drift: factoryDrift,
    sync_warning: consistent ? "" : "Artifacts are out of sync",
    materialize_source,
  };
}

export function getLegacyClientDeliveryPaths() {
  return {
    zip: LEGACY_ZIP,
    readme: LEGACY_README,
    demo: LEGACY_DEMO,
    profile: LEGACY_CLIENT_PROFILE,
    manifest: LEGACY_DELIVERY_MANIFEST,
  };
}
