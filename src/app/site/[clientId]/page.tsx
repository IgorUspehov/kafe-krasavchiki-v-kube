import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  buildPublicSitePath,
  ensurePublicSiteResolved,
} from "@/lib/cloudflare/resolve-public-site";
import { resolveSiteCrmHref } from "@/lib/cloudflare/resolve-site-crm-href";
import { listCatalogItems } from "@/lib/catalog/firestore-catalog";
import {
  leadFormCopy,
  normalizeLeadLang,
  resolveSectorModelForLead,
} from "@/lib/leads/niche-mode";
import { resolveClientHeroSrc } from "@/lib/image-library/paths";
import { loadClientManifestAsync } from "@/lib/manifest/storage";
import { pickLocalized } from "@/lib/niches/sector-models";
import { DEFAULT_BUSINESS_TYPE } from "@/lib/sector-mapping";
import { buildPublicSiteMetadata } from "@/lib/site/public-site-metadata";
import {
  formatWorkingHours,
  publicSiteContent,
  socialEntries,
  whatsappHref,
} from "@/lib/site/public-site-content";

type SitePageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: SitePageProps): Promise<Metadata> {
  const { clientId } = await params;
  const query = await searchParams;
  return buildPublicSiteMetadata(clientId, "site", query.lang);
}

export default async function PublicSitePage({ params, searchParams }: SitePageProps) {
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
    redirect(buildPublicSitePath(resolved.siteSlug, langHint));
  }

  const { clientId, siteSlug, demo } = resolved;
  const manifest = (await loadClientManifestAsync(clientId)) || {};
  const content = publicSiteContent(manifest);

  const businessType = String(
    (manifest.businessType as string) ||
      (manifest.business_type as string) ||
      DEFAULT_BUSINESS_TYPE,
  );
  const sectorId = String(
    (manifest.sectorId as string) || (manifest.sector_id as string) || "",
  ).trim() || null;
  const businessName = content.businessName || "Business";
  const city = content.city;
  const phone = content.phone;
  const lang = normalizeLeadLang(
    query.lang || String(manifest.language || manifest.lang || "de"),
  );
  const model = resolveSectorModelForLead(businessType, sectorId);
  const nicheLabel = model
    ? pickLocalized(model.niche, lang)
    : businessType.replace(/_/g, " ");
  const t = leadFormCopy[lang];
  const crmHref = resolveSiteCrmHref({
    clientId,
    demo,
    businessName,
    businessType,
  });
  const gallery = content.galleryPhotos.filter(Boolean);
  const heroFolder = (model?.businessType || businessType).replace(/_crm$/, "");
  const hero = resolveClientHeroSrc({
    heroPhoto: content.heroPhoto || manifest.heroPhoto,
    galleryPhotos: gallery,
    businessType: heroFolder,
  });
  const hours = formatWorkingHours(content.workingHours, lang);
  const social = socialEntries(content.socialLinks);
  const wa = whatsappHref(content.whatsapp || content.phone);
  let catalog: Awaited<ReturnType<typeof listCatalogItems>> = [];
  try {
    catalog = await listCatalogItems(clientId);
  } catch {
    catalog = [];
  }

  const langQuery = query.lang ? `?lang=${encodeURIComponent(lang)}` : "";
  const copy = {
    book: lang === "ru" ? "Заказать услугу" : lang === "de" ? "Termin buchen" : "Book Service",
    jobs: lang === "ru" ? "Вакансии" : lang === "de" ? "Stellen" : "Jobs",
    about: lang === "ru" ? "О нас" : lang === "de" ? "Über uns" : "About",
    services: lang === "ru" ? "Услуги" : lang === "de" ? "Leistungen" : "Services",
    gallery: lang === "ru" ? "Галерея" : lang === "de" ? "Galerie" : "Gallery",
    hours: lang === "ru" ? "Часы работы" : lang === "de" ? "Öffnungszeiten" : "Opening hours",
    contact: lang === "ru" ? "Контакты" : lang === "de" ? "Kontakt" : "Contact",
  };

  return (
    <main className="min-h-svh bg-gradient-to-b from-slate-950 via-slate-900 to-stone-900 text-white">
      <div
        className="relative min-h-[52vh] overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(15,23,42,0.82), rgba(68,64,60,0.55)), url(${hero})`,
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col px-6 pb-16 pt-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {content.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={content.logo} alt="" className="h-12 w-12 rounded-full bg-white/90 object-contain p-1" />
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200/90">
                {nicheLabel}
              </p>
            </div>
            <div className="flex gap-1 rounded-full border border-white/15 bg-black/25 p-1">
              {(["en", "de", "ru"] as const).map((code) => (
                <Link
                  key={code}
                  href={buildPublicSitePath(siteSlug, code)}
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    lang === code ? "bg-orange-500 text-white" : "text-slate-200"
                  }`}
                >
                  {code}
                </Link>
              ))}
            </div>
          </div>
          <h1 className="max-w-3xl text-5xl font-black tracking-tight sm:text-6xl">{businessName}</h1>
          {content.subtitle ? (
            <p className="mt-3 max-w-2xl text-xl font-medium text-orange-100">{content.subtitle}</p>
          ) : null}
          <p className="mt-4 max-w-2xl text-lg text-slate-200">
            {city ? `${nicheLabel} · ${city}` : nicheLabel}
            {phone ? ` · ${phone}` : ""}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={`/site/${encodeURIComponent(siteSlug)}/booking${langQuery}`}
              className="rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white hover:bg-orange-400"
            >
              {copy.book}
            </Link>
            <Link
              href={`/site/${encodeURIComponent(siteSlug)}/job${langQuery}`}
              className="rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white hover:bg-orange-400"
            >
              {copy.jobs}
            </Link>
            {wa ? (
              <a
                href={wa}
                className="rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white hover:bg-orange-400"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {content.description ? (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-bold">{copy.about}</h2>
          <p className="mt-4 max-w-3xl whitespace-pre-wrap text-lg leading-relaxed text-slate-200">
            {content.description}
          </p>
        </section>
      ) : null}

      {catalog.length ? (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-bold">{copy.services}</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {catalog.map((item) => {
              const name = pickLocalized(item.name, lang);
              const duration =
                typeof item.duration === "string"
                  ? item.duration
                  : item.duration
                    ? pickLocalized(item.duration, lang)
                    : "";
              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <div>
                    <p className="font-semibold">{name}</p>
                    {duration ? <p className="text-sm text-slate-300">{duration}</p> : null}
                  </div>
                  {item.price ? <p className="font-bold text-orange-200">{item.price}</p> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {gallery.length ? (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="mb-6 text-2xl font-bold">{copy.gallery}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {gallery.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="h-48 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">{copy.contact}</h2>
          <ul className="mt-4 space-y-2 text-slate-200">
            {phone ? (
              <li>
                Tel: <a className="underline" href={`tel:${phone}`}>{phone}</a>
              </li>
            ) : null}
            {content.whatsapp ? (
              <li>
                WhatsApp:{" "}
                <a className="underline" href={wa || `https://wa.me/${content.whatsapp}`}>
                  {content.whatsapp}
                </a>
              </li>
            ) : null}
            {content.email ? (
              <li>
                Email: <a className="underline" href={`mailto:${content.email}`}>{content.email}</a>
              </li>
            ) : null}
            {content.address || content.postalCode || city ? (
              <li>
                {[content.address, [content.postalCode, city].filter(Boolean).join(" ")]
                  .filter(Boolean)
                  .join(", ")}
              </li>
            ) : null}
          </ul>
          {social.length ? (
            <ul className="mt-4 flex flex-wrap gap-3">
              {social.map((item) => (
                <li key={item.label}>
                  <a className="font-semibold text-orange-300 hover:text-orange-200" href={item.href}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {hours.length ? (
          <div>
            <h2 className="text-2xl font-bold">{copy.hours}</h2>
            <ul className="mt-4 space-y-1 text-slate-200">
              {hours.map((item) => (
                <li key={item.day} className="flex justify-between gap-4">
                  <span>{item.day}</span>
                  <span>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {crmHref ? (
        <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-400">
          <Link href={crmHref} className="font-semibold text-orange-300 hover:text-orange-200">
            {t.openCrm}
          </Link>
        </footer>
      ) : null}
    </main>
  );
}
