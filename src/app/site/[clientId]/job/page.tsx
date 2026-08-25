import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { JobForm } from "@/components/public-site/job-form";
import { ensurePublicSiteResolved } from "@/lib/cloudflare/resolve-public-site";
import { resolveClientHeroSrc } from "@/lib/image-library/paths";
import { normalizeLeadLang, resolveSectorModelForLead } from "@/lib/leads/niche-mode";
import { loadClientManifestAsync } from "@/lib/manifest/storage";
import { DEFAULT_BUSINESS_TYPE } from "@/lib/sector-mapping";
import { buildPublicSiteMetadata } from "@/lib/site/public-site-metadata";
import { listVacancies } from "@/lib/vacancies/store";

type JobPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: JobPageProps): Promise<Metadata> {
  const { clientId } = await params;
  const query = await searchParams;
  return buildPublicSiteMetadata(clientId, "job", query.lang);
}

export default async function PublicJobPage({
  params,
  searchParams,
}: JobPageProps) {
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
    redirect(`/site/${encodeURIComponent(resolved.siteSlug)}/job${qs}`);
  }

  const { clientId } = resolved;
  const manifest = (await loadClientManifestAsync(clientId)) || {};
  const lang = normalizeLeadLang(
    query.lang || String(manifest.language || manifest.lang || "de"),
  );
  const businessType = String(
    (manifest.businessType as string) ||
      (manifest.business_type as string) ||
      DEFAULT_BUSINESS_TYPE,
  );
  const sectorId =
    String(
      (manifest.sectorId as string) || (manifest.sector_id as string) || "",
    ).trim() || null;
  const model = resolveSectorModelForLead(businessType, sectorId);
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

  const vacancyRecords = await listVacancies(clientId);
  const vacancies = vacancyRecords.map((item) => ({
    id: item.id,
    title: item.title,
    salary: item.salary || "",
    requirements: item.requirements || "",
  }));

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
        <JobForm
          clientId={clientId}
          language={lang}
          vacancies={vacancies}
          accent="#ea580c"
          heroSrc={heroSrc}
          businessName={businessName}
        />
      </div>
    </main>
  );
}
