import {
  getGalleryImagePaths,
  getHeroImagePath,
} from "@/lib/image-library";
import { resolveImageLibraryFolder } from "@/lib/image-library/business-type-map";

/**
 * Replaces legacy NICHE_FOLDER_MAP for manifest media generation.
 * real_estate / real_estate_crm must never resolve to beauty, hotel, or other folders.
 */
export const BUSINESS_TYPE_MEDIA_FOLDER: Record<string, string> = {
  real_estate: "real_estate",
  real_estate_crm: "real_estate",
};

const REAL_ESTATE_TYPES = new Set(["real_estate", "real_estate_crm"]);
const FORBIDDEN_REAL_ESTATE_PATH_MARKERS = ["/beauty", "/beauty_salon/", "/hotel/"];

function assertRealEstateMediaPath(businessType: string, mediaPath: string): void {
  if (!REAL_ESTATE_TYPES.has(businessType)) {
    return;
  }

  const folder = resolveImageLibraryFolder(businessType);
  if (folder !== "real_estate") {
    throw new Error(
      `real_estate media folder must be real_estate, got ${folder} for businessType=${businessType}`,
    );
  }

  for (const marker of FORBIDDEN_REAL_ESTATE_PATH_MARKERS) {
    if (mediaPath.includes(marker)) {
      throw new Error(
        `Forbidden real_estate media path (${marker}): ${mediaPath}`,
      );
    }
  }

  if (!mediaPath.startsWith("/image-library/real_estate/")) {
    throw new Error(
      `real_estate media must use /image-library/real_estate/, got: ${mediaPath}`,
    );
  }
}

export function pickRandomGalleryPhotos(businessType: string, count = 3): string[] {
  const paths = getGalleryImagePaths(businessType).slice(0, count);
  for (const mediaPath of paths) {
    assertRealEstateMediaPath(businessType, mediaPath);
  }
  return paths;
}

export function pickRandomHeroPhoto(businessType: string): string {
  const heroPath = getHeroImagePath(businessType);
  assertRealEstateMediaPath(businessType, heroPath);
  return heroPath;
}
