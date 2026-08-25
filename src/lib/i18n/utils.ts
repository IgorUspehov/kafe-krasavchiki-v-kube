type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

interface JsonObject {
  [key: string]: JsonValue;
}

export type TranslationTree = JsonObject;

export function getNestedValue(tree: TranslationTree, path: string): string {
  if (!tree || typeof tree !== "object") {
    return path;
  }

  const parts = path.split(".").filter(Boolean);
  let current: JsonValue = tree;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return path;
    }
    if (typeof current !== "object" || Array.isArray(current)) {
      return path;
    }
    current = (current as JsonObject)[part];
  }

  if (typeof current === "string") {
    return current;
  }
  if (typeof current === "number" || typeof current === "boolean") {
    return String(current);
  }

  return path;
}

export function mergeTranslations(
  common: TranslationTree,
  presentation: TranslationTree
): TranslationTree {
  return {
    ...common,
    presentation,
  };
}
