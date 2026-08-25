"use client";

import { useEffect, useState } from "react";
import { FileArchive, Github, PackageCheck, Rocket } from "lucide-react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n/context";
import { RELEASE_PATHS } from "@/lib/release/generator";
import { fetchReleaseArtifactsSnapshot } from "@/lib/release/release-artifacts";
import type { ReleaseArtifactsSnapshot } from "@/lib/release/types";

function readyVariant(ready: boolean | undefined) {
  return ready ? "default" : "secondary";
}

export function ReleasePage() {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<ReleaseArtifactsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchReleaseArtifactsSnapshot();
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

  const manifest = snapshot.releaseManifest;
  const report = snapshot.releaseReport;
  const github = snapshot.githubReport;
  const presentation = snapshot.presentation;

  const bundleReady = manifest?.bundle_ready ?? presentation?.release_ready ?? false;
  const githubReady = github?.github_ready ?? bundleReady;
  const zipReady = report?.bundle_ready ?? bundleReady;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Rocket className="size-5 text-primary" />
        <Badge>{t("releasePage.releaseStatus")}</Badge>
        <Badge variant={readyVariant(bundleReady)}>
          {bundleReady ? "RELEASE_READY" : "PENDING"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("releasePage.bundleStatus")}</CardTitle>
            <PackageCheck className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Badge variant={readyVariant(bundleReady)}>
              {bundleReady ? "BUNDLE_READY" : "PENDING"}
            </Badge>
            <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
              {presentation?.bundle_path ?? RELEASE_PATHS.bundle}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("releasePage.githubReady")}</CardTitle>
            <Github className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Badge variant={readyVariant(githubReady)}>
              {githubReady ? "GITHUB_READY" : "PENDING"}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">{t("releasePage.githubPrepOnly")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("releasePage.zipReady")}</CardTitle>
            <FileArchive className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Badge variant={readyVariant(zipReady)}>
              {zipReady ? "ZIP_READY" : "PENDING"}
            </Badge>
            <p className="mt-2 font-mono text-xs text-muted-foreground">project_bundle.zip</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("releasePage.filesIncluded")}</CardTitle>
          <CardDescription>{RELEASE_PATHS.releaseReport}</CardDescription>
        </CardHeader>
        <CardContent>
          {report?.files_included?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t("releasePage.file")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.files_included.map((file, index) => (
                  <TableRow key={`${file}-${index}`}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{file}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">{t("releasePage.runGenerate")}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("releasePage.releaseManifest")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {RELEASE_PATHS.releaseManifest}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 rounded-md border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(manifest, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("releasePage.githubReport")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {RELEASE_PATHS.githubReport}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 rounded-md border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(github, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
