import type { AnalyzeIdeaResponse } from "@/lib/ai-orchestrator/types";

export type RecommendedStackSections = {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  cloud_platform?: string[];
  other_tools?: string[];
};

const STACK_SECTION_LABELS: Record<keyof RecommendedStackSections, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  cloud_platform: "Cloud",
  other_tools: "Other tools",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item == null) return "";
      if (typeof item === "number" || typeof item === "boolean") return String(item);
      return JSON.stringify(item);
    })
    .filter(Boolean);
}

export function parseRecommendedStackSections(value: unknown): RecommendedStackSections | null {
  if (!isRecord(value)) return null;

  const sections: RecommendedStackSections = {};
  for (const key of Object.keys(STACK_SECTION_LABELS) as (keyof RecommendedStackSections)[]) {
    const items = toStringList(value[key]);
    if (items.length > 0) sections[key] = items;
  }

  return Object.keys(sections).length > 0 ? sections : null;
}

export function formatRecommendedStackText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";

  const sections = parseRecommendedStackSections(value);
  if (sections) {
    return (Object.keys(STACK_SECTION_LABELS) as (keyof RecommendedStackSections)[])
      .filter((key) => sections[key]?.length)
      .map((key) => `${STACK_SECTION_LABELS[key]}: ${sections[key]!.join(", ")}`)
      .join(" | ");
  }

  if (Array.isArray(value)) {
    return toStringList(value).join(", ");
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, entry]) => {
        const items = toStringList(entry);
        if (items.length > 0) return `${key}: ${items.join(", ")}`;
        if (typeof entry === "string") return `${key}: ${entry}`;
        return null;
      })
      .filter(Boolean)
      .join(" | ");
  }

  return String(value);
}

export function toDisplayText(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return toStringList(value).join(", ") || "—";
  if (isRecord(value)) return formatRecommendedStackText(value) || "—";
  return String(value);
}

export function toStringArray(value: unknown): string[] {
  return toStringList(value);
}

export function normalizeAnalyzeIdeaResponse(
  response: AnalyzeIdeaResponse
): AnalyzeIdeaResponse & { stack_sections?: RecommendedStackSections | null } {
  const stackSections = parseRecommendedStackSections(response.recommended_stack);

  return {
    ...response,
    summary: toDisplayText(response.summary),
    project_type: toDisplayText(response.project_type),
    idea_analysis:
      typeof response.idea_analysis === "string"
        ? response.idea_analysis
        : toDisplayText(response.idea_analysis),
    recommended_stack: formatRecommendedStackText(response.recommended_stack),
    mvp_features: toStringArray(response.mvp_features),
    risks: toStringArray(response.risks),
    next_steps: toStringArray(response.next_steps),
    stack_sections: stackSections,
  };
}

export function getStackSectionLabel(key: keyof RecommendedStackSections): string {
  return STACK_SECTION_LABELS[key];
}
