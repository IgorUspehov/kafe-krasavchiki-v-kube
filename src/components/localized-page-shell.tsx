"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { useTranslation } from "@/lib/i18n/context";

export function LocalizedPageShell({
  pageKey,
  children,
}: {
  pageKey: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <DashboardShell
      title={t(`pages.${pageKey}.title`)}
      description={t(`pages.${pageKey}.description`)}
    >
      {children}
    </DashboardShell>
  );
}
