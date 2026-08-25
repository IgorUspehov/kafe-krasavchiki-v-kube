"use client";

import { useEffect, useState } from "react";
import { Box, Globe, Smartphone, TabletSmartphone } from "lucide-react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n/context";
import { PACKAGE_PATHS } from "@/lib/package/generator";
import { fetchPackageArtifactsSnapshot } from "@/lib/package/package-artifacts";
import type { PackageArtifactsSnapshot } from "@/lib/package/types";

function statusBadgeVariant(status: string | undefined) {
  return status === "READY" ? "default" : "secondary";
}

export function PackagingPage() {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<PackageArtifactsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPackageArtifactsSnapshot();
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

  const report = snapshot.packageReport;
  const presentation = snapshot.presentation;

  const webStatus = presentation?.web_status ?? report?.web ?? "PENDING";
  const pwaStatus = presentation?.pwa_status ?? report?.pwa ?? "PENDING";
  const apkStatus = presentation?.apk_status ?? report?.apk ?? "PENDING";

  const statusCards = [
    {
      key: "web",
      title: t("packaging.webReady"),
      status: webStatus,
      path: presentation?.web_artifact_path ?? PACKAGE_PATHS.web,
      icon: Globe,
    },
    {
      key: "pwa",
      title: t("packaging.pwaReady"),
      status: pwaStatus,
      path: presentation?.pwa_artifact_path ?? PACKAGE_PATHS.pwa,
      icon: TabletSmartphone,
    },
    {
      key: "apk",
      title: t("packaging.apkReady"),
      status: apkStatus,
      path: presentation?.apk_artifact_path ?? PACKAGE_PATHS.apk,
      icon: Smartphone,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Box className="size-5 text-primary" />
        <Badge>{t("packaging.packageStatus")}</Badge>
        {report ? (
          <Badge variant="outline">v{report.factory_version}</Badge>
        ) : null}
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
              <CardContent className="space-y-2">
                <Badge variant={statusBadgeVariant(card.status)}>{card.status}</Badge>
                <p className="truncate font-mono text-xs text-muted-foreground">{card.path}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("packaging.pwaStatus")}</CardTitle>
            <CardDescription>{PACKAGE_PATHS.pwa}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">manifest.json</span>
              <Badge variant={statusBadgeVariant(pwaStatus)}>
                {pwaStatus === "READY" ? "READY" : "PENDING"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">icons.json</span>
              <Badge variant={statusBadgeVariant(pwaStatus)}>READY</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">pwa_report.json</span>
              <Badge variant={statusBadgeVariant(pwaStatus)}>READY</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("packaging.apkStatus")}</CardTitle>
            <CardDescription>{PACKAGE_PATHS.apk}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">capacitor.config.json</span>
              <Badge variant={statusBadgeVariant(apkStatus)}>READY</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">android_manifest.json</span>
              <Badge variant={statusBadgeVariant(apkStatus)}>READY</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("packaging.apkBuild")}</span>
              <Badge variant="secondary">{t("packaging.notImplemented")}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("packaging.packageReport")}</CardTitle>
          <CardDescription className="font-mono text-xs">{PACKAGE_PATHS.packageReport}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 rounded-md border bg-muted/30 p-4">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(report, null, 2)}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
