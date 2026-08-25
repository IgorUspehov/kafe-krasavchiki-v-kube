import { apiFetch } from "@/lib/api-core";

const DEFAULT_IDEA =
  "Создать SaaS-платформу для профессионального мастера маникюра. Онлайн-запись клиентов, календарь мастера, база клиентов, история посещений, портфолио работ, напоминания, учет доходов и расходов, статистика услуг, мобильная версия, русский и немецкий язык. Целевая аудитория: частные мастера маникюра и небольшие салоны красоты в Германии. Монетизация: подписка 10–20 евро в месяц.";

const jsonBody = (data: Record<string, unknown>) => JSON.stringify(data);

function getFactoryIdea(): string {
  if (typeof window === "undefined") return DEFAULT_IDEA;

  const savedIdea = window.localStorage.getItem("factory:lastIdea");
  if (savedIdea && savedIdea.trim()) return savedIdea.trim();

  return DEFAULT_IDEA;
}

export function saveFactoryIdea(idea: string): void {
  if (typeof window === "undefined") return;
  if (!idea.trim()) return;

  window.localStorage.setItem("factory:lastIdea", idea.trim());
}

export interface ProjectTypeResult {
  status: string;
  project_type?: string;
  confidence?: number;
}

export interface RankRepoResult {
  status: string;
  best_repo?: string;
  score?: number;
}

export interface RankTemplateResult {
  status: string;
  best_template?: string;
  score?: number;
}

export interface RankUiResult {
  status: string;
  best_ui?: string;
  score?: number;
}

export interface ComplexityResult {
  status: string;
  complexity?: string;
  score?: number;
}

export interface CostResult {
  status: string;
  hours?: number;
  cost_eur?: number;
}

export interface PackagingResult {
  status: string;
  recommended?: string;
}

export interface FactoryAuditResult {
  status: string;
  ready_for_v3?: boolean;
}

export async function fetchProjectType(
  idea = getFactoryIdea()
): Promise<ProjectTypeResult> {
  return apiFetch<ProjectTypeResult>("/detect-project-type", {
    method: "POST",
    body: jsonBody({ idea }),
  });
}

export async function fetchRankRepositories(
  idea = getFactoryIdea()
): Promise<RankRepoResult> {
  return apiFetch<RankRepoResult>("/rank-repositories", {
    method: "POST",
    body: jsonBody({ idea }),
  });
}

export async function fetchRankTemplates(
  idea = getFactoryIdea()
): Promise<RankTemplateResult> {
  return apiFetch<RankTemplateResult>("/rank-templates", {
    method: "POST",
    body: jsonBody({ idea }),
  });
}

export async function fetchRankUi(
  idea = getFactoryIdea()
): Promise<RankUiResult> {
  return apiFetch<RankUiResult>("/rank-ui", {
    method: "POST",
    body: jsonBody({ idea }),
  });
}

export async function fetchComplexity(
  idea = getFactoryIdea()
): Promise<ComplexityResult> {
  return apiFetch<ComplexityResult>("/estimate-complexity", {
    method: "POST",
    body: jsonBody({ idea }),
  });
}

export async function fetchCostEstimate(
  idea = getFactoryIdea()
): Promise<CostResult> {
  return apiFetch<CostResult>("/estimate-cost", {
    method: "POST",
    body: jsonBody({ idea }),
  });
}

export async function fetchPackagingAdvice(
  idea = getFactoryIdea()
): Promise<PackagingResult> {
  return apiFetch<PackagingResult>("/advise-packaging", {
    method: "POST",
    body: jsonBody({ idea }),
  });
}

export async function fetchFactoryAudit(
  idea = getFactoryIdea()
): Promise<FactoryAuditResult> {
  return apiFetch<FactoryAuditResult>("/factory-audit", {
    method: "POST",
    body: jsonBody({ idea }),
  });
}

export async function fetchPipelineSnapshot(idea = getFactoryIdea()) {
  const [
    projectType,
    repository,
    template,
    ui,
    complexity,
    cost,
    packaging,
    audit,
  ] = await Promise.allSettled([
    fetchProjectType(idea),
    fetchRankRepositories(idea),
    fetchRankTemplates(idea),
    fetchRankUi(idea),
    fetchComplexity(idea),
    fetchCostEstimate(idea),
    fetchPackagingAdvice(idea),
    fetchFactoryAudit(idea),
  ]);

  const val = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;

  return {
    projectType: val(projectType),
    repository: val(repository),
    template: val(template),
    ui: val(ui),
    complexity: val(complexity),
    cost: val(cost),
    packaging: val(packaging),
    audit: val(audit),
  };
}
