"use client";

import { useMemo, useState, type FormEvent } from "react";

import {
  ctaForMode,
  leadFormCopy,
  normalizeLeadLang,
  titleForMode,
} from "@/lib/leads/niche-mode";
import {
  isRetryableLeadError,
  LeadRequestError,
  withRetries,
} from "@/lib/leads/retry";
import type { LeadFormMode } from "@/lib/leads/types";

type PublicCatalogOption = {
  name: string;
  price?: string;
  duration?: string;
};

type BookingFormProps = {
  clientId: string;
  mode: LeadFormMode;
  language: string;
  services: string[];
  catalogItems?: PublicCatalogOption[];
  accent?: string;
  /** Niche-specific CTA from sector model (overrides mode default). */
  ctaLabel?: string;
  titleLabel?: string;
  serviceLabel?: string;
  /** When true, render the form immediately (no CTA gate / close control). */
  alwaysOpen?: boolean;
  heroSrc?: string;
  businessName?: string;
  siteHref?: string;
};

const FETCH_TIMEOUT_MS = 12_000;
const FRONT_RETRY_ATTEMPTS = 3;
const FRONT_BASE_DELAY_MS = 400;

/** Combine separate date/time inputs into the datetime-local style string the API stores. */
function combinePreferredAt(date: string, time: string): string | undefined {
  const d = date.trim();
  const t = time.trim();
  if (d && t) return `${d}T${t}`;
  if (d) return d;
  if (t) return t;
  return undefined;
}

async function postLeadOnce(
  clientId: string,
  body: Record<string, unknown>,
): Promise<void> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`/api/leads/${encodeURIComponent(clientId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
    if (!res.ok) {
      throw new LeadRequestError(
        data.error || `HTTP ${res.status}`,
        res.status,
        data,
      );
    }
    if (data.ok !== true) {
      // Defensive: never treat ambiguous bodies as success.
      throw new LeadRequestError("invalid_success_payload", 502, data);
    }
  } catch (error) {
    if (error instanceof LeadRequestError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new LeadRequestError("timeout", 408);
    }
    throw new LeadRequestError(
      error instanceof Error ? error.message : "network_error",
      0,
    );
  } finally {
    window.clearTimeout(timer);
  }
}

export function PublicBookingForm({
  clientId,
  mode,
  language,
  services,
  catalogItems,
  accent = "#c2410c",
  ctaLabel,
  titleLabel,
  serviceLabel,
  alwaysOpen = false,
  heroSrc,
  businessName,
  siteHref,
}: BookingFormProps) {
  const lang = normalizeLeadLang(language);
  const t = leadFormCopy[lang];
  const title = titleLabel || titleForMode(mode, lang);
  const cta = ctaLabel || ctaForMode(mode, lang);

  const [open, setOpen] = useState(alwaysOpen);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const showPreferred = mode === "appointment" || mode === "reservation";
  const serviceOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: PublicCatalogOption[] = [];
    const source: PublicCatalogOption[] =
      catalogItems && catalogItems.length
        ? catalogItems
        : services.map((name) => ({ name }));
    for (const item of source) {
      const name = typeof item.name === "string" ? item.name.trim() : "";
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({
        name,
        price: item.price?.trim() || "",
        duration: item.duration?.trim() || "",
      });
    }
    return out;
  }, [services, catalogItems]);

  function mapError(err: unknown): string {
    if (err instanceof LeadRequestError) {
      if (err.status === 429) return t.errorGeneric;
      if (err.status === 0 || err.status === 408) return t.errorNetwork;
      const body = err.body as { error?: string } | undefined;
      if (body?.error === "invalid phone") return t.errorPhone;
      if (body?.error?.includes("required")) return t.errorRequired;
      return t.errorGeneric;
    }
    return t.errorNetwork;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    if (!name.trim() || !phone.trim()) {
      setError(t.errorRequired);
      return;
    }
    setSending(true);
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      service: selected.length > 0 ? selected.join(", ") : undefined,
      preferredAt: combinePreferredAt(preferredDate, preferredTime),
      language: lang,
    };
    try {
      await withRetries(() => postLeadOnce(clientId, payload), {
        attempts: FRONT_RETRY_ATTEMPTS,
        baseDelayMs: FRONT_BASE_DELAY_MS,
        maxDelayMs: 2_000,
        shouldRetry: (err) => isRetryableLeadError(err),
      });
      setSuccess(true);
      setName("");
      setPhone("");
      setSelected([]);
      setPreferredDate("");
      setPreferredTime("");
    } catch (err) {
      // Final failure only — never show success for a failed / timed-out request.
      setSuccess(false);
      setError(mapError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="w-full">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl px-6 py-4 text-lg font-black text-white shadow-lg transition hover:opacity-95 sm:w-auto"
          style={{ background: accent }}
        >
          {cta}
        </button>
      ) : (
        <form
          onSubmit={onSubmit}
          className="overflow-hidden rounded-3xl border border-white/15 bg-slate-950/70 shadow-2xl backdrop-blur-md"
        >
          {heroSrc ? (
            <div className="relative h-52 w-full overflow-hidden sm:h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroSrc}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
              {businessName ? (
                <p className="absolute bottom-4 left-5 right-5 text-xl font-black tracking-tight text-white sm:text-2xl">
                  {businessName}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="p-6 sm:p-7">
            <h2 className="text-2xl font-black text-white">{title}</h2>
            <div className="mt-5 grid gap-3">
              <label className="grid gap-1 text-sm text-slate-200">
                {t.name} *
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={120}
                  className="rounded-xl border border-white/20 bg-slate-950/40 px-3 py-2.5 text-base text-white outline-none focus:border-orange-400"
                />
              </label>
              <label className="grid gap-1 text-sm text-slate-200">
                {t.phone} *
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  maxLength={40}
                  inputMode="tel"
                  className="rounded-xl border border-white/20 bg-slate-950/40 px-3 py-2.5 text-base text-white outline-none focus:border-orange-400"
                />
              </label>
              {serviceOptions.length > 0 ? (
                <fieldset className="grid gap-2">
                  <legend className="text-sm text-slate-200">
                    {serviceLabel || t.service}
                  </legend>
                  {serviceOptions.map((service) => {
                    const checked = selected.includes(service.name);
                    return (
                      <label
                        key={service.name}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                          checked
                            ? "border-orange-400 bg-orange-500/15 text-white"
                            : "border-white/20 bg-slate-950/40 text-slate-200 hover:border-white/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={service.name}
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelected([...selected, service.name]);
                            else
                              setSelected(selected.filter((s) => s !== service.name));
                          }}
                          className="h-4 w-4 shrink-0 accent-orange-500"
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="font-medium">{service.name}</span>
                          {service.duration ? (
                            <span className="text-xs text-slate-400">{service.duration}</span>
                          ) : null}
                        </span>
                        {service.price ? (
                          <span className="shrink-0 font-semibold text-orange-200">{service.price}</span>
                        ) : null}
                      </label>
                    );
                  })}
                </fieldset>
              ) : null}
              {showPreferred ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-200">
                    {t.preferredDate}
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="rounded-xl border border-white/20 bg-slate-950/40 px-3 py-2.5 text-base text-white outline-none focus:border-orange-400"
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-slate-200">
                    {t.preferredTime}
                    <input
                      type="time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="rounded-xl border border-white/20 bg-slate-950/40 px-3 py-2.5 text-base text-white outline-none focus:border-orange-400"
                    />
                  </label>
                </div>
              ) : null}
            </div>
            {error ? (
              <p className="mt-3 text-sm font-semibold text-rose-300" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mt-3 text-sm font-semibold text-emerald-300" role="status">
                {t.success}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-2xl px-5 py-3 text-base font-black text-white disabled:opacity-60"
                style={{ background: accent }}
              >
                {sending ? t.sending : t.submit}
              </button>
              {alwaysOpen ? null : (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-white/25 px-5 py-3 text-base font-semibold text-slate-200"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {siteHref ? (
        <a
          href={siteHref}
          className="mt-4 flex w-full items-center justify-center rounded-2xl px-5 py-3 text-base font-black text-white shadow-lg transition hover:opacity-95"
          style={{ background: accent }}
        >
          {t.site}
        </a>
      ) : null}
    </section>
  );
}
