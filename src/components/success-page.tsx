"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { TenantReadyLinks, type TenantReadyLinksCopy } from "@/components/tenant-ready-links";

const POLL_MS = 3000;

function isUsableCheckoutId(value: string): boolean {
  const id = value.trim();
  if (!id) return false;
  if (id.includes("{") || id.includes("}")) return false;
  if (id.toUpperCase() === "CHECKOUT_ID") return false;
  return true;
}

function pickCheckoutId(searchParams: ReturnType<typeof useSearchParams>): string {
  const candidates = [
    searchParams?.get("checkout_id"),
    searchParams?.get("checkoutId"),
    searchParams?.get("customer_session_token"),
  ];
  for (const raw of candidates) {
    const id = raw?.trim() ?? "";
    if (isUsableCheckoutId(id)) return id;
  }
  return "";
}

const COPY = {
  ru: {
    title: "Оплата прошла успешно!",
    subtitleDemo: "Ваш Сайт + CRM + Бронирование сохранён навсегда",
    subtitlePro: "Ваш Deployable ZIP (€999) готов к скачиванию",
    emailHint: "Сохраните ссылки ниже — сайт для клиентов, вакансии и бронирование.",
    download: "Скачать ZIP",
    home: "Вернуться на главную",
    waiting: "Подготавливаем ваш ZIP...",
    downloadError: "ZIP ещё готовится. Подождите несколько секунд и нажмите снова.",
    paymentPending:
      "Оплата ещё не подтверждена на сервере. Подождите до минуты или обратитесь в поддержку — ZIP не «готовится», а ждёт подтверждения Polar.",
    links: {
      publicSiteLabel: "Ваш сайт для клиентов",
      publicSiteHint: "Эту ссылку размещайте в Google Maps, Instagram или на визитке.",
      jobsLabel: "Страница вакансий",
      jobsHint: "Отправьте эту ссылку соискателям",
      bookingLabel: "Страница бронирования",
      bookingHint: "Отправьте эту ссылку вашим клиентам",
      copyLink: "Копировать ссылку",
      copied: "Скопировано!",
    } satisfies TenantReadyLinksCopy,
  },
  de: {
    title: "Zahlung erfolgreich!",
    subtitleDemo: "Ihr Website + CRM + Buchung ist dauerhaft gespeichert",
    subtitlePro: "Ihr Deployable ZIP (€999) ist zum Download bereit",
    emailHint: "Speichern Sie die Links unten — Kundenwebsite, Stellen und Buchung.",
    download: "ZIP herunterladen",
    home: "Zur Startseite",
    waiting: "ZIP wird vorbereitet...",
    downloadError: "ZIP wird noch vorbereitet. Bitte kurz warten und erneut klicken.",
    paymentPending:
      "Zahlung noch nicht auf dem Server bestätigt. Bitte bis zu einer Minute warten oder Support kontaktieren.",
    links: {
      publicSiteLabel: "Ihre Website für Kunden",
      publicSiteHint: "Diesen Link in Google Maps, Instagram oder auf Ihre Visitenkarte setzen.",
      jobsLabel: "Stellenangebote-Seite",
      jobsHint: "Senden Sie diesen Link an Bewerber",
      bookingLabel: "Buchungsseite",
      bookingHint: "Senden Sie diesen Link an Ihre Kunden",
      copyLink: "Link kopieren",
      copied: "Kopiert!",
    } satisfies TenantReadyLinksCopy,
  },
  en: {
    title: "Payment successful!",
    subtitleDemo: "Your Website + CRM + Booking is saved forever",
    subtitlePro: "Your Deployable ZIP (€999) package is ready",
    emailHint: "Save the links below — customer site, jobs, and booking.",
    download: "Download ZIP",
    home: "Back to home",
    waiting: "Preparing your ZIP...",
    downloadError: "ZIP is still preparing. Wait a few seconds and try again.",
    paymentPending:
      "Payment is not confirmed on the server yet. Wait up to a minute or contact support — the ZIP is waiting for Polar confirmation, not building.",
    links: {
      publicSiteLabel: "Your site for customers",
      publicSiteHint: "Put this link on Google Maps, Instagram, or your business card.",
      jobsLabel: "Jobs page",
      jobsHint: "Send this link to applicants",
      bookingLabel: "Booking page",
      bookingHint: "Send this link to your customers",
      copyLink: "Copy link",
      copied: "Copied!",
    } satisfies TenantReadyLinksCopy,
  },
} as const;

export function SuccessPageContent() {
  const searchParams = useSearchParams();
  const urlClientId = searchParams?.get("clientId")?.trim() ?? "";
  const email = searchParams?.get("email")?.trim() ?? "";
  const checkoutId = pickCheckoutId(searchParams);
  const tier = searchParams?.get("tier")?.trim() ?? "";
  const isMvpPro = tier === "mvp_pro";
  const langParam = searchParams?.get("lang")?.trim() ?? "ru";
  const lang = (["ru", "de", "en"].includes(langParam) ? langParam : "ru") as keyof typeof COPY;
  const t = COPY[lang];

  const [clientId, setClientId] = useState(urlClientId);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [zipUnlocked, setZipUnlocked] = useState(false);
  const [zipUnlockReason, setZipUnlockReason] = useState<string>("");
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [publicSiteUrl, setPublicSiteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (urlClientId) setClientId(urlClientId);
  }, [urlClientId]);

  useEffect(() => {
    if (!clientId) return;
    const origin = window.location.origin;
    setPublicSiteUrl(`${origin}/site/${encodeURIComponent(clientId)}`);
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/demo-access/${encodeURIComponent(clientId)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          publicSiteUrl?: string | null;
        };
        if (cancelled) return;
        if (typeof data.publicSiteUrl === "string" && data.publicSiteUrl) {
          setPublicSiteUrl(data.publicSiteUrl);
        }
      } catch {
        /* ignore */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!isMvpPro || (!urlClientId && !checkoutId)) {
      return;
    }

    let cancelled = false;

    const applyUnlock = (data: {
      ready?: boolean;
      zipUnlocked?: boolean;
      downloadToken?: string;
      zipUnlockReason?: string;
      resolvedClientId?: string;
      clientId?: string;
    }) => {
      if (cancelled) return;
      const resolved =
        (typeof data.resolvedClientId === "string" && data.resolvedClientId.trim()) ||
        (typeof data.clientId === "string" && data.clientId.trim()) ||
        "";
      if (resolved) {
        setClientId(resolved);
        if (resolved !== urlClientId && typeof window !== "undefined") {
          const next = new URL(window.location.href);
          next.searchParams.set("clientId", resolved);
          window.history.replaceState({}, "", next.toString());
        }
      }
      if (typeof data.zipUnlockReason === "string") {
        setZipUnlockReason(data.zipUnlockReason);
      }
      if (data.zipUnlocked || data.ready) {
        setZipUnlocked(true);
      }
      if (data.downloadToken) {
        setDownloadToken(data.downloadToken);
      }
    };

    const poll = async () => {
      try {
        const params = new URLSearchParams();
        if (urlClientId) params.set("clientId", urlClientId);
        if (email) params.set("email", email);
        if (checkoutId) params.set("checkout_id", checkoutId);
        const statusResponse = await fetch(`/api/mvp-pro/status?${params.toString()}`, {
          cache: "no-store",
        });
        if (statusResponse.ok) {
          const data = (await statusResponse.json()) as {
            ready?: boolean;
            zipUnlocked?: boolean;
            downloadToken?: string;
            zipUnlockReason?: string;
            resolvedClientId?: string;
            clientId?: string;
          };
          applyUnlock(data);
        }
      } catch {
        /* keep polling */
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      if (cancelled) return;
      void poll();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isMvpPro, urlClientId, email, checkoutId]);

  const resolveDownloadToken = async (): Promise<{ token: string; id: string } | null> => {
    if (downloadToken && clientId) return { token: downloadToken, id: clientId };
    if (!urlClientId && !checkoutId && !clientId) return null;

    const params = new URLSearchParams();
    if (clientId || urlClientId) params.set("clientId", clientId || urlClientId);
    if (email) params.set("email", email);
    if (checkoutId) params.set("checkout_id", checkoutId);
    const response = await fetch(`/api/mvp-pro/status?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      zipUnlocked?: boolean;
      downloadToken?: string;
      resolvedClientId?: string;
      clientId?: string;
    };
    const resolved =
      (typeof data.resolvedClientId === "string" && data.resolvedClientId.trim()) ||
      (typeof data.clientId === "string" && data.clientId.trim()) ||
      clientId ||
      urlClientId;
    if (resolved) setClientId(resolved);
    if (data.zipUnlocked) {
      setZipUnlocked(true);
    }
    if (data.downloadToken && resolved) {
      setDownloadToken(data.downloadToken);
      return { token: data.downloadToken, id: resolved };
    }
    return null;
  };

  const handleDownload = async () => {
    if (downloadBusy) return;
    setDownloadBusy(true);
    setDownloadError("");
    try {
      const resolved = await resolveDownloadToken();
      if (!resolved) {
        setDownloadError(t.downloadError);
        return;
      }
      const params = new URLSearchParams({
        clientId: resolved.id,
        token: resolved.token,
      });
      window.open(`/api/download-zip?${params.toString()}`, "_blank", "noopener,noreferrer");
    } catch {
      setDownloadError(t.downloadError);
    } finally {
      setDownloadBusy(false);
    }
  };

  const showDownloadCta = isMvpPro && Boolean(clientId || checkoutId);

  return (
    <main className="min-h-svh bg-white text-slate-900">
      <div className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 text-6xl" aria-hidden>
          🎉
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {t.title}
        </h1>

        <p className="mt-4 text-2xl font-semibold text-violet-700">
          {isMvpPro ? t.subtitlePro : t.subtitleDemo}
        </p>

        {!isMvpPro ? (
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">{t.emailHint}</p>
        ) : null}

        {publicSiteUrl ? (
          <div className="mt-8 w-full text-left [&_.tenant-ready-link-block]:border-slate-200 [&_.tenant-ready-link-block]:bg-slate-50 [&_.tenant-ready-link-label]:text-slate-900 [&_.tenant-ready-link-hint]:text-slate-500 [&_.wizard-ready-url]:border-slate-200 [&_.wizard-ready-url]:bg-white [&_.wizard-ready-url]:text-slate-800 [&_.wizard-ready-copy]:border [&_.wizard-ready-copy]:border-slate-200 [&_.wizard-ready-copy]:bg-white [&_.wizard-ready-copy]:text-slate-800">
            <TenantReadyLinks publicSiteUrl={publicSiteUrl} copy={t.links} />
          </div>
        ) : null}

        {isMvpPro ? (
          <div className="mt-10 flex flex-col items-center gap-3">
            {showDownloadCta ? (
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={downloadBusy}
                className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-80"
              >
                {downloadBusy ? t.waiting : t.download}
              </button>
            ) : null}
            {!downloadBusy && !downloadToken && !zipUnlocked ? (
              <p className="text-slate-600">
                {zipUnlockReason === "payment_required" ? t.paymentPending : t.waiting}
              </p>
            ) : null}
            {downloadError ? <p className="max-w-md text-sm text-red-600">{downloadError}</p> : null}
          </div>
        ) : null}

        <Link
          href="/"
          className="mt-12 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          {t.home}
        </Link>
      </div>
    </main>
  );
}
