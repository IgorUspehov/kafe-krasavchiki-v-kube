import fs from "fs";
import path from "path";
import { execSync } from "child_process";

import type { ArtifactIdentity } from "@/lib/client-preview/active-artifact-context";
import { getLegacyClientDeliveryPaths } from "@/lib/client-preview/active-artifact-context";
import { canonicalBusinessType } from "@/lib/client-preview/business-type-canonical";

const LEGACY_ZIP = path.join(process.cwd(), "output", "client_delivery", "final_package.zip");

const FORBIDDEN_DEMO_TERMS = [
  "dental clinic",
  "bright smile dental",
  "dr. petrova",
  "dr petrova",
  "munich dental",
  "petrova",
  "restaurant",
  "barbershop",
  "dentist",
  "dental_clinic",
  "dental center",
];

export type DemoVideoSyncAssessment = {
  synced: boolean;
  warning: string;
  reason?: string;
};

function readJsonFile(filePath: string): Record<string, unknown> | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readZipJsonEntry(entry: string): Record<string, unknown> | null {
  if (!fs.existsSync(LEGACY_ZIP)) {
    return null;
  }
  try {
    const raw = execSync(`unzip -p "${LEGACY_ZIP}" "${entry}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function namesAlign(left: string, right: string): boolean {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  if (!a || !b) {
    return true;
  }
  return a === b || a.includes(b) || b.includes(a);
}

function collectDemoMetadataBlob(): string {
  const chunks: unknown[] = [
    readZipJsonEntry("docs/demo_video_manifest.json"),
    readZipJsonEntry("client_data/video_client_data.json"),
    readJsonFile(path.join(process.cwd(), "artifacts/factory_output/demo_video/video_client_data.json")),
  ];
  return JSON.stringify(chunks).toLowerCase();
}

function findForbiddenTerm(blob: string): string | null {
  for (const term of FORBIDDEN_DEMO_TERMS) {
    if (blob.includes(term)) {
      return term;
    }
  }
  return null;
}

export function assessDemoVideoSync(canonical: ArtifactIdentity | null): DemoVideoSyncAssessment {
  if (!canonical) {
    return {
      synced: false,
      warning: "Demo video not synced",
      reason: "active preview identity missing",
    };
  }

  const legacy = getLegacyClientDeliveryPaths();
  if (!fs.existsSync(legacy.demo)) {
    return {
      synced: false,
      warning: "Demo video not synced",
      reason: "demo.mp4 not found",
    };
  }

  const demoManifest = readZipJsonEntry("docs/demo_video_manifest.json");
  const manifestBusinessName = String(demoManifest?.business_name ?? "").trim();
  const metadataBlob = collectDemoMetadataBlob();
  const forbidden = findForbiddenTerm(metadataBlob);

  if (forbidden) {
    return {
      synced: false,
      warning: "Demo video not synced",
      reason: `forbidden demo content (${forbidden})`,
    };
  }

  if (manifestBusinessName && !namesAlign(manifestBusinessName, canonical.business_name)) {
    return {
      synced: false,
      warning: "Demo video not synced",
      reason: `demo manifest business_name(${manifestBusinessName}) != active MVP(${canonical.business_name})`,
    };
  }

  const expectedType = canonicalBusinessType(canonical.business_type);
  const manifestType = demoManifest?.business_type ?? demoManifest?.selected_business_category;
  if (manifestType && canonicalBusinessType(String(manifestType)) !== expectedType) {
    return {
      synced: false,
      warning: "Demo video not synced",
      reason: `demo manifest business_type(${String(manifestType)}) != active MVP(${expectedType})`,
    };
  }

  if (manifestBusinessName && namesAlign(manifestBusinessName, canonical.business_name)) {
    return { synced: true, warning: "" };
  }

  // Legacy dental mp4 without updated manifest metadata — block delivery.
  if (demoManifest && manifestBusinessName.toLowerCase().includes("dental")) {
    return {
      synced: false,
      warning: "Demo video not synced",
      reason: "demo manifest still references dental clinic content",
    };
  }

  return {
    synced: false,
    warning: "Demo video not synced",
    reason: "demo video metadata does not confirm active MVP",
  };
}

export function isDemoVideoSynced(canonical: ArtifactIdentity | null): boolean {
  return assessDemoVideoSync(canonical).synced;
}
