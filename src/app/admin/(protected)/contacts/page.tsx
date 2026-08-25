"use client";

import { FormEvent, useEffect, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n";
import { AdminPageShell, useAdminSite } from "@/components/admin/admin-shell";
import { AdminSaveFeedback } from "@/components/admin/admin-save-feedback";
import {
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_WORKING_HOURS,
  WORKING_HOUR_DAYS,
  type SocialLinks,
  type WorkingHours,
} from "@/lib/admin/site-content";

export default function AdminContactsPage() {
  const { copy } = useAdminI18n();
  const { data, loading, error, reload } = useAdminSite();
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [hours, setHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);
  const [social, setSocial] = useState<SocialLinks>(DEFAULT_SOCIAL_LINKS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!data) return;
    setPhone(data.content.phone);
    setWhatsapp(data.content.whatsapp);
    setEmail(data.content.email);
    setAddress(data.content.address);
    setPostalCode(data.content.postalCode);
    setCity(data.content.city);
    setHours(data.content.workingHours);
    setSocial(data.content.socialLinks);
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
        body: JSON.stringify({
          phone,
          whatsapp,
          email,
          address,
          postalCode,
          city,
          workingHours: hours,
          socialLinks: social,
        }),
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
      title={copy.contacts.title}
      description={copy.contacts.description}
      businessName={data?.content.businessName}
    >
      {loading ? <p className="admin-muted">{copy.loading}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-card">
        <form className="admin-stack" onSubmit={(event) => void onSubmit(event)}>
          <div className="admin-field-grid">
            <div>
              <label className="admin-label">{copy.contacts.phone}</label>
              <input className="admin-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="admin-label">{copy.contacts.whatsapp}</label>
              <input className="admin-input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
            <div>
              <label className="admin-label">{copy.contacts.email}</label>
              <input
                className="admin-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="admin-label">{copy.contacts.city}</label>
              <input className="admin-input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className="admin-label">{copy.contacts.postalCode}</label>
              <input
                className="admin-input"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
            <div className="admin-field-span-2">
              <label className="admin-label">{copy.contacts.address}</label>
              <input className="admin-input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          <div className="admin-stack">
            <h2 className="admin-card-title" style={{ marginBottom: 0 }}>
              {copy.contacts.hours}
            </h2>
            <div className="admin-field-grid">
              {WORKING_HOUR_DAYS.map((day) => (
                <div key={day}>
                  <label className="admin-label">{copy.contacts.days[day] || day}</label>
                  <input
                    className="admin-input"
                    value={hours[day]}
                    onChange={(event) =>
                      setHours((current) => ({ ...current, [day]: event.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="admin-stack">
            <h2 className="admin-card-title" style={{ marginBottom: 0 }}>
              {copy.contacts.social}
            </h2>
            <div className="admin-field-grid">
              {(Object.keys(DEFAULT_SOCIAL_LINKS) as (keyof SocialLinks)[]).map((key) => (
                <div key={key}>
                  <label className="admin-label" style={{ textTransform: "capitalize" }}>
                    {key}
                  </label>
                  <input
                    className="admin-input"
                    value={social[key]}
                    onChange={(event) =>
                      setSocial((current) => ({ ...current, [key]: event.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
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
