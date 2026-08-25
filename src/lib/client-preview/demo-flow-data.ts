import fs from "fs";

import { assessActiveArtifacts, getLegacyClientDeliveryPaths } from "@/lib/client-preview/active-artifact-context";
import { isDeliveryReady, readV2Manifest } from "@/lib/client-preview/preview-service";
import type { ClientPreviewDemoFlow } from "@/lib/client-preview/types";

const BEAUTY_SALON_DEMO_MODULES = ["clients", "services", "stylists", "bookings"];

function readProfile(): Record<string, string> | null {
  const legacy = getLegacyClientDeliveryPaths();
  if (!fs.existsSync(legacy.profile)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(legacy.profile, "utf-8")) as Record<string, string>;
  } catch {
    return null;
  }
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

export function buildDemoFlowData(routeId: string): ClientPreviewDemoFlow | null {
  const assessment = assessActiveArtifacts(routeId);
  const canonical = assessment.canonical;
  if (!canonical) {
    return null;
  }

  const profile = readProfile();
  const businessName = canonical.business_name || profile?.business_name || "";
  const businessType = canonical.business_type;
  const language = profile?.language || "de";
  const email = profile?.email || "";
  const phone = profile?.phone || "";
  const modules = resolveDisplayModules(businessType, canonical.modules);
  const manifest = readV2Manifest();

  return {
    questionnaire: {
      business_name: businessName,
      business_category: businessType,
      language,
      email,
      phone,
    },
    sphere: {
      selected_sphere: businessType,
      template: canonical.template_id,
      modules,
    },
    manifest_card: {
      business_name: businessName,
      business_type: businessType,
      selected_template: canonical.template_id,
      language,
      delivery_ready: isDeliveryReady(manifest),
      artifacts_in_sync: assessment.consistent,
    },
  };
}
