import type { AnalyzeIdeaRequest, AnalyzeIdeaResponse } from "@/lib/ai-orchestrator/types";

function extractJson(text: string): AnalyzeIdeaResponse {
  const cleaned = text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return JSON");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as AnalyzeIdeaResponse;
}

export function formatGeminiError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Gemini error";
}

export async function analyzeWithGemini(
  input: AnalyzeIdeaRequest,
  apiKey: string
): Promise<AnalyzeIdeaResponse> {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const generatedAt = new Date().toISOString();

  const prompt = `
Ты — продуктовый AI-архитектор SaaS/MVP.

Задача: проанализировать идею и вернуть только JSON без markdown.

Идея:
${input.idea}

Язык ответа: ${input.language}
Целевой результат: ${input.target_output}

Верни строго JSON:
{
  "status": "ok",
  "provider": "gemini",
  "idea": "...",
  "summary": "...",
  "project_type": "...",
  "recommended_stack": "...",
  "mvp_features": ["..."],
  "risks": ["..."],
  "next_steps": ["..."],
  "generated_at": "${generatedAt}",
  "idea_analysis": "..."
}

Важно:
- Не используй старые темы типа translator или telegram bot, если их нет в идее.
- Думай по реальной нише пользователя.
- Для SaaS предлагай CRM, dashboard, calendar, clients, finance, portfolio, auth, subscription.
- Ответ должен быть коммерчески полезным.
`;

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini empty response");
  }

  const parsed = extractJson(text);

  return {
    ...parsed,
    status: parsed.status || "ok",
    provider: "gemini",
    idea: parsed.idea || input.idea,
    generated_at: parsed.generated_at || generatedAt,
  };
}
