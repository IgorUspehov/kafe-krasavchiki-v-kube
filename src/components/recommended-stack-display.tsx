import {
  getStackSectionLabel,
  parseRecommendedStackSections,
  type RecommendedStackSections,
} from "@/lib/ai-orchestrator/normalize-analysis";

type RecommendedStackDisplayProps = {
  value: unknown;
  sections?: RecommendedStackSections | null;
  className?: string;
};

export function RecommendedStackDisplay({
  value,
  sections,
  className,
}: RecommendedStackDisplayProps) {
  const parsedSections = sections ?? parseRecommendedStackSections(value);

  if (parsedSections) {
    const keys = Object.keys(parsedSections) as (keyof RecommendedStackSections)[];
    return (
      <div className={className ?? "space-y-3"}>
        {keys.map((key) => {
          const items = parsedSections[key];
          if (!items?.length) return null;
          return (
            <div key={key}>
              <p className="font-medium">{getStackSectionLabel(key)}:</p>
              <ul className="list-disc pl-5">
                {items.map((item) => (
                  <li key={`${key}-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }

  const text =
    typeof value === "string"
      ? value
      : value == null
        ? "—"
        : Array.isArray(value)
          ? value.map(String).join(", ")
          : "—";

  return <p className={className}>{text || "—"}</p>;
}
