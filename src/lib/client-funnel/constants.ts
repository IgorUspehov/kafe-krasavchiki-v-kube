import {
  DEFAULT_BUSINESS_TYPE,
  SECTOR_ID_TO_BUSINESS_TYPE,
  sectorIdToBusinessType,
} from "@/lib/sector-mapping";

export const FUNNEL_SECTORS = [
  { id: "beauty", icon: "💈", businessType: SECTOR_ID_TO_BUSINESS_TYPE.beauty },
  { id: "dental", icon: "🏥", businessType: SECTOR_ID_TO_BUSINESS_TYPE.dental },
  { id: "tech", icon: "💻", businessType: SECTOR_ID_TO_BUSINESS_TYPE.tech },
  { id: "shop", icon: "🛍️", businessType: SECTOR_ID_TO_BUSINESS_TYPE.shop },
  { id: "logistics", icon: "🚚", businessType: SECTOR_ID_TO_BUSINESS_TYPE.logistics },
  { id: "food", icon: "🍽️", businessType: SECTOR_ID_TO_BUSINESS_TYPE.food },
  { id: "education", icon: "🎓", businessType: SECTOR_ID_TO_BUSINESS_TYPE.education },
  { id: "fitness", icon: "💪", businessType: SECTOR_ID_TO_BUSINESS_TYPE.fitness },
  { id: "realestate", icon: "🏠", businessType: SECTOR_ID_TO_BUSINESS_TYPE.realestate },
] as const;

export type FunnelSectorId = (typeof FUNNEL_SECTORS)[number]["id"];

export const FUNNEL_LANGUAGES = [
  { id: "de", label: "Deutsch" },
  { id: "en", label: "English" },
  { id: "ru", label: "Русский" },
  { id: "uk", label: "Українська" },
  { id: "fr", label: "Français" },
  { id: "es", label: "Español" },
] as const;

export type FunnelLanguageId = (typeof FUNNEL_LANGUAGES)[number]["id"];

export function sectorToBusinessType(sectorId: string): string {
  return sectorIdToBusinessType(sectorId);
}

export { DEFAULT_BUSINESS_TYPE };

export function languageToApiCode(languageId: string): string {
  const supported = ["de", "en", "ru"] as const;
  if ((supported as readonly string[]).includes(languageId)) {
    return languageId;
  }
  return "en";
}
