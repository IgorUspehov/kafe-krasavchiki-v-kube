/** Canonical image-library folder names (under public/image-library/). */
export const IMAGE_LIBRARY_FOLDERS = [
  "hotel",
  "car_dealer",
  "beauty_salon",
  "dental_clinic",
  "restaurant",
  "fitness_club",
  "real_estate",
  "technology",
  "generic",
  "logistics",
  "massage_salon",
  "health_clinic",
  "ecommerce",
  "education",
  "law_firm",
  "accounting",
  "construction",
  "cleaning_service",
  "veterinary_clinic",
] as const;

export type ImageLibraryFolder = (typeof IMAGE_LIBRARY_FOLDERS)[number];

const BUSINESS_TYPE_TO_LIBRARY_FOLDER: Record<string, ImageLibraryFolder> = {
  hotel_booking: "hotel",
  real_estate: "real_estate",
  real_estate_crm: "real_estate",
  car_service: "car_dealer",
  car_service_crm: "car_dealer",
  beauty_salon: "beauty_salon",
  barbershop: "beauty_salon",
  massage_salon: "massage_salon",
  massage_salon_crm: "massage_salon",
  dental_clinic: "dental_clinic",
  health_clinic: "health_clinic",
  restaurant: "restaurant",
  restaurant_crm: "restaurant",
  fitness_club: "fitness_club",
  fitness: "fitness_club",
  technology: "technology",
  ecommerce: "ecommerce",
  ecommerce_crm: "ecommerce",
  education: "education",
  course_platform: "education",
  school_management: "education",
  logistics: "logistics",
  logistics_crm: "logistics",
  logistics_delivery: "logistics",
  delivery: "logistics",
  law_firm: "law_firm",
  accounting: "accounting",
  construction: "construction",
  cleaning_service: "cleaning_service",
  car_wash: "car_dealer",
  veterinary_clinic: "veterinary_clinic",
  inventory_system: "ecommerce",
};

export function resolveImageLibraryFolder(businessType: string): ImageLibraryFolder {
  const normalized = String(businessType || "").trim();
  if ((IMAGE_LIBRARY_FOLDERS as readonly string[]).includes(normalized)) {
    return normalized as ImageLibraryFolder;
  }
  const mapped = BUSINESS_TYPE_TO_LIBRARY_FOLDER[normalized];
  if (mapped) {
    return mapped;
  }
  if (normalized.endsWith("_crm")) {
    const withoutCrm = normalized.slice(0, -4);
    const mappedCrm = BUSINESS_TYPE_TO_LIBRARY_FOLDER[withoutCrm];
    if (mappedCrm) {
      return mappedCrm;
    }
  }
  return "generic";
}
