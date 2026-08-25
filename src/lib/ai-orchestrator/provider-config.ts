export type AiProviderMode = "openai" | "gemini" | "fallback";

export function getActiveProvider(): AiProviderMode {
  const value = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (value === "openai" && process.env.OPENAI_API_KEY?.trim()) {
    return "openai";
  }

  if (value === "gemini" && process.env.GEMINI_API_KEY?.trim()) {
    return "gemini";
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return "openai";
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    return "gemini";
  }

  return "fallback";
}
