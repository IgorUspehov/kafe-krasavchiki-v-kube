import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CrmLeadsBridge } from "@/components/crm-leads-bridge";
import { DemoSiteFrame } from "@/components/demo-site-frame";
import { DemoTenantLinksBar } from "@/components/demo-tenant-links-bar";
import { resolveDemoAccess } from "@/lib/cloudflare/demo-access";
import { buildDemoEmbedSrc } from "@/lib/cloudflare/demo-embed";
import { findDemoByShortId } from "@/lib/cloudflare/demo-registry";
import { readRootClientManifest } from "@/lib/deployable-zip/buyer-setup";
import { loadClientManifest } from "@/lib/manifest/storage";
import { buildPublicSiteMetadata } from "@/lib/site/public-site-metadata";

function pickManifestClientId(): string {
  const packaged = readRootClientManifest();
  if (!packaged) return "";
  const id = packaged.clientId ?? packaged.client_id;
  return typeof id === "string" ? id.trim() : "";
}

type ShortDemoPageProps = {
  params: Promise<{ shortId: string }>;
};

export async function generateMetadata({
  params,
}: ShortDemoPageProps): Promise<Metadata> {
  const { shortId } = await params;
  const record = findDemoByShortId(shortId);
  if (!record) {
    return { title: "Demo not found" };
  }
  return buildPublicSiteMetadata(record.slug, "demo", undefined, {
    clientId: record.clientId,
    canonicalPath: `/d/${encodeURIComponent(shortId)}`,
  });
}

function resolveManifestLanguage(clientId: string): string | undefined {
  const manifest = loadClientManifest(clientId);
  if (!manifest) return undefined;
  const raw = manifest.language ?? manifest.lang;
  return typeof raw === "string" ? raw : undefined;
}

export default async function ShortDemoPage({ params }: ShortDemoPageProps) {
  const { shortId } = await params;

  if (process.env.IS_DEPLOYABLE_ZIP === "true") {
    const zipClientId = pickManifestClientId();
    if (zipClientId) {
      redirect(`/admin/login?clientId=${encodeURIComponent(zipClientId)}`);
    }
  }

  const record = findDemoByShortId(shortId);

  if (!record) {
    return (
      <main style={{ fontFamily: "system-ui", padding: 40 }}>
        <h1>Demo not found</h1>
        <p>No Website + CRM + Booking is registered for “{shortId}”.</p>
      </main>
    );
  }

  const access = resolveDemoAccess(record.clientId);
  const unpaid = !access.paid;
  const language = resolveManifestLanguage(record.clientId);
  /** Outer banner → tariff chooser (not Polar directly). */
  const checkoutUrl = access.checkoutUrl;
  const src = buildDemoEmbedSrc(record);
  const iframeTitle = `Website + CRM + Booking ${shortId}`;

  return (
    <>
      <CrmLeadsBridge
        clientId={record.clientId}
        shortId={shortId}
        iframeTitle={iframeTitle}
      />
      <DemoSiteFrame
        unpaid={unpaid}
        clientId={record.clientId}
        checkoutUrl={checkoutUrl}
        language={language}
        iframeSrc={src}
        iframeTitle={iframeTitle}
        paidBar={
          !unpaid ? (
            <DemoTenantLinksBar
              clientId={record.clientId}
              slug={record.slug}
              language={language}
            />
          ) : undefined
        }
      />
    </>
  );
}
