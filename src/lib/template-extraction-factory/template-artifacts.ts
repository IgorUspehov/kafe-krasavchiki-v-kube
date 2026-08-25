import type { TemplateExtractionSnapshot, TemplateManifest } from "@/lib/template-extraction-factory/types";

export const TEMPLATE_EXTRACTION_BASE = "/artifacts/template";

export async function fetchTemplateExtractionSnapshot(): Promise<TemplateExtractionSnapshot> {
  const res = await fetch(`${TEMPLATE_EXTRACTION_BASE}/template_manifest.json`);
  const manifest = res.ok ? ((await res.json()) as TemplateManifest) : null;
  return { manifest };
}
