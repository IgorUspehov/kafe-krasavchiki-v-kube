"use client";

import { useEffect, useState } from "react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchStatus } from "@/lib/api";
import { fetchProjectType } from "@/lib/factory-api";
import { toErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n/context";
import type { ApiStatusResponse } from "@/types/mvp";

export function ResearchPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ApiStatusResponse | null>(null);
  const [projectType, setProjectType] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [st, pt] = await Promise.all([fetchStatus(), fetchProjectType()]);
        if (cancelled) return;
        setStatus(st);
        setProjectType(pt.project_type ?? "—");
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

  const outputs = status?.outputs ?? {};

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">{t("research.overview")}</TabsTrigger>
        <TabsTrigger value="outputs">{t("research.outputs")}</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("research.researchStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("research.factoryVersion")}</span>
              <Badge variant="secondary">{status?.factory_version}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("research.projectType")}</span>
              <Badge>{projectType}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">{t("research.rawIdea")}</span>
              <p className="mt-1 rounded-md border bg-muted/40 p-3">{status?.idea ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="outputs">
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(outputs).map(([name, ok]) => (
            <AccordionItem key={name} value={name}>
              <AccordionTrigger>{name}</AccordionTrigger>
              <AccordionContent>
                <Badge variant={ok ? "default" : "secondary"}>
                  {ok ? t("research.present") : t("research.missing")}
                </Badge>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </TabsContent>
    </Tabs>
  );
}
