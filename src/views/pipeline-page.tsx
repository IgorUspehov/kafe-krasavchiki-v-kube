"use client";

import { useEffect, useState } from "react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchPipelineSnapshot } from "@/lib/factory-api";
import { toErrorMessage } from "@/lib/errors";
import { translateStatus, useTranslation } from "@/lib/i18n/context";

export function PipelinePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<{ step: string; value: string; status: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const snap = await fetchPipelineSnapshot();
        if (cancelled) return;
        setRows([
          {
            step: t("pipeline.projectType"),
            value: snap.projectType?.project_type ?? "—",
            status: snap.projectType?.status ?? "failed",
          },
          {
            step: t("pipeline.repository"),
            value: snap.repository?.best_repo
              ? `${snap.repository.best_repo} (${snap.repository.score ?? 0})`
              : "—",
            status: snap.repository?.status ?? "failed",
          },
          {
            step: t("pipeline.template"),
            value: snap.template?.best_template
              ? `${snap.template.best_template} (${snap.template.score ?? 0})`
              : "—",
            status: snap.template?.status ?? "failed",
          },
          {
            step: t("pipeline.uiLibrary"),
            value: snap.ui?.best_ui
              ? `${snap.ui.best_ui} (${snap.ui.score ?? 0})`
              : "—",
            status: snap.ui?.status ?? "failed",
          },
          {
            step: t("pipeline.complexity"),
            value: snap.complexity?.complexity
              ? `${snap.complexity.complexity} (${snap.complexity.score ?? 0})`
              : "—",
            status: snap.complexity?.status ?? "failed",
          },
          {
            step: t("pipeline.cost"),
            value: snap.cost?.hours
              ? `${snap.cost.hours}h / ${snap.cost.cost_eur ?? 0} EUR`
              : "—",
            status: snap.cost?.status ?? "failed",
          },
          {
            step: t("pipeline.packaging"),
            value: snap.packaging?.recommended ?? "—",
            status: snap.packaging?.status ?? "failed",
          },
          {
            step: t("pipeline.audit"),
            value: snap.audit?.ready_for_v3 ? t("status.readyForV3") : t("status.notReady"),
            status: snap.audit?.status ?? "failed",
          },
        ]);
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
        <CardTitle>{t("pipeline.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dashboard.step")}</TableHead>
              <TableHead>{t("dashboard.value")}</TableHead>
              <TableHead>{t("dashboard.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.step}>
                <TableCell className="font-medium">{row.step}</TableCell>
                <TableCell>{row.value}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "ok" ? "default" : "secondary"}>
                    {translateStatus(t, row.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
