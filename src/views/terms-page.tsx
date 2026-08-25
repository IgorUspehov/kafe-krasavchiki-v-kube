"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/context";

type TermsRule = { id: number; text: string };

type TermsResponse = {
  status: string;
  title?: string;
  disclaimer?: string;
  rules?: TermsRule[];
  error?: string;
};

export function TermsPage() {
  const { locale, t } = useTranslation();
  const [data, setData] = useState<TermsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTerms() {
      try {
        const response = await fetch(`/api/legal/terms?language=${locale}`);
        const payload = (await response.json()) as TermsResponse;
        if (!active) {
          return;
        }
        if (payload.status !== "PASS") {
          throw new Error(payload.error ?? "Failed to load terms");
        }
        setData(payload);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load terms");
        }
      }
    }

    void loadTerms();
    return () => {
      active = false;
    };
  }, [locale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.terms.title")}</CardTitle>
        <CardDescription>{t("pages.terms.description")}</CardDescription>
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
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          {(data?.rules ?? []).map((rule) => (
            <li key={rule.id}>{rule.text}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
