"use client";

import { useEffect, useState } from "react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchFactoryAudit } from "@/lib/factory-api";
import { fetchStatus } from "@/lib/api";
import { toErrorMessage } from "@/lib/errors";
import { translateStatus, useTranslation } from "@/lib/i18n/context";

export function BuildsPage() {
  const { t } = useTranslation();
  const [mvpStatus, setMvpStatus] = useState("—");
  const [projectName, setProjectName] = useState("—");
  const [readyV3, setReadyV3] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [status, audit] = await Promise.all([fetchStatus(), fetchFactoryAudit()]);
        if (cancelled) return;
        setMvpStatus(status.status ?? "—");
        setProjectName(status.project_name ?? "—");
        setReadyV3(Boolean(audit.ready_for_v3));
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

  const progress = mvpStatus === "WORKING" ? 100 : mvpStatus === "FAILED" ? 15 : 50;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("builds.mvpBuild")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>{t("builds.project")}</span>
            <span className="font-mono text-xs">{projectName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{t("dashboard.status")}</span>
            <Badge variant={mvpStatus === "WORKING" ? "default" : "secondary"}>
              {translateStatus(t, mvpStatus === "—" ? null : mvpStatus)}
            </Badge>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("builds.factoryAudit")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("builds.readyForV3")}</span>
            <Badge variant={readyV3 ? "default" : "secondary"}>
              {readyV3 ? t("status.yes") : t("status.no")}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
