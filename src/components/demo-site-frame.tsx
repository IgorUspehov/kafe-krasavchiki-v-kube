"use client";

import { useEffect, useState, type ReactNode } from "react";

import { DemoUnpaidBanner } from "@/components/demo-unpaid-banner";

type DemoSiteFrameProps = {
  unpaid: boolean;
  clientId: string;
  checkoutUrl: string;
  language?: string;
  iframeSrc: string;
  iframeTitle: string;
  paidBar?: ReactNode;
};

const REVEAL_FALLBACK_MS = 2500;

/**
 * Demo wrapper chrome (paywall banner / tenant links) belongs on a top-level
 * /demo or /d visit. When the same URL is iframed on /pay, hide it so the
 * preview is the actual site — /pay already has plan + promo actions.
 */
export function DemoSiteFrame({
  unpaid,
  clientId,
  checkoutUrl,
  language,
  iframeSrc,
  iframeTitle,
  paidBar,
}: DemoSiteFrameProps) {
  // Top-level /demo visits must show the paywall immediately; only hide chrome when iframed (/pay).
  const [framed, setFramed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setFramed(window.self !== window.top);
  }, []);

  useEffect(() => {
    setRevealed(false);
  }, [iframeSrc]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: string }).type === "crm-demo-ready") {
        setRevealed(true);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (revealed) return;
    const timer = window.setTimeout(() => setRevealed(true), REVEAL_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [revealed, iframeSrc]);

  const showUnpaidBanner = unpaid && !framed;
  const showPaidBar = Boolean(paidBar) && !unpaid && !framed;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
      }}
    >
      {showUnpaidBanner ? (
        <DemoUnpaidBanner clientId={clientId} checkoutUrl={checkoutUrl} language={language} />
      ) : null}
      {showPaidBar ? paidBar : null}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <iframe
          title={iframeTitle}
          src={iframeSrc}
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            margin: 0,
            padding: 0,
            opacity: revealed ? 1 : 0,
            transition: "opacity 0.35s ease-out",
            background: "#0f172a",
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
          allow="clipboard-write"
        />
        <div
          aria-hidden={revealed}
          style={{
            pointerEvents: revealed ? "none" : "auto",
            position: "absolute",
            inset: 0,
            background: "#0f172a",
            opacity: revealed ? 0 : 1,
            transition: "opacity 0.35s ease-out",
          }}
        />
      </div>
    </div>
  );
}
