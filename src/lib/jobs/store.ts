import { getFirestoreDb } from "@/lib/firebase/admin";

export type JobApplicationRecord = {
  id: string;
  clientId: string;
  name: string;
  phone: string;
  position: string;
  experience: string;
  language: string;
  status: string;
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

export async function listJobApplications(
  clientId: string,
): Promise<JobApplicationRecord[]> {
  const id = String(clientId || "").trim();
  if (!id) return [];

  const snap = await getFirestoreDb()
    .collection("job_applications")
    .doc(id)
    .collection("records")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      id: asString(data.id) || doc.id,
      clientId: asString(data.clientId) || id,
      name: asString(data.name),
      phone: asString(data.phone),
      position: asString(data.position),
      experience: asString(data.experience),
      language: asString(data.language) || "de",
      status: asString(data.status) || "new",
      createdAt: asNumber(data.createdAt),
    };
  });
}
