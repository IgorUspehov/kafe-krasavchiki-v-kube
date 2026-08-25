"use client";

import { useState } from "react";

import "@/client-wizard/styles.css";

export type TenantReadyLinksCopy = {
  publicSiteLabel: string;
  publicSiteHint: string;
  jobsLabel: string;
  jobsHint: string;
  bookingLabel: string;
  bookingHint: string;
  copyLink: string;
  copied: string;
};

type TenantReadyLinksProps = {
  publicSiteUrl: string;
  copy: TenantReadyLinksCopy;
  /** Optional countdown text while publishing. */
  publishingText?: string | null;
  className?: string;
};

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function joinSitePath(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function LinkBlock({
  label,
  hint,
  url,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  hint: string;
  url: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="tenant-ready-link-block">
      <div className="tenant-ready-link-label">{label}</div>
      <p className="tenant-ready-link-hint">{hint}</p>
      <input type="text" readOnly className="wizard-ready-url" value={url} aria-label={label} />
      <div className="tenant-ready-link-actions">
        <button
          type="button"
          className="wizard-ready-copy"
          onClick={() => {
            void copyText(url).then((ok) => {
              if (!ok) return;
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            });
          }}
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}

/** Share links: public site, jobs, and booking. */
export function TenantReadyLinks({
  publicSiteUrl,
  copy,
  publishingText,
  className,
}: TenantReadyLinksProps) {
  return (
    <div className={className ? `tenant-ready-links ${className}` : "tenant-ready-links"}>
      <LinkBlock
        label={copy.publicSiteLabel}
        hint={copy.publicSiteHint}
        url={publicSiteUrl}
        copyLabel={copy.copyLink}
        copiedLabel={copy.copied}
      />
      <LinkBlock
        label={copy.jobsLabel}
        hint={copy.jobsHint}
        url={joinSitePath(publicSiteUrl, "/job")}
        copyLabel={copy.copyLink}
        copiedLabel={copy.copied}
      />
      <LinkBlock
        label={copy.bookingLabel}
        hint={copy.bookingHint}
        url={joinSitePath(publicSiteUrl, "/booking")}
        copyLabel={copy.copyLink}
        copiedLabel={copy.copied}
      />
      {publishingText ? <p className="step-sub wizard-ready-countdown">{publishingText}</p> : null}
    </div>
  );
}
