"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  Archive,
  BarChart3,
  FlaskConical,
  FolderKanban,
  GitBranch,
  Hammer,
  HeartPulse,
  Key,
  Layers,
  LayoutTemplate,
  Puzzle,
  Boxes,
  Package,
  FileText,
  Gauge,
  ListOrdered,
  Network,
  Plug,
  Receipt,
  Repeat,
  Shield,
  Store,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";

import { AiPromptInterface } from "@/components/ai-prompt-interface";
import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchBillingFactorySnapshot } from "@/lib/billing-factory/billing-artifacts";
import type { BillingFactorySnapshot } from "@/lib/billing-factory/types";
import { fetchCommercialFactorySnapshot } from "@/lib/commercial-factory/commercial-artifacts";
import type { CommercialFactorySnapshot } from "@/lib/commercial-factory/types";
import { fetchCustomerFactorySnapshot } from "@/lib/customer-factory/customer-artifacts";
import type { CustomerFactorySnapshot } from "@/lib/customer-factory/types";
import { fetchSalesFactorySnapshot } from "@/lib/sales-factory/sales-artifacts";
import type { SalesFactorySnapshot } from "@/lib/sales-factory/types";
import { fetchLicenseFactorySnapshot } from "@/lib/license-factory/license-artifacts";
import type { LicenseFactorySnapshot } from "@/lib/license-factory/types";
import { fetchPricingFactorySnapshot } from "@/lib/pricing-factory/pricing-artifacts";
import type { PricingFactorySnapshot } from "@/lib/pricing-factory/types";
import { fetchSubscriptionFactorySnapshot } from "@/lib/subscription-factory/subscription-artifacts";
import type { SubscriptionFactorySnapshot } from "@/lib/subscription-factory/types";
import { fetchApiGatewayFactorySnapshot } from "@/lib/api-gateway-factory/api-gateway-artifacts";
import { fetchJobQueueFactorySnapshot } from "@/lib/job-queue-factory/job-queue-artifacts";
import type { JobQueueFactorySnapshot } from "@/lib/job-queue-factory/types";
import { fetchLoggingFactorySnapshot } from "@/lib/logging-factory/logging-artifacts";
import type { LoggingFactorySnapshot } from "@/lib/logging-factory/types";
import { fetchHealthFactorySnapshot, isServiceHealthy } from "@/lib/health-factory/health-artifacts";
import type { HealthFactorySnapshot } from "@/lib/health-factory/types";
import { fetchSaasRuntimeFactorySnapshot } from "@/lib/saas-runtime-factory/runtime-summary-artifacts";
import type { SaasRuntimeFactorySnapshot } from "@/lib/saas-runtime-factory/types";
import {
  fetchMetricsFactorySnapshot,
  getGeneratedArtifacts,
  getTotalProjects,
  getTotalRequests,
  getTotalUsers,
} from "@/lib/metrics-factory/metrics-artifacts";
import type { MetricsFactorySnapshot } from "@/lib/metrics-factory/types";
import { fetchMonitoringFactorySnapshot } from "@/lib/monitoring-factory/monitoring-artifacts";
import type { MonitoringFactorySnapshot } from "@/lib/monitoring-factory/types";
import type { ApiGatewayFactorySnapshot } from "@/lib/api-gateway-factory/types";
import { fetchAuthFactorySnapshot } from "@/lib/auth-factory/auth-artifacts";
import type { AuthFactorySnapshot } from "@/lib/auth-factory/types";
import { fetchMultiUserFactorySnapshot } from "@/lib/multi-user-factory/multi-user-artifacts";
import type { MultiUserFactorySnapshot } from "@/lib/multi-user-factory/types";
import { fetchDashboard, fetchHistory, fetchStatus, getApiUrl } from "@/lib/api";
import { ARTIFACT_DEFINITIONS } from "@/lib/artifacts";
import { fetchPipelineSnapshot } from "@/lib/factory-api";
import { fetchAssemblyBlueprintSnapshot } from "@/lib/assembly-blueprint-factory/blueprint-artifacts";
import type { AssemblyBlueprintSnapshot } from "@/lib/assembly-blueprint-factory/types";
import {
  fetchMvpStructureSnapshot,
  getDeployTargets,
} from "@/lib/mvp-structure-factory/structure-artifacts";
import type { MvpStructureSnapshot } from "@/lib/mvp-structure-factory/types";
import { fetchMvpPackageSnapshot } from "@/lib/mvp-package-factory/package-artifacts";
import type { MvpPackageSnapshot } from "@/lib/mvp-package-factory/types";
import { fetchTemplateExtractionSnapshot } from "@/lib/template-extraction-factory/template-artifacts";
import type { TemplateExtractionSnapshot } from "@/lib/template-extraction-factory/types";
import { toErrorMessage } from "@/lib/errors";
import {
  translateFactoryStatus,
  translateLicenseType,
  translatePlanName,
  translateRuntimeModule,
  translateStatus,
  useTranslation,
} from "@/lib/i18n/context";
import type {
  ApiStatusResponse,
  DashboardMetrics,
  HistoryResponse,
  ProjectHistoryEntry,
} from "@/types/mvp";

export function DashboardPage() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [status, setStatus] = useState<ApiStatusResponse | null>(null);
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);
  const [pipeline, setPipeline] = useState<Awaited<ReturnType<typeof fetchPipelineSnapshot>> | null>(null);
  const [templateExtractionFactory, setTemplateExtractionFactory] =
    useState<TemplateExtractionSnapshot | null>(null);
  const [assemblyBlueprintFactory, setAssemblyBlueprintFactory] =
    useState<AssemblyBlueprintSnapshot | null>(null);
  const [mvpStructureFactory, setMvpStructureFactory] =
    useState<MvpStructureSnapshot | null>(null);
  const [mvpPackageFactory, setMvpPackageFactory] =
    useState<MvpPackageSnapshot | null>(null);
  const [authFactory, setAuthFactory] = useState<AuthFactorySnapshot | null>(null);
  const [multiUserFactory, setMultiUserFactory] = useState<MultiUserFactorySnapshot | null>(null);
  const [apiGatewayFactory, setApiGatewayFactory] = useState<ApiGatewayFactorySnapshot | null>(null);
  const [jobQueueFactory, setJobQueueFactory] = useState<JobQueueFactorySnapshot | null>(null);
  const [monitoringFactory, setMonitoringFactory] = useState<MonitoringFactorySnapshot | null>(null);
  const [loggingFactory, setLoggingFactory] = useState<LoggingFactorySnapshot | null>(null);
  const [metricsFactory, setMetricsFactory] = useState<MetricsFactorySnapshot | null>(null);
  const [healthFactory, setHealthFactory] = useState<HealthFactorySnapshot | null>(null);
  const [saasRuntimeFactory, setSaasRuntimeFactory] = useState<SaasRuntimeFactorySnapshot | null>(null);
  const [billingFactory, setBillingFactory] = useState<BillingFactorySnapshot | null>(null);
  const [subscriptionFactory, setSubscriptionFactory] = useState<SubscriptionFactorySnapshot | null>(null);
  const [pricingFactory, setPricingFactory] = useState<PricingFactorySnapshot | null>(null);
  const [licenseFactory, setLicenseFactory] = useState<LicenseFactorySnapshot | null>(null);
  const [customerFactory, setCustomerFactory] = useState<CustomerFactorySnapshot | null>(null);
  const [salesFactory, setSalesFactory] = useState<SalesFactorySnapshot | null>(null);
  const [commercialFactory, setCommercialFactory] = useState<CommercialFactorySnapshot | null>(null);
  const [successRate, setSuccessRate] = useState(0);
  const [apiConnected, setApiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          fetchDashboard(),
          fetchHistory(),
          fetchStatus(),
          fetchPipelineSnapshot(),
          fetchTemplateExtractionSnapshot(),
          fetchAssemblyBlueprintSnapshot(),
          fetchMvpStructureSnapshot(),
          fetchMvpPackageSnapshot(),
          fetchAuthFactorySnapshot(),
          fetchMultiUserFactorySnapshot(),
          fetchApiGatewayFactorySnapshot(),
          fetchJobQueueFactorySnapshot(),
          fetchMonitoringFactorySnapshot(),
          fetchLoggingFactorySnapshot(),
          fetchMetricsFactorySnapshot(),
          fetchHealthFactorySnapshot(),
          fetchSaasRuntimeFactorySnapshot(),
          fetchBillingFactorySnapshot(),
          fetchSubscriptionFactorySnapshot(),
          fetchPricingFactorySnapshot(),
          fetchLicenseFactorySnapshot(),
          fetchCustomerFactorySnapshot(),
          fetchSalesFactorySnapshot(),
          fetchCommercialFactorySnapshot(),
        ]);
        if (cancelled) return;

        const pick = <T,>(index: number): T | null =>
          results[index]?.status === "fulfilled" ? (results[index] as PromiseFulfilledResult<T>).value : null;

        const dash = pick<DashboardMetrics>(0);
        const hist = pick<HistoryResponse>(1);
        const st = pick<ApiStatusResponse>(2);
        const pipe = pick<Awaited<ReturnType<typeof fetchPipelineSnapshot>>>(3);
        const templateExtraction = pick<TemplateExtractionSnapshot>(4);
        const assemblyBlueprint = pick<AssemblyBlueprintSnapshot>(5);
        const mvpStructure = pick<MvpStructureSnapshot>(6);
        const mvpPackage = pick<MvpPackageSnapshot>(7);
        const auth = pick<AuthFactorySnapshot>(8);
        const multiUser = pick<MultiUserFactorySnapshot>(9);
        const apiGateway = pick<ApiGatewayFactorySnapshot>(10);
        const jobQueue = pick<JobQueueFactorySnapshot>(11);
        const monitoring = pick<MonitoringFactorySnapshot>(12);
        const logging = pick<LoggingFactorySnapshot>(13);
        const metrics = pick<MetricsFactorySnapshot>(14);
        const health = pick<HealthFactorySnapshot>(15);
        const saasRuntime = pick<SaasRuntimeFactorySnapshot>(16);
        const billing = pick<BillingFactorySnapshot>(17);
        const subscription = pick<SubscriptionFactorySnapshot>(18);
        const pricing = pick<PricingFactorySnapshot>(19);
        const license = pick<LicenseFactorySnapshot>(20);
        const customer = pick<CustomerFactorySnapshot>(21);
        const sales = pick<SalesFactorySnapshot>(22);
        const commercial = pick<CommercialFactorySnapshot>(23);

        const rejected = results.filter((result) => result.status === "rejected");
        if (rejected.length > 0) {
          const firstError = rejected[0].status === "rejected" ? rejected[0].reason : null;
          setError(toErrorMessage(firstError, t("errors.unknown")));
        }

        setDashboard(dash);
        setHistory(hist?.entries ?? []);
        setStatus(st);
        setPipeline(pipe);
        setTemplateExtractionFactory(templateExtraction);
        setAssemblyBlueprintFactory(assemblyBlueprint);
        setMvpStructureFactory(mvpStructure);
        setMvpPackageFactory(mvpPackage);
        setAuthFactory(auth);
        setMultiUserFactory(multiUser);
        setApiGatewayFactory(apiGateway);
        setJobQueueFactory(jobQueue);
        setMonitoringFactory(monitoring);
        setLoggingFactory(logging);
        setMetricsFactory(metrics);
        setHealthFactory(health);
        setSaasRuntimeFactory(saasRuntime);
        setBillingFactory(billing);
        setSubscriptionFactory(subscription);
        setPricingFactory(pricing);
        setLicenseFactory(license);
        setCustomerFactory(customer);
        setSalesFactory(sales);
        setCommercialFactory(commercial);
        setApiConnected(Boolean(dash && st));
        const entries = hist?.entries ?? [];
        const total = entries.length;
        const ok = entries.filter((e) => e.status === "WORKING").length;
        setSuccessRate(
          total > 0 ? Math.round((ok / total) * 100) : st?.status === "WORKING" ? 100 : 0
        );
      } catch (err) {
        if (!cancelled) {
          setError(toErrorMessage(err, t("errors.unknown")));
          setApiConnected(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) return <PageLoader rows={4} />;

  const statCards = [
    {
      title: t("dashboard.statProjects"),
      value: dashboard?.total_projects ?? 0,
      hint: dashboard?.last_project || "—",
      icon: FolderKanban,
    },
    {
      title: t("dashboard.statResearchRuns"),
      value: dashboard?.history_entries ?? 0,
      hint: `v${dashboard?.factory_version ?? "—"}`,
      icon: FlaskConical,
    },
    {
      title: t("dashboard.statMvpBuilds"),
      value: dashboard?.total_zip_files ?? 0,
      hint: status?.project_name ?? "—",
      icon: Hammer,
    },
    {
      title: t("dashboard.statSuccessRate"),
      value: `${successRate}%`,
      hint: translateStatus(t, status?.status),
      icon: TrendingUp,
    },
  ];

  const pipelineRows = [
    { label: t("pipeline.projectType"), value: pipeline?.projectType?.project_type ?? "—" },
    { label: t("pipeline.repository"), value: pipeline?.repository?.best_repo ?? "—" },
    { label: t("pipeline.template"), value: pipeline?.template?.best_template ?? "—" },
    { label: t("pipeline.uiLibrary"), value: pipeline?.ui?.best_ui ?? "—" },
    { label: t("pipeline.complexity"), value: pipeline?.complexity?.complexity ?? "—" },
    {
      label: t("pipeline.cost"),
      value: pipeline?.cost?.hours
        ? `${pipeline.cost.hours}h / ${pipeline.cost.cost_eur} EUR`
        : "—",
    },
    { label: t("pipeline.packaging"), value: pipeline?.packaging?.recommended ?? "—" },
    {
      label: t("pipeline.audit"),
      value: pipeline?.audit?.ready_for_v3 ? t("status.readyForV3") : t("status.pending"),
    },
  ];

  return (
    <div className="space-y-6">
      {error ? (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{card.value}</div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AiPromptInterface />

      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="size-5 text-primary" />
            {t("dashboard.assemblyBlueprintFactory")}
          </CardTitle>
          <CardDescription>{t("dashboard.assemblyBlueprintFactoryDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={assemblyBlueprintFactory?.blueprint?.assembly_ready ? "default" : "secondary"}
            >
              {assemblyBlueprintFactory?.blueprint?.assembly_ready
                ? t("status.ready")
                : t("status.pending")}
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.assemblyBlueprintProjectType")}</span>
              <span className="font-medium text-right">
                {assemblyBlueprintFactory?.blueprint?.project_type ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.assemblyBlueprintRepository")}</span>
              <span className="font-medium text-right truncate max-w-[60%]">
                {assemblyBlueprintFactory?.blueprint?.repository ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.assemblyBlueprintTemplate")}</span>
              <span className="font-medium text-right">
                {assemblyBlueprintFactory?.blueprint?.template ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.assemblyBlueprintUi")}</span>
              <span className="font-medium text-right">
                {assemblyBlueprintFactory?.blueprint?.ui ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.assemblyBlueprintPages")}</span>
              <span className="font-medium text-right">
                {assemblyBlueprintFactory?.blueprint?.pages?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.assemblyBlueprintComponents")}</span>
              <span className="font-medium text-right">
                {assemblyBlueprintFactory?.blueprint?.components?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.assemblyBlueprintReady")}</span>
              <span className="font-medium text-right">
                {assemblyBlueprintFactory?.blueprint?.assembly_ready ? t("status.yes") : t("status.no")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="size-5 text-primary" />
            {t("dashboard.mvpStructureFactory")}
          </CardTitle>
          <CardDescription>{t("dashboard.mvpStructureFactoryDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={mvpStructureFactory?.structure?.structure_ready ? "default" : "secondary"}
            >
              {mvpStructureFactory?.structure?.structure_ready
                ? t("status.ready")
                : t("status.pending")}
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpStructurePages")}</span>
              <span className="font-medium text-right">
                {mvpStructureFactory?.structure?.frontend?.pages?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpStructureBackendModules")}</span>
              <span className="font-medium text-right">
                {mvpStructureFactory?.structure?.backend?.modules?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpStructureDatabaseTables")}</span>
              <span className="font-medium text-right">
                {mvpStructureFactory?.structure?.database?.tables?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpStructureDeployTargets")}</span>
              <span className="font-medium text-right">
                {getDeployTargets(mvpStructureFactory?.structure ?? null).join(", ") || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpStructureReady")}</span>
              <span className="font-medium text-right">
                {mvpStructureFactory?.structure?.structure_ready ? t("status.yes") : t("status.no")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            {t("dashboard.mvpPackageFactory")}
          </CardTitle>
          <CardDescription>{t("dashboard.mvpPackageFactoryDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                mvpPackageFactory?.package?.status === "MVP_PACKAGE_READY"
                  ? "default"
                  : "secondary"
              }
            >
              {translateFactoryStatus(
                t,
                mvpPackageFactory?.package?.status ?? t("status.pending")
              )}
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpPackageProjectType")}</span>
              <span className="font-medium text-right">
                {mvpPackageFactory?.package?.project_type ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpPackageRepository")}</span>
              <span className="font-medium text-right">
                {mvpPackageFactory?.package?.repository ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpPackageTemplate")}</span>
              <span className="font-medium text-right">
                {mvpPackageFactory?.package?.template ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpPackageUi")}</span>
              <span className="font-medium text-right">
                {mvpPackageFactory?.package?.ui ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpPackagePages")}</span>
              <span className="font-medium text-right">
                {mvpPackageFactory?.package?.pages?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpPackageApi")}</span>
              <span className="font-medium text-right">
                {mvpPackageFactory?.package?.api?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpPackageDatabase")}</span>
              <span className="font-medium text-right">
                {mvpPackageFactory?.package?.database?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.mvpPackageReady")}</span>
              <span className="font-medium text-right">
                {mvpPackageFactory?.package?.package_ready ? t("status.yes") : t("status.no")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="size-5 text-primary" />
            {t("dashboard.templateExtractionFactory")}
          </CardTitle>
          <CardDescription>{t("dashboard.templateExtractionFactoryDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                templateExtractionFactory?.manifest?.status === "TEMPLATE_EXTRACTED"
                  ? "default"
                  : "secondary"
              }
            >
              {translateFactoryStatus(
                t,
                templateExtractionFactory?.manifest?.status ?? t("status.pending")
              )}
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.templateExtractionTemplate")}</span>
              <span className="font-medium text-right">
                {templateExtractionFactory?.manifest?.template_name ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.templateExtractionPages")}</span>
              <span className="font-medium text-right">
                {templateExtractionFactory?.manifest?.pages?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.templateExtractionComponents")}</span>
              <span className="font-medium text-right">
                {templateExtractionFactory?.manifest?.components?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.templateExtractionForms")}</span>
              <span className="font-medium text-right">
                {templateExtractionFactory?.manifest?.forms?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("dashboard.templateExtractionStatus")}</span>
              <span className="font-medium text-right">
                {translateFactoryStatus(
                  t,
                  templateExtractionFactory?.manifest?.status ?? t("status.pending")
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            {t("dashboard.runtimeSummary")}
          </CardTitle>
          <CardDescription>{t("dashboard.runtimeSummaryDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={saasRuntimeFactory?.summary?.status === "RUNTIME_COMPLETE" ? "default" : "secondary"}>
              {saasRuntimeFactory?.summary?.status === "RUNTIME_COMPLETE"
                ? translateFactoryStatus(t, "RUNTIME_COMPLETE")
                : t("status.pending")}
            </Badge>
            <Badge variant={saasRuntimeFactory?.summary?.runtime_complete ? "default" : "secondary"}>
              {t("dashboard.runtimeComplete")}: {saasRuntimeFactory?.summary?.runtime_complete ? t("status.yes") : t("status.no")}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">{saasRuntimeFactory?.summary?.readiness_score ?? 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.completedModules")}</span>
                <span className="font-medium">
                  {saasRuntimeFactory?.summary?.completed_modules?.length ?? 0}/8
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.runtimeLayers")}</span>
                <span className="font-medium">{saasRuntimeFactory?.summary?.generated_layers?.length ?? 0}</span>
              </div>
            </div>
            <div className="sm:col-span-2 space-y-2 text-sm">
              <p className="text-muted-foreground">{t("dashboard.finalResult")}</p>
              <p className="font-medium">
                {saasRuntimeFactory?.summary?.runtime_complete
                  ? t("dashboard.runtimeFinalResultReady")
                  : (saasRuntimeFactory?.summary?.final_result ?? "—")}
              </p>
              {saasRuntimeFactory?.summary?.completed_modules?.length ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {saasRuntimeFactory.summary.completed_modules.map((mod) => (
                    <Badge key={mod} variant="outline" className="text-xs">
                      {translateRuntimeModule(t, mod)}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <Progress value={saasRuntimeFactory?.summary?.readiness_score ?? 0} className="h-2" />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            {t("dashboard.saasCommercialFactory")}
          </CardTitle>
          <CardDescription>{t("dashboard.saasCommercialFactoryDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={commercialFactory?.report?.status === "COMMERCIAL_READY" ? "default" : "secondary"}>
              {commercialFactory?.commercial?.status === "ACTIVE"
                ? translateFactoryStatus(t, "COMMERCIAL_READY")
                : t("status.pending")}
            </Badge>
            <Badge variant={commercialFactory?.commercial?.status === "ACTIVE" ? "default" : "secondary"}>
              {t("dashboard.commercialStatus")}:{" "}
              {translateFactoryStatus(t, commercialFactory?.commercial?.status ?? t("status.pending"))}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.billingStatus")}</span>
                <span className="font-medium">
                  {translateFactoryStatus(t, commercialFactory?.commercial?.billing_status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.subscriptionStatus")}</span>
                <span className="font-medium">
                  {translateFactoryStatus(t, commercialFactory?.commercial?.subscription_status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.pricingStatus")}</span>
                <span className="font-medium">
                  {translateFactoryStatus(t, commercialFactory?.commercial?.pricing_status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.licenseStatus")}</span>
                <span className="font-medium">
                  {translateFactoryStatus(t, commercialFactory?.commercial?.license_status)}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.customerStatus")}</span>
                <span className="font-medium">
                  {translateFactoryStatus(t, commercialFactory?.commercial?.customer_status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.salesStatus")}</span>
                <span className="font-medium">
                  {translateFactoryStatus(t, commercialFactory?.commercial?.sales_status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.completedModules")}</span>
                <span className="font-medium">
                  {commercialFactory?.commercial?.modules_completed ?? 0}/
                  {commercialFactory?.commercial?.modules_total ?? 6}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">
                  {commercialFactory?.commercial?.commercial_readiness_score ?? 0}%
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.revenueModelsCount")}</span>
                <span className="font-medium">{commercialFactory?.commercial?.revenue_models_count ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.pricingPlansCount")}</span>
                <span className="font-medium">{commercialFactory?.commercial?.pricing_plans_count ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.customersTotal")}</span>
                <span className="font-medium">{commercialFactory?.commercial?.customers_count ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.activeCustomers")}</span>
                <span className="font-medium">{commercialFactory?.commercial?.active_customers ?? 0}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.conversionRate")}</span>
                <span className="font-medium">{commercialFactory?.commercial?.conversion_rate ?? 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.mrr")}</span>
                <span className="font-medium">${commercialFactory?.commercial?.mrr ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.arr")}</span>
                <span className="font-medium">${commercialFactory?.commercial?.arr ?? 0}</span>
              </div>
            </div>
          </div>
          <Progress value={commercialFactory?.commercial?.commercial_readiness_score ?? 0} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 min-[1800px]:grid-cols-6">
        <Card className="shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              {t("dashboard.billingFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.billingFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={billingFactory?.report?.status === "BILLING_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, billingFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={billingFactory?.billing?.billing?.enabled ? "default" : "secondary"}>
                {t("dashboard.billingStatus")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.invoices")}</span>
                <span className="font-medium">
                  {billingFactory?.report?.invoices_enabled ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.billingCycles")}</span>
                <span className="font-medium">
                  {billingFactory?.report?.billing_cycles_enabled ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.usageBilling")}</span>
                <span className="font-medium">
                  {billingFactory?.report?.usage_billing_enabled ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.recurringBilling")}</span>
                <span className="font-medium">
                  {billingFactory?.report?.recurring_billing_enabled ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">{billingFactory?.report?.readiness_score ?? 0}%</span>
              </div>
              <Progress value={billingFactory?.report?.readiness_score ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-primary" />
              {t("dashboard.subscriptionFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.subscriptionFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={subscriptionFactory?.report?.status === "SUBSCRIPTION_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, subscriptionFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={subscriptionFactory?.subscriptions?.subscriptions?.enabled ? "default" : "secondary"}>
                {t("dashboard.subscriptionStatus")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.availablePlans")}</span>
                <span className="font-medium">{subscriptionFactory?.report?.available_plans ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.upgradePaths")}</span>
                <span className="font-medium">{subscriptionFactory?.report?.upgrade_paths?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.renewalModels")}</span>
                <span className="font-medium">{subscriptionFactory?.report?.renewal_models?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.commercialReadinessScore")}</span>
                <span className="font-medium">{subscriptionFactory?.report?.commercial_readiness_score ?? 0}%</span>
              </div>
              <Progress value={subscriptionFactory?.report?.commercial_readiness_score ?? 0} className="h-2" />
            </div>
            {subscriptionFactory?.subscriptions?.subscriptions?.plans?.length ? (
              <div className="flex flex-wrap gap-1">
                {subscriptionFactory.subscriptions.subscriptions.plans.map((plan) => (
                  <Badge key={plan.id} variant="outline" className="text-xs">
                    {translatePlanName(t, plan.name)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="size-4 text-primary" />
              {t("dashboard.pricingFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.pricingFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={pricingFactory?.report?.status === "PRICING_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, pricingFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={pricingFactory?.report?.pricing_engine === "active" ? "default" : "secondary"}>
                {t("dashboard.pricingMatrix")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.plansGenerated")}</span>
                <span className="font-medium">{pricingFactory?.report?.plans_generated ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.commercialReadiness")}</span>
                <span className="font-medium">{pricingFactory?.report?.commercial_readiness ?? 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.pricingScore")}</span>
                <span className="font-medium">{pricingFactory?.report?.pricing_score ?? 0}%</span>
              </div>
              <Progress value={pricingFactory?.report?.commercial_readiness ?? 0} className="h-2" />
            </div>
            {pricingFactory?.pricing?.plans?.length ? (
              <div className="flex flex-wrap gap-1">
                {pricingFactory.pricing.plans.map((plan) => (
                  <Badge key={plan.name} variant="outline" className="text-xs">
                    {translatePlanName(t, plan.name)}: ${plan.monthly_price}
                    {t("dashboard.perMonth")}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="size-4 text-primary" />
              {t("dashboard.licenseFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.licenseFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={licenseFactory?.report?.status === "LICENSE_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, licenseFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={licenseFactory?.license?.status === "ACTIVE" ? "default" : "secondary"}>
                {t("dashboard.licenseStatus")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.licenseType")}</span>
                <span className="font-medium">
                  {translateLicenseType(t, licenseFactory?.license?.license_type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.licenseStatus")}</span>
                <span className="font-medium">
                  {translateFactoryStatus(t, licenseFactory?.license?.status ?? t("status.pending"))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.commercialUse")}</span>
                <span className="font-medium">
                  {licenseFactory?.license
                    ? licenseFactory.license.commercial_use
                      ? t("status.yes")
                      : t("status.no")
                    : t("status.pending")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.apiAccess")}</span>
                <span className="font-medium">
                  {licenseFactory?.license
                    ? licenseFactory.license.api_access
                      ? t("status.yes")
                      : t("status.no")
                    : t("status.pending")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.deployment")}</span>
                <span className="font-medium">
                  {licenseFactory?.license
                    ? licenseFactory.license.deployment
                      ? t("status.yes")
                      : t("status.no")
                    : t("status.pending")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.exportAllowed")}</span>
                <span className="font-medium">
                  {licenseFactory?.license
                    ? licenseFactory.license.export_allowed
                      ? t("status.yes")
                      : t("status.no")
                    : t("status.pending")}
                </span>
              </div>
              <Progress value={licenseFactory?.report?.commercial_readiness_score ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              {t("dashboard.customerFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.customerFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={customerFactory?.report?.status === "CUSTOMER_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, customerFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={customerFactory?.customer?.status === "ACTIVE" ? "default" : "secondary"}>
                {t("dashboard.customerStatus")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.customersTotal")}</span>
                <span className="font-medium">{customerFactory?.report?.customers_total ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.activeCustomers")}</span>
                <span className="font-medium">{customerFactory?.report?.active_customers ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.trialCustomers")}</span>
                <span className="font-medium">{customerFactory?.report?.trial_customers ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.plansCount")}</span>
                <span className="font-medium">{customerFactory?.report?.plans_count ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">
                  {customerFactory?.report?.commercial_readiness_score ?? 0}%
                </span>
              </div>
              <Progress value={customerFactory?.report?.commercial_readiness_score ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              {t("dashboard.salesFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.salesFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={salesFactory?.report?.status === "SALES_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, salesFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={salesFactory?.sales?.status === "ACTIVE" ? "default" : "secondary"}>
                {t("dashboard.salesStatus")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.salesLeads")}</span>
                <span className="font-medium">{salesFactory?.sales?.leads ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.salesCustomers")}</span>
                <span className="font-medium">{salesFactory?.sales?.customers ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.conversionRate")}</span>
                <span className="font-medium">{salesFactory?.report?.conversion_rate ?? 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.mrr")}</span>
                <span className="font-medium">${salesFactory?.sales?.mrr ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.arr")}</span>
                <span className="font-medium">${salesFactory?.sales?.arr ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.revenue")}</span>
                <span className="font-medium">${salesFactory?.sales?.revenue ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">
                  {salesFactory?.report?.commercial_readiness_score ?? 0}%
                </span>
              </div>
              <Progress value={salesFactory?.report?.commercial_readiness_score ?? 0} className="h-2" />
            </div>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/artifacts/factory_output/sales/sales_report.json" target="_blank">
                {t("dashboard.salesMetrics")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-10">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="size-4 text-primary" />
              {t("dashboard.healthFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.healthFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={healthFactory?.report?.status === "HEALTH_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, healthFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={healthFactory?.health?.health?.enabled ? "default" : "secondary"}>
                {t("dashboard.healthStatus")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.frontend")}</span>
                <span className="font-medium">
                  {isServiceHealthy(healthFactory?.health ?? null, "frontend") ? t("status.healthy") : t("status.offline")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.backend")}</span>
                <span className="font-medium">
                  {isServiceHealthy(healthFactory?.health ?? null, "backend") ? t("status.healthy") : t("status.offline")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.database")}</span>
                <span className="font-medium">
                  {isServiceHealthy(healthFactory?.health ?? null, "database") ? t("status.healthy") : t("status.offline")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.api")}</span>
                <span className="font-medium">
                  {isServiceHealthy(healthFactory?.health ?? null, "api_gateway") ? t("status.healthy") : t("status.offline")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.queue")}</span>
                <span className="font-medium">
                  {isServiceHealthy(healthFactory?.health ?? null, "queue") ? t("status.healthy") : t("status.offline")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.storage")}</span>
                <span className="font-medium">
                  {isServiceHealthy(healthFactory?.health ?? null, "storage") ? t("status.healthy") : t("status.offline")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.overallHealthScore")}</span>
                <span className="font-medium">{healthFactory?.report?.overall_health_score ?? 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">{healthFactory?.report?.readiness_score ?? 0}%</span>
              </div>
              <Progress value={healthFactory?.report?.overall_health_score ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              {t("dashboard.metricsFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.metricsFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={metricsFactory?.report?.status === "METRICS_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, metricsFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={metricsFactory?.report?.runtime_statistics_enabled ? "default" : "secondary"}>
                {t("dashboard.runtimeStatistics")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.metricsStatus")}</span>
                <span className="font-medium">
                  {metricsFactory?.metrics?.metrics?.enabled ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.requests")}</span>
                <span className="font-medium">{getTotalRequests(metricsFactory?.metrics ?? null)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.users")}</span>
                <span className="font-medium">{getTotalUsers(metricsFactory?.metrics ?? null)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.projects")}</span>
                <span className="font-medium">{getTotalProjects(metricsFactory?.metrics ?? null)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.artifacts")}</span>
                <span className="font-medium">{getGeneratedArtifacts(metricsFactory?.metrics ?? null)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">{metricsFactory?.report?.readiness_score ?? 0}%</span>
              </div>
              <Progress value={metricsFactory?.report?.readiness_score ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              {t("dashboard.loggingFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.loggingFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={loggingFactory?.report?.status === "LOGGING_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, loggingFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={loggingFactory?.report?.audit_logs_enabled ? "default" : "secondary"}>
                {t("dashboard.auditLogs")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.loggingStatus")}</span>
                <span className="font-medium">
                  {loggingFactory?.logging?.logging?.enabled ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.logSources")}</span>
                <span className="font-medium">{loggingFactory?.report?.log_sources ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.logLevels")}</span>
                <span className="font-medium">{loggingFactory?.report?.log_levels?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.retentionPolicy")}</span>
                <span className="font-medium">
                  {loggingFactory?.report?.retention_policy_enabled ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">{loggingFactory?.report?.readiness_score ?? 0}%</span>
              </div>
              <Progress value={loggingFactory?.report?.readiness_score ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="size-4 text-primary" />
              {t("dashboard.monitoringFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.monitoringFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={monitoringFactory?.report?.status === "MONITORING_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, monitoringFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={monitoringFactory?.monitoring?.monitoring?.alerts_ready ? "default" : "secondary"}>
                {t("dashboard.alerts")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.monitoredServices")}</span>
                <span className="font-medium">{monitoringFactory?.report?.monitored_services ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.uptimeTracking")}</span>
                <span className="font-medium">
                  {monitoringFactory?.report?.uptime_tracking ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.monitoringStatus")}</span>
                <span className="font-medium">
                  {monitoringFactory?.monitoring?.monitoring?.enabled ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">{monitoringFactory?.report?.readiness_score ?? 0}%</span>
              </div>
              <Progress value={monitoringFactory?.report?.readiness_score ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="size-4 text-primary" />
              {t("dashboard.jobQueueFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.jobQueueFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={jobQueueFactory?.report?.status === "JOB_QUEUE_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, jobQueueFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={jobQueueFactory?.report?.retry_enabled ? "default" : "secondary"}>
                {t("dashboard.retrySystem")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.workers")}</span>
                <span className="font-medium">{jobQueueFactory?.workers?.workers?.worker_count ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.scheduler")}</span>
                <span className="font-medium">
                  {jobQueueFactory?.report?.scheduler_enabled ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.jobTypes")}</span>
                <span className="font-medium">{jobQueueFactory?.jobQueue?.job_types?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">{jobQueueFactory?.report?.readiness_score ?? 0}%</span>
              </div>
              <Progress value={jobQueueFactory?.report?.readiness_score ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="size-4 text-primary" />
              {t("dashboard.apiGatewayFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.apiGatewayFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={apiGatewayFactory?.report?.status === "API_GATEWAY_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, apiGatewayFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={apiGatewayFactory?.report?.middleware_enabled ? "default" : "secondary"}>
                {t("dashboard.middleware")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.apiRoutes")}</span>
                <span className="font-medium">{apiGatewayFactory?.report?.routes_count ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.versioning")}</span>
                <span className="font-medium">
                  {apiGatewayFactory?.gateway?.versioning?.current ?? "—"}
                  {apiGatewayFactory?.gateway?.versioning?.v2_ready ? t("dashboard.versionV2Suffix") : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.rateLimiting")}</span>
                <span className="font-medium">
                  {apiGatewayFactory?.report?.rate_limiting_enabled ? t("status.enabled") : t("status.disabled")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">{apiGatewayFactory?.report?.readiness_score ?? 0}%</span>
              </div>
              <Progress value={apiGatewayFactory?.report?.readiness_score ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              {t("dashboard.multiUserFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.multiUserFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={multiUserFactory?.report?.status === "MULTI_USER_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, multiUserFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={multiUserFactory?.report?.ownership_model ? "default" : "secondary"}>
                {t("dashboard.ownership")}: {multiUserFactory?.report?.ownership_model ? t("status.enabled") : t("status.disabled")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.multiUserUsers")}</span>
                <span className="font-medium">{multiUserFactory?.usersRuntime?.user_records?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.multiUserTenants")}</span>
                <span className="font-medium">{multiUserFactory?.tenants?.tenant_records?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.multiUserWorkspaces")}</span>
                <span className="font-medium">
                  {multiUserFactory?.tenants?.tenant_records?.[0]?.workspaces?.length ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">{multiUserFactory?.report?.readiness_score ?? 0}%</span>
              </div>
              <Progress value={multiUserFactory?.report?.readiness_score ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              {t("dashboard.authFactory")}
            </CardTitle>
            <CardDescription>{t("dashboard.authFactoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={authFactory?.report?.status === "AUTH_READY" ? "default" : "secondary"}>
                {translateFactoryStatus(t, authFactory?.report?.status ?? t("status.pending"))}
              </Badge>
              <Badge variant={authFactory?.config?.authentication.jwt ? "default" : "secondary"}>
                {t("dashboard.jwtLabel")}: {authFactory?.config?.authentication.jwt ? t("status.enabled") : t("status.disabled")}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.authRoles")}</span>
                <span className="font-medium">{authFactory?.report?.supported_roles?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dashboard.readinessScore")}</span>
                <span className="font-medium">{authFactory?.report?.readiness_score ?? 0}%</span>
              </div>
              <Progress value={authFactory?.report?.readiness_score ?? 0} className="h-2" />
            </div>
            {authFactory?.report?.supported_roles?.length ? (
              <div className="flex flex-wrap gap-1">
                {authFactory.report.supported_roles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {t(`dashboard.roles.${role.toLowerCase()}`) !== `dashboard.roles.${role.toLowerCase()}`
                      ? t(`dashboard.roles.${role.toLowerCase()}`)
                      : role}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              {t("dashboard.factoryStatus")}
            </CardTitle>
            <CardDescription>{t("dashboard.factoryStatusDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>
                {status?.factory_version
                  ? `${t("dashboard.factory")} v${status.factory_version}`
                  : t("dashboard.factory")}
              </Badge>
              <Badge variant={status?.status === "WORKING" ? "default" : "secondary"}>
                {t("dashboard.mvp")}: {translateStatus(t, status?.status)}
              </Badge>
              <Badge variant="outline">{status?.selected_option ?? t("dashboard.noOption")}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.statSuccessRate")}</span>
                <span className="font-medium">{successRate}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>
            {status?.idea ? (
              <ScrollArea className="h-20 rounded-md border bg-muted/40 p-3 text-sm">
                {status.idea}
              </ScrollArea>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="size-4 text-primary" />
              {t("dashboard.apiConnection")}
            </CardTitle>
            <CardDescription>{t("dashboard.apiConnectionDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-muted-foreground">{t("dashboard.endpoint")}</span>
              <code className="text-xs">{getApiUrl()}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("dashboard.status")}</span>
              <Badge variant={apiConnected ? "default" : "destructive"}>
                {apiConnected ? t("status.connected") : t("status.disconnected")}
              </Badge>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/settings">{t("nav.settings")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="size-4 text-primary" />
              {t("dashboard.pipelineOverview")}
            </CardTitle>
            <CardDescription>{t("dashboard.pipelineOverviewDesc")}</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/pipeline">{t("dashboard.openPipeline")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.step")}</TableHead>
                <TableHead>{t("dashboard.value")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipelineRows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell>{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="size-4 text-primary" />
                {t("dashboard.projectsBlock")}
              </CardTitle>
              <CardDescription>{t("dashboard.projectsBlockDesc")}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects">{t("dashboard.allProjects")}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.noProjects")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dashboard.project")}</TableHead>
                    <TableHead>{t("dashboard.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.slice(0, 5).map((entry) => (
                    <TableRow key={`${entry.timestamp}-${entry.project_name}`}>
                      <TableCell className="max-w-[180px] truncate font-mono text-xs">
                        {entry.project_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === "WORKING" ? "default" : "secondary"}>
                          {translateStatus(t, entry.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="size-4 text-primary" />
                {t("dashboard.artifactsBlock")}
              </CardTitle>
              <CardDescription>{t("dashboard.artifactsBlockDesc")}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/artifacts">{t("dashboard.allArtifacts")}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px] pr-4">
              <div className="space-y-2">
                {ARTIFACT_DEFINITIONS.map((artifact) => (
                  <div
                    key={artifact.name}
                    className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                  >
                    <span className="font-mono text-xs">{artifact.name}</span>
                    <Badge variant="secondary">{t("status.api")}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
