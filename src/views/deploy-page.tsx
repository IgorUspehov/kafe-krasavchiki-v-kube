"use client";

import { useEffect, useState } from "react";
import { Cloud, Container, Rocket, Server } from "lucide-react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchDeployArtifactsSnapshot } from "@/lib/deploy/deploy-artifacts";
import { DEPLOY_PATHS } from "@/lib/deploy/generator";
import type { DeployArtifactsSnapshot } from "@/lib/deploy/types";
import { toErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n/context";

function readyVariant(ready: boolean | undefined) {
  return ready ? "default" : "secondary";
}

export function DeployPage() {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<DeployArtifactsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchDeployArtifactsSnapshot();
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

  const manifest = snapshot.deployManifest;
  const report = snapshot.deploymentReport;
  const deployReady = report?.status === "DEPLOY_READY";

  const statusCards = [
    {
      key: "netlify",
      title: t("deployPage.netlifyReady"),
      ready: manifest?.netlify_ready,
      icon: Cloud,
      path: DEPLOY_PATHS.netlifyToml,
    },
    {
      key: "vercel",
      title: t("deployPage.vercelReady"),
      ready: manifest?.vercel_ready,
      icon: Server,
      path: DEPLOY_PATHS.vercelJson,
    },
    {
      key: "docker",
      title: t("deployPage.dockerReady"),
      ready: manifest?.docker_ready,
      icon: Container,
      path: DEPLOY_PATHS.dockerfile,
    },
    {
      key: "deployment",
      title: t("deployPage.deploymentReady"),
      ready: manifest?.deployment_ready,
      icon: Rocket,
      path: DEPLOY_PATHS.deployManifest,
    },
  ];

  const filePaths = [
    { label: "netlify.toml", path: DEPLOY_PATHS.netlifyToml },
    { label: "vercel.json", path: DEPLOY_PATHS.vercelJson },
    { label: "Dockerfile", path: DEPLOY_PATHS.dockerfile },
    { label: "docker-compose.yml", path: DEPLOY_PATHS.dockerCompose },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Rocket className="size-5 text-primary" />
        <span className="text-sm font-semibold">{t("deployPage.title")}</span>
        <Badge variant={readyVariant(deployReady)}>
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

      <Card>
        <CardHeader>
          <CardTitle>{t("deployPage.configPaths")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {filePaths.map((file) => (
            <div key={file.label} className="flex justify-between gap-4">
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
            <CardTitle>{t("deployPage.deploymentManifest")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {DEPLOY_PATHS.deployManifest}
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

        <Card>
          <CardHeader>
            <CardTitle>{t("deployPage.deploymentReport")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {DEPLOY_PATHS.deploymentReport}
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
      </div>

      <p className="text-sm text-muted-foreground">{t("deployPage.prepOnly")}</p>
    </div>
  );
}
