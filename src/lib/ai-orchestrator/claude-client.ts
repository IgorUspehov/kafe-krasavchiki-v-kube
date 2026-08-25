// ============================================================
// Claude Client — Primary AI Provider
// Model: claude-3-5-sonnet-latest
// ============================================================

import { AnalyzeIdeaResponse } from "./types";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const SYSTEM_PROMPT = `You are an expert SaaS MVP analyzer. 
Your task: analyze a business idea and return a structured JSON response.

CRITICAL RULES:
- Return ONLY valid JSON. No markdown, no backticks, no explanation.
- Detect the niche precisely (beauty, education, fitness, logistics, etc.)
- For beauty/nail/barbershop niches → always include: booking, calendar, clients, portfolio, finance
- For education niches → always include: courses, students, progress, payments
- mvp_features must be specific to the niche, never generic
- recommended_stack must be practical for a solo developer

JSON schema (return exactly this structure):
{
  "status": "ok",
  "provider": "claude",
  "idea": "<original idea text>",
  "summary": "<2-3 sentence summary in the same language as the idea>",
  "project_type": "<Beauty Booking SaaS | Education Platform | Marketplace | CRM | etc>",
  "recommended_stack": "<e.g. Next.js + Supabase + Stripe + Tailwind>",
  "mvp_features": ["<feature 1>", "<feature 2>", "...8-12 specific features"],
  "risks": ["<risk 1>", "<risk 2>", "...3-5 risks"],
  "next_steps": ["<step 1>", "<step 2>", "...4-6 actionable steps"],
  "generated_at": "<ISO timestamp>",
  "idea_analysis": "<detailed 3-5 paragraph analysis of the idea, market, monetization>"
}`;

export async function analyzeWithClaude(
  idea: string,
  language: string = "ru"
): Promise<AnalyzeIdeaResponse> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const userPrompt = `Analyze this SaaS idea and return JSON:

${idea}

Response language for text fields: ${language === "de" ? "German" : language === "en" ? "English" : "Russian"}
Current time: ${new Date().toISOString()}`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Extract text from Claude response
  const rawText = data?.content?.[0]?.text || "";

  // Strip markdown code blocks if present
  const jsonText = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: AnalyzeIdeaResponse;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${rawText.slice(0, 200)}`);
  }

  // Ensure required fields
  parsed.status = "ok";
  parsed.provider = "claude";
  parsed.generated_at = parsed.generated_at || new Date().toISOString();

  return parsed;
}

export function isClaudioAvailable(): boolean {
  return !!ANTHROPIC_API_KEY;
}
