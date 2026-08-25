import type { ApiPromptOption, MvpOption } from "@/types/mvp";

export function mapApiOption(raw: ApiPromptOption): MvpOption {
  const features = raw.features ?? [];
  return {
    id: raw.id,
    option_key: raw.option_key,
    title: raw.title,
    audience: raw.target_audience ?? "—",
    problem: raw.description ?? "—",
    solution:
      features.length > 0
        ? features.slice(0, 5).join(" · ")
        : (raw.description ?? "—"),
    monetization:
      raw.architecture_key?.includes("saas") ||
      raw.option_key === "OPTION_3"
        ? "SaaS-подписка, тарифы, API"
        : "Freemium / разовая настройка",
    tech_stack: raw.stack ?? "—",
    complexity: raw.estimated_complexity ?? "—",
    hidden_technical_prompt: raw.hidden_technical_prompt ?? "",
  };
}

export function mapApiOptions(
  options: ApiPromptOption[] | undefined | null
): MvpOption[] {
  if (!Array.isArray(options)) return [];
  return options.map(mapApiOption);
}
