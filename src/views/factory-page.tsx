"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppWindow,
  Blocks,
  CloudUpload,
  Database,
  Layers,
  Cpu,
  Factory,
  HardDrive,
  Github,
  Handshake,
  Package,
  Play,
  Presentation,
  Link2,
  Rocket,
  Server,
  ShieldCheck,
} from "lucide-react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n/context";
import { FACTORY_GENERATE_COMMAND } from "@/lib/orchestrator/generator";
import {
  FACTORY_OUTPUT_PATHS,
  fetchFactoryOutputSnapshot,
} from "@/lib/orchestrator/output-assembler";
import { fetchAppArtifactsSnapshot } from "@/lib/app/app-artifacts";
import { APP_PATHS } from "@/lib/app/paths";
import type { AppArtifactsSnapshot } from "@/lib/app/types";
import { fetchAssemblyArtifactsSnapshot } from "@/lib/assembly/assembly-artifacts";
import { ASSEMBLY_PATHS } from "@/lib/assembly/paths";
import type { AssemblyArtifactsSnapshot } from "@/lib/assembly/types";
import { fetchBindingArtifactsSnapshot } from "@/lib/binding/binding-artifacts";
import { BINDING_PATHS } from "@/lib/binding/paths";
import type { BindingArtifactsSnapshot } from "@/lib/binding/types";
import { fetchDatabaseArtifactsSnapshot } from "@/lib/database-factory/database-artifacts";
import { DATABASE_PATHS } from "@/lib/database-factory/paths";
import type { DatabaseArtifactsSnapshot } from "@/lib/database-factory/types";
import { fetchExecutionArtifactsSnapshot } from "@/lib/execution-factory/execution-artifacts";
import { EXECUTION_PATHS } from "@/lib/execution-factory/paths";
import type { ExecutionArtifactsSnapshot } from "@/lib/execution-factory/types";
import { fetchBackendArtifactsSnapshot } from "@/lib/backend/backend-artifacts";
import { BACKEND_PATHS } from "@/lib/backend/paths";
import type { BackendArtifactsSnapshot } from "@/lib/backend/types";
import { fetchDataArtifactsSnapshot } from "@/lib/data/data-artifacts";
import { DATA_PATHS } from "@/lib/data/paths";
import type { DataArtifactsSnapshot } from "@/lib/data/types";
import { fetchScaffoldArtifactsSnapshot } from "@/lib/scaffold/scaffold-artifacts";
import { SCAFFOLD_PATHS } from "@/lib/scaffold/paths";
import type { ScaffoldArtifactsSnapshot } from "@/lib/scaffold/types";
import { fetchRuntimeArtifactsSnapshot } from "@/lib/runtime/runtime-artifacts";
import { RUNTIME_PATHS } from "@/lib/runtime/paths";
import type { RuntimeArtifactsSnapshot } from "@/lib/runtime/types";
import type { FactoryOutputSnapshot } from "@/lib/orchestrator/types";
import { fetchValidationArtifactsSnapshot } from "@/lib/validation-factory/validation-artifacts";
import { VALIDATION_PATHS } from "@/lib/validation-factory/paths";
import type { ValidationArtifactsSnapshot } from "@/lib/validation-factory/types";

function readyVariant(ready: boolean | undefined) {
  return ready ? "default" : "secondary";
}

export function FactoryPage() {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<FactoryOutputSnapshot | null>(null);
  const [runtimeSnapshot, setRuntimeSnapshot] = useState<RuntimeArtifactsSnapshot | null>(null);
  const [appSnapshot, setAppSnapshot] = useState<AppArtifactsSnapshot | null>(null);
  const [scaffoldSnapshot, setScaffoldSnapshot] = useState<ScaffoldArtifactsSnapshot | null>(null);
  const [assemblySnapshot, setAssemblySnapshot] = useState<AssemblyArtifactsSnapshot | null>(null);
  const [dataSnapshot, setDataSnapshot] = useState<DataArtifactsSnapshot | null>(null);
  const [backendSnapshot, setBackendSnapshot] = useState<BackendArtifactsSnapshot | null>(null);
  const [bindingSnapshot, setBindingSnapshot] = useState<BindingArtifactsSnapshot | null>(null);
  const [executionSnapshot, setExecutionSnapshot] = useState<ExecutionArtifactsSnapshot | null>(null);
  const [databaseSnapshot, setDatabaseSnapshot] = useState<DatabaseArtifactsSnapshot | null>(null);
  const [validationSnapshot, setValidationSnapshot] = useState<ValidationArtifactsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulateMessage, setSimulateMessage] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, runtime, app, scaffold, assembly, dataModel, backend, binding, execution, database, validation] =
        await Promise.all([
          fetchFactoryOutputSnapshot(),
          fetchRuntimeArtifactsSnapshot(),
          fetchAppArtifactsSnapshot(),
          fetchScaffoldArtifactsSnapshot(),
          fetchAssemblyArtifactsSnapshot(),
          fetchDataArtifactsSnapshot(),
          fetchBackendArtifactsSnapshot(),
          fetchBindingArtifactsSnapshot(),
          fetchExecutionArtifactsSnapshot(),
          fetchDatabaseArtifactsSnapshot(),
          fetchValidationArtifactsSnapshot(),
        ]);
      setSnapshot(data);
      setRuntimeSnapshot(runtime);
      setAppSnapshot(app);
      setScaffoldSnapshot(scaffold);
      setAssemblySnapshot(assembly);
      setDataSnapshot(dataModel);
      setBackendSnapshot(backend);
      setBindingSnapshot(binding);
      setExecutionSnapshot(execution);
      setDatabaseSnapshot(database);
      setValidationSnapshot(validation);
    } catch (err) {
      setError(toErrorMessage(err, t("errors.unknown")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const handleGenerateAll = () => {
    setSimulating(true);
    setSimulateMessage(`${t("factoryPage.generateSimulated")} ${FACTORY_GENERATE_COMMAND}`);
    window.setTimeout(() => {
      setSimulating(false);
      void loadSnapshot();
    }, 1200);
  };

  if (loading && !snapshot) return <PageLoader rows={5} />;
  if (error && !snapshot) return <ErrorBanner message={error} />;

  const manifest = snapshot?.factoryManifest;
  const report = snapshot?.factoryReport;
  const execution = snapshot?.executionReport;
  const factoryReady = report?.status === "FACTORY_READY";

  const moduleCards = [
    {
      key: "presentation",
      title: t("factoryPage.presentationReady"),
      ready: manifest?.presentation,
      icon: Presentation,
      path: FACTORY_OUTPUT_PATHS.presentation,
    },
    {
      key: "package",
      title: t("factoryPage.packageReady"),
      ready: manifest?.package,
      icon: Package,
      path: FACTORY_OUTPUT_PATHS.package,
    },
    {
      key: "release",
      title: t("factoryPage.releaseReady"),
      ready: manifest?.release,
      icon: Rocket,
      path: FACTORY_OUTPUT_PATHS.release,
    },
    {
      key: "github",
      title: t("factoryPage.githubReady"),
      ready: manifest?.github,
      icon: Github,
      path: FACTORY_OUTPUT_PATHS.github,
    },
    {
      key: "deploy",
      title: t("factoryPage.deployReady"),
      ready: manifest?.deploy,
      icon: CloudUpload,
      path: FACTORY_OUTPUT_PATHS.deploy,
    },
    {
      key: "client",
      title: t("factoryPage.clientReady"),
      ready: manifest?.client,
      icon: Handshake,
      path: FACTORY_OUTPUT_PATHS.client,
    },
    {
      key: "runtime",
      title: t("factoryPage.runtimeReady"),
      ready: manifest?.runtime,
      icon: Cpu,
      path: FACTORY_OUTPUT_PATHS.runtime,
    },
    {
      key: "app",
      title: t("factoryPage.appReady"),
      ready: manifest?.app,
      icon: AppWindow,
      path: FACTORY_OUTPUT_PATHS.app,
    },
    {
      key: "scaffold",
      title: t("factoryPage.scaffoldReady"),
      ready: manifest?.scaffold,
      icon: Blocks,
      path: FACTORY_OUTPUT_PATHS.scaffold,
    },
    {
      key: "assembly",
      title: t("factoryPage.assemblyReady"),
      ready: manifest?.assembly,
      icon: Layers,
      path: FACTORY_OUTPUT_PATHS.assembly,
    },
    {
      key: "data",
      title: t("factoryPage.dataReady"),
      ready: manifest?.data,
      icon: Database,
      path: FACTORY_OUTPUT_PATHS.data,
    },
    {
      key: "backend",
      title: t("factoryPage.backendReady"),
      ready: manifest?.backend,
      icon: Server,
      path: FACTORY_OUTPUT_PATHS.backend,
    },
    {
      key: "binding",
      title: t("factoryPage.bindingReady"),
      ready: manifest?.binding,
      icon: Link2,
      path: FACTORY_OUTPUT_PATHS.binding,
    },
    {
      key: "execution",
      title: t("factoryPage.executionReady"),
      ready: manifest?.execution,
      icon: Play,
      path: FACTORY_OUTPUT_PATHS.execution,
    },
    {
      key: "database",
      title: t("factoryPage.databaseReady"),
      ready: manifest?.database,
      icon: HardDrive,
      path: FACTORY_OUTPUT_PATHS.database,
    },
    {
      key: "validation",
      title: t("factoryPage.validationReady"),
      ready: manifest?.validation,
      icon: ShieldCheck,
      path: FACTORY_OUTPUT_PATHS.validation,
    },
  ];

  const outputFiles = [
    { label: "README.md", path: FACTORY_OUTPUT_PATHS.readme },
    { label: "demo.mp4", path: FACTORY_OUTPUT_PATHS.demoVideo },
    { label: "project_bundle.zip", path: FACTORY_OUTPUT_PATHS.releaseBundle },
    { label: "client_package.zip", path: FACTORY_OUTPUT_PATHS.clientPackage },
  ];

  const modulePaths = [
    { label: "presentation/", path: FACTORY_OUTPUT_PATHS.presentation },
    { label: "package/", path: FACTORY_OUTPUT_PATHS.package },
    { label: "release/", path: FACTORY_OUTPUT_PATHS.release },
    { label: "github/", path: FACTORY_OUTPUT_PATHS.github },
    { label: "deploy/", path: FACTORY_OUTPUT_PATHS.deploy },
    { label: "client/", path: FACTORY_OUTPUT_PATHS.client },
    { label: "runtime/", path: FACTORY_OUTPUT_PATHS.runtime },
    { label: "app/", path: FACTORY_OUTPUT_PATHS.app },
    { label: "scaffold/", path: FACTORY_OUTPUT_PATHS.scaffold },
    { label: "assembly/", path: FACTORY_OUTPUT_PATHS.assembly },
    { label: "data/", path: FACTORY_OUTPUT_PATHS.data },
    { label: "backend/", path: FACTORY_OUTPUT_PATHS.backend },
    { label: "binding/", path: FACTORY_OUTPUT_PATHS.binding },
    { label: "execution/", path: FACTORY_OUTPUT_PATHS.execution },
    { label: "database/", path: FACTORY_OUTPUT_PATHS.database },
    { label: "validation/", path: FACTORY_OUTPUT_PATHS.validation },
  ];

  const assemblyManifest = assemblySnapshot?.assemblyManifest;
  const assemblyReport = assemblySnapshot?.assemblyReport;
  const assemblyReady = assemblyReport?.status === "ASSEMBLY_READY";
  const dataManifest = dataSnapshot?.dataManifest;
  const dataReport = dataSnapshot?.dataReport;
  const dataReady = dataReport?.status === "DATA_MODEL_READY";
  const backendManifest = backendSnapshot?.backendManifest;
  const backendReport = backendSnapshot?.backendReport;
  const backendReady = backendReport?.status === "BACKEND_READY";
  const bindingManifest = bindingSnapshot?.bindingManifest;
  const bindingReport = bindingSnapshot?.bindingReport;
  const bindingReady = bindingReport?.status === "BINDING_READY";
  const executionModuleManifest = executionSnapshot?.executionManifest;
  const executionModuleReport = executionSnapshot?.executionReport;
  const executionReady = executionModuleReport?.status === "EXECUTION_READY";
  const databaseModuleManifest = databaseSnapshot?.databaseManifest;
  const databaseModuleReport = databaseSnapshot?.databaseReport;
  const databaseReady = databaseModuleReport?.status === "DATABASE_READY";
  const validationManifest = validationSnapshot?.validationManifest;
  const validationReport = validationSnapshot?.validationReport;
  const validationReady = validationReport?.status === "RUNTIME_VALID";
  const runtimeScore = validationSnapshot?.runtimeScore as {
    build_score?: number;
    frontend_score?: number;
    backend_score?: number;
    database_score?: number;
    api_score?: number;
    overall_score?: number;
  } | null;

  const scaffoldManifest = scaffoldSnapshot?.scaffoldManifest;
  const scaffoldReport = scaffoldSnapshot?.scaffoldReport;
  const scaffoldProjectName = scaffoldManifest?.project_name ?? "MVP_PROJECT";
  const scaffoldReady = scaffoldReport?.status === "SCAFFOLD_READY";

  const appManifest = appSnapshot?.appManifest;
  const appReport = appSnapshot?.appReport;
  const appProjectName = appManifest?.project_name ?? "MVP_PROJECT";
  const appReady = appReport?.status === "APP_READY";

  const runtimeManifest = runtimeSnapshot?.runtimeManifest;
  const runtimeReport = runtimeSnapshot?.runtimeReport;
  const projectName = runtimeManifest?.project_name ?? "MVP_PROJECT";
  const runtimeReady = runtimeReport?.status === "RUNTIME_READY";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Factory className="size-5 text-primary" />
          <span className="text-sm font-semibold">{t("factoryPage.title")}</span>
          <Badge variant={readyVariant(factoryReady)}>
            {report?.status ?? "PENDING"}
          </Badge>
        </div>
        <Button
          variant="default"
          size="sm"
          disabled={simulating}
          onClick={handleGenerateAll}
        >
          <Play className="mr-2 size-4" />
          {t("factoryPage.generateAll")}
        </Button>
      </div>

      {simulateMessage ? (
        <p className="text-sm text-muted-foreground">{simulateMessage}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {moduleCards.map((card) => {
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
                  {card.path}/
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="size-4" />
            {t("factoryPage.runtimeSection")}
          </CardTitle>
          <CardDescription>{FACTORY_OUTPUT_PATHS.runtime}/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readyVariant(runtimeReady)}>
              {runtimeReport?.status ?? t("factoryPage.runtimeStatus")}
            </Badge>
            <Badge variant={readyVariant(runtimeReport?.package_generated)}>
              {t("factoryPage.runtimePackageGenerated")}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.generatedFilesCount")}: {runtimeReport?.files_count ?? 0}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.runtimeManifest")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(runtimeManifest, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {RUNTIME_PATHS.manifest}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.runtimeReport")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(runtimeReport, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {RUNTIME_PATHS.report}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: "start.sh", path: RUNTIME_PATHS.startSh(projectName) },
              { label: "stop.sh", path: RUNTIME_PATHS.stopSh(projectName) },
              { label: "status.sh", path: RUNTIME_PATHS.statusSh(projectName) },
              { label: "manifest.yml", path: RUNTIME_PATHS.manifestYml(projectName) },
              { label: "README.txt", path: RUNTIME_PATHS.readmeTxt(projectName) },
            ].map((file) => (
              <div key={file.path} className="flex justify-between gap-4">
                <span className="font-medium">{file.label}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {file.path}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AppWindow className="size-4" />
            {t("factoryPage.appBuilderSection")}
          </CardTitle>
          <CardDescription>{FACTORY_OUTPUT_PATHS.app}/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readyVariant(appReady)}>
              {appReport?.status ?? t("factoryPage.appStatus")}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.templateUsed")}: {appReport?.template_used ?? "—"}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.generatedFilesCount")}: {appReport?.files_count ?? 0}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.appManifest")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(appManifest, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {APP_PATHS.manifest}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.appReport")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(appReport, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {APP_PATHS.report}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: "index.html", path: APP_PATHS.indexHtml(appProjectName) },
              { label: "package.json", path: APP_PATHS.packageJson(appProjectName) },
              { label: "src/main.js", path: APP_PATHS.mainJs(appProjectName) },
              { label: "src/styles.css", path: APP_PATHS.stylesCss(appProjectName) },
            ].map((file) => (
              <div key={file.path} className="flex justify-between gap-4">
                <span className="font-medium">{file.label}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {file.path}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Blocks className="size-4" />
            {t("factoryPage.scaffoldSection")}
          </CardTitle>
          <CardDescription>{FACTORY_OUTPUT_PATHS.scaffold}/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readyVariant(scaffoldReady)}>
              {scaffoldReport?.status ?? t("factoryPage.scaffoldStatus")}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.framework")}: {scaffoldReport?.framework ?? "—"}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.uiSystem")}: {scaffoldReport?.ui_system ?? "—"}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.componentsCount")}: {scaffoldReport?.components_count ?? 0}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.scaffoldManifest")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(scaffoldManifest, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {SCAFFOLD_PATHS.manifest}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.scaffoldReport")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(scaffoldReport, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {SCAFFOLD_PATHS.report}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: "components.json", path: SCAFFOLD_PATHS.componentsJson(scaffoldProjectName) },
              { label: "package.json", path: SCAFFOLD_PATHS.packageJson(scaffoldProjectName) },
              { label: "vite.config.ts", path: SCAFFOLD_PATHS.viteConfig(scaffoldProjectName) },
              { label: "tailwind.config.ts", path: SCAFFOLD_PATHS.tailwindConfig(scaffoldProjectName) },
            ].map((file) => (
              <div key={file.path} className="flex justify-between gap-4">
                <span className="font-medium">{file.label}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {file.path}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-4" />
            {t("factoryPage.assemblySection")}
          </CardTitle>
          <CardDescription>{FACTORY_OUTPUT_PATHS.assembly}/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readyVariant(assemblyReady)}>
              {assemblyReport?.status ?? t("factoryPage.assemblyStatus")}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.projectType")}: {assemblyManifest?.project_type ?? "—"}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.pagesCount")}: {assemblyReport?.pages_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.componentsCount")}: {assemblyReport?.components_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.featuresCount")}: {assemblyReport?.features_count ?? 0}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.assemblyManifest")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(assemblyManifest, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {ASSEMBLY_PATHS.manifest}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.assemblyReport")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(assemblyReport, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {ASSEMBLY_PATHS.report}
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.routes")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(assemblySnapshot?.routes, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.generatedPages")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(assemblySnapshot?.generatedPages, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.generatedFeatures")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(assemblySnapshot?.generatedFeatures, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">{ASSEMBLY_PATHS.routes}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4" />
            {t("factoryPage.dataSection")}
          </CardTitle>
          <CardDescription>{FACTORY_OUTPUT_PATHS.data}/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readyVariant(dataReady)}>
              {dataReport?.status ?? t("factoryPage.dataStatus")}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.entitiesCount")}: {dataReport?.entities_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.relationsCount")}: {dataReport?.relations_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.apiCount")}: {dataReport?.api_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.formsCount")}: {dataReport?.forms_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.tablesCount")}: {dataReport?.tables_count ?? 0}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.dataManifest")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(dataManifest, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {DATA_PATHS.manifest}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.dataReport")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(dataReport, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {DATA_PATHS.report}
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.entities")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(dataSnapshot?.entities, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.entityRelations")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(dataSnapshot?.entityRelations, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.databaseSchema")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(dataSnapshot?.databaseSchema, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.apiEndpoints")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(dataSnapshot?.apiEndpoints, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.forms")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(dataSnapshot?.forms, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.dataTables")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(dataSnapshot?.tables, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("factoryPage.dataFlow")}</p>
            <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(dataSnapshot?.dataFlow, null, 2)}
              </pre>
            </ScrollArea>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">{DATA_PATHS.dataFlow}</p>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="size-4" />
            {t("factoryPage.backendSection")}
          </CardTitle>
          <CardDescription>{FACTORY_OUTPUT_PATHS.backend}/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readyVariant(backendReady)}>
              {backendReport?.status ?? t("factoryPage.backendStatus")}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.modelsCount")}: {backendReport?.models_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.routesCount")}: {backendReport?.routes_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.servicesCount")}: {backendReport?.services_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.controllersCount")}: {backendReport?.controllers_count ?? 0}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.backendManifest")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(backendManifest, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {BACKEND_PATHS.manifest}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.backendReport")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(backendReport, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {BACKEND_PATHS.report}
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.databaseModels")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(backendSnapshot?.databaseModels, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.schemaDefinitions")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(backendSnapshot?.schemaDefinitions, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.crudEndpoints")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(backendSnapshot?.crudEndpoints, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.serviceLayer")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(backendSnapshot?.serviceLayer, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.controllerLayer")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(backendSnapshot?.controllerLayer, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.backendRoutes")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(backendSnapshot?.backendRoutes, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.authStructure")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(backendSnapshot?.authStructure, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.openapiStructure")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(backendSnapshot?.openapiStructure, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {BACKEND_PATHS.openapiStructure}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-4" />
            {t("factoryPage.bindingSection")}
          </CardTitle>
          <CardDescription>{FACTORY_OUTPUT_PATHS.binding}/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readyVariant(bindingReady)}>
              {bindingReport?.status ?? t("factoryPage.bindingStatus")}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.bindingServicesCount")}: {bindingReport?.services_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.bindingHooksCount")}: {bindingReport?.hooks_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.bindingFormsCount")}: {bindingReport?.forms_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.bindingTablesCount")}: {bindingReport?.tables_count ?? 0}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.bindingManifest")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingManifest, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {BINDING_PATHS.manifest}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.bindingReport")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingReport, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {BINDING_PATHS.report}
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.bindingHooks")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingSnapshot?.hooks, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.bindingServices")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingSnapshot?.services, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.bindingForms")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingSnapshot?.formComponents, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.bindingTables")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingSnapshot?.tableComponents, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.entityBinding")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingSnapshot?.entityBinding, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.apiBinding")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingSnapshot?.apiBinding, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.frontendRoutes")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingSnapshot?.frontendRoutes, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.dashboardBinding")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingSnapshot?.dashboardBinding, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.errorHandling")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(bindingSnapshot?.errorHandling, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">{BINDING_PATHS.apiBinding}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="size-4" />
            {t("factoryPage.executionSection")}
          </CardTitle>
          <CardDescription>{FACTORY_OUTPUT_PATHS.execution}/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readyVariant(executionReady)}>
              {executionModuleReport?.status ?? t("factoryPage.executionStatus")}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.scriptsCount")}: {executionModuleReport?.scripts_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.healthchecksCount")}: {executionModuleReport?.healthchecks_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.logsCount")}: {executionModuleReport?.logs_count ?? 0}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.executionManifest")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(executionModuleManifest, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {EXECUTION_PATHS.manifest}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.executionModuleReport")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(executionModuleReport, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {EXECUTION_PATHS.report}
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.startScript")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {executionSnapshot?.runScripts.start ?? "—"}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {EXECUTION_PATHS.startScript}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.stopScript")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {executionSnapshot?.runScripts.stop ?? "—"}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {EXECUTION_PATHS.stopScript}
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.statusScript")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {executionSnapshot?.runScripts.status ?? "—"}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {EXECUTION_PATHS.statusScript}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.healthcheckScript")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {executionSnapshot?.runScripts.healthcheck ?? "—"}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {EXECUTION_PATHS.healthcheckScript}
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.executionMatrix")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(executionSnapshot?.executionMatrix, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.runReport")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(executionSnapshot?.runReport, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.executionHealthReport")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(executionSnapshot?.healthReport, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("factoryPage.environmentConfig")}</p>
            <ScrollArea className="h-20 rounded-md border bg-muted/30 p-3">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(executionSnapshot?.environment, null, 2)}
              </pre>
            </ScrollArea>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {EXECUTION_PATHS.environment}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="size-4" />
            {t("factoryPage.databaseSection")}
          </CardTitle>
          <CardDescription>{FACTORY_OUTPUT_PATHS.database}/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readyVariant(databaseReady)}>
              {databaseModuleReport?.status ?? t("factoryPage.databaseStatus")}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.dbModelsCount")}: {databaseModuleReport?.models_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.dbTablesCount")}: {databaseModuleReport?.tables_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.dbRelationsCount")}: {databaseModuleReport?.relations_count ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.dbMigrationsCount")}: {databaseModuleReport?.migration_count ?? 0}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.databaseManifest")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(databaseModuleManifest, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {DATABASE_PATHS.manifest}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.databaseReport")}</p>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(databaseModuleReport, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {DATABASE_PATHS.report}
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.databaseRelations")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(databaseSnapshot?.databaseRelations, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.migrationManifest")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(databaseSnapshot?.migrationManifest, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.seedData")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(databaseSnapshot?.seedData, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.createTablesSql")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {databaseSnapshot?.createTablesSql ?? "—"}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {DATABASE_PATHS.createTables}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.databaseConfig")}</p>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(databaseSnapshot?.databaseConfig, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {DATABASE_PATHS.config}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            {t("factoryPage.validationSection")}
          </CardTitle>
          <CardDescription>{FACTORY_OUTPUT_PATHS.validation}/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readyVariant(validationReady)}>
              {validationReport?.status ?? t("factoryPage.validationStatus")}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.checksPassed")}: {validationManifest?.checks_passed ?? 0}/
              {validationManifest?.checks_total ?? 0}
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.runtimeScore")}: {runtimeScore?.overall_score ?? validationManifest?.overall_score ?? 0}%
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.buildScore")}: {runtimeScore?.build_score ?? 0}%
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.frontendScore")}: {runtimeScore?.frontend_score ?? 0}%
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.backendScore")}: {runtimeScore?.backend_score ?? 0}%
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.databaseScore")}: {runtimeScore?.database_score ?? 0}%
            </Badge>
            <Badge variant="outline">
              {t("factoryPage.apiScore")}: {runtimeScore?.api_score ?? 0}%
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.buildValidation")}</p>
              <ScrollArea className="h-28 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(validationSnapshot?.buildValidation, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {VALIDATION_PATHS.buildValidation}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.frontendValidation")}</p>
              <ScrollArea className="h-28 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(validationSnapshot?.frontendValidation, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {VALIDATION_PATHS.frontendValidation}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.backendValidation")}</p>
              <ScrollArea className="h-28 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(validationSnapshot?.backendValidation, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {VALIDATION_PATHS.backendValidation}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.databaseValidation")}</p>
              <ScrollArea className="h-28 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(validationSnapshot?.databaseValidation, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {VALIDATION_PATHS.databaseValidation}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.apiValidation")}</p>
              <ScrollArea className="h-28 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(validationSnapshot?.apiValidation, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {VALIDATION_PATHS.apiValidation}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.healthValidation")}</p>
              <ScrollArea className="h-28 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(validationSnapshot?.healthValidation, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {VALIDATION_PATHS.healthValidation}
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.runtimeScoreCard")}</p>
              <ScrollArea className="h-28 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(runtimeScore, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {VALIDATION_PATHS.runtimeScore}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.validationManifest")}</p>
              <ScrollArea className="h-28 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(validationManifest, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {VALIDATION_PATHS.manifest}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("factoryPage.validationReport")}</p>
              <ScrollArea className="h-28 rounded-md border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(validationReport, null, 2)}
                </pre>
              </ScrollArea>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {VALIDATION_PATHS.report}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("factoryPage.outputAssembler")}</CardTitle>
          <CardDescription>{t("factoryPage.outputView")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            {outputFiles.map((file) => (
              <div key={file.path} className="flex justify-between gap-4">
                <span className="font-medium">{file.label}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {file.path}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2 text-sm">
            {modulePaths.map((item) => (
              <div key={item.path} className="flex justify-between gap-4">
                <span className="font-medium">{item.label}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {item.path}/
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("factoryPage.factoryManifest")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {FACTORY_OUTPUT_PATHS.factoryManifest}
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
            <CardTitle>{t("factoryPage.factoryReport")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {FACTORY_OUTPUT_PATHS.factoryReport}
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
            <CardTitle>{t("factoryPage.executionReport")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {FACTORY_OUTPUT_PATHS.executionReport}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 rounded-md border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(execution, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">{t("factoryPage.prepOnly")}</p>
    </div>
  );
}
