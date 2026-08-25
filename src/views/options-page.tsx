"use client";

import { useEffect, useState } from "react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchStatus } from "@/lib/api";
import { toErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n/context";

export function OptionsPage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [hasOptions, setHasOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await fetchStatus();
        if (cancelled) return;
        setSelected(status.selected_option);
        setHasOptions(Boolean(status.outputs?.["PROMPT_OPTIONS.json"]));
      } catch (err) {
        if (!cancelled) setError(toErrorMessage(err, t("errors.unknown")));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("options.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">PROMPT_OPTIONS.json</span>
          <Badge variant={hasOptions ? "default" : "secondary"}>
            {hasOptions ? t("options.ready") : t("research.missing")}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("options.selectedOption")}</span>
          <Badge>{selected ?? t("options.notSelected")}</Badge>
        </div>
        <ScrollArea className="h-40 rounded-md border p-4 text-sm text-muted-foreground">
          {t("options.hint")}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
