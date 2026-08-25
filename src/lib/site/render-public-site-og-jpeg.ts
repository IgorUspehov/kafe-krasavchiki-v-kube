import fs from "fs";
import path from "path";

import sharp from "sharp";

import { ensurePublicSiteResolved } from "@/lib/cloudflare/resolve-public-site";
import { getHeroImagePath, getImageLibraryRoot } from "@/lib/image-library/paths";
import { loadClientManifestAsync } from "@/lib/manifest/storage";
import { resolvePublicSiteFirstImage } from "@/lib/site/public-site-metadata";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function publicFilePath(src: string, projectRoot = process.cwd()): string | null {
  const relative = src.replace(/^\//, "").split("?")[0];
  if (!relative || relative.includes("..")) return null;
  const filePath = path.join(projectRoot, "public", relative);
  if (!filePath.startsWith(path.join(projectRoot, "public"))) return null;
  return fs.existsSync(filePath) ? filePath : null;
}

async function loadImageBuffer(src: string): Promise<Buffer | null> {
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const response = await fetch(trimmed, { redirect: "follow" });
      if (!response.ok) return null;
      const bytes = Buffer.from(await response.arrayBuffer());
      return bytes.length ? bytes : null;
    } catch {
      return null;
    }
  }

  const filePath = publicFilePath(trimmed);
  if (!filePath) return null;
  try {
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

function toOgJpeg(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "centre" })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
}

export async function renderPublicSiteOgJpeg(rawParam: string): Promise<Buffer> {
  const resolved = await ensurePublicSiteResolved(rawParam);
  const manifest = resolved ? (await loadClientManifestAsync(resolved.clientId)) || {} : {};
  const firstImage = resolved
    ? resolvePublicSiteFirstImage(manifest)
    : getHeroImagePath("generic");

  const primary = await loadImageBuffer(firstImage);
  if (primary) {
    return toOgJpeg(primary);
  }

  const fallbackFs = path.join(getImageLibraryRoot(), "generic", "hero.jpg");
  if (fs.existsSync(fallbackFs)) {
    return toOgJpeg(fs.readFileSync(fallbackFs));
  }

  return sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 3,
      background: { r: 15, g: 23, b: 42 },
    },
  })
    .jpeg({ quality: 70 })
    .toBuffer();
}
