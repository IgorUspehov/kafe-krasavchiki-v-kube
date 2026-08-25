import type {
  ClientArtifactsSnapshot,
  ClientDeliveryReport,
  ClientManifest,
  DeliveryChecklist,
  HandoverReport,
} from "@/lib/client/types";

export const CLIENT_ARTIFACT_BASE = "/artifacts/client";

export async function fetchClientArtifactsSnapshot(): Promise<ClientArtifactsSnapshot> {
  const [
    manifestRes,
    reportRes,
    handoverRes,
    checklistRes,
    summaryRes,
    offerRes,
  ] = await Promise.all([
    fetch(`${CLIENT_ARTIFACT_BASE}/client_manifest.json`),
    fetch(`${CLIENT_ARTIFACT_BASE}/client_delivery_report.json`),
    fetch(`${CLIENT_ARTIFACT_BASE}/handover_report.json`),
    fetch(`${CLIENT_ARTIFACT_BASE}/delivery_checklist.json`),
    fetch(`${CLIENT_ARTIFACT_BASE}/project_summary.md`),
    fetch(`${CLIENT_ARTIFACT_BASE}/offer.md`),
  ]);

  const clientManifest = manifestRes.ok
    ? ((await manifestRes.json()) as ClientManifest)
    : null;

  const clientDeliveryReport = reportRes.ok
    ? ((await reportRes.json()) as ClientDeliveryReport)
    : null;

  const handoverReport = handoverRes.ok
    ? ((await handoverRes.json()) as HandoverReport)
    : null;

  const deliveryChecklist = checklistRes.ok
    ? ((await checklistRes.json()) as DeliveryChecklist)
    : null;

  const projectSummary = summaryRes.ok ? await summaryRes.text() : null;
  const offer = offerRes.ok ? await offerRes.text() : null;

  return {
    clientManifest,
    clientDeliveryReport,
    handoverReport,
    deliveryChecklist,
    projectSummary,
    offer,
  };
}
