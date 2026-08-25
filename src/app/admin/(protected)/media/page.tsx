"use client";

import { useRef, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n";
import {
  AdminPageShell,
  useAdminSite,
  type AdminSiteResponse,
} from "@/components/admin/admin-shell";
import { AdminSaveFeedback } from "@/components/admin/admin-save-feedback";

async function uploadSlot(slot: "logo" | "hero" | "gallery", file: File) {
  const body = new FormData();
  body.set("slot", slot);
  body.set("file", file);
  const response = await fetch("/api/admin/media", {
    method: "POST",
    body,
    credentials: "same-origin",
  });
  const json = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || !json.ok) {
    throw new Error(json.error || "Upload failed");
  }
}

function withCacheBust(url: string, revision: number): string {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${revision}`;
}

function resolveViewSiteUrl(data: AdminSiteResponse | null): string | null {
  if (!data) return null;
  if (data.publicSiteUrl) return data.publicSiteUrl;
  if (data.slug) return `/site/${encodeURIComponent(data.slug)}`;
  if (data.clientId) return `/site/${encodeURIComponent(data.clientId)}`;
  return null;
}

export default function AdminMediaPage() {
  const { copy } = useAdminI18n();
  const { data, loading, error, reload } = useAdminSite();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [viewSiteUrl, setViewSiteUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mediaRevision, setMediaRevision] = useState(() => Date.now());
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  function resetFileInput(ref: React.RefObject<HTMLInputElement | null>) {
    if (ref.current) ref.current.value = "";
  }

  function showSavedFeedback(siteData: AdminSiteResponse | null) {
    setSaveError("");
    setViewSiteUrl(resolveViewSiteUrl(siteData));
    setSaved(true);
    window.requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  async function handleUpload(
    slot: "logo" | "hero" | "gallery",
    file: File | undefined,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) {
    if (!file) return;
    setBusy(true);
    setSaved(false);
    setSaveError("");
    const siteSnapshot = data;
    try {
      await uploadSlot(slot, file);
      setMediaRevision(Date.now());
      await reload();
      showSavedFeedback(siteSnapshot);
    } catch (err) {
      setSaved(false);
      setSaveError(err instanceof Error ? err.message : copy.media.uploadFailed);
    } finally {
      resetFileInput(inputRef);
      setBusy(false);
    }
  }

  async function remove(slot: "logo" | "hero" | "gallery", url?: string) {
    setBusy(true);
    setSaved(false);
    setSaveError("");
    const siteSnapshot = data;
    try {
      const params = new URLSearchParams({ slot });
      if (url) params.set("url", url);
      const response = await fetch(`/api/admin/media?${params.toString()}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const json = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !json.ok) throw new Error(json.error || copy.media.deleteFailed);
      setMediaRevision(Date.now());
      await reload();
      showSavedFeedback(siteSnapshot);
    } catch (err) {
      setSaved(false);
      setSaveError(err instanceof Error ? err.message : copy.media.deleteFailed);
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!data) return;
    const gallery = [...data.content.galleryPhotos];
    const next = index + direction;
    if (next < 0 || next >= gallery.length) return;
    const [item] = gallery.splice(index, 1);
    gallery.splice(next, 0, item!);
    setBusy(true);
    setSaved(false);
    setSaveError("");
    const siteSnapshot = data;
    try {
      const response = await fetch("/api/admin/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ galleryPhotos: gallery }),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !json.ok) {
        setSaveError(json.error || copy.saveFailed);
        return;
      }
      await reload();
      showSavedFeedback(siteSnapshot);
    } finally {
      setBusy(false);
    }
  }

  const content = data?.content;
  const feedbackSiteUrl = viewSiteUrl || resolveViewSiteUrl(data);

  return (
    <AdminPageShell
      title={copy.media.title}
      description={copy.media.description}
      businessName={data?.content.businessName}
    >
      {loading && !busy ? <p className="admin-muted">{copy.loading}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-grid-2">
        <div className="admin-card admin-stack">
          <h2 className="admin-card-title">{copy.media.logo}</h2>
          {content?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={withCacheBust(content.logo, mediaRevision)}
              alt=""
              className="admin-media-logo"
            />
          ) : (
            <p className="admin-muted">{copy.media.noLogo}</p>
          )}
          <label className="admin-label" htmlFor="logo">
            {copy.media.chooseFile}
          </label>
          <input
            id="logo"
            ref={logoInputRef}
            className="admin-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) =>
              void handleUpload("logo", event.target.files?.[0], logoInputRef)
            }
          />
          {content?.logo ? (
            <button
              type="button"
              className="admin-btn-outline"
              disabled={busy}
              onClick={() => void remove("logo")}
            >
              {copy.media.removeLogo}
            </button>
          ) : null}
        </div>

        <div className="admin-card admin-stack">
          <h2 className="admin-card-title">{copy.media.hero}</h2>
          {content?.heroPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={withCacheBust(content.heroPhoto, mediaRevision)}
              alt=""
              className="admin-media-thumb"
            />
          ) : (
            <p className="admin-muted">{copy.media.noHero}</p>
          )}
          <input
            ref={heroInputRef}
            className="admin-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) =>
              void handleUpload("hero", event.target.files?.[0], heroInputRef)
            }
          />
          {content?.heroPhoto ? (
            <button
              type="button"
              className="admin-btn-outline"
              disabled={busy}
              onClick={() => void remove("hero")}
            >
              {copy.media.removeHero}
            </button>
          ) : null}
        </div>
      </div>

      <div className="admin-card admin-stack">
        <h2 className="admin-card-title">{copy.media.gallery}</h2>
        <input
          ref={galleryInputRef}
          className="admin-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(event) =>
            void handleUpload("gallery", event.target.files?.[0], galleryInputRef)
          }
        />
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))",
          }}
        >
          {(content?.galleryPhotos || []).map((src, index) => (
            <div key={`${src}-${index}`} className="admin-stack">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withCacheBust(src, mediaRevision)}
                alt=""
                className="admin-media-thumb"
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                <button
                  type="button"
                  className="admin-btn-outline"
                  disabled={busy}
                  onClick={() => void move(index, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="admin-btn-outline"
                  disabled={busy}
                  onClick={() => void move(index, 1)}
                >
                  →
                </button>
                <button
                  type="button"
                  className="admin-btn-outline"
                  disabled={busy}
                  onClick={() => void remove("gallery", src)}
                >
                  {copy.media.remove}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div ref={feedbackRef} className="admin-card">
        <AdminSaveFeedback
          saved={saved}
          error={saveError}
          siteUrl={feedbackSiteUrl}
          savedLabel={copy.saved}
          viewSiteLabel={copy.viewSite}
        />
        {!saved && !saveError ? (
          <p className="admin-muted" style={{ margin: 0 }}>
            {busy ? copy.saving : copy.media.description}
          </p>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
