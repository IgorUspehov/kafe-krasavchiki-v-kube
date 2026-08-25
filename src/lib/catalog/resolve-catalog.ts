import fs from "fs";
import path from "path";

import {
  getSectorModel,
  getSectorModelByBusinessType,
  pickLocalized,
  type CatalogRecordKey,
  type LocalizedLabel,
  type SectorModel,
} from "@/lib/niches/sector-models";
import type { LeadLang } from "@/lib/leads/types";
import { loadClientManifest } from "@/lib/manifest/storage";

export type CatalogItem = {
  id: string;
  /** Full i18n name — single source for CRM + public form. */
  name: LocalizedLabel;
  price?: string;
  duration?: LocalizedLabel | string;
};

function scenariosPath(): string {
  return path.join(
    process.cwd(),
    "artifacts/factory_output/react_mvp/src/data/niche-scenarios.json",
  );
}

function readScenarios(): Record<string, unknown> {
  const filePath = scenariosPath();
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function asLocalized(
  value: unknown,
  fallback = "",
): LocalizedLabel {
  if (typeof value === "string") {
    return { en: value, de: value, ru: value };
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return {
      en: String(o.en ?? o.de ?? o.ru ?? fallback),
      de: String(o.de ?? o.en ?? o.ru ?? fallback),
      ru: String(o.ru ?? o.en ?? o.de ?? fallback),
    };
  }
  return { en: fallback, de: fallback, ru: fallback };
}

function itemsFromRecords(
  records: Record<string, unknown> | undefined,
  catalogKey: CatalogRecordKey,
): CatalogItem[] {
  const arr = records?.[catalogKey];
  if (!Array.isArray(arr) || !arr.length) return [];
  return arr.map((raw, index) => {
    const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const id = String(item.id || `seed-${catalogKey}-${index + 1}`);
    return {
      id,
      name: asLocalized(item.name ?? item.title, `Item ${index + 1}`),
      price: item.price != null ? String(item.price) : undefined,
      duration:
        typeof item.duration === "string" || (item.duration && typeof item.duration === "object")
          ? asLocalized(item.duration)
          : undefined,
    };
  });
}

/** Build canonical catalog seed for a sector model (scenario records → seedCatalog). */
export function buildCatalogSeed(model: SectorModel): CatalogItem[] {
  const scenarios = readScenarios();
  const scenario = scenarios[model.scenarioKey] as
    | { records?: Record<string, unknown> }
    | undefined;
  const fromRecords = itemsFromRecords(scenario?.records, model.catalogKey);
  if (fromRecords.length) return fromRecords;

  // Alias: barbershop may reuse beauty_salon services until own scenario exists
  if (model.sectorId === "barbershop") {
    const beauty = scenarios.beauty_salon as { records?: Record<string, unknown> } | undefined;
    const beautyServices = itemsFromRecords(beauty?.records, "services");
    if (beautyServices.length) return beautyServices;
  }

  return model.seedCatalog.map((name, index) => ({
    id: `seed-${model.sectorId}-${index + 1}`,
    name,
  }));
}

export function resolveSectorModelForClient(clientId: string): SectorModel | null {
  const manifest = loadClientManifest(clientId) || {};
  const sectorId = String(manifest.sectorId ?? manifest.sector_id ?? "").trim();
  if (sectorId) {
    const bySector = getSectorModel(sectorId);
    if (bySector) return bySector;
  }
  const businessType = String(
    manifest.businessType ?? manifest.business_type ?? "",
  ).trim();
  if (businessType) return getSectorModelByBusinessType(businessType);
  return null;
}

/** Localized name list for public form / CRM dropdown — same order, same items. */
export function catalogNamesForLang(items: CatalogItem[], lang: LeadLang): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of items) {
    const name = pickLocalized(item.name, lang);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

/**
 * Resolve catalog for a tenant without Firestore (seed only).
 * Used as fallback and for offline verification.
 */
export function resolveCatalogSeedForClient(clientId: string): {
  model: SectorModel | null;
  items: CatalogItem[];
} {
  const model = resolveSectorModelForClient(clientId);
  if (!model) return { model: null, items: [] };
  return { model, items: buildCatalogSeed(model) };
}

export function resolveCatalogSeedForSector(sectorId: string): {
  model: SectorModel | null;
  items: CatalogItem[];
} {
  const model = getSectorModel(sectorId);
  if (!model) return { model: null, items: [] };
  return { model, items: buildCatalogSeed(model) };
}
