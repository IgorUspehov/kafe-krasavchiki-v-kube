"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, RefreshCw } from "lucide-react";

import { ClientScreenShell } from "@/components/client-screen-shell";
import { markPreviewApproved } from "@/lib/client-preview/approval-storage";
import type { ClientPreviewDemoFlow, ClientPreviewPayload } from "@/lib/client-preview/types";
import { useTranslation } from "@/lib/i18n/context";
import { getPreviewCopy } from "@/lib/i18n/preview-copy";

import "@/styles/client-funnel.css";

function DemoFlowField({ label, value }: { label: string; value: string }) {
  return (
    <div className="client-preview-demo-field">
      <span className="client-preview-demo-field-label">{label}</span>
      <span className="client-preview-demo-field-value">{value || "—"}</span>
    </div>
  );
}

function DemoFlowBlock({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="client-preview-demo-block">
      <div className="client-preview-demo-block-head">
        <span className="client-preview-demo-step">{step}</span>
        <h2 className="client-preview-demo-block-title">{title}</h2>
      </div>
      <div className="client-preview-demo-block-body">{children}</div>
    </section>
  );
}

function ManifestCard({ flow }: { flow: ClientPreviewDemoFlow }) {
  const card = {
    business_name: flow.manifest_card.business_name,
    business_type: flow.manifest_card.business_type,
    selected_template: flow.manifest_card.selected_template,
    language: flow.manifest_card.language,
    delivery_ready: flow.manifest_card.delivery_ready,
    artifacts_in_sync: flow.manifest_card.artifacts_in_sync,
  };

  return (
    <pre className="client-preview-manifest-pre">{JSON.stringify(card, null, 2)}</pre>
  );
}

export function ClientPreviewPage({ previewRouteId }: { previewRouteId: string }) {
  const router = useRouter();
  const { locale } = useTranslation();
  const copy = getPreviewCopy(locale);
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [payload, setPayload] = useState<ClientPreviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPreview() {
      try {
        const response = await fetch(`/api/client-preview/${encodeURIComponent(previewRouteId)}`);
        const data = (await response.json()) as ClientPreviewPayload;
        if (!active) return;
        if (!response.ok || !data.ok) {
          setError(data.error ?? "Preview not found");
          setPayload(null);
          return;
        }
        setPayload(data);
        setIframeLoading(Boolean(data.dist_available && data.preview_url));
      } catch {
        if (active) setError("Failed to load preview");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPreview();
    return () => {
      active = false;
    };
  }, [previewRouteId]);

  function handleYes() {
    if (!payload?.preview_id) return;
    markPreviewApproved(payload.preview_id);
    router.push(`/client-result/${encodeURIComponent(payload.preview_id)}`);
  }

  function handleNo() {
    router.push("/client-funnel");
  }

  const flow = payload?.demo_flow;
  const businessTitle = payload?.business_name || copy.pageTitle;

  const header = (
    <header className="client-preview-demo-header">
      <div className="client-preview-title-wrap">
        <span className="client-funnel-live-dot" />
        <h1 className="client-preview-title">{businessTitle}</h1>
      </div>
      <p className="client-preview-demo-subtitle">{copy.pageDescription}</p>
    </header>
  );

  return (
    <ClientScreenShell header={header}>
      {loading ? <div className="client-preview-status">{copy.loading}</div> : null}

      {error ? (
        <div className="client-preview-status client-funnel-error" style={{ margin: 24 }}>
          {error}
        </div>
      ) : null}

      {payload && flow ? (
        <div className="client-preview-demo-flow">
          <DemoFlowBlock step={1} title={copy.demoFlowQuestionnaireTitle}>
            <DemoFlowField label={copy.businessName} value={flow.questionnaire.business_name} />
            <DemoFlowField label={copy.demoFlowCategory} value={flow.questionnaire.business_category} />
            <DemoFlowField label={copy.demoFlowLanguage} value={flow.questionnaire.language} />
            <DemoFlowField label={copy.demoFlowEmail} value={flow.questionnaire.email} />
            <DemoFlowField label={copy.demoFlowPhone} value={flow.questionnaire.phone} />
          </DemoFlowBlock>

          <DemoFlowBlock step={2} title={copy.demoFlowSphereTitle}>
            <DemoFlowField label={copy.demoFlowSelectedSphere} value={flow.sphere.selected_sphere} />
            <DemoFlowField label={copy.template} value={flow.sphere.template} />
            <DemoFlowField label={copy.modules} value={flow.sphere.modules.join(", ")} />
          </DemoFlowBlock>

          <DemoFlowBlock step={3} title={copy.demoFlowManifestTitle}>
            <ManifestCard flow={flow} />
          </DemoFlowBlock>

          <DemoFlowBlock step={4} title={copy.demoFlowLivePreviewTitle}>
            {payload.dist_available && payload.preview_url ? (
              <div className="client-preview-live-block">
                {iframeLoading ? (
                  <div className="client-preview-iframe-loader">{copy.loading}</div>
                ) : null}
                <iframe
                  title={copy.livePreview}
                  src={payload.preview_url}
                  className={`client-preview-iframe-demo ${iframeLoading ? "opacity-0" : "opacity-100"}`}
                  onLoad={() => setIframeLoading(false)}
                />
                <a
                  href={payload.preview_url}
                  target="_blank"
                  rel="noreferrer"
                  className="client-preview-live-link"
                >
                  {payload.preview_url}
                </a>
              </div>
            ) : (
              <div className="client-preview-status">{copy.previewUnavailable}</div>
            )}
          </DemoFlowBlock>

          <DemoFlowBlock step={5} title={copy.demoFlowApprovalTitle}>
            <div className="client-preview-approval-row">
              <span className="client-preview-question">{copy.likeQuestion}</span>
              <button type="button" className="client-funnel-btn-yes client-preview-btn" onClick={handleYes}>
                <Check className="size-4" />
                {copy.yes}
              </button>
              <button type="button" className="client-funnel-btn-no client-preview-btn" onClick={handleNo}>
                <RefreshCw className="size-4" />
                {copy.no}
              </button>
            </div>
          </DemoFlowBlock>
        </div>
      ) : payload ? (
        <div className="client-preview-status">{copy.previewUnavailable}</div>
      ) : null}
    </ClientScreenShell>
  );
}
