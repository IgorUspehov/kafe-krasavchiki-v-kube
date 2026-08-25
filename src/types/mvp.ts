export interface MvpOption {
  id: number;
  option_key: string;
  title: string;
  audience: string;
  problem: string;
  solution: string;
  monetization: string;
  tech_stack: string;
  complexity: string;
  hidden_technical_prompt: string;
}

export interface MvpResult {
  PROJECT_NAME: string;
  STATUS: string;
  ZIP: string;
}

export interface GenerateMvpJobResponse {
  job_id: string;
  status: string;
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress: number;
  project_name: string | null;
  zip: string | null;
}

/** Ответ backend PROMPT_OPTIONS.json */
export interface ApiPromptOption {
  id: number;
  option_key: string;
  title: string;
  description?: string;
  target_audience?: string;
  features?: string[];
  stack?: string;
  architecture_key?: string;
  estimated_complexity?: string;
  hidden_technical_prompt?: string;
}

export interface ApiPromptOptionsResponse {
  options: ApiPromptOption[];
}

export interface ApiSelectOptionResponse {
  option_id: number;
  option_key: string;
  hidden_technical_prompt: string;
}

export interface ApiStatusResponse {
  factory_version: string;
  mock_mode: boolean;
  idea: string | null;
  selected_option: string | null;
  project_name: string | null;
  status: string | null;
  outputs: Record<string, boolean>;
}

export interface ProjectHistoryEntry {
  timestamp: string;
  idea: string;
  selected_option: string;
  project_name: string;
  zip: string;
  status: string;
}

export interface HistoryResponse {
  entries: ProjectHistoryEntry[];
}

export interface DashboardMetrics {
  factory_version: string;
  total_projects: number;
  total_zip_files: number;
  last_project: string;
  history_entries: number;
}

export interface ProjectDetails {
  project_name: string;
  zip: string;
  status: string;
  created_at: string;
  files: string[];
}
