"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { factoryBridgeTierFromPrice } from "@/lib/factory-crm/bridge";
import {
  normalizeTariffLang,
  tariffCopy,
  type TariffContext,
  type TariffLang,
} from "@/lib/tariffs/copy";
import { buildCrmDemoPolarUrl, buildFactoryBridgeApiPath } from "@/lib/tariffs/urls";

/** Factory €499 / €999 cards — keep code, hide from public UI for now. */
const SHOW_FACTORY_TARIFF_CARDS = false;

type ManifestSlice = {
  businessName?: string;
  ownerName?: string;
  niche?: string;
  businessType?: string;
  sectorId?: string;
  city?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  language?: string;
};

function readParam(
  params: { get(key: string): string | null } | null | undefined,
  key: string,
): string {
  return params?.get(key)?.trim() || "";
}

export function TariffChooser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId =
    readParam(searchParams, "clientId") || readParam(searchParams, "client_id");
  const demoUrl = readParam(searchParams, "demo_url");

  const [lang, setLang] = useState<TariffLang>(() =>
    normalizeTariffLang(readParam(searchParams, "lang") || readParam(searchParams, "language")),
  );
  const [manifest, setManifest] = useState<ManifestSlice | null>(null);
  const [loading, setLoading] = useState(Boolean(clientId));

  useEffect(() => {
    const fromQuery = normalizeTariffLang(
      readParam(searchParams, "lang") || readParam(searchParams, "language"),
    );
    setLang(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/manifest/${encodeURIComponent(clientId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as ManifestSlice;
        if (!cancelled) setManifest(data);
      } catch {
        /* ignore — query params still work */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const ctx: TariffContext = useMemo(() => {
    const niche =
      readParam(searchParams, "niche") ||
      manifest?.niche ||
      manifest?.businessType ||
      manifest?.sectorId ||
      "";
    return {
      clientId,
      businessName:
        readParam(searchParams, "businessName") || manifest?.businessName || "",
      ownerName: readParam(searchParams, "ownerName") || manifest?.ownerName || "",
      niche,
      city: readParam(searchParams, "city") || manifest?.city || "",
      phone: readParam(searchParams, "phone") || manifest?.phone || "",
      email: readParam(searchParams, "email") || manifest?.email || "",
      whatsapp: readParam(searchParams, "whatsapp") || manifest?.whatsapp || "",
      language: lang,
      demoUrl: demoUrl || undefined,
    };
  }, [clientId, demoUrl, lang, manifest, searchParams]);

  const t = tariffCopy[lang];

  function goFactory(price: 499 | 999) {
    const path = buildFactoryBridgeApiPath({
      clientId: ctx.clientId || undefined,
      language: lang,
      tier: factoryBridgeTierFromPrice(price),
    });
    // Append any fields already known so bridge works even without stored manifest
    const url = new URL(path, window.location.origin);
    if (ctx.businessName) url.searchParams.set("businessName", ctx.businessName);
    if (ctx.ownerName) url.searchParams.set("ownerName", ctx.ownerName);
    if (ctx.niche) url.searchParams.set("niche", ctx.niche);
    if (ctx.city) url.searchParams.set("city", ctx.city);
    if (ctx.phone) url.searchParams.set("phone", ctx.phone);
    if (ctx.email) url.searchParams.set("email", ctx.email);
    if (ctx.whatsapp) url.searchParams.set("whatsapp", ctx.whatsapp);
    window.location.href = url.toString();
  }

  function goCrmDemo() {
    if (!clientId) return;
    void (async () => {
      try {
        const response = await fetch("/api/polar/crm-demo-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            email: ctx.email || undefined,
            locale: lang,
          }),
        });
        const data = (await response.json()) as { checkout_url?: string };
        if (response.ok && data.checkout_url) {
          window.location.href = data.checkout_url;
          return;
        }
      } catch {
        /* fall back to static Polar link */
      }
      window.location.href = buildCrmDemoPolarUrl(clientId, ctx.email || undefined, lang);
    })();
  }

  return (
    <main className="min-h-svh bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => (demoUrl ? (window.location.href = demoUrl) : router.back())}
            className="text-sm font-semibold text-slate-300 hover:text-white"
          >
            ← {t.back}
          </button>
          <div className="flex gap-1 rounded-full border border-white/15 bg-white/5 p-1" role="group">
            {(["en", "de", "ru"] as TariffLang[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`rounded-full px-3 py-1.5 text-sm font-bold uppercase ${
                  lang === code ? "bg-orange-500 text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-300">{t.subtitle}</p>
          {ctx.businessName ? (
            <p className="mt-4 text-base font-semibold text-orange-300">
              {ctx.businessName}
              {ctx.city ? ` · ${ctx.city}` : ""}
            </p>
          ) : null}
        </header>

        {loading ? (
          <p className="text-center text-slate-400">{t.loading}</p>
        ) : (
          <div
            className={`grid gap-5 ${SHOW_FACTORY_TARIFF_CARDS ? "lg:grid-cols-3" : "mx-auto max-w-md lg:grid-cols-1"}`}
          >
            <article className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <h2 className="text-xl font-bold">{t.crmDemo.name}</h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">{t.crmDemo.price}</span>
                <span className="text-slate-400">{t.crmDemo.period}</span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{t.crmDemo.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                {t.crmDemo.bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={goCrmDemo}
                className="mt-auto w-full rounded-2xl bg-orange-500 px-4 py-3.5 text-base font-black text-white hover:bg-orange-600"
              >
                {t.crmDemo.cta}
              </button>
            </article>

            {SHOW_FACTORY_TARIFF_CARDS ? (
              <>
                <article className="relative flex flex-col rounded-3xl border-2 border-orange-400/60 bg-orange-500/10 p-6 shadow-xl">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    {t.popular}
                  </span>
                  <h2 className="text-xl font-bold">{t.factoryReady.name}</h2>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">{t.factoryReady.price}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-200">{t.factoryReady.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-100">
                    {t.factoryReady.bullets.map((b) => (
                      <li key={b}>• {b}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => goFactory(499)}
                    className="mt-auto w-full rounded-2xl bg-white px-4 py-3.5 text-base font-black text-slate-900 hover:bg-orange-50"
                  >
                    {t.factoryReady.cta}
                  </button>
                </article>

                <article className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
                  <h2 className="text-xl font-bold">{t.factoryCustom.name}</h2>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">{t.factoryCustom.price}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{t.factoryCustom.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-200">
                    {t.factoryCustom.bullets.map((b) => (
                      <li key={b}>• {b}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => goFactory(999)}
                    className="mt-auto w-full rounded-2xl border-2 border-white/30 bg-transparent px-4 py-3.5 text-base font-black text-white hover:bg-white/10"
                  >
                    {t.factoryCustom.cta}
                  </button>
                </article>
              </>
            ) : null}
          </div>
        )}

        {SHOW_FACTORY_TARIFF_CARDS ? (
          <p className="mt-8 text-center text-sm text-slate-400">{t.bridgeNote}</p>
        ) : null}
        {!clientId ? (
          <p className="mt-2 text-center text-sm text-amber-300">{t.missingClient}</p>
        ) : null}
      </div>
    </main>
  );
}
