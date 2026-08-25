"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Film, Presentation, RefreshCw } from "lucide-react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  type DemoArtifactsSnapshot,
  fetchDemoArtifactsSnapshot,
  publicScreenshotUrl,
} from "@/lib/presentation/demo-artifacts";
import {
  PRESENTATION_ARTIFACT_PATHS,
  fetchPresentationBundle,
} from "@/lib/presentation/generator";
import type { PresentationBundle } from "@/lib/presentation/types";

export function PresentationPage() {
  const { t } = useTranslation();
  const [bundle, setBundle] = useState<PresentationBundle | null>(null);
  const [demo, setDemo] = useState<DemoArtifactsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBundle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, demoSnapshot] = await Promise.all([
        fetchPresentationBundle(t),
        fetchDemoArtifactsSnapshot(),
      ]);
      setBundle(data);
      setDemo(demoSnapshot);
    } catch (err) {
      setError(toErrorMessage(err, t("errors.unknown")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadBundle();
  }, [loadBundle]);

  if (loading) return <PageLoader rows={5} />;
  if (error) return <ErrorBanner message={error} />;
  if (!bundle || !demo) return null;

  const screenshotEntries = Object.entries(demo.screenshots ?? bundle.screenshots);
  const capturedPreviews = screenshotEntries.filter(([, path]) => path.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Presentation className="size-5 text-primary" />
          <Badge>{t("status.selfPresenting")}</Badge>
          <Badge variant="outline">{bundle.presentation.status}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadBundle()}>
          <RefreshCw className="mr-2 size-4" />
          {t("presentationPage.regenerate")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("presentationPage.screenshotsStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("presentationPage.captured")}</span>
              <Badge variant={demo.capturedCount > 0 ? "default" : "secondary"}>
                {demo.capturedCount}/{demo.totalScreenshots}
              </Badge>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {PRESENTATION_ARTIFACT_PATHS.screenshots}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Film className="size-4" />
              {t("presentationPage.demoVideoStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("dashboard.status")}</span>
              <Badge
                variant={
                  demo.demoStatus === "READY"
                    ? "default"
                    : demo.demoStatus === "FFMPEG_NOT_FOUND"
                      ? "destructive"
                      : "secondary"
                }
              >
                {demo.demoStatus}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">{t("presentationPage.demoVideoPath")}</span>
              <p className="mt-1 font-mono text-xs">{demo.demoVideoPath}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {capturedPreviews.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("presentationPage.screenshotPreviewList")}</CardTitle>
            <CardDescription>{t("presentationPage.screenshotPreviewDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {capturedPreviews.map(([key, manifestPath]) => (
                <div key={key} className="space-y-2 rounded-md border p-2">
                  <p className="text-xs font-medium capitalize">{key}</p>
                  <div className="relative aspect-video overflow-hidden rounded-md border bg-muted/30">
                    <Image
                      src={publicScreenshotUrl(manifestPath)}
                      alt={key}
                      fill
                      className="object-cover object-top"
                      unoptimized
                    />
                  </div>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {manifestPath}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="readme">
        <TabsList>
          <TabsTrigger value="readme">{t("presentationPage.readmePreview")}</TabsTrigger>
          <TabsTrigger value="card">{t("presentationPage.projectCardPreview")}</TabsTrigger>
          <TabsTrigger value="screenshots">
            {t("presentationPage.screenshotsPreview")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="readme">
          <Card>
            <CardHeader>
              <CardTitle>{t("presentationPage.readmePreview")}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {PRESENTATION_ARTIFACT_PATHS.readme}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] rounded-md border bg-muted/30 p-4">
                <pre className="text-xs whitespace-pre-wrap">{bundle.readme}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="card">
          <Card>
            <CardHeader>
              <CardTitle>{t("presentationPage.projectCardPreview")}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {PRESENTATION_ARTIFACT_PATHS.projectCard}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] rounded-md border bg-muted/30 p-4">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bundle.projectCard, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screenshots">
          <Card>
            <CardHeader>
              <CardTitle>{t("presentationPage.screenshotsPreview")}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {PRESENTATION_ARTIFACT_PATHS.screenshots}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {demo.capturedCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("presentationPage.noScreenshotsYet")}
                </p>
              ) : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dashboard.step")}</TableHead>
                    <TableHead>{t("presentationPage.manifestPath")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {screenshotEntries.map(([key, path]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium capitalize">{key}</TableCell>
                      <TableCell className="font-mono text-xs">{path || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollArea className="h-40 rounded-md border bg-muted/30 p-4">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(demo.screenshots, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
