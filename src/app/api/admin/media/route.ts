import { NextResponse } from "next/server";

import { AdminUnauthorizedError, requireAdminSession, unauthorizedResponse } from "@/lib/admin/authorize";
import {
  MAX_GALLERY_IMAGES,
  deleteClientMediaFile,
  filenameFromMediaUrl,
  saveUploadedMedia,
  type MediaSlot,
} from "@/lib/admin/media-store";
import { persistClientManifest, requireClientManifest } from "@/lib/admin/persist";
import { applySiteContentPatch, readSiteContent } from "@/lib/admin/site-content";
import { markClientAdminEdited } from "@/lib/site-delivery/dist-protection";

export const runtime = "nodejs";

function asSlot(value: string | null): MediaSlot | null {
  if (value === "logo" || value === "hero" || value === "gallery") return value;
  return null;
}

export async function POST(request: Request) {
  try {
    const session = requireAdminSession(request);
    const form = await request.formData();
    const slot = asSlot(typeof form.get("slot") === "string" ? String(form.get("slot")) : null);
    const file = form.get("file");
    if (!slot) {
      return NextResponse.json({ ok: false, error: "slot must be logo, hero, or gallery" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await saveUploadedMedia({
      clientId: session.clientId,
      slot,
      bytes,
      mime: file.type || "application/octet-stream",
    });

    const manifest = await requireClientManifest(session.clientId);
    const content = readSiteContent(manifest);
    if (slot === "logo") {
      const previous = filenameFromMediaUrl(content.logo, session.clientId);
      if (previous && previous !== saved.filename) {
        deleteClientMediaFile(session.clientId, previous);
      }
      await persistClientManifest(session.clientId, applySiteContentPatch(manifest, { logo: saved.url }));
    } else if (slot === "hero") {
      const previous = filenameFromMediaUrl(content.heroPhoto, session.clientId);
      if (previous && previous !== saved.filename) {
        deleteClientMediaFile(session.clientId, previous);
      }
      await persistClientManifest(session.clientId, applySiteContentPatch(manifest, { heroPhoto: saved.url }));
    } else {
      const gallery = [...content.galleryPhotos.filter((item) => item !== saved.url), saved.url];
      if (gallery.length > MAX_GALLERY_IMAGES) {
        return NextResponse.json({ ok: false, error: "Gallery limit reached" }, { status: 400 });
      }
      await persistClientManifest(session.clientId, applySiteContentPatch(manifest, { galleryPhotos: gallery }));
    }
    markClientAdminEdited(session.clientId);
    const next = await requireClientManifest(session.clientId);
    return NextResponse.json({ ok: true, url: saved.url, content: readSiteContent(next) });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = requireAdminSession(request);
    const url = new URL(request.url);
    const slot = asSlot(url.searchParams.get("slot"));
    const mediaUrl = url.searchParams.get("url") || "";
    if (!slot) {
      return NextResponse.json({ ok: false, error: "slot required" }, { status: 400 });
    }

    const manifest = await requireClientManifest(session.clientId);
    const content = readSiteContent(manifest);
    if (slot === "logo") {
      const filename = filenameFromMediaUrl(content.logo, session.clientId);
      if (filename) deleteClientMediaFile(session.clientId, filename);
      await persistClientManifest(session.clientId, applySiteContentPatch(manifest, { logo: "" }));
    } else if (slot === "hero") {
      const filename = filenameFromMediaUrl(content.heroPhoto, session.clientId);
      if (filename) deleteClientMediaFile(session.clientId, filename);
      await persistClientManifest(session.clientId, applySiteContentPatch(manifest, { heroPhoto: "" }));
    } else {
      const target = mediaUrl || "";
      const nextGallery = content.galleryPhotos.filter((item) => item !== target);
      const filename = filenameFromMediaUrl(target, session.clientId);
      if (filename) deleteClientMediaFile(session.clientId, filename);
      await persistClientManifest(
        session.clientId,
        applySiteContentPatch(manifest, { galleryPhotos: nextGallery }),
      );
    }
    markClientAdminEdited(session.clientId);
    const next = await requireClientManifest(session.clientId);
    return NextResponse.json({ ok: true, content: readSiteContent(next) });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Delete failed" },
      { status: 400 },
    );
  }
}
