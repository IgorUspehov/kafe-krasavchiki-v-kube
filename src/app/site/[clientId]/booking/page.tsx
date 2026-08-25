import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PublicBookingForm } from "@/components/public-site/booking-form";
import { listCatalogItems } from "@/lib/catalog/firestore-catalog";
import {
  catalogNamesForLang,
  resolveCatalogSeedForClient,
} from "@/lib/catalog/resolve-catalog";
import { ensurePublicSiteResolved } from "@/lib/cloudflare/resolve-public-site";
import {
  normalizeLeadLang,
  resolveLeadFormMode,
  resolveSectorModelForLead,
} from "@/lib/leads/niche-mode";
import { resolveClientHeroSrc } from "@/lib/image-library/paths";
import { loadClientManifestAsync } from "@/lib/manifest/storage";
import { pickLocalized } from "@/lib/niches/sector-models";
import { DEFAULT_BUSINESS_TYPE } from "@/lib/sector-mapping";
import type { LeadLang } from "@/lib/leads/types";
import { buildPublicSiteMetadata } from "@/lib/site/public-site-metadata";

type BookingPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: BookingPageProps): Promise<Metadata> {
  const { clientId } = await params;
  const query = await searchParams;
  return buildPublicSiteMetadata(clientId, "booking", query.lang);
}

async function loadSharedCatalog(
  clientId: string,
  lang: LeadLang,
): Promise<{ names: string[]; items: { name: string; price?: string; duration?: string }[] }> {
  try {
    const items = await listCatalogItems(clientId);
    return {
      names: catalogNamesForLang(items, lang),
      items: items.map((item) => ({
        name: pickLocalized(item.name, lang),
        price: item.price,
        duration:
          typeof item.duration === "string"
            ? item.duration
            : item.duration
              ? pickLocalized(item.duration, lang)
              : undefined,
      })),
    };
  } catch {
    const { items } = resolveCatalogSeedForClient(clientId);
    return {
      names: catalogNamesForLang(items, lang),
      items: items.map((item) => ({
        name: pickLocalized(item.name, lang),
        price: item.price,
        duration:
          typeof item.duration === "string"
            ? item.duration
            : item.duration
              ? pickLocalized(item.duration, lang)
              : undefined,
      })),
    };
  }
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { clientId: raw } = await params;
  const query = await searchParams;
  const resolved = await ensurePublicSiteResolved(raw || "");

  if (!resolved) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-slate-950 px-6 text-center text-slate-200">
        <div>
          <h1 className="text-2xl font-bold">Site not found</h1>
          <p className="mt-2 text-slate-400">Unknown or expired site link.</p>
        </div>
      </main>
    );
  }

  const langHint = query.lang ? normalizeLeadLang(query.lang) : undefined;
  if (resolved.shouldRedirectToSlug) {
    const qs = langHint ? `?lang=${encodeURIComponent(langHint)}` : "";
    redirect(`/site/${encodeURIComponent(resolved.siteSlug)}/booking${qs}`);
  }

  const { clientId } = resolved;
  const manifest = (await loadClientManifestAsync(clientId)) || {};

  const businessType = String(
    (manifest.businessType as string) ||
      (manifest.business_type as string) ||
      DEFAULT_BUSINESS_TYPE,
  );
  const sectorId =
    String(
      (manifest.sectorId as string) || (manifest.sector_id as string) || "",
    ).trim() || null;
  const lang = normalizeLeadLang(
    query.lang || String(manifest.language || manifest.lang || "de"),
  );
  const model = resolveSectorModelForLead(businessType, sectorId);
  const mode = resolveLeadFormMode(businessType, sectorId);
  const catalog = await loadSharedCatalog(clientId, lang);
  const services = catalog.names;
  const formCta = model ? pickLocalized(model.publicCta, lang) : undefined;
  const catalogLabel = model ? pickLocalized(model.catalog, lang) : undefined;
  const businessName = String(
    (manifest.businessName as string) ||
      (manifest.business_name as string) ||
      "",
  );
  const gallery = Array.isArray(manifest.galleryPhotos)
    ? (manifest.galleryPhotos as string[]).slice(0, 3)
    : [];
  const heroFolder = (model?.businessType || businessType).replace(/_crm$/, "");
  const heroSrc = resolveClientHeroSrc({
    heroPhoto: manifest.heroPhoto,
    galleryPhotos: gallery,
    businessType: heroFolder,
  });
  return (
    <main className="relative flex min-h-svh items-start justify-center overflow-hidden bg-slate-950 px-6 py-12 text-white">
      {heroSrc ? (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroSrc})` }}
          aria-hidden
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-slate-950/80" aria-hidden />
      <div className="relative z-10 w-full max-w-lg">
        <PublicBookingForm
          clientId={clientId}
          mode={mode}
          language={lang}
          services={services}
          catalogItems={catalog.items}
          accent="#ea580c"
          ctaLabel={formCta}
          titleLabel={formCta}
          serviceLabel={catalogLabel}
          alwaysOpen
          heroSrc={heroSrc}
          businessName={businessName}
        />
      </div>
    </main>
  );
}
