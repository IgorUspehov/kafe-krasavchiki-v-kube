import type {
  ApiPromptOptionsResponse,
  ApiSelectOptionResponse,
  ApiStatusResponse,
  DashboardMetrics,
  GenerateMvpJobResponse,
  HistoryResponse,
  JobStatus,
  ProjectDetails,
} from "@/types/mvp";
import { ApiError, apiFetch, getApiUrl } from "@/lib/api-core";

export { ApiError, getApiUrl };

export function getDownloadUrl(projectName: string): string {
  return `${getApiUrl()}/download/${encodeURIComponent(projectName)}`;
}

export async function generateOptions(
  idea: string
): Promise<ApiPromptOptionsResponse> {
  return apiFetch<ApiPromptOptionsResponse>("/generate-options", {
    method: "POST",
    body: JSON.stringify({ idea }),
  });
}

export async function selectOption(
  optionId: number
): Promise<ApiSelectOptionResponse> {
  return apiFetch<ApiSelectOptionResponse>("/select-option", {
    method: "POST",
    body: JSON.stringify({ option_id: optionId }),
  });
}

export async function generateMvp(
  optionId: number
): Promise<GenerateMvpJobResponse> {
  return apiFetch<GenerateMvpJobResponse>("/generate-mvp", {
    method: "POST",
    body: JSON.stringify({ option_id: optionId }),
  });
}

export async function fetchJobStatus(jobId: string): Promise<JobStatus> {
  return apiFetch<JobStatus>(`/job/${encodeURIComponent(jobId)}`);
}

export async function fetchStatus(): Promise<ApiStatusResponse> {
  return apiFetch<ApiStatusResponse>("/status");
}

export async function fetchHistory(): Promise<HistoryResponse> {
  return apiFetch<HistoryResponse>("/history");
}

export async function fetchDashboard(): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>("/dashboard");
}

export async function fetchProjectDetails(
  projectName: string
): Promise<ProjectDetails> {
  return apiFetch<ProjectDetails>(
    `/project/${encodeURIComponent(projectName)}`
  );
}
