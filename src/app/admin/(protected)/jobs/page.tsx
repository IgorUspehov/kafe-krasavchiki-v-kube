"use client";

import { FormEvent, useEffect, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n";
import { AdminPageShell, useAdminSite } from "@/components/admin/admin-shell";
import { AdminSaveFeedback } from "@/components/admin/admin-save-feedback";
import type { VacancyRecord } from "@/lib/vacancies/store";

export default function AdminJobsPage() {
  const { copy } = useAdminI18n();
  const { data } = useAdminSite();
  const [items, setItems] = useState<VacancyRecord[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [salary, setSalary] = useState("");
  const [requirements, setRequirements] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/jobs", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = (await response.json()) as { ok?: boolean; items?: VacancyRecord[] };
    if (json.ok) setItems(json.items || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    setSaveError("");
    const payload = { title, description, salary, requirements };
    const response = await fetch("/api/admin/jobs", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });
    const json = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !json.ok) {
      setSaveError(json.error || copy.saveFailed);
      return;
    }
    setTitle("");
    setDescription("");
    setSalary("");
    setRequirements("");
    setEditingId(null);
    setSaved(true);
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/jobs?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    await load();
  }

  function edit(item: VacancyRecord) {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setSalary(item.salary || "");
    setRequirements(item.requirements || "");
  }

  return (
    <AdminPageShell
      title={copy.jobs.title}
      description={copy.jobs.description}
      businessName={data?.content.businessName}
    >
      <AdminSaveFeedback
        saved={saved}
        error={saveError}
        siteUrl={data?.publicSiteUrl || (data?.slug ? `/site/${data.slug}` : null)}
        savedLabel={copy.saved}
        viewSiteLabel={copy.viewSite}
      />
      <div className="admin-card">
        <h2 className="admin-card-title">{editingId ? copy.jobs.edit : copy.jobs.newJob}</h2>
        <form className="admin-stack" onSubmit={(event) => void onSubmit(event)}>
          <input
            className="admin-input"
            placeholder={copy.jobs.jobTitle}
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            className="admin-textarea"
            placeholder={copy.jobs.jobDescription}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <input
            className="admin-input"
            placeholder={copy.jobs.salary}
            value={salary}
            onChange={(event) => setSalary(event.target.value)}
          />
          <input
            className="admin-input"
            placeholder={copy.jobs.requirements}
            value={requirements}
            onChange={(event) => setRequirements(event.target.value)}
          />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="submit" className="admin-btn-primary">
              {editingId ? copy.jobs.update : copy.jobs.create}
            </button>
            {editingId ? (
              <button
                type="button"
                className="admin-btn-outline"
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setDescription("");
                  setSalary("");
                  setRequirements("");
                }}
              >
                {copy.jobs.cancel}
              </button>
            ) : null}
          </div>
        </form>
      </div>
      <div className="admin-stack">
        {items.map((item) => (
          <div key={item.id} className="admin-card">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
              className="sm:flex-row"
            >
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{item.title}</p>
                {item.salary ? <p className="admin-muted" style={{ margin: "0.25rem 0 0" }}>{item.salary}</p> : null}
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>{item.description}</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" className="admin-btn-outline" onClick={() => edit(item)}>
                  {copy.jobs.editBtn}
                </button>
                <button type="button" className="admin-btn-outline" onClick={() => void remove(item.id)}>
                  {copy.jobs.deleteBtn}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
