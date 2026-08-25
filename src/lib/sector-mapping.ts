import sectorConfig from "../../config/sector_mapping.json";

export type SectorMappingConfig = {
  default_business_type: string;
  sector_id_to_business_type: Record<string, string>;
  business_type_display_names: Record<string, string>;
};

const config = sectorConfig as SectorMappingConfig;

export const DEFAULT_BUSINESS_TYPE = config.default_business_type;

export const SECTOR_ID_TO_BUSINESS_TYPE = config.sector_id_to_business_type;

export const BUSINESS_TYPE_DISPLAY_NAMES = config.business_type_display_names;

export function sectorIdToBusinessType(sectorId: string): string {
  const key = sectorId.trim().toLowerCase();
  return SECTOR_ID_TO_BUSINESS_TYPE[key] ?? DEFAULT_BUSINESS_TYPE;
}

export function getBusinessTypeDisplayName(businessType: string): string {
  const raw = businessType.trim().toLowerCase().replace(/-/g, "_");
  const key = SECTOR_ID_TO_BUSINESS_TYPE[raw] ?? raw;
  return (
    BUSINESS_TYPE_DISPLAY_NAMES[key] ??
    (businessType.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()) ||
      "Business")
  );
}
