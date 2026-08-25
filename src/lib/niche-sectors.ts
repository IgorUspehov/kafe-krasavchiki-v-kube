/** Sector `id` values from client-wizard `copy.sectors` / select "Branche". */
export const WIZARD_SECTOR_IDS = [
  "beauty",
  "barbershop",
  "massage",
  "fitness",
  "yoga",
  "dental",
  "health",
  "food",
  "cafe",
  "hotel",
  "car_service",
  "tire_service",
  "car_wash",
  "realestate",
  "law_firm",
  "accounting",
  "education",
  "logistics",
  "shop",
  "tech",
] as const;

export type WizardSectorId = (typeof WIZARD_SECTOR_IDS)[number];

/**
 * Landing niche card index → wizard sector id (same order as `landing-copy` niches[]).
 */
export const LANDING_NICHE_SLUGS: readonly WizardSectorId[] = [
  "beauty", // 0  Beauty-Salon
  "barbershop", // 1  Barbershop
  "massage", // 2  Massagestudio
  "fitness", // 3  Fitnessstudio
  "yoga", // 4  Yoga-Studio
  "dental", // 5  Zahnarztpraxis
  "health", // 6  Medizinische Klinik
  "food", // 7  Restaurant
  "cafe", // 8  Café
  "hotel", // 9  Hotel
  "car_service", // 10 Autowerkstatt
  "tire_service", // 11 Reifendienst
  "car_wash", // 12 Autowäsche
  "realestate", // 13 Immobilienagentur
  "law_firm", // 14 Anwaltskanzlei
  "accounting", // 15 Buchhaltungsservice
  "education", // 16 Bildungszentrum
  "logistics", // 17 Logistik & Transport
  "shop", // 18 Online-Shop
  "tech", // 19 IT & Technologie
];

export function isWizardSectorId(value: string): value is WizardSectorId {
  return (WIZARD_SECTOR_IDS as readonly string[]).includes(value);
}
