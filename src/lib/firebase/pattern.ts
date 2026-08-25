import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();

const BUSINESS_TYPE_TO_PATTERN_DIR: Record<string, string> = {
  beauty_salon: "beauty_salon",
  barbershop: "beauty_salon",
  dental_clinic: "health_clinic",
  health_clinic: "health_clinic",
  massage_salon: "massage_salon",
  massage_salon_crm: "massage_salon",
  fitness_club: "fitness_club",
  car_service: "car_service",
  car_service_crm: "car_service",
  restaurant: "restaurant",
  restaurant_crm: "restaurant",
  hotel_booking: "hotel_booking",
  real_estate: "real_estate",
  real_estate_crm: "real_estate",
  education: "school_management",
  school_management: "school_management",
  course_platform: "course_platform",
  logistics: "car_service",
  logistics_crm: "car_service",
  delivery: "car_service",
  ecommerce: "inventory_system",
  ecommerce_crm: "inventory_system",
  inventory_system: "inventory_system",
  technology: "inventory_system",
  veterinary_clinic: "veterinary_clinic",
};

type PatternFile = {
  entities?: string[];
};

function patternFileExists(patternDir: string): boolean {
  return fs.existsSync(path.join(PROJECT_ROOT, "patterns", patternDir, "pattern.json"));
}

export function resolvePatternDir(businessType: string): string {
  const normalized = businessType.trim().toLowerCase();
  const mapped = BUSINESS_TYPE_TO_PATTERN_DIR[normalized] ?? normalized;

  if (patternFileExists(mapped)) {
    return mapped;
  }
  if (patternFileExists(normalized)) {
    return normalized;
  }
  return "beauty_salon";
}

export function loadPatternEntities(businessType: string): string[] {
  const patternDir = resolvePatternDir(businessType);
  const patternPath = path.join(PROJECT_ROOT, "patterns", patternDir, "pattern.json");
  const raw = fs.readFileSync(patternPath, "utf8");
  const pattern = JSON.parse(raw) as PatternFile;
  const entities = Array.isArray(pattern.entities)
    ? pattern.entities.map((entity) => String(entity).trim()).filter(Boolean)
    : [];

  if (entities.length === 0) {
    throw new Error(`Pattern "${patternDir}" has no entities for businessType "${businessType}"`);
  }

  return entities;
}
