import { NextRequest, NextResponse } from "next/server";

import { buildDemoEmbedSrc } from "@/lib/cloudflare/demo-embed";
import { findDemoBySlug } from "@/lib/cloudflare/demo-registry";
import { isPagesIframeEmbedReady } from "@/lib/cloudflare/iframe-ready";
import { findPendingByClientId } from "@/lib/cloudflare/scheduler";
import { getPublicSiteOrigin } from "@/lib/cloudflare/shared-project";

const ALLOWED_PREVIEW_HOST = /\.(pages\.dev|netlify\.app)$/i;
const PROBE_TIMEOUT_MS = 8_000;

function parsePreviewUrl(value: string): URL | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    return parsed;
  } catch {
    return null;
  }
}

function resolveProbeTarget(urlParam: string): string | null {
  const previewUrl = parsePreviewUrl(urlParam);
  if (!previewUrl) return null;

  if (ALLOWED_PREVIEW_HOST.test(previewUrl.hostname)) {
    return previewUrl.toString();
  }

  const publicOrigin = getPublicSiteOrigin();
  if (previewUrl.origin === new URL(publicOrigin).origin && previewUrl.pathname.startsWith("/demo/")) {
    const slug = previewUrl.pathname.replace(/^\/demo\//, "").split("/")[0];
    const record = findDemoBySlug(slug);
    if (!record?.deploymentUrl) return null;
    const clientId = previewUrl.searchParams.get("clientId") || record.clientId;
    return buildDemoEmbedSrc(record, clientId || undefined);
  }

  return null;
}

async function probePreviewSite(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html",
      },
    });
    return isPagesIframeEmbedReady(response);
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url")?.trim();
  const clientId = request.nextUrl.searchParams.get("clientId")?.trim();

  if (!urlParam) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const probeUrl = resolveProbeTarget(urlParam);
  if (!probeUrl) {
    return NextResponse.json({ error: "Invalid preview url" }, { status: 400 });
  }

  if (clientId) {
    const pending = findPendingByClientId(clientId);
    if (pending?.deploymentUrl || pending?.siteUrl) {
      const pendingOrigin =
        parsePreviewUrl(pending.deploymentUrl || pending.siteUrl || "")?.origin;
      const probeOrigin = parsePreviewUrl(probeUrl)?.origin;
      // Readable /demo URLs resolve to deployment origin — allow that match.
      if (pendingOrigin && probeOrigin && pendingOrigin !== probeOrigin) {
        const readableOrigin = new URL(getPublicSiteOrigin()).origin;
        const requested = parsePreviewUrl(urlParam);
        if (!(requested && requested.origin === readableOrigin)) {
          return NextResponse.json({ error: "Url mismatch" }, { status: 403 });
        }
      }
    }
  }

  const ready = await probePreviewSite(probeUrl);
  return NextResponse.json({ ready, probeUrl });
}
