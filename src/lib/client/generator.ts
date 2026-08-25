import { generateDeliveryChecklist, type ChecklistAvailability } from "@/lib/client/checklist-generator";
import { generateHandoverReport } from "@/lib/client/handover-generator";
import { generateOffer } from "@/lib/client/offer-generator";
import { generateProjectSummary } from "@/lib/client/summary-generator";
import {
  CLIENT_ARTIFACT_ROOT,
  CLIENT_FACTORY_VERSION,
  type ClientBundle,
  type ClientDeliveryReport,
  type ClientManifest,
} from "@/lib/client/types";

export const CLIENT_PATHS = {
  root: CLIENT_ARTIFACT_ROOT,
  projectSummary: `${CLIENT_ARTIFACT_ROOT}/project_summary.md`,
  offer: `${CLIENT_ARTIFACT_ROOT}/offer.md`,
  handoverReport: `${CLIENT_ARTIFACT_ROOT}/handover_report.json`,
  deliveryChecklist: `${CLIENT_ARTIFACT_ROOT}/delivery_checklist.json`,
  clientManifest: `${CLIENT_ARTIFACT_ROOT}/client_manifest.json`,
  clientDeliveryReport: `${CLIENT_ARTIFACT_ROOT}/client_delivery_report.json`,
  clientPackage: `${CLIENT_ARTIFACT_ROOT}/client_package.zip`,
} as const;

export function generateClientManifest(checklistReady: boolean): ClientManifest {
  return {
    version: CLIENT_FACTORY_VERSION,
    client_ready: checklistReady,
    delivery_ready: checklistReady,
    handover_ready: checklistReady,
  };
}

export function generateClientDeliveryReport(ready: boolean): ClientDeliveryReport {
  const status = ready ? "READY" : "PENDING";
  return {
    status: ready ? "CLIENT_READY" : "PENDING",
    summary: status,
    offer: status,
    handover: status,
    checklist: status,
  };
}

export function generateClientBundle(
  projectName: string,
  availability: ChecklistAvailability
): ClientBundle {
  const deliveryChecklist = generateDeliveryChecklist(availability);
  const ready = deliveryChecklist.delivery_ready;

  return {
    projectSummary: generateProjectSummary({ projectName }),
    offer: generateOffer(),
    deliveryChecklist,
    handoverReport: generateHandoverReport(),
    clientManifest: generateClientManifest(ready),
    clientDeliveryReport: generateClientDeliveryReport(ready),
  };
}
