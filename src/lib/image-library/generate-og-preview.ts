import fs from "fs";

import sharp from "sharp";

import { resolveOgImageFilePath } from "@/lib/image-library/paths";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * Build og-preview.png from image-library/{niche}/og.jpg (no text overlay).
 */
export async function generateOgPreviewFromLibrary(
  businessType: string,
  projectRoot = process.cwd(),
): Promise<Buffer> {
  const ogJpgPath = resolveOgImageFilePath(businessType, projectRoot);

  if (!fs.existsSync(ogJpgPath)) {
    throw new Error(`[image-library] og.jpg not found: ${ogJpgPath}`);
  }

  return sharp(ogJpgPath)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
