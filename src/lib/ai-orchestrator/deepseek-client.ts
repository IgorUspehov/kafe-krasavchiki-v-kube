import type { AnalyzeIdeaRequest, AnalyzeIdeaResponse } from "@/lib/ai-orchestrator/types";

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";
const FALLBACK_HTTP_STATUSES = new Set([401, 402, 429, 500]);

function buildAnalysisPrompt(input: AnalyzeIdeaRequest): string {
  const langLabel = input.language.toUpperCase();
  return [
    `Analyze this product idea for a ${input.target_output} output.`,
    `Respond in ${langLabel}.`,
    `Return ONLY valid JSON with keys:`,
    `summary, project_type, recommended_stack, mvp_features (array), risks (array), next_steps (array).`,
    ``,
    `Idea: ${input.idea}`,
  ].join("\n");
}

export function formatDeepSeekError(status?: number, cause?: unknown): string {
  if (typeof status === "number") {
    return `DeepSeek API error: ${status}`;
  }
  if (cause instanceof Error) {
    return cause.message;
  }
  return "DeepSeek network error";
}

export function buildMockAnalysis(
  input: AnalyzeIdeaRequest,
  generatedAt: string
): AnalyzeIdeaResponse {
  return {
    status: "MOCK_MODE",
    provider: "mock",
    idea: input.idea,
    summary: "Mock AI analysis generated locally",
    project_type: input.target_output === "SaaS" ? "saas_platform" : "mvp_web_app",
    recommended_stack: "Next.js, TypeScript, Tailwind CSS, FastAPI, PostgreSQL",
    mvp_features: [
      "User onboarding",
      "Core dashboard",
      "API layer",
      "Admin panel",
    ],
    risks: ["API key not configured", "Scope needs validation"],
    next_steps: ["Set DEEPSEEK_API_KEY", "Re-run analysis", "Generate MVP"],
    generated_at: generatedAt,
    mock_mode: true,
    message: "DEEPSEEK_API_KEY not found",
    idea_analysis: "Mock AI analysis generated locally",
  };
}

export function buildFallbackAnalysis(
  input: AnalyzeIdeaRequest,
  generatedAt: string,
  originalError: string
): AnalyzeIdeaResponse {
  const base = buildMockAnalysis(input, generatedAt);

  return {
    ...base,
    status: "FALLBACK_MODE",
    provider: "mock",
    message: "DeepSeek unavailable or payment required",
    original_error: originalError,
    idea_analysis: "Mock AI analysis generated locally",
    summary: "Mock AI analysis generated locally",
    risks: ["DeepSeek API unavailable", "Using local fallback analysis"],
    next_steps: ["Check DEEPSEEK_API_KEY and billing", "Re-run analysis later", "Generate MVP"],
  };
}

function extractJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw) as Record<string, unknown>;
}

export async function analyzeWithDeepSeek(
  input: AnalyzeIdeaRequest,
  apiKey: string
): Promise<AnalyzeIdeaResponse> {
  const generatedAt = new Date().toISOString();

  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a SaaS MVP architect. Return strict JSON only, no markdown fences.",
          },
          { role: "user", content: buildAnalysisPrompt(input) },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorMessage = formatDeepSeekError(status);
      if (FALLBACK_HTTP_STATUSES.has(status)) {
        return buildFallbackAnalysis(input, generatedAt, errorMessage);
      }
      return buildFallbackAnalysis(input, generatedAt, errorMessage);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(content);
    } catch (parseError) {
      return buildFallbackAnalysis(
        input,
        generatedAt,
        formatDeepSeekError(undefined, parseError)
      );
    }

    return {
      status: "ACTIVE",
      provider: "deepseek",
      idea: input.idea,
      summary: String(parsed.summary ?? "AI analysis completed."),
      project_type: String(parsed.project_type ?? "mvp_web_app"),
      recommended_stack: String(parsed.recommended_stack ?? "Next.js + TypeScript + FastAPI"),
      mvp_features: Array.isArray(parsed.mvp_features)
        ? parsed.mvp_features.map(String)
        : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps.map(String) : [],
      generated_at: generatedAt,
      mock_mode: false,
    };
  } catch (error) {
    return buildFallbackAnalysis(input, generatedAt, formatDeepSeekError(undefined, error));
  }
}
