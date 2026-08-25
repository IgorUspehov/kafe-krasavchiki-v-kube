import fs from "fs";
import path from "path";

import { resolveImageLibraryFolder } from "@/lib/image-library/business-type-map";

const IMAGE_LIBRARY_URL_PREFIX = "/image-library";

export function getImageLibraryUrlPrefix(): string {
  return IMAGE_LIBRARY_URL_PREFIX;
}

export function getImageLibraryFolderUrl(businessType: string): string {
  const folder = resolveImageLibraryFolder(businessType);
  return `${IMAGE_LIBRARY_URL_PREFIX}/${folder}`;
}

export function getHeroImagePath(businessType: string): string {
  return `${getImageLibraryFolderUrl(businessType)}/hero.jpg`;
}

/** Same hero the public site uses: client photo, else first gallery shot, else niche library. */
export function resolveClientHeroSrc(input: {
  heroPhoto?: unknown;
  galleryPhotos?: unknown;
  businessType: string;
}): string {
  if (typeof input.heroPhoto === "string" && input.heroPhoto.trim()) {
    return input.heroPhoto.trim();
  }
  if (Array.isArray(input.galleryPhotos)) {
    const first = input.galleryPhotos.find(
      (item) => typeof item === "string" && item.trim(),
    );
    if (typeof first === "string") return first.trim();
  }
  return getHeroImagePath(input.businessType);
}

export function getGalleryImagePaths(businessType: string): string[] {
  const base = getImageLibraryFolderUrl(businessType);
  return [1, 2, 3].map((index) => `${base}/gallery-${index}.jpg`);
}

export function getOgImagePath(businessType: string): string {
  return `${getImageLibraryFolderUrl(businessType)}/og.jpg`;
}

/** Server filesystem path to public/image-library */
export function getImageLibraryRoot(projectRoot = process.cwd()): string {
  return path.join(projectRoot, "public", "image-library");
}

export function resolveOgImageFilePath(businessType: string, projectRoot = process.cwd()): string {
  const folder = resolveImageLibraryFolder(businessType);
  const root = getImageLibraryRoot(projectRoot);
  const primary = path.join(root, folder, "og.jpg");
  if (fs.existsSync(primary)) {
    return primary;
  }
  return path.join(root, "generic", "og.jpg");
}

/**
 * Copy only the niche image-library folder (+ generic fallback) into a staging dist.
 * Always replaces any pre-copied full library from client-template (otherwise every
 * demo inherits all ~19 niches / ~24MB from the template cpSync).
 */
export function ensureImageLibraryInDist(
  stagingDir: string,
  businessType: string,
  projectRoot = process.cwd(),
): void {
  const sourceRoot = getImageLibraryRoot(projectRoot);
  const destinationRoot = path.join(stagingDir, "image-library");
  if (!fs.existsSync(sourceRoot)) {
    console.warn("[image-library] library root missing:", sourceRoot);
    return;
  }

  const nicheFolder = resolveImageLibraryFolder(businessType);
  const folders = new Set<string>([nicheFolder, "generic"]);

  // Drop template's full image-library before staging the niche subset.
  fs.rmSync(destinationRoot, { recursive: true, force: true });
  fs.mkdirSync(destinationRoot, { recursive: true });

  for (const folder of folders) {
    const source = path.join(sourceRoot, folder);
    const destination = path.join(destinationRoot, folder);
    if (!fs.existsSync(source)) {
      console.warn("[image-library] niche folder missing:", source);
      continue;
    }
    fs.cpSync(source, destination, { recursive: true });
  }

  console.log("[image-library] staged niche folders", {
    businessType,
    nicheFolder,
    folders: [...folders],
    destinationRoot,
  });
}
