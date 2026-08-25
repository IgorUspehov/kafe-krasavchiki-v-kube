import { analyzeWithOpenAI } from "@/lib/ai-orchestrator/openai-client";
import { analyzeWithGemini } from "@/lib/ai-orchestrator/gemini-client";
import { buildSmartFallbackAnalysis } from "@/lib/ai-orchestrator/fallback-client";
import { getActiveProvider } from "@/lib/ai-orchestrator/provider-config";
import { runFactoryPipelineFromAnalysis } from "@/lib/ai-orchestrator/factory-bridge";
import { normalizeAnalyzeIdeaResponse } from "@/lib/ai-orchestrator/normalize-analysis";
import type { AnalyzeIdeaRequest, AnalyzeIdeaResponse } from "@/lib/ai-orchestrator/types";

export async function orchestrateAnalysis(
  request: AnalyzeIdeaRequest
): Promise<AnalyzeIdeaResponse> {
  const { idea, language = "ru" } = request;
  const provider = getActiveProvider();

  console.log(`[Orchestrator] Provider: ${provider} | Idea: ${idea.slice(0, 80)}...`);

  if (provider === "openai") {
    try {
      console.log("[Orchestrator] → Trying OpenAI API...");
      const result = await analyzeWithOpenAI(
        request,
        process.env.OPENAI_API_KEY?.trim() || ""
      );
      console.log("[Orchestrator] ✓ OpenAI success");
      const runPipeline = process.env.FACTORY_RUN_PIPELINE === "1";
      const factory_pipeline = runPipeline
        ? await runFactoryPipelineFromAnalysis(result)
        : {
            status: "DEFERRED",
            message: "Factory pipeline skipped during analyze. Run: npm run domain:sync",
          };
      if (runPipeline) {
        console.log("[Orchestrator] ✓ Factory Pipeline done");
      }
      return normalizeAnalyzeIdeaResponse({ ...result, factory_pipeline });
    } catch (err) {
      console.error("[Orchestrator] ✗ OpenAI failed:", err);
      console.log("[Orchestrator] → Falling back to Gemini...");
    }
  }

  try {
    console.log("[Orchestrator] → Trying Gemini API...");
    const result = await analyzeWithGemini(
      request,
      process.env.GEMINI_API_KEY?.trim() || ""
    );
    console.log("[Orchestrator] ✓ Gemini success");
    return normalizeAnalyzeIdeaResponse(result);
  } catch (err) {
    console.error("[Orchestrator] ✗ Gemini failed:", err);
  }

  console.log("[Orchestrator] → Using Smart Fallback...");
  return normalizeAnalyzeIdeaResponse(buildSmartFallbackAnalysis(idea, language));
}

export const analyzeIdea = orchestrateAnalysis;
