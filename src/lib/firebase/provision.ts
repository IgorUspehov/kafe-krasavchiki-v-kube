import { FieldValue } from "firebase-admin/firestore";

import { getFirestoreDb } from "@/lib/firebase/admin";
import { loadPatternEntities, resolvePatternDir } from "@/lib/firebase/pattern";
import { buildEntitySeedRecords } from "@/lib/firebase/seed-builder";

export type ProvisionCrmFullResult = {
  clientId: string;
  businessType: string;
  patternDir: string;
  entities: string[];
  seededCollections: Record<string, number>;
};

function normalizeClientId(clientId: string): string {
  const normalized = clientId.trim();
  if (!normalized) {
    throw new Error("clientId is required for CRM Full provisioning");
  }
  return normalized;
}

function normalizeBusinessType(businessType: string): string {
  const normalized = businessType.trim().toLowerCase();
  if (!normalized) {
    throw new Error("businessType is required for CRM Full provisioning");
  }
  return normalized;
}

export async function provisionCrmFullClient(
  clientId: string,
  businessType: string,
): Promise<ProvisionCrmFullResult> {
  const normalizedClientId = normalizeClientId(clientId);
  const normalizedBusinessType = normalizeBusinessType(businessType);
  const patternDir = resolvePatternDir(normalizedBusinessType);
  const entities = loadPatternEntities(normalizedBusinessType);
  const db = getFirestoreDb();

  const clientRef = db.collection("clients").doc(normalizedClientId);
  const batch = db.batch();
  const seededCollections: Record<string, number> = {};

  batch.set(clientRef, {
    businessType: normalizedBusinessType,
    createdAt: FieldValue.serverTimestamp(),
    status: "active",
  });

  for (const entity of entities) {
    const seeds = buildEntitySeedRecords(entity, normalizedBusinessType);
    const collectionRef = clientRef.collection(entity);

    seeds.forEach((seed, index) => {
      batch.set(collectionRef.doc(`seed-${index + 1}`), {
        ...seed,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    seededCollections[entity] = seeds.length;
  }

  await batch.commit();

  return {
    clientId: normalizedClientId,
    businessType: normalizedBusinessType,
    patternDir,
    entities,
    seededCollections,
  };
}
