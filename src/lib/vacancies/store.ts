import { getFirestoreDb } from "@/lib/firebase/admin";

export type VacancyRecord = {
  id: string;
  title: string;
  description: string;
  salary?: string;
  requirements?: string;
  createdAt: number;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function itemsCollection(clientId: string) {
  return getFirestoreDb().collection("vacancies").doc(clientId).collection("items");
}

function normalizeVacancy(
  data: Record<string, unknown>,
  fallbackId: string,
): VacancyRecord | null {
  const title = asString(data.title).trim();
  if (!title) return null;
  const requirements = asString(data.requirements).trim();
  const description =
    asString(data.description).trim() || requirements || title;
  const salary = asString(data.salary).trim();
  return {
    id: asString(data.id) || fallbackId,
    title,
    description,
    ...(salary ? { salary } : {}),
    ...(requirements ? { requirements } : {}),
    createdAt: asNumber(data.createdAt) || Date.now(),
  };
}

export async function listVacancies(clientId: string): Promise<VacancyRecord[]> {
  const id = String(clientId || "").trim();
  if (!id) return [];

  try {
    const snap = await itemsCollection(id).orderBy("createdAt", "desc").limit(100).get();
    return snap.docs
      .map((doc) => normalizeVacancy(doc.data() as Record<string, unknown>, doc.id))
      .filter((item): item is VacancyRecord => Boolean(item));
  } catch (error) {
    console.error("[vacancies] list failed", {
      clientId: id,
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function createVacancy(
  clientId: string,
  input: {
    title: string;
    description?: string;
    salary?: string;
    requirements?: string;
  },
): Promise<VacancyRecord> {
  const id = `vac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const title = String(input.title || "").trim();
  if (!title) {
    throw new Error("title is required");
  }
  const salary = String(input.salary || "").trim();
  const requirements = String(input.requirements || "").trim();
  const description =
    String(input.description || "").trim() || requirements || title;
  const record: VacancyRecord = {
    id,
    title,
    description,
    ...(salary ? { salary } : {}),
    ...(requirements ? { requirements } : {}),
    createdAt: Date.now(),
  };
  await itemsCollection(clientId).doc(id).set(record);
  return record;
}

export async function deleteVacancy(
  clientId: string,
  vacancyId: string,
): Promise<boolean> {
  const id = String(vacancyId || "").trim();
  if (!id) return false;
  await itemsCollection(clientId).doc(id).delete();
  return true;
}

export async function updateVacancy(
  clientId: string,
  vacancyId: string,
  input: {
    title?: string;
    description?: string;
    salary?: string;
    requirements?: string;
  },
): Promise<VacancyRecord | null> {
  const id = String(vacancyId || "").trim();
  if (!id) return null;
  const ref = itemsCollection(clientId).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const current = normalizeVacancy(snap.data() as Record<string, unknown>, id);
  if (!current) return null;
  const title = input.title !== undefined ? String(input.title || "").trim() : current.title;
  if (!title) {
    throw new Error("title is required");
  }
  const salary =
    input.salary !== undefined ? String(input.salary || "").trim() : current.salary || "";
  const requirements =
    input.requirements !== undefined
      ? String(input.requirements || "").trim()
      : current.requirements || "";
  const description =
    input.description !== undefined
      ? String(input.description || "").trim() || requirements || title
      : current.description;
  const record: VacancyRecord = {
    id,
    title,
    description,
    ...(salary ? { salary } : {}),
    ...(requirements ? { requirements } : {}),
    createdAt: current.createdAt,
  };
  await ref.set(record);
  return record;
}
