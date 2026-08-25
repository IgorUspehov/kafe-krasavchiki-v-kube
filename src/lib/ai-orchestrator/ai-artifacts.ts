import { normalizeAnalyzeIdeaResponse } from "@/lib/ai-orchestrator/normalize-analysis";
import type { AiFactorySnapshot, AnalyzeIdeaResponse } from "@/lib/ai-orchestrator/types";

export async function analyzeIdeaViaApi(
  idea: string,
  language: "ru" | "en" | "de",
  targetOutput: "MVP" | "SaaS" | "Landing" | "APK" | "PWA"
): Promise<AnalyzeIdeaResponse> {
  const res = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idea,
      language,
      target_output: targetOutput,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "AI analysis failed");
  }

  return (await res.json()) as AnalyzeIdeaResponse;
}

export async function fetchLatestAiAnalysis(): Promise<AiFactorySnapshot> {
  const res = await fetch("/artifacts/factory_output/ai/ai_analysis.json");
  if (!res.ok) {
    return { analysis: null };
  }

  const analysis = normalizeAnalyzeIdeaResponse((await res.json()) as AnalyzeIdeaResponse);
  return { analysis };
}
