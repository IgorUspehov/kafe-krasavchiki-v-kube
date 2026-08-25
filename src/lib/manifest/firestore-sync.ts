import { FieldValue } from "firebase-admin/firestore";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function firebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
      process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
      process.env.FIREBASE_PRIVATE_KEY?.trim(),
  );
}

/** Rebuild a public manifest when Firestore has client fields but manifest blob was lost. */
export function synthesizeManifestFromClientRecord(
  clientId: string,
  data: Record<string, unknown>,
): Record<string, unknown> | null {
  const nested =
    data.manifest && typeof data.manifest === "object"
      ? (data.manifest as Record<string, unknown>)
      : null;
  if (nested) return nested;

  const questionnaire =
    data.questionnaire && typeof data.questionnaire === "object"
      ? (data.questionnaire as Record<string, unknown>)
      : null;

  const businessName =
    pickString(data.businessName) ||
    pickString(data.business_name) ||
    pickString(questionnaire?.business_name);
  if (!businessName) return null;

  const businessType =
    pickString(data.businessType) ||
    pickString(data.business_type) ||
    pickString(questionnaire?.business_type) ||
    "business";

  return {
    businessName,
    business_name: businessName,
    businessType,
    business_type: businessType,
    ownerName: pickString(data.name) || pickString(questionnaire?.name) || businessName,
    email: pickString(data.email) || pickString(questionnaire?.email),
    phone: pickString(data.phone) || pickString(questionnaire?.phone),
    whatsapp: pickString(data.whatsapp) || pickString(questionnaire?.whatsapp),
    telegram: pickString(data.telegram) || pickString(questionnaire?.telegram),
    city: pickString(data.city) || pickString(questionnaire?.city),
    address: pickString(data.address) || pickString(questionnaire?.address),
    postalCode: pickString(data.postalCode) || pickString(questionnaire?.postal_code),
    language: pickString(data.language) || pickString(questionnaire?.language) || "de",
    sectorId: pickString(data.sectorId) || pickString(questionnaire?.sector_id),
    sector_id: pickString(data.sector_id) || pickString(questionnaire?.sector_id),
    clientId,
    client_id: clientId,
  };
}

/** Read manifest from Firestore — survives Render /tmp wipes. */
export async function readManifestFromFirestore(
  clientId: string,
): Promise<Record<string, unknown> | null> {
  const id = String(clientId || "").trim();
  if (!id || !firebaseConfigured()) return null;

  try {
    const { getFirestoreDb } = await import("@/lib/firebase/admin");
    const snap = await getFirestoreDb().collection("clients").doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as Record<string, unknown> | undefined;
    if (!data) return null;
    return synthesizeManifestFromClientRecord(id, data);
  } catch (error) {
    console.warn("[manifest-firestore] read failed", {
      clientId: id,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/** Persist manifest blob to Firestore (merge) — source of truth across deploys. */
export async function writeManifestToFirestore(
  clientId: string,
  manifest: Record<string, unknown>,
): Promise<void> {
  const id = String(clientId || "").trim();
  if (!id) {
    throw new Error("clientId is required for writeManifestToFirestore");
  }
  if (!firebaseConfigured()) {
    console.error("[manifest-firestore] write skipped — Firebase env not configured", {
      clientId: id,
    });
    throw new Error("Firebase is not configured — cannot persist manifest");
  }

  const { getFirestoreDb } = await import("@/lib/firebase/admin");
  await getFirestoreDb()
    .collection("clients")
    .doc(id)
    .set(
      {
        manifest,
        businessName:
          pickString(manifest.businessName) || pickString(manifest.business_name) || undefined,
        businessType:
          pickString(manifest.businessType) || pickString(manifest.business_type) || undefined,
        source: "manifest_firestore_sync",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}
