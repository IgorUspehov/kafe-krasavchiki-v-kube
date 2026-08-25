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
import { fetchHistory } from "@/lib/api";
import { toErrorMessage } from "@/lib/errors";
import { translateStatus, useTranslation } from "@/lib/i18n/context";
import type { ProjectHistoryEntry } from "@/types/mvp";

export function ProjectsPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<ProjectHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchHistory();
        if (!cancelled) setEntries(data.entries);
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
        <CardTitle>{t("projects.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("projects.noProjects")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.project")}</TableHead>
                <TableHead>{t("projects.option")}</TableHead>
                <TableHead>{t("dashboard.status")}</TableHead>
                <TableHead>{t("projects.idea")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={`${entry.timestamp}-${entry.project_name}`}>
                  <TableCell className="font-mono text-xs">{entry.project_name}</TableCell>
                  <TableCell>{entry.selected_option}</TableCell>
                  <TableCell>
                    <Badge variant={entry.status === "WORKING" ? "default" : "secondary"}>
                      {translateStatus(t, entry.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{entry.idea}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
