"use client";

import { FormEvent, useEffect, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n";
import { AdminPageShell, useAdminSite } from "@/components/admin/admin-shell";
import { AdminSaveFeedback } from "@/components/admin/admin-save-feedback";

export default function AdminContentPage() {
  const { copy } = useAdminI18n();
  const { data, loading, error, reload } = useAdminSite();
  const [businessName, setBusinessName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!data) return;
    setBusinessName(data.content.businessName);
    setSubtitle(data.content.subtitle);
    setDescription(data.content.description);
  }, [data]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const response = await fetch("/api/admin/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ businessName, subtitle, description }),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !json.ok) {
        setSaveError(json.error || copy.saveFailed);
        return;
      }
      setSaved(true);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      title={copy.content.title}
      description={copy.content.description}
      businessName={data?.content.businessName}
    >
      {loading ? <p className="admin-muted">{copy.loading}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-card">
        <form className="admin-stack" onSubmit={(event) => void onSubmit(event)}>
          <div>
            <label className="admin-label" htmlFor="businessName">
              {copy.content.businessName}
            </label>
            <input
              id="businessName"
              className="admin-input"
              required
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="subtitle">
              {copy.content.subtitle}
            </label>
            <input
              id="subtitle"
              className="admin-input"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="description">
              {copy.content.descriptionField}
            </label>
            <textarea
              id="description"
              className="admin-textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <AdminSaveFeedback
            saved={saved}
            error={saveError}
            siteUrl={data?.publicSiteUrl || (data?.slug ? `/site/${data.slug}` : null)}
            savedLabel={copy.saved}
            viewSiteLabel={copy.viewSite}
          />
          <button type="submit" className="admin-btn-primary" disabled={saving || loading}>
            {saving ? copy.saving : copy.save}
          </button>
        </form>
      </div>
    </AdminPageShell>
  );
}
