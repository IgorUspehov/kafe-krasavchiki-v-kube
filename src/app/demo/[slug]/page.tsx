import type { Metadata } from "next";

import { CrmLeadsBridge } from "@/components/crm-leads-bridge";
import { DemoSiteFrame } from "@/components/demo-site-frame";
import { DemoTenantLinksBar } from "@/components/demo-tenant-links-bar";
import { persistTenantUnpaid, restoreDemoByClientId } from "@/lib/billing/paid-tenant";
import { resolveDemoAccess } from "@/lib/cloudflare/demo-access";
import { buildDemoEmbedSrc } from "@/lib/cloudflare/demo-embed";
import { hydrateDemoRecord } from "@/lib/cloudflare/demo-registry";
import { loadClientManifest } from "@/lib/manifest/storage";
import { buildPublicSiteMetadata } from "@/lib/site/public-site-metadata";

/** Demos falsely unlocked (email inherit) — re-lock paywall once Firestore is cleared. */
const RELOCK_PAYWALL_CLIENT_IDS = new Set([
  "66c54983-807a-4504-84ca-c799e575c447", // krasavchiki-66 — restore tariff + promo
]);

async function ensurePaywallRelocked(clientId: string): Promise<void> {
  if (!RELOCK_PAYWALL_CLIENT_IDS.has(clientId)) return;
  const { getFirestoreDb } = await import("@/lib/firebase/admin");
  try {
    const snap = await getFirestoreDb().collection("clients").doc(clientId).get();
    const data = snap.data() || {};
    const source = typeof data.paidSource === "string" ? data.paidSource : "";
    const legit =
      source === "polar" ||
      source === "promo" ||
      source.startsWith("promo_") ||
      source.includes("polar");
    // Clear false unlocks only — never wipe a real Polar/promo payment.
    if (data.paid === true && !legit) {
      await persistTenantUnpaid(clientId);
    }
  } catch {
    /* ignore — local registry re-lock still runs via restoreDemoByClientId */
  }
}

type DemoPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ clientId?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: DemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  return buildPublicSiteMetadata(slug, "demo", undefined, {
    clientId: query.clientId,
  });
}

function resolveManifestLanguage(clientId: string): string | undefined {
  const manifest = loadClientManifest(clientId);
  if (!manifest) return undefined;
  const raw = manifest.language ?? manifest.lang;
  return typeof raw === "string" ? raw : undefined;
}

export default async function DemoPage({ params, searchParams }: DemoPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  let record = await hydrateDemoRecord({ slug, clientId: query.clientId });

  if (!record) {
    return (
      <main style={{ fontFamily: "system-ui", padding: 40 }}>
        <h1>Demo not found</h1>
        <p>No Website + CRM + Booking is registered for “{slug}”.</p>
      </main>
    );
  }

  const clientId = query.clientId || record.clientId;
  if (clientId) {
    await ensurePaywallRelocked(clientId);
    // Registry lives in /tmp on Render — re-sync paid/unpaid from Firestore after wipe or stale unlock.
    record = (await restoreDemoByClientId(clientId)) || record;
  }
  const access = resolveDemoAccess(clientId);
  const unpaid = !access.paid;
  const language = resolveManifestLanguage(clientId);
  /** Outer banner → tariff chooser (not Polar directly). */
  const checkoutUrl = access.checkoutUrl;

  const src = buildDemoEmbedSrc(record, clientId);
  const iframeTitle = `Website + CRM + Booking ${slug}`;

  return (
    <>
      <CrmLeadsBridge clientId={clientId} slug={slug} iframeTitle={iframeTitle} />
      <DemoSiteFrame
        unpaid={unpaid}
        clientId={clientId}
        checkoutUrl={checkoutUrl}
        language={language}
        iframeSrc={src}
        iframeTitle={iframeTitle}
        paidBar={
          <DemoTenantLinksBar
            clientId={clientId}
            slug={slug}
            language={language}
          />
        }
      />
    </>
  );
}
