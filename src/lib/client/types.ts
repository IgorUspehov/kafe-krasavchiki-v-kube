export const CLIENT_FACTORY_VERSION = "3.8.0";

export const CLIENT_ARTIFACT_ROOT = "artifacts/client";

export type ClientReadyStatus = "READY" | "PENDING";
export type ClientDeliveryStatus = "CLIENT_READY" | "PENDING";
export type HandoverStatus = "READY_FOR_HANDOVER" | "PENDING";

export interface DeliveryChecklist {
  readme: boolean;
  demo_video: boolean;
  screenshots: boolean;
  release_bundle: boolean;
  github_package: boolean;
  deploy_package: boolean;
  delivery_ready: boolean;
}

export interface HandoverReport {
  status: HandoverStatus;
  generated_at: string;
  core_modified: boolean;
}

export interface ClientManifest {
  version: string;
  client_ready: boolean;
  delivery_ready: boolean;
  handover_ready: boolean;
}

export interface ClientDeliveryReport {
  status: ClientDeliveryStatus;
  summary: ClientReadyStatus;
  offer: ClientReadyStatus;
  handover: ClientReadyStatus;
  checklist: ClientReadyStatus;
}

export interface ClientBundle {
  projectSummary: string;
  offer: string;
  deliveryChecklist: DeliveryChecklist;
  handoverReport: HandoverReport;
  clientManifest: ClientManifest;
  clientDeliveryReport: ClientDeliveryReport;
}

export interface ClientArtifactsSnapshot {
  clientManifest: ClientManifest | null;
  clientDeliveryReport: ClientDeliveryReport | null;
  handoverReport: HandoverReport | null;
  deliveryChecklist: DeliveryChecklist | null;
  projectSummary: string | null;
  offer: string | null;
}
