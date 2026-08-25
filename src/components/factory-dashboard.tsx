"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardMetricsBlock } from "@/components/dashboard-metrics";
import { DemoVideoTab } from "@/components/demo-video-tab";
import { ErrorBanner } from "@/components/error-banner";
import { Header } from "@/components/header";
import { JobStatusBlock } from "@/components/job-status";
import { OptionCard } from "@/components/option-card";
import { ProjectDetailsBlock } from "@/components/project-details";
import { ProjectHistory } from "@/components/project-history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  fetchDashboard,
  fetchHistory,
  fetchJobStatus,
  fetchProjectDetails,
  fetchStatus,
  generateMvp,
  generateOptions,
  getDownloadUrl,
  selectOption,
} from "@/lib/api";
import { toErrorMessage } from "@/lib/errors";
import { mapApiOptions } from "@/lib/map-options";
import type {
  ApiStatusResponse,
  DashboardMetrics,
  MvpOption,
  MvpResult,
  JobStatus,
  ProjectDetails,
  ProjectHistoryEntry,
} from "@/types/mvp";
import { Download, Film, FolderTree, History, Loader2, Rocket, Wand2 } from "lucide-react";

export function FactoryDashboard() {
  const [idea, setIdea] = useState("");
  const [options, setOptions] = useState<MvpOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [mvpResult, setMvpResult] = useState<MvpResult | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatusResponse | null>(null);
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("generate");

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSelect, setLoadingSelect] = useState<number | null>(null);
  const [loadingMvp, setLoadingMvp] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);
  const [activeJob, setActiveJob] = useState<JobStatus | null>(null);
  const [pollingJob, setPollingJob] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = options.find((o) => o.id === selectedId);
  const promptText =
    selectedPrompt ?? selectedOption?.hidden_technical_prompt ?? "";
  const lastHistoryProject = history[0]?.project_name ?? null;

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const status = await fetchStatus();
      setApiStatus(status);
    } catch (err) {
      setApiStatus(null);
      if (err instanceof ApiError) {
        setError(toErrorMessage(err));
      }
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchHistory();
      setHistory(data.entries);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const data = await fetchDashboard();
      setDashboard(data);
    } catch {
      setDashboard(null);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const loadProjectDetailsByName = useCallback(async (name: string) => {
    if (!name) return;
    setLoadingProjectDetails(true);
    try {
      const details = await fetchProjectDetails(name);
      setProjectDetails(details);
    } catch {
      setProjectDetails(null);
    } finally {
      setLoadingProjectDetails(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadHistory();
    loadDashboard();
  }, [loadStatus, loadHistory, loadDashboard]);

  useEffect(() => {
    if (activeTab !== "project") return;
    const name =
      mvpResult?.PROJECT_NAME ||
      dashboard?.last_project ||
      lastHistoryProject;
    if (name && name !== projectDetails?.project_name) {
      loadProjectDetailsByName(name);
    }
  }, [
    activeTab,
    mvpResult?.PROJECT_NAME,
    dashboard?.last_project,
    lastHistoryProject,
    projectDetails?.project_name,
    loadProjectDetailsByName,
  ]);

  useEffect(() => {
    if (!activeJob?.job_id || !pollingJob) return;
    const jobId = activeJob.job_id;
    if (activeJob.status === "COMPLETED" || activeJob.status === "FAILED") {
      setPollingJob(false);
      return;
    }

    async function pollJob() {
      try {
        const job = await fetchJobStatus(jobId);
        setActiveJob(job);

        if (job.status === "COMPLETED" && job.project_name && job.zip) {
          setPollingJob(false);
          setMvpResult({
            PROJECT_NAME: job.project_name,
            STATUS: "WORKING",
            ZIP: job.zip,
          });
          await loadProjectDetailsByName(job.project_name);
          await Promise.all([loadStatus(), loadHistory(), loadDashboard()]);
        } else if (job.status === "FAILED") {
          setPollingJob(false);
          setError("Генерация MVP завершилась с ошибкой.");
        }
      } catch {
        setPollingJob(false);
      }
    }

    const interval = setInterval(pollJob, 2000);
    return () => clearInterval(interval);
  }, [
    activeJob?.job_id,
    activeJob?.status,
    pollingJob,
    loadStatus,
    loadHistory,
    loadDashboard,
    loadProjectDetailsByName,
  ]);

  async function handleGenerateOptions() {
    const trimmed = idea.trim();
    if (!trimmed) {
      setError("Введите идею перед генерацией вариантов.");
      return;
    }

    setError(null);
    setLoadingOptions(true);
    setOptions([]);
    setSelectedId(null);
    setSelectedPrompt(null);
    setMvpResult(null);

    try {
      const data = await generateOptions(trimmed);
      setOptions(mapApiOptions(data?.options ?? []));
      await loadStatus();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? toErrorMessage(err)
          : toErrorMessage(err, "Не удалось получить варианты MVP.")
      );
    } finally {
      setLoadingOptions(false);
    }
  }

  async function handleSelectOption(optionId: number) {
    setError(null);
    setLoadingSelect(optionId);
    setSelectedId(optionId);
    setSelectedPrompt(null);
    setMvpResult(null);

    try {
      const data = await selectOption(optionId);
      setSelectedPrompt(data.hidden_technical_prompt);
      await loadStatus();
    } catch (err) {
      setSelectedId(null);
      setError(
        err instanceof ApiError
          ? toErrorMessage(err)
          : toErrorMessage(err, "Не удалось выбрать вариант.")
      );
    } finally {
      setLoadingSelect(null);
    }
  }

  async function handleGenerateMvp() {
    if (selectedId === null) return;

    setError(null);
    setLoadingMvp(true);
    setMvpResult(null);
    setProjectDetails(null);
    setActiveJob(null);

    try {
      const queued = await generateMvp(selectedId);
      setPollingJob(true);
      const initial = await fetchJobStatus(queued.job_id);
      setActiveJob(initial);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? toErrorMessage(err)
          : toErrorMessage(err, "Не удалось сгенерировать MVP.")
      );
    } finally {
      setLoadingMvp(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        factoryVersion={apiStatus?.factory_version ?? dashboard?.factory_version}
        status={apiStatus?.status}
        loading={loadingStatus}
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <DashboardMetricsBlock
          metrics={dashboard}
          loading={loadingDashboard}
        />

        {error && (
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="history">
              <History className="size-4 sm:mr-1" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="project">
              <FolderTree className="size-4 sm:mr-1" />
              <span className="hidden sm:inline">Project Details</span>
            </TabsTrigger>
            <TabsTrigger value="demo">
              <Film className="size-4 sm:mr-1" />
              <span className="hidden sm:inline">Demo Video</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ваша идея</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Например: Telegram-бот для рыбалки"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="min-h-[100px] resize-y"
                  disabled={loadingOptions}
                />
                <Button
                  type="button"
                  size="lg"
                  onClick={() => void handleGenerateOptions()}
                  disabled={loadingOptions || !idea.trim()}
                >
                  {loadingOptions ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Wand2 />
                  )}
                  {loadingOptions ? "Generating…" : "Generate Options"}
                </Button>
              </CardContent>
            </Card>

            {options.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">MVP Options</h2>
                  <Badge variant="secondary">3 варианта</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {options.map((option) => (
                    <OptionCard
                      key={option.option_key}
                      option={option}
                      selected={selectedId === option.id}
                      loading={loadingSelect === option.id}
                      onSelect={() => handleSelectOption(option.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {selectedOption && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    hidden_technical_prompt
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedOption.option_key} — {selectedOption.title}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingSelect !== null && !selectedPrompt ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Загрузка промпта…
                    </div>
                  ) : (
                    <ScrollArea className="h-80 rounded-lg border">
                      <pre className="p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {promptText}
                      </pre>
                    </ScrollArea>
                  )}
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => void handleGenerateMvp()}
                    disabled={
                      loadingMvp || loadingSelect !== null || !promptText
                    }
                  >
                    {loadingMvp ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Rocket />
                    )}
                    {loadingMvp ? "Generating MVP…" : "Generate MVP"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {(activeJob || (loadingMvp && !mvpResult)) && (
              <JobStatusBlock
                job={activeJob}
                loading={loadingMvp && !activeJob}
              />
            )}

            {mvpResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">MVP Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        PROJECT_NAME
                      </dt>
                      <dd className="mt-1 font-mono text-sm font-medium">
                        {mvpResult.PROJECT_NAME}
                      </dd>
                    </div>
                    <div className="rounded-lg border p-4">
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        STATUS
                      </dt>
                      <dd className="mt-1">
                        <Badge
                          variant={
                            mvpResult.STATUS === "WORKING"
                              ? "default"
                              : "outline"
                          }
                        >
                          {mvpResult.STATUS}
                        </Badge>
                      </dd>
                    </div>
                    <div className="rounded-lg border p-4">
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        ZIP
                      </dt>
                      <dd className="mt-1 font-mono text-sm">
                        {mvpResult.ZIP}
                      </dd>
                    </div>
                  </dl>
                  <Separator />
                  <Button asChild>
                    <a
                      href={getDownloadUrl(mvpResult.PROJECT_NAME)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download />
                      Download ZIP
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ProjectHistory entries={history} loading={loadingHistory} />
          </TabsContent>

          <TabsContent value="project">
            <ProjectDetailsBlock
              details={projectDetails}
              loading={loadingProjectDetails}
              projectName={
                mvpResult?.PROJECT_NAME ||
                dashboard?.last_project ||
                lastHistoryProject
              }
            />
          </TabsContent>

          <TabsContent value="demo">
            <DemoVideoTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
