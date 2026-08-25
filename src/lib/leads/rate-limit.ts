import { createHash } from "crypto";

import { FieldValue } from "firebase-admin/firestore";

import { getFirestoreDb } from "@/lib/firebase/admin";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_HITS = 5;

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

/**
 * Firestore-backed rate limit: max MAX_HITS posts per IP+clientId per WINDOW_MS.
 * Survives serverless cold starts better than in-memory maps.
 */
export async function assertLeadRateLimit(input: {
  clientId: string;
  ip: string;
}): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const ip = input.ip.trim() || "unknown";
  const docId = `${input.clientId}_${hashIp(ip)}`;
  const ref = getFirestoreDb().collection("leadRateLimits").doc(docId);
  const now = Date.now();

  const result = await getFirestoreDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { windowStart?: number; count?: number } | undefined;
    const windowStart = typeof data?.windowStart === "number" ? data.windowStart : now;
    const count = typeof data?.count === "number" ? data.count : 0;

    if (now - windowStart > WINDOW_MS) {
      tx.set(ref, {
        windowStart: now,
        count: 1,
        clientId: input.clientId,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { ok: true as const };
    }

    if (count >= MAX_HITS) {
      const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - windowStart)) / 1000));
      return { ok: false as const, retryAfterSec };
    }

    tx.set(
      ref,
      {
        windowStart,
        count: count + 1,
        clientId: input.clientId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true as const };
  });

  return result;
}
