export type RuntimeSummary = {
  module: string;
  version: string;
  status: string;
  runtime_complete: boolean;
  readiness_score: number;
  completed_modules: string[];
  generated_layers: string[];
  final_result: string;
};

export type SaasRuntimeFactorySnapshot = {
  summary: RuntimeSummary | null;
};
