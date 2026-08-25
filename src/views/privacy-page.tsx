"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/context";

type PrivacySection = { id: string; title: string; text: string };

type PrivacyResponse = {
  status: string;
  title?: string;
  disclaimer?: string;
  sections?: PrivacySection[];
  error?: string;
};

export function PrivacyPage() {
  const { locale, t } = useTranslation();
  const [data, setData] = useState<PrivacyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPrivacy() {
      try {
        const response = await fetch(`/api/legal/privacy?language=${locale}`);
        const payload = (await response.json()) as PrivacyResponse;
        if (!active) {
          return;
        }
        if (payload.status !== "PASS") {
          throw new Error(payload.error ?? "Failed to load privacy policy");
        }
        setData(payload);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load privacy policy");
        }
      }
    }

    void loadPrivacy();
    return () => {
      active = false;
    };
  }, [locale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.privacy.title")}</CardTitle>
        <CardDescription>{t("pages.privacy.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <p className="text-sm text-muted-foreground">{data?.disclaimer}</p>
        <Separator />
        <div className="space-y-4">
          {(data?.sections ?? []).map((section) => (
            <div key={section.id} className="space-y-1">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <p className="text-sm text-muted-foreground">{section.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
