"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";

import { ClientScreenShell } from "@/components/client-screen-shell";
import { isPreviewApproved, markPreviewApproved } from "@/lib/client-preview/approval-storage";
import { isResultApiReady } from "@/lib/client-preview/result-readiness";
import type { ClientResultPayload, DeliveryOption, DeliveryOptionKey } from "@/lib/client-preview/types";
import { useTranslation } from "@/lib/i18n/context";
import { getPreviewCopy, type PreviewCopy } from "@/lib/i18n/preview-copy";

import "@/styles/client-funnel.css";

const CLIENT_RESULT_KEYS: DeliveryOptionKey[] = [
  "zip",
  "netlify",
  "custom_domain",
  "readme",
  "demo_mp4",
  "github",
];

function filterDeliveryOptions(options: DeliveryOption[]): DeliveryOption[] {
  return options.filter((option) => {
    if (!CLIENT_RESULT_KEYS.includes(option.key)) {
      return false;
    }
    if ((option.key === "apk" || option.key === "pwa" || option.key === "github") && !option.available) {
      return false;
    }
    return true;
  });
}

function DeliveryOptionButton({
  option,
  copy,
}: {
  option: DeliveryOption;
  copy: PreviewCopy;
}) {
  const localized = copy.deliveryOptions[option.key];
  const href = option.href;

  if (!option.available || !href) {
    return (
      <div className="client-funnel-dl-btn disabled">
        <div className="client-funnel-dl-icon">{localized.label.slice(0, 2)}</div>
        <div>
          <div>{localized.label}</div>
          <div style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>
            {copy.optionUnavailable}
          </div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={href}
      className="client-funnel-dl-btn"
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      download={option.key === "zip" ? "final_package.zip" : undefined}
    >
      <div className="client-funnel-dl-icon">{localized.label.slice(0, 2)}</div>
      <div>{localized.label}</div>
    </a>
  );
}

export function ClientResultPage({ previewRouteId }: { previewRouteId: string }) {
  const router = useRouter();
  const { locale } = useTranslation();
  const copy = getPreviewCopy(locale);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<ClientResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function loadResult() {
      try {
        const response = await fetch(`/api/client-result/${encodeURIComponent(previewRouteId)}`);
        const data = (await response.json()) as ClientResultPayload;
        if (!active) return;
        if (!response.ok || !data.ok) {
          setError(data.error ?? "Result not found");
          setPayload(null);
          setApproved(false);
          return;
        }
        setPayload(data);
        const approvedByUser = isPreviewApproved(data.preview_id);
        const apiReady = isResultApiReady(data);
        const canShowResult = approvedByUser || apiReady;
        setApproved(canShowResult);

        if (apiReady && !approvedByUser) {
          markPreviewApproved(data.preview_id);
        }

        if (!canShowResult) {
          const previewHref =
            previewRouteId === "latest"
              ? "/client-preview/latest"
              : `/client-preview/${encodeURIComponent(data.preview_id)}`;
          router.replace(previewHref);
        }
      } catch {
        if (active) {
          setError("Failed to load result");
          setApproved(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadResult();
    return () => {
      active = false;
    };
  }, [previewRouteId, router]);

  if (loading || approved === null) {
    return (
      <ClientScreenShell>
        <div className="client-result-shell">
          <p className="client-preview-status">{copy.loading}</p>
        </div>
      </ClientScreenShell>
    );
  }

  if (!approved) {
    return (
      <ClientScreenShell>
        <div className="client-result-shell">
          <p className="client-preview-status">{copy.approvalRequired}</p>
          {payload ? (
            <Link href={`/client-preview/${encodeURIComponent(payload.preview_id)}`} className="client-result-back">
              {copy.openPreview}
            </Link>
          ) : null}
        </div>
      </ClientScreenShell>
    );
  }

  const deliveryOptions = payload ? filterDeliveryOptions(payload.delivery_options) : [];

  return (
    <ClientScreenShell>
      <div className="client-result-shell">
        {error ? (
          <div className="client-funnel-error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        ) : null}

        {payload ? (
          <>
            <div className="client-funnel-badge">
              <Check className="size-4" />
              {copy.resultTitle}
            </div>
            <h1 className="client-funnel-step-h client-funnel-grad-em">{copy.resultTitle}</h1>
            <p className="client-funnel-step-sub">{copy.resultDescription}</p>

            {payload.demo_video_synced === false ? (
              <div className="client-funnel-error" style={{ marginBottom: 20, fontSize: 13 }}>
                {payload.demo_video_warning ?? copy.demoVideoNotSynced}
              </div>
            ) : null}

            {payload.artifacts_in_sync === false ? (
              <div className="client-funnel-error" style={{ marginBottom: 20 }}>
                <div>{copy.artifactsSyncWarning}</div>
                {payload.artifact_mismatches?.length ? (
                  <ul style={{ marginTop: 10, paddingLeft: 18, fontSize: 12 }}>
                    {payload.artifact_mismatches.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="client-funnel-dl-grid">
              {deliveryOptions.map((option) => (
                <DeliveryOptionButton key={option.key} option={option} copy={copy} />
              ))}
            </div>

            <Link
              href={`/client-preview/${encodeURIComponent(payload.preview_id)}`}
              className="client-result-back"
            >
              <ArrowLeft className="size-4" />
              {copy.backToPreview}
            </Link>
          </>
        ) : null}
      </div>
    </ClientScreenShell>
  );
}
