"use client";

import { useEffect, useState } from "react";
import { FileArchive, FileText, Handshake, PackageCheck } from "lucide-react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchClientArtifactsSnapshot } from "@/lib/client/client-artifacts";
import { CLIENT_PATHS } from "@/lib/client/generator";
import type { ClientArtifactsSnapshot } from "@/lib/client/types";
import { toErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n/context";

function readyVariant(ready: boolean | undefined) {
  return ready ? "default" : "secondary";
}

export function ClientPage() {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<ClientArtifactsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchClientArtifactsSnapshot();
        if (!cancelled) setSnapshot(data);
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

  if (loading) return <PageLoader rows={4} />;
  if (error) return <ErrorBanner message={error} />;
  if (!snapshot) return null;

  const manifest = snapshot.clientManifest;
  const report = snapshot.clientDeliveryReport;
  const clientReady = report?.status === "CLIENT_READY";

  const statusCards = [
    {
      key: "client",
      title: t("clientPage.clientReady"),
      ready: manifest?.client_ready,
      icon: PackageCheck,
    },
    {
      key: "handover",
      title: t("clientPage.handoverReady"),
      ready: manifest?.handover_ready,
      icon: Handshake,
    },
    {
      key: "delivery",
      title: t("clientPage.deliveryReady"),
      ready: manifest?.delivery_ready,
      icon: FileArchive,
    },
  ];

  const artifactPaths = [
    { label: t("clientPage.projectSummary"), path: CLIENT_PATHS.projectSummary },
    { label: t("clientPage.offer"), path: CLIENT_PATHS.offer },
    { label: t("clientPage.clientPackage"), path: CLIENT_PATHS.clientPackage },
    { label: t("clientPage.deliveryChecklist"), path: CLIENT_PATHS.deliveryChecklist },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Handshake className="size-5 text-primary" />
        <span className="text-sm font-semibold">{t("clientPage.title")}</span>
        <Badge variant={readyVariant(clientReady)}>
          {report?.status ?? "PENDING"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statusCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant={readyVariant(card.ready)}>
                  {card.ready ? "READY" : "PENDING"}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("clientPage.artifacts")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {artifactPaths.map((file) => (
            <div key={file.path} className="flex justify-between gap-4">
              <span className="font-medium">{file.label}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {file.path}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              {t("clientPage.projectSummary")}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {CLIENT_PATHS.projectSummary}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 rounded-md border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap">
                {snapshot.projectSummary ?? "—"}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              {t("clientPage.offer")}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {CLIENT_PATHS.offer}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 rounded-md border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap">
                {snapshot.offer ?? "—"}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("clientPage.deliveryChecklist")}</CardTitle>
          <CardDescription className="font-mono text-xs">
            {CLIENT_PATHS.deliveryChecklist}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40 rounded-md border bg-muted/30 p-4">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(snapshot.deliveryChecklist, null, 2)}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{t("clientPage.prepOnly")}</p>
    </div>
  );
}
