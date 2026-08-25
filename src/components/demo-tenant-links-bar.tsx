"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { buildTenantShareLinks } from "@/lib/tenant-share-links";

type DemoTenantLinksBarProps = {
  clientId: string;
  slug?: string;
  language?: string;
  /** Deployable ZIP: CRM button opens Admin instead of /demo. */
  preferAdminCrm?: boolean;
  /** @deprecated use clientId — kept for callers that still pass it */
  publicSiteUrl?: string;
};

const COPY = {
  en: {
    crm: "CRM",
    admin: "Admin",
    website: "Website",
    vacancies: "Vacancies",
    booking: "Booking",
    copy: "Copy",
    copied: "Copied",
    missing: "Link not ready",
  },
  de: {
    crm: "CRM",
    admin: "Admin",
    website: "Website",
    vacancies: "Stellen",
    booking: "Buchung",
    copy: "Kopieren",
    copied: "Kopiert",
    missing: "Link noch nicht bereit",
  },
  ru: {
    crm: "CRM",
    admin: "Админ",
    website: "Сайт",
    vacancies: "Вакансии",
    booking: "Бронирование",
    copy: "Копировать",
    copied: "Скопировано",
    missing: "Ссылка пока недоступна",
  },
} as const;

function normalizeLang(language: string | undefined): keyof typeof COPY {
  const lang = (language || "de").toLowerCase();
  if (lang.startsWith("ru")) return "ru";
  if (lang.startsWith("en")) return "en";
  return "de";
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

const rowStyle: CSSProperties = {
  display: "flex",
  flex: "1 1 18rem",
  alignItems: "center",
  gap: "0.45rem",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  flexShrink: 0,
  fontWeight: 700,
  color: "#f8fafc",
  whiteSpace: "nowrap",
};

const urlInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: "1px solid #334155",
  borderRadius: 8,
  background: "#1e293b",
  color: "#e2e8f0",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "0.75rem",
  padding: "0.35rem 0.55rem",
  outline: "none",
};

const copyBtnStyle: CSSProperties = {
  flexShrink: 0,
  border: "1px solid #ea580c",
  borderRadius: 8,
  background: "#f97316",
  color: "#111827",
  fontWeight: 700,
  fontSize: "0.75rem",
  padding: "0.35rem 0.65rem",
  cursor: "pointer",
  fontFamily: "inherit",
};

function CopyableFormLink({
  label,
  href,
  copyLabel,
  copiedLabel,
  missingLabel,
}: {
  label: string;
  href: string;
  copyLabel: string;
  copiedLabel: string;
  missingLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div style={rowStyle}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{ ...copyBtnStyle, textDecoration: "none" }}
        >
          {label}
        </a>
      ) : (
        <span style={labelStyle}>{label}</span>
      )}
      {href ? (
        <input
          type="text"
          readOnly
          value={href}
          aria-label={label}
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
          style={urlInputStyle}
        />
      ) : (
        <span style={{ ...urlInputStyle, border: 0, background: "transparent", color: "#94a3b8" }}>
          {missingLabel}
        </span>
      )}
      <button
        type="button"
        disabled={!href}
        style={{ ...copyBtnStyle, opacity: href ? 1 : 0.45, cursor: href ? "pointer" : "not-allowed" }}
        onClick={() => {
          if (!href) return;
          void copyText(href).then((ok) => {
            if (!ok) return;
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

/** Shareable tenant URLs on paid /demo — CRM, admin, public site, job + booking forms. */
export function DemoTenantLinksBar({
  clientId,
  slug,
  language,
  preferAdminCrm,
}: DemoTenantLinksBarProps) {
  const [lang, setLang] = useState(() => normalizeLang(language));
  const t = COPY[lang];
  const [origin, setOrigin] = useState<string | undefined>(undefined);

  useEffect(() => {
    setOrigin(window.location.origin.replace(/\/$/, ""));
  }, []);

  useEffect(() => {
    setLang(normalizeLang(language));
  }, [language]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: string }).type !== "crm-demo-language") return;
      const next = (data as { language?: string }).language;
      if (typeof next !== "string") return;
      setLang(normalizeLang(next));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const links = useMemo(
    () => buildTenantShareLinks({ clientId, slug, origin, preferAdminCrm }),
    [clientId, slug, origin, preferAdminCrm],
  );

  const rows = [
    { label: t.crm, href: links.crm },
    { label: t.admin, href: links.admin },
    { label: t.website, href: links.site },
    { label: t.vacancies, href: links.vacancies },
    { label: t.booking, href: links.booking },
  ];

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.65rem 1.25rem",
        padding: "0.55rem 0.85rem",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.82rem",
        borderBottom: "1px solid #1e293b",
      }}
    >
      {rows.map((row) => (
        <CopyableFormLink
          key={row.label}
          label={row.label}
          href={row.href}
          copyLabel={t.copy}
          copiedLabel={t.copied}
          missingLabel={t.missing}
        />
      ))}
    </div>
  );
}
