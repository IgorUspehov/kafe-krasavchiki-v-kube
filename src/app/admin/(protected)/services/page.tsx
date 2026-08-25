"use client";

import { useEffect, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n";
import { AdminPageShell, useAdminSite } from "@/components/admin/admin-shell";
import { AdminSaveFeedback } from "@/components/admin/admin-save-feedback";
import type { CatalogItem } from "@/lib/catalog/resolve-catalog";
import type { Locale } from "@/lib/i18n/config";
import type { LocalizedLabel } from "@/lib/niches/sector-models";

type Row = {
  id: string;
  name: LocalizedLabel;
  price: string;
  duration: LocalizedLabel;
};

function emptyLabel(): LocalizedLabel {
  return { en: "", de: "", ru: "" };
}

function asLabel(value: CatalogItem["name"] | CatalogItem["duration"] | undefined): LocalizedLabel {
  if (!value) return emptyLabel();
  if (typeof value === "string") {
    return { en: value, de: value, ru: value };
  }
  return {
    en: value.en || "",
    de: value.de || "",
    ru: value.ru || "",
  };
}

function pickLabel(label: LocalizedLabel, locale: Locale): string {
  return label[locale] || label.en || label.de || label.ru || "";
}

function toRows(items: CatalogItem[]): Row[] {
  return items.map((item) => ({
    id: item.id,
    name: asLabel(item.name),
    price: item.price || "",
    duration: asLabel(item.duration),
  }));
}

export default function AdminServicesPage() {
  const { copy, locale } = useAdminI18n();
  const { data } = useAdminSite();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/catalog", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const json = (await response.json()) as { ok?: boolean; items?: CatalogItem[]; error?: string };
      if (!response.ok || !json.ok) {
        setSaveError(json.error || copy.loadFailed);
        return;
      }
      setRows(toRows(json.items || []));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(nextRows: Row[]) {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const items = nextRows.map((row) => ({
        id: row.id,
        name: row.name,
        price: row.price,
        duration: row.duration,
      }));
      const response = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ items }),
      });
      const json = (await response.json()) as { ok?: boolean; items?: CatalogItem[]; error?: string };
      if (!response.ok || !json.ok) {
        setSaveError(json.error || copy.saveFailed);
        return;
      }
      setRows(json.items ? toRows(json.items) : nextRows);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function updateName(index: number, value: string) {
    setRows((current) =>
      current.map((row, i) =>
        i === index ? { ...row, name: { ...row.name, [locale]: value } } : row,
      ),
    );
  }

  function updateDuration(index: number, value: string) {
    setRows((current) =>
      current.map((row, i) =>
        i === index ? { ...row, duration: { ...row.duration, [locale]: value } } : row,
      ),
    );
  }

  function updatePrice(index: number, value: string) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, price: value } : row)));
  }

  return (
    <AdminPageShell
      title={copy.services.title}
      description={copy.services.description}
      businessName={data?.content.businessName}
    >
      {loading ? <p className="admin-muted">{copy.loading}</p> : null}
      <AdminSaveFeedback
        saved={saved}
        error={saveError}
        siteUrl={data?.publicSiteUrl || (data?.slug ? `/site/${data.slug}` : null)}
        savedLabel={copy.saved}
        viewSiteLabel={copy.viewSite}
      />
      <div className="admin-card admin-stack">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <h2 className="admin-card-title" style={{ margin: 0 }}>
            {copy.services.catalog}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="admin-badge">{locale.toUpperCase()}</span>
            <button
              type="button"
              className="admin-btn-outline"
              disabled={saving}
              onClick={() =>
                setRows((current) => [
                  ...current,
                  {
                    id: `svc-${Date.now()}`,
                    name: emptyLabel(),
                    price: "",
                    duration: emptyLabel(),
                  },
                ])
              }
            >
              {copy.services.add}
            </button>
          </div>
        </div>
        {rows.map((row, index) => (
          <div key={row.id} className="admin-service-row">
            <input
              className="admin-input"
              placeholder={`${copy.services.name} (${locale.toUpperCase()})`}
              value={pickLabel(row.name, locale)}
              onChange={(event) => updateName(index, event.target.value)}
            />
            <input
              className="admin-input"
              placeholder={copy.services.price}
              value={row.price}
              onChange={(event) => updatePrice(index, event.target.value)}
            />
            <input
              className="admin-input"
              placeholder={`${copy.services.duration} (${locale.toUpperCase()})`}
              value={pickLabel(row.duration, locale)}
              onChange={(event) => updateDuration(index, event.target.value)}
            />
            <button
              type="button"
              className="admin-btn-outline"
              onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
            >
              {copy.services.remove}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="admin-btn-primary"
          disabled={saving || loading}
          onClick={() => void save(rows)}
        >
          {saving ? copy.saving : copy.save}
        </button>
      </div>
    </AdminPageShell>
  );
}
