import fs from "fs";
import path from "path";

import {
  buildCatalogSeed,
  type CatalogItem,
  resolveSectorModelForClient,
} from "@/lib/catalog/resolve-catalog";
import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";

function catalogDir(): string {
  return path.join(resolvePersistentDataDir(), "catalogs");
}

function catalogPath(clientId: string): string {
  return path.join(catalogDir(), `${clientId}.json`);
}

function normalizeItem(raw: unknown, index: number): CatalogItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const nameRaw = item.name;
  let name: CatalogItem["name"];
  if (typeof nameRaw === "string" && nameRaw.trim()) {
    const v = nameRaw.trim();
    name = { en: v, de: v, ru: v };
  } else if (nameRaw && typeof nameRaw === "object") {
    const o = nameRaw as Record<string, unknown>;
    name = {
      en: String(o.en ?? o.de ?? o.ru ?? "").trim(),
      de: String(o.de ?? o.en ?? o.ru ?? "").trim(),
      ru: String(o.ru ?? o.en ?? o.de ?? "").trim(),
    };
  } else {
    return null;
  }
  if (!name.en && !name.de && !name.ru) return null;
  return {
    id: String(item.id || `rec-cat-${Date.now()}-${index}`),
    name,
    price: item.price != null ? String(item.price) : undefined,
    duration:
      typeof item.duration === "string"
        ? item.duration
        : item.duration && typeof item.duration === "object"
          ? {
              en: String((item.duration as Record<string, unknown>).en ?? ""),
              de: String((item.duration as Record<string, unknown>).de ?? ""),
              ru: String((item.duration as Record<string, unknown>).ru ?? ""),
            }
          : undefined,
  };
}

export function listFileCatalogItems(clientId: string): CatalogItem[] {
  const filePath = catalogPath(clientId);
  if (fs.existsSync(filePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as { items?: unknown[] };
      if (Array.isArray(raw.items) && raw.items.length) {
        return raw.items
          .map((item, index) => normalizeItem(item, index))
          .filter((item): item is CatalogItem => Boolean(item));
      }
    } catch {
      /* fall through to seed */
    }
  }

  const model = resolveSectorModelForClient(clientId);
  const seed = model ? buildCatalogSeed(model) : [];
  if (seed.length) {
    replaceFileCatalogItems(clientId, seed);
  }
  return seed;
}

export function replaceFileCatalogItems(
  clientId: string,
  items: unknown[],
): CatalogItem[] {
  const normalized = items
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is CatalogItem => Boolean(item));

  fs.mkdirSync(catalogDir(), { recursive: true });
  fs.writeFileSync(
    catalogPath(clientId),
    `${JSON.stringify(
      {
        clientId,
        updatedAt: new Date().toISOString(),
        items: normalized,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return normalized;
}
