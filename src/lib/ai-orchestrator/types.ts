export type TargetOutput = "MVP" | "SaaS" | "Landing" | "APK" | "PWA";

export type PromptLanguage = "ru" | "en" | "de";

export type AnalyzeIdeaRequest = {
  idea: string;
  language: PromptLanguage;
  target_output: TargetOutput;
};

export type RecommendedStackInput =
  | string
  | {
      frontend?: string[];
      backend?: string[];
      database?: string[];
      cloud_platform?: string[];
      other_tools?: string[];
      [key: string]: unknown;
    };

export type AnalyzeIdeaResponse = {
  status: string;
  provider: string;
  idea: string;
  summary: string;
  project_type: string;
  recommended_stack: string | RecommendedStackInput;
  mvp_features: string[];
  risks: string[];
  next_steps: string[];
  generated_at: string;
  mock_mode?: boolean;
  message?: string;
  original_error?: string;
  idea_analysis?: string;
  stack_sections?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    cloud_platform?: string[];
    other_tools?: string[];
  } | null;
  factory_pipeline?: {
    status: string;
    message?: string;
    project_name?: string;
    project_type?: string;
    project_card?: string;
    selected_prompt?: string;
    selected_option?: string;
    zip?: string;
  };
};

export type AiFactorySnapshot = {
  analysis: AnalyzeIdeaResponse | null;
};
