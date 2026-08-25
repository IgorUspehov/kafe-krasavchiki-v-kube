"use client";

import { useState, type FormEvent } from "react";

export type JobVacancyOption = {
  id: string;
  title: string;
  salary: string;
  requirements?: string;
};

type JobFormProps = {
  clientId: string;
  language: string;
  vacancies: JobVacancyOption[];
  accent?: string;
  heroSrc?: string;
  businessName?: string;
};

const COPY = {
  de: {
    title: "Wir suchen Mitarbeiter",
    subtitle: "Bewerben Sie sich jetzt",
    position: "Offene Stellen",
    salary: "Gehalt",
    requirements: "Anforderungen",
    name: "Vollständiger Name",
    phone: "Telefon",
    cta: "Bewerbung senden",
    success: "Bewerbung eingegangen! Wir melden uns bald.",
    sending: "Senden…",
    empty: "Вакансий пока нет",
    selectHint: "Markieren Sie eine oder mehrere Stellen",
    errorRequired: "Bitte alle Pflichtfelder ausfüllen.",
    errorPositions: "Bitte mindestens eine Stelle auswählen.",
    errorGeneric: "Etwas ist schiefgelaufen. Bitte erneut versuchen.",
  },
  ru: {
    title: "Вакансии",
    subtitle: "Отправьте заявку",
    position: "Открытые вакансии",
    salary: "Зарплата",
    requirements: "Требования",
    name: "Полное имя",
    phone: "Телефон",
    cta: "Отправить заявку",
    success: "Заявка принята! Скоро свяжемся.",
    sending: "Отправка…",
    empty: "Вакансий пока нет",
    selectHint: "Отметьте одну или несколько вакансий",
    errorRequired: "Заполните обязательные поля.",
    errorPositions: "Отметьте хотя бы одну вакансию.",
    errorGeneric: "Что-то пошло не так. Попробуйте ещё раз.",
  },
  en: {
    title: "We Are Hiring",
    subtitle: "Apply now",
    position: "Open vacancies",
    salary: "Salary",
    requirements: "Requirements",
    name: "Full name",
    phone: "Phone",
    cta: "Submit application",
    success: "Application received! We'll be in touch.",
    sending: "Sending…",
    empty: "Вакансий пока нет",
    selectHint: "Select one or more vacancies",
    errorRequired: "Please fill in all required fields.",
    errorPositions: "Please select at least one vacancy.",
    errorGeneric: "Something went wrong. Please try again.",
  },
} as const;

type JobLang = keyof typeof COPY;

const fieldClassName =
  "rounded-xl border border-white/20 bg-slate-950/40 px-3 py-2.5 text-base text-white outline-none focus:border-orange-400";

function normalizeJobLang(language: string): JobLang {
  const code = language.trim().toLowerCase().slice(0, 2);
  if (code === "ru" || code === "en" || code === "de") return code;
  return "de";
}

export function JobForm({
  clientId,
  language,
  vacancies,
  accent = "#c2410c",
  heroSrc,
  businessName,
}: JobFormProps) {
  const lang = normalizeJobLang(language);
  const t = COPY[lang];

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function toggleVacancy(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setError("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const selected = vacancies.filter((item) => selectedIds.includes(item.id));
    const positions = selected
      .map((item) => item.title.trim())
      .filter(Boolean);

    if (positions.length === 0) {
      setError(t.errorPositions);
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError(t.errorRequired);
      return;
    }

    const salary = selected
      .map((item) => item.salary.trim())
      .filter(Boolean)
      .join("; ");

    setSending(true);
    try {
      const res = await fetch(`/api/job-leads/${encodeURIComponent(clientId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          positions,
          position: positions.join(", "),
          salary: salary || undefined,
          language: lang,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || data.ok !== true) {
        setError(t.errorGeneric);
        return;
      }
      setSuccess(true);
      setSelectedIds([]);
      setName("");
      setPhone("");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-slate-950/70 shadow-2xl backdrop-blur-md">
        {heroSrc ? (
          <div className="relative h-48 w-full overflow-hidden sm:h-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroSrc} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
            {businessName ? (
              <p className="absolute bottom-4 left-5 right-5 text-xl font-black tracking-tight text-white sm:text-2xl">
                {businessName}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="p-6 sm:p-7">
          <p className="text-lg font-semibold text-emerald-300" role="status">
            {t.success}
          </p>
        </div>
      </div>
    );
  }

  if (vacancies.length === 0) {
    return (
      <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-slate-950/70 shadow-2xl backdrop-blur-md">
        {heroSrc ? (
          <div className="relative h-48 w-full overflow-hidden sm:h-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroSrc} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
            {businessName ? (
              <p className="absolute bottom-4 left-5 right-5 text-xl font-black tracking-tight text-white sm:text-2xl">
                {businessName}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="p-6 sm:p-7">
          <h2 className="text-2xl font-black text-white">{t.title}</h2>
          <p className="mt-3 text-base text-slate-200" role="status">
            {t.empty}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-slate-950/70 shadow-2xl backdrop-blur-md"
    >
      {heroSrc ? (
        <div className="relative h-48 w-full overflow-hidden sm:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroSrc} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
          {businessName ? (
            <p className="absolute bottom-4 left-5 right-5 text-xl font-black tracking-tight text-white sm:text-2xl">
              {businessName}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="p-6 sm:p-7">
        <h2 className="text-2xl font-black text-white">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-300">{t.subtitle}</p>
        <div className="mt-5 grid gap-3">
          <fieldset className="grid gap-2">
            <legend className="text-sm text-slate-200">
              {t.position} *
            </legend>
            <p className="text-xs text-slate-400">{t.selectHint}</p>
            <div className="grid gap-2">
              {vacancies.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                      checked
                        ? "border-orange-400 bg-orange-500/15"
                        : "border-white/20 bg-slate-950/40 hover:border-white/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleVacancy(item.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-orange-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-white">
                        {item.title}
                      </span>
                      {item.salary ? (
                        <span className="mt-0.5 block text-slate-200">
                          {t.salary}: {item.salary}
                        </span>
                      ) : null}
                      {item.requirements ? (
                        <span className="mt-0.5 block whitespace-pre-wrap text-slate-400">
                          {t.requirements}: {item.requirements}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="grid gap-1 text-sm text-slate-200">
            {t.name} *
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              className={fieldClassName}
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-200">
            {t.phone} *
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength={40}
              inputMode="tel"
              className={fieldClassName}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-3 text-sm font-semibold text-rose-300" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5">
          <button
            type="submit"
            disabled={sending}
            className="rounded-2xl px-5 py-3 text-base font-black text-white disabled:opacity-60"
            style={{ background: accent }}
          >
            {sending ? t.sending : t.cta}
          </button>
        </div>
      </div>
    </form>
  );
}
