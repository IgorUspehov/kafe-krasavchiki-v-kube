import fs from "fs";
import path from "path";

import sharp from "sharp";

import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_GALLERY_IMAGES = 12;

export type MediaSlot = "logo" | "hero" | "gallery";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function sanitizeClientId(clientId: string): string {
  const id = clientId.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error("Invalid clientId");
  }
  return id;
}

function sanitizeFilename(name: string): string {
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    throw new Error("Invalid filename");
  }
  const base = path.basename(name);
  if (!/^[a-zA-Z0-9._-]+$/.test(base)) {
    throw new Error("Invalid filename");
  }
  return base;
}

export function clientMediaDir(clientId: string): string {
  return path.join(resolvePersistentDataDir(), "client-media", sanitizeClientId(clientId));
}

export function resolveClientMediaFile(clientId: string, filename: string): string {
  const root = path.resolve(clientMediaDir(clientId));
  const resolved = path.resolve(root, sanitizeFilename(filename));
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (resolved !== root && !resolved.startsWith(prefix)) {
    throw new Error("Invalid media path");
  }
  return resolved;
}

export function publicMediaUrl(clientId: string, filename: string): string {
  return `/api/media/${encodeURIComponent(sanitizeClientId(clientId))}/${encodeURIComponent(sanitizeFilename(filename))}`;
}

export function isClientMediaUrl(value: string, clientId: string): boolean {
  const prefix = `/api/media/${encodeURIComponent(clientId)}/`;
  return value.startsWith("/api/media/") && value.startsWith(prefix);
}

async function processImage(input: Buffer, slot: MediaSlot): Promise<{ buffer: Buffer; filename: string }> {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  if (slot === "logo") {
    const buffer = await sharp(input)
      .rotate()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return { buffer, filename: `logo-${id}.png` };
  }

  const buffer = await sharp(input)
    .rotate()
    .resize(1920, 1080, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const filename = slot === "hero" ? `hero-${id}.jpg` : `gallery-${id}.jpg`;
  return { buffer, filename };
}

export async function saveUploadedMedia(input: {
  clientId: string;
  slot: MediaSlot;
  bytes: Buffer;
  mime: string;
}): Promise<{ url: string; filename: string }> {
  if (!ALLOWED_MIME.has(input.mime)) {
    throw new Error("Unsupported image type");
  }
  if (input.bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error("File too large");
  }

  const processed = await processImage(input.bytes, input.slot);
  const dir = clientMediaDir(input.clientId);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = resolveClientMediaFile(input.clientId, processed.filename);
  fs.writeFileSync(filePath, processed.buffer);
  return {
    url: publicMediaUrl(input.clientId, processed.filename),
    filename: processed.filename,
  };
}

export function deleteClientMediaFile(clientId: string, filename: string): void {
  const filePath = resolveClientMediaFile(clientId, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function filenameFromMediaUrl(url: string, clientId: string): string | null {
  const prefix = `/api/media/${encodeURIComponent(clientId)}/`;
  if (!url.startsWith(prefix)) return null;
  try {
    return sanitizeFilename(decodeURIComponent(url.slice(prefix.length)));
  } catch {
    return null;
  }
}

export function listGalleryFiles(clientId: string): string[] {
  const dir = clientMediaDir(clientId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith("gallery-"))
    .map((name) => publicMediaUrl(clientId, name));
}
