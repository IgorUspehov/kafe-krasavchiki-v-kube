import {
  getGalleryImagePaths,
  getHeroImagePath,
} from "@/lib/image-library";
import { resolveImageLibraryFolder } from "@/lib/image-library/business-type-map";

const LEGACY_NICHE_PREFIX = "/assets/niches/";
const IMAGE_LIBRARY_PREFIX = "/image-library/";

function resolveManifestBusinessType(manifest: Record<string, unknown>): string {
  const raw =
    manifest.businessType ??
    manifest.business_type ??
    manifest.domain ??
    manifest.business ??
    "generic";
  return String(raw || "generic");
}

function usesForeignMediaPath(value: string, businessType: string): boolean {
  if (value.startsWith(LEGACY_NICHE_PREFIX)) {
    return true;
  }
  if (value.startsWith("/api/media/")) {
    return false;
  }
  if (!value.startsWith(IMAGE_LIBRARY_PREFIX)) {
    return false;
  }
  const folder = resolveImageLibraryFolder(businessType);
  const expectedPrefix = `${IMAGE_LIBRARY_PREFIX}${folder}/`;
  return !value.startsWith(expectedPrefix);
}

function shouldReplaceHero(hero: unknown, businessType: string): hero is string {
  return typeof hero === "string" && usesForeignMediaPath(hero, businessType);
}

function shouldReplaceGallery(gallery: unknown, businessType: string): boolean {
  if (!Array.isArray(gallery) || gallery.length === 0) {
    return false;
  }
  return gallery.some(
    (item) => typeof item === "string" && usesForeignMediaPath(item, businessType),
  );
}

export function normalizeManifestMedia(manifest: Record<string, unknown>): Record<string, unknown> {
  const businessType = resolveManifestBusinessType(manifest);
  const next: Record<string, unknown> = { ...manifest };
  const heroPath = getHeroImagePath(businessType);
  const galleryPaths = getGalleryImagePaths(businessType);

  const hero = next.heroPhoto ?? next.hero_photo;
  if (shouldReplaceHero(hero, businessType)) {
    next.heroPhoto = heroPath;
    next.hero_photo = heroPath;
  }

  const gallery = next.galleryPhotos ?? next.gallery_photos;
  if (shouldReplaceGallery(gallery, businessType)) {
    next.galleryPhotos = galleryPaths;
    next.gallery_photos = galleryPaths;
  }

  return next;
}
