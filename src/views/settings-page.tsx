"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-muted-foreground">{t("settings.apiUrl")}</p>
          <p className="mt-1 font-mono text-xs">{getApiUrl()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t("settings.uiStack")}</p>
          <p className="mt-1">React · Next.js · Tailwind CSS · shadcn/ui</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t("settings.env")}</p>
          <p className="mt-1 font-mono text-xs">NEXT_PUBLIC_API_URL</p>
        </div>
      </CardContent>
    </Card>
  );
}
