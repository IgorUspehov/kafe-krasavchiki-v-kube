"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  getFactoryWebsiteBaseUrl,
  pickFactoryBridgeFields,
} from "@/lib/factory-crm/bridge";

function FactoryHandoffInner() {
  const searchParams = useSearchParams();
  const payload = useMemo(() => {
    const raw: Record<string, string> = {};
    searchParams?.forEach((value, key) => {
      raw[key] = value;
    });
    return pickFactoryBridgeFields(raw);
  }, [searchParams]);

  const factoryBase = getFactoryWebsiteBaseUrl();
  const factoryConfigured = Boolean(factoryBase);
  const target = useMemo(() => {
    if (!factoryBase) return "";
    const url = new URL(factoryBase.endsWith("/") ? factoryBase : `${factoryBase}/`);
    for (const [k, v] of Object.entries(payload)) {
      if (v) url.searchParams.set(k, String(v));
    }
    return url.toString();
  }, [factoryBase, payload]);

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 px-6 py-12 text-slate-900">
      <h1 className="text-3xl font-black">Factory Website+CRM bridge</h1>
      <p className="text-slate-600">
        Only business fields are passed — no templates or repositories are mixed.
      </p>
      <dl className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
        {Object.entries(payload).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="font-semibold text-slate-500">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {!factoryConfigured ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Set <code className="font-mono">NEXT_PUBLIC_FACTORY_WEBSITE_URL</code> to your Factory
          Website+CRM origin. Until then this handoff page is the bridge target.
        </p>
      ) : (
        <a
          href={target}
          className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-6 py-4 text-lg font-black text-white hover:bg-orange-600"
        >
          Open Factory Website+CRM
        </a>
      )}
    </main>
  );
}

export default function FactoryHandoffPage() {
  return (
    <Suspense fallback={<main className="p-8">Loading…</main>}>
      <FactoryHandoffInner />
    </Suspense>
  );
}
