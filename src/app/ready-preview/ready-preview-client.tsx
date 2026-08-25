"use client";

import { useSearchParams } from "next/navigation";

import { TenantReadyLinks } from "@/components/tenant-ready-links";
import "@/client-wizard/styles.css";

/**
 * Visual QA surface for the ready-links screen (same component as /client s6).
 * Example: /ready-preview?site=https://…/site/slug
 */
export function ReadyPreviewClient() {
  const params = useSearchParams();
  const site =
    params?.get("site")?.trim() ||
    "https://saas-mvp-funnel-production.up.railway.app/site/example-slug";
  const name = params?.get("name")?.trim() || "Demo Business";

  return (
    <main className="mf-root" data-step="s6" style={{ minHeight: "100svh", padding: "2rem 1rem" }}>
      <div className="build-wrap wizard-ready-wrap" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="step-h" style={{ textAlign: "center" }}>
          Ваш Сайт + CRM + Бронирование готов
        </div>
        <div className="step-sub" style={{ textAlign: "center", marginBottom: 0 }}>
          {name}
        </div>
        <TenantReadyLinks
          publicSiteUrl={site}
          copy={{
            publicSiteLabel: "Ваш сайт для клиентов",
            publicSiteHint: "Эту ссылку размещайте в Google Maps, Instagram или на визитке.",
            jobsLabel: "Страница вакансий",
            jobsHint: "Отправьте эту ссылку соискателям",
            bookingLabel: "Страница бронирования",
            bookingHint: "Отправьте эту ссылку вашим клиентам",
            copyLink: "Копировать ссылку",
            copied: "Скопировано!",
          }}
        />
      </div>
    </main>
  );
}
