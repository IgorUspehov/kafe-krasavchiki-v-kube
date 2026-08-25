"use client";

import { useCallback, useEffect, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSectionPager } from "@/components/admin/admin-section-pager";
import type { SiteContent } from "@/lib/admin/site-content";

export type AdminSiteResponse = {
  ok: boolean;
  clientId: string;
  slug?: string | null;
  paid?: boolean;
  publicSiteUrl?: string | null;
  crmUrl?: string | null;
  content: SiteContent;
  error?: string;
};

export function useAdminSite() {
  const { copy } = useAdminI18n();
  const [data, setData] = useState<AdminSiteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/site", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const json = (await response.json()) as AdminSiteResponse;
      if (!response.ok || !json.ok) {
        setError(json.error || copy.loadFailed);
        setData(null);
        return;
      }
      setError(null);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [copy.loadFailed]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

export function AdminPageShell({
  title,
  description,
  businessName,
  children,
}: {
  title: string;
  description?: string;
  businessName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root">
      <AdminNav businessName={businessName} />
      <main className="admin-main">
        <div className="admin-page-intro">
          <h1 className="admin-page-title">{title}</h1>
          {description ? <p className="admin-page-desc">{description}</p> : null}
        </div>
        {children}
        <AdminSectionPager />
      </main>
    </div>
  );
}
