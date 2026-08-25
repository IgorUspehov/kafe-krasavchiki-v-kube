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
    throw new Error("OpenAI did not return JSON");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as AnalyzeIdeaResponse;
}

export async function analyzeWithOpenAI(
  input: AnalyzeIdeaRequest,
  apiKey: string
): Promise<AnalyzeIdeaResponse> {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const generatedAt = new Date().toISOString();

  const prompt = `
Ты — главный LLM-архитектор фабрики SAAS_IDEA_AI_MVP_FACTORY.

Твоя задача: проанализировать бизнес-идею и вернуть СТРОГО JSON без markdown.

Идея:
${input.idea}

Язык ответа: ${input.language}
Целевой результат: ${input.target_output}

Верни JSON:
{
  "status": "ok",
  "provider": "openai",
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

Правила:
- Не используй старые темы telegram bot / translator, если их нет в идее.
- Определи реальную нишу.
- Для SaaS думай как коммерческий продукт.
- Дай конкретные функции под нишу.
- Дай стек для solo developer: Next.js, Tailwind, shadcn/ui, Supabase/PostgreSQL, Stripe при монетизации.
- Ответ должен быть полезен для создания MVP.
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Return only valid JSON. No markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("OpenAI empty response");
  }

  const parsed = extractJson(text);

  return {
    ...parsed,
    status: parsed.status || "ok",
    provider: "openai",
    idea: parsed.idea || input.idea,
    generated_at: parsed.generated_at || generatedAt,
  };
}
