import { NextRequest, NextResponse } from "next/server";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";

import { extractOwnerEmail } from "@/lib/admin/site-content";
import { markTenantPaid, persistTenantPaid } from "@/lib/billing/paid-tenant";
import { findDemoByClientId } from "@/lib/cloudflare/demo-registry";
import { getFirestoreDb } from "@/lib/firebase/admin";
import { loadClientManifest } from "@/lib/manifest/storage";

const PERMANENT_CODE = "serafim01";
const INVALID_MESSAGE = "Invalid or already used promo code";

async function grantPaidAccess(clientId: string, source: string): Promise<void> {
  const id = clientId.trim();
  if (!id) return;
  markTenantPaid(id);
  const manifest = loadClientManifest(id);
  const demo = findDemoByClientId(id);
  await persistTenantPaid({
    clientId: id,
    email: extractOwnerEmail(manifest),
    slug: demo?.slug,
    source,
  });
}

async function redeemDocument(
  db: Firestore,
  docRef: DocumentReference,
  clientId: string,
) {
  try {
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      if (!doc.exists) {
        throw new Error("NOT_FOUND");
      }
      const data = doc.data();
      if (data?.used) {
        throw new Error("USED");
      }
      tx.update(docRef, { used: true });
    });
    if (clientId) await grantPaidAccess(clientId, "promo");
    return NextResponse.json({ valid: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "USED" || message === "NOT_FOUND") {
      return NextResponse.json({ valid: false, error: INVALID_MESSAGE }, { status: 403 });
    }
    console.error("[redeem-promo]", err);
    return NextResponse.json({ valid: false, error: "Promo validation failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let code = "";
  let clientId = "";
  try {
    const body = (await request.json()) as { code?: string; clientId?: string };
    code = String(body?.code ?? "").trim();
    clientId = String(body?.clientId ?? "").trim();
  } catch {
    return NextResponse.json({ valid: false, error: INVALID_MESSAGE }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ valid: false, error: INVALID_MESSAGE }, { status: 400 });
  }

  if (code.toLowerCase() === PERMANENT_CODE) {
    if (clientId) await grantPaidAccess(clientId, "promo_serafim01");
    return NextResponse.json({ valid: true, permanent: true });
  }

  const db = getFirestoreDb();
  const docRef = db.collection("promoCodes").doc(code);
  const snap = await docRef.get();

  if (!snap.exists) {
    const query = await db.collection("promoCodes").where("code", "==", code).limit(1).get();
    if (query.empty) {
      return NextResponse.json({ valid: false, error: INVALID_MESSAGE }, { status: 403 });
    }
    return redeemDocument(db, query.docs[0]!.ref, clientId);
  }

  return redeemDocument(db, docRef, clientId);
}
