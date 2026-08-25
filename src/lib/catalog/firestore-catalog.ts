import { FieldValue } from "firebase-admin/firestore";

import {
  listFileCatalogItems,
  replaceFileCatalogItems,
} from "@/lib/catalog/file-catalog";
import {
  buildCatalogSeed,
  type CatalogItem,
  resolveSectorModelForClient,
} from "@/lib/catalog/resolve-catalog";
import { getFirestoreDb } from "@/lib/firebase/admin";

function preferFileCatalog(): boolean {
  const mode = (process.env.CATALOG_BACKEND || "").trim().toLowerCase();
  if (mode === "file") return true;
  if (mode === "firestore") return false;
  // Local default: file store (no Railway volume / safe for evidence tenants).
  return process.env.NODE_ENV !== "production";
}

function catalogCollection(clientId: string) {
  return getFirestoreDb().collection("clients").doc(clientId).collection("catalog");
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

async function listFirestoreCatalog(clientId: string): Promise<CatalogItem[]> {
  const snap = await catalogCollection(clientId).orderBy("sortOrder", "asc").get();
  if (!snap.empty) {
    return snap.docs.map((doc, index) => {
      const data = doc.data();
      return (
        normalizeItem({ ...data, id: data.id || doc.id }, index) || {
          id: doc.id,
          name: { en: doc.id, de: doc.id, ru: doc.id },
        }
      );
    });
  }

  const model = resolveSectorModelForClient(clientId);
  const seed = model ? buildCatalogSeed(model) : [];
  if (!seed.length) return [];

  const batch = getFirestoreDb().batch();
  seed.forEach((item, index) => {
    const ref = catalogCollection(clientId).doc(item.id);
    const payload: Record<string, unknown> = {
      id: item.id,
      name: item.name,
      sortOrder: index,
      source: "seed",
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (item.price !== undefined) payload.price = item.price;
    if (item.duration !== undefined) payload.duration = item.duration;
    batch.set(ref, payload);
  });
  await batch.commit();
  return seed;
}

async function replaceFirestoreCatalog(
  clientId: string,
  items: unknown[],
): Promise<CatalogItem[]> {
  const normalized = items
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is CatalogItem => Boolean(item));

  const col = catalogCollection(clientId);
  const existing = await col.get();
  const batch = getFirestoreDb().batch();
  existing.docs.forEach((doc) => batch.delete(doc.ref));
  normalized.forEach((item, index) => {
    const payload: Record<string, unknown> = {
      id: item.id,
      name: item.name,
      sortOrder: index,
      source: "crm",
      updatedAt: FieldValue.serverTimestamp(),
    };
    // Firestore rejects explicit `undefined` fields (e.g. menu rows without duration).
    if (item.price !== undefined) payload.price = item.price;
    if (item.duration !== undefined) payload.duration = item.duration;
    batch.set(col.doc(item.id), payload);
  });
  await batch.commit();
  return normalized;
}

export async function listCatalogItems(clientId: string): Promise<CatalogItem[]> {
  if (preferFileCatalog()) {
    return listFileCatalogItems(clientId);
  }
  try {
    return await listFirestoreCatalog(clientId);
  } catch (error) {
    console.warn("[catalog] Firestore list failed, using file store", error);
    return listFileCatalogItems(clientId);
  }
}

export async function replaceCatalogItems(
  clientId: string,
  items: unknown[],
): Promise<CatalogItem[]> {
  if (preferFileCatalog()) {
    return replaceFileCatalogItems(clientId, items);
  }
  try {
    const saved = await replaceFirestoreCatalog(clientId, items);
    // Mirror to file for local debugging.
    try {
      replaceFileCatalogItems(clientId, saved);
    } catch {
      /* ignore */
    }
    return saved;
  } catch (error) {
    console.warn("[catalog] Firestore replace failed, using file store", error);
    return replaceFileCatalogItems(clientId, items);
  }
}
