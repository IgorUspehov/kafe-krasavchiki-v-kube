import fs from "fs";
import path from "path";

export function loadHeroPhotoBuffer(distPath: string, heroPhoto?: string | null): Buffer | null {
  if (!heroPhoto || typeof heroPhoto !== "string") {
    return null;
  }

  const relative = heroPhoto.replace(/^\//, "");
  const filePath = path.join(distPath, relative);

  if (!fs.existsSync(filePath)) {
    console.warn("[og-image] hero photo not found:", filePath);
    return null;
  }

  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    console.warn("[og-image] failed to read hero photo:", filePath, error);
    return null;
  }
}
