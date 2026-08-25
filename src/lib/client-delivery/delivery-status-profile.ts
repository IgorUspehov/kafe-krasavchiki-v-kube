import fs from "fs";
import path from "path";

const PROFILE_PATHS = [
  "output/client_delivery/client_profile.json",
  "artifacts/factory_output/client_data/client_profile.json",
] as const;

const QUESTIONNAIRE_PATH = "input/client_onboarding_questionnaire.json";
const PROFILE_FORM_PATH = "input/client_profile_form.json";
const ONBOARDING_PROFILE_PATH = "artifacts/factory_output/client_onboarding/client_profile.json";
const DELIVERY_MANIFEST_PATH = "output/client_delivery/delivery_manifest.json";
const PROJECT_MANIFEST_PATH = "config/manifest.yml";
const CATEGORY_MAP_PATH = "config/knowledge_category_map.json";

function resolvePath(rel: string) {
  return path.join(process.cwd(), rel);
}

function readJson(rel: string): Record<string, unknown> | null {
  const fullPath = resolvePath(rel);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readProjectTypeFromManifest(): string | null {
  const fullPath = resolvePath(PROJECT_MANIFEST_PATH);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(fullPath, "utf8");
    const match = content.match(/^project_type:\s*(\S+)/m);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

function categoryToBusinessType(category: string): string | null {
  const map = readJson(CATEGORY_MAP_PATH);
  const entries = map?.business_type_to_category;
  if (!entries || typeof entries !== "object") {
    return null;
  }
  for (const [businessType, mappedCategory] of Object.entries(entries as Record<string, string>)) {
    if (mappedCategory === category) {
      return businessType;
    }
  }
  return null;
}

function normalizeName(value: unknown) {
  return String(value ?? "").trim();
}

function namesAlign(left: string, right: string) {
  if (!left || !right) {
    return true;
  }
  const leftLower = left.toLowerCase();
  const rightLower = right.toLowerCase();
  return leftLower === rightLower || leftLower.includes(rightLower) || rightLower.includes(leftLower);
}

function isStaleDentalFallback(businessType: string, businessName: string) {
  if (businessType !== "dental_clinic") {
    return false;
  }
  const name = businessName.toLowerCase();
  return name.includes("beauty salon") || name.includes("beauty_salon");
}

function resolveBusinessType(profile: Record<string, unknown>) {
  const profileName = normalizeName(profile.business_name);
  const questionnaire = readJson(QUESTIONNAIRE_PATH);
  const profileForm = readJson(PROFILE_FORM_PATH);
  const onboardingProfile = readJson(ONBOARDING_PROFILE_PATH);
  const deliveryManifest = readJson(DELIVERY_MANIFEST_PATH);
  const projectType = readProjectTypeFromManifest();
  const manifestCategory = normalizeName(deliveryManifest?.selected_business_category);
  const manifestBusinessType = manifestCategory ? categoryToBusinessType(manifestCategory) : null;

  const candidates: Array<{ value: string | null; sourceName: string }> = [
    {
      value: normalizeName(questionnaire?.business_type) || null,
      sourceName: normalizeName(questionnaire?.business_name),
    },
    {
      value: normalizeName(profileForm?.business_type) || null,
      sourceName: normalizeName(profileForm?.business_name),
    },
    {
      value: normalizeName(onboardingProfile?.business_type) || null,
      sourceName: normalizeName(onboardingProfile?.business_name),
    },
    {
      value: manifestBusinessType,
      sourceName: profileName,
    },
    {
      value: projectType,
      sourceName: profileName,
    },
    {
      value: normalizeName(profile.business_type) || null,
      sourceName: profileName,
    },
  ];

  for (const candidate of candidates) {
    const value = candidate.value;
    if (!value) {
      continue;
    }
    if (!namesAlign(profileName, candidate.sourceName)) {
      continue;
    }
    if (isStaleDentalFallback(value, profileName)) {
      continue;
    }
    return value;
  }

  if (projectType && !isStaleDentalFallback(projectType, profileName)) {
    return projectType;
  }

  return "MISSING";
}

export function readDeliveryStatusProfile(): Record<string, unknown> {
  let profile: Record<string, unknown> = {};

  for (const rel of PROFILE_PATHS) {
    const data = readJson(rel);
    if (data && normalizeName(data.business_name)) {
      profile = { ...data };
      break;
    }
  }

  return {
    ...profile,
    business_type: resolveBusinessType(profile),
  };
}
