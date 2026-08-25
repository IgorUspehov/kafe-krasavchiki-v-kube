"use client";

import { useEffect, useState } from "react";
import { BookOpen, Github, Hash, FileText, Tags } from "lucide-react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toErrorMessage } from "@/lib/errors";
import { fetchGithubArtifactsSnapshot } from "@/lib/github/github-artifacts";
import { GITHUB_PATHS } from "@/lib/github/generator";
import type { GithubArtifactsSnapshot } from "@/lib/github/types";
import { useTranslation } from "@/lib/i18n/context";

function readyVariant(ready: boolean | undefined) {
  return ready ? "default" : "secondary";
}

export function GithubPage() {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<GithubArtifactsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchGithubArtifactsSnapshot();
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

  const report = snapshot.publishReport;
  const manifest = snapshot.repositoryManifest;
  const ready = report?.status === "READY_TO_PUBLISH";

  const statusCards = [
    {
      key: "readme",
      title: t("githubPage.readmeReady"),
      ready: report?.readme_ready,
      icon: BookOpen,
      path: GITHUB_PATHS.readmeReady,
    },
    {
      key: "release",
      title: t("githubPage.releaseReady"),
      ready: report?.release_ready,
      icon: FileText,
      path: GITHUB_PATHS.releaseBody,
    },
    {
      key: "topics",
      title: t("githubPage.topicsReady"),
      ready: Boolean(snapshot.topics?.topics.length),
      icon: Tags,
      path: GITHUB_PATHS.topics,
    },
    {
      key: "manifest",
      title: t("githubPage.manifestReady"),
      ready: Boolean(manifest),
      icon: Hash,
      path: GITHUB_PATHS.repositoryManifest,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Github className="size-5 text-primary" />
        <span className="text-sm font-semibold">{t("githubPage.title")}</span>
        <Badge variant={readyVariant(ready)}>
          {report?.status ?? "PENDING"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                <Badge variant={readyVariant(card.ready)}>
                  {card.ready ? "READY" : "PENDING"}
                </Badge>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {card.path}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("githubPage.publishReport")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {GITHUB_PATHS.publishReport}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 rounded-md border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(report, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("githubPage.repositoryManifest")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {GITHUB_PATHS.repositoryManifest}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 rounded-md border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(manifest, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {snapshot.releaseTag ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("githubPage.releaseTag")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {GITHUB_PATHS.releaseTag}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">{snapshot.releaseTag.tag}</Badge>
            <Badge>{snapshot.releaseTag.status}</Badge>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-sm text-muted-foreground">{t("githubPage.prepOnly")}</p>
    </div>
  );
}
