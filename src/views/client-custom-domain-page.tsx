"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { ClientScreenShell } from "@/components/client-screen-shell";
import { useTranslation } from "@/lib/i18n/context";
import { getPreviewCopy } from "@/lib/i18n/preview-copy";

import "@/styles/client-funnel.css";

export function ClientCustomDomainPage() {
  const { locale } = useTranslation();
  const copy = getPreviewCopy(locale);
  const [netlifyUrl, setNetlifyUrl] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/client-result/custom-domain")
      .then((response) => response.json())
      .then((data: { netlify_url?: string | null }) => {
        setNetlifyUrl(data.netlify_url ?? null);
      })
      .catch(() => setNetlifyUrl(null));
  }, []);

  return (
    <ClientScreenShell>
      <div className="client-result-shell">
        <h1 className="client-funnel-step-h">{copy.domainGuideTitle}</h1>
        <p className="client-funnel-step-sub">{copy.domainGuideSubtitle}</p>

        {netlifyUrl ? (
          <div className="client-domain-netlify">
            <span className="client-domain-netlify-label">{copy.domainNetlifyHint}</span>
            <a href={netlifyUrl} target="_blank" rel="noreferrer" className="client-domain-netlify-link">
              {netlifyUrl}
            </a>
          </div>
        ) : null}

        <ol className="client-domain-steps">
          {copy.domainSteps.map((step, index) => (
            <li key={step} className="client-domain-step">
              <span className="client-domain-step-num">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <Link href="/client-result/latest" className="client-result-back">
          <ArrowLeft className="size-4" />
          {copy.domainBackToResult}
        </Link>
      </div>
    </ClientScreenShell>
  );
}
