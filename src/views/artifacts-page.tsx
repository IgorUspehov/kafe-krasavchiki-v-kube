"use client";

import { useEffect, useState } from "react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchStatus } from "@/lib/api";
import { ARTIFACT_DEFINITIONS } from "@/lib/artifacts";
import { fetchPipelineSnapshot } from "@/lib/factory-api";
import { toErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n/context";

type Snapshot = Awaited<ReturnType<typeof fetchPipelineSnapshot>>;

export function ArtifactsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [finalReportExists, setFinalReportExists] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogBody, setDialogBody] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [snap, status] = await Promise.all([
          fetchPipelineSnapshot(),
          fetchStatus(),
        ]);
        if (cancelled) return;
        setSnapshot(snap);
        setFinalReportExists(Boolean(status.outputs?.["FINAL_REPORT.md"]));
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

  const openArtifact = (name: string, apiKey: string) => {
    setDialogTitle(name);
    if (apiKey === "finalReport") {
      setDialogBody(
        finalReportExists ? t("artifacts.finalReportAvailable") : t("artifacts.finalReportMissing")
      );
      setDialogOpen(true);
      return;
    }
    const data = snapshot?.[apiKey as keyof Snapshot];
    setDialogBody(JSON.stringify(data ?? { error: "no data" }, null, 2));
    setDialogOpen(true);
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("artifacts.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("artifacts.artifact")}</TableHead>
                <TableHead>{t("artifacts.source")}</TableHead>
                <TableHead>{t("dashboard.status")}</TableHead>
                <TableHead className="text-right">{t("artifacts.view")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ARTIFACT_DEFINITIONS.map((artifact) => {
                const available =
                  artifact.apiKey === "finalReport"
                    ? finalReportExists
                    : Boolean(snapshot?.[artifact.apiKey as keyof Snapshot]);
                return (
                  <TableRow key={artifact.name}>
                    <TableCell className="font-mono text-sm">{artifact.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {artifact.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant={available ? "default" : "secondary"}>
                        {available ? t("artifacts.available") : t("research.missing")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openArtifact(artifact.name, artifact.apiKey)}
                      >
                        {t("artifacts.open")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{t("artifacts.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] rounded-md border p-4">
            <pre className="text-xs whitespace-pre-wrap">{dialogBody}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
