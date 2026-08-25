import type { DeliveryStepStatusKey } from "@/lib/i18n/questionnaire-copy";

export const V2_PIPELINE_STEP_NAMES = [
  "client_onboarding",
  "mvp_assembly",
  "template_selection",
  "build_orchestrator",
  "react_mvp_build",
  "v2_finalize",
] as const;

export type V2PipelineStepName = (typeof V2_PIPELINE_STEP_NAMES)[number];

export type V2RunResponse = {
  ok?: boolean;
  status?: string;
  steps?: Array<{ name: string; status: string }>;
  final_package?: string;
  business_name?: string;
  business_type?: string;
  template_id?: string;
  modules?: string[];
  error?: string;
};

export type V2StatusPayload = {
  ok?: boolean;
  status?: string;
  manifest_exists?: boolean;
  package_exists?: boolean;
  package_ready?: boolean;
  business_name?: string | null;
  business_type?: string | null;
  template_id?: string | null;
  modules?: string[] | Record<string, unknown>;
  manifest?: {
    status?: string;
    business_type?: string;
    template_id?: string;
    modules?: string[];
    client_contacts?: {
      business_name?: string;
    };
    outputs?: {
      final_package?: string;
    };
  } | null;
};

export type DeliveryStepView = {
  name: string;
  label: string;
  status: DeliveryStepStatusKey;
};

const READY_MANIFEST_STATUSES = new Set(["DELIVERY_READY", "READY"]);

export function isV2RunSuccess(result: V2RunResponse): boolean {
  return result.status === "PASS" || result.ok === true;
}

export function getManifestStatus(payload: V2StatusPayload | null | undefined): string | undefined {
  return payload?.manifest?.status;
}

export function isV2DeliveryReady(payload: V2StatusPayload | null | undefined): boolean {
  if (!payload) {
    return false;
  }

  const manifestStatus = getManifestStatus(payload);
  if (manifestStatus && READY_MANIFEST_STATUSES.has(manifestStatus)) {
    return true;
  }

  return Boolean(payload.package_exists || payload.package_ready) && Boolean(payload.manifest_exists);
}

export function isV2OverallPass(
  runResult: V2RunResponse,
  statusPayload: V2StatusPayload | null | undefined,
): boolean {
  if (isV2DeliveryReady(statusPayload)) {
    return true;
  }
  return isV2RunSuccess(runResult);
}

function normalizeModules(modules: V2StatusPayload["modules"]): string[] {
  if (Array.isArray(modules)) {
    return modules.map(String);
  }
  return [];
}

export function buildDeliveryResultFromStatus(
  runResult: V2RunResponse,
  statusPayload: V2StatusPayload | null | undefined,
): V2RunResponse {
  const manifest = statusPayload?.manifest;
  const contacts = manifest?.client_contacts;

  return {
    ...runResult,
    status: isV2OverallPass(runResult, statusPayload) ? "PASS" : "FAIL",
    business_name:
      statusPayload?.business_name ??
      contacts?.business_name ??
      runResult.business_name ??
      undefined,
    business_type:
      statusPayload?.business_type ?? manifest?.business_type ?? runResult.business_type ?? undefined,
    template_id:
      statusPayload?.template_id ?? manifest?.template_id ?? runResult.template_id ?? undefined,
    modules: normalizeModules(statusPayload?.modules).length
      ? normalizeModules(statusPayload?.modules)
      : manifest?.modules ?? runResult.modules ?? [],
    final_package:
      runResult.final_package ??
      manifest?.outputs?.final_package ??
      "artifacts/factory_output/client_delivery_v2/final_package.zip",
  };
}

export function mapDeliverySteps(
  steps: DeliveryStepView[],
  runResult: V2RunResponse,
  statusPayload: V2StatusPayload | null | undefined,
): DeliveryStepView[] {
  if (isV2DeliveryReady(statusPayload) || (isV2RunSuccess(runResult) && !runResult.steps?.length)) {
    return steps.map((step) => ({ ...step, status: "PASS" }));
  }

  if (runResult.steps?.length) {
    return steps.map((step) => {
      const match = runResult.steps?.find((item) => item.name === step.name);
      return {
        ...step,
        status: match?.status === "PASS" ? "PASS" : "FAIL",
      };
    });
  }

  const defaultStatus: DeliveryStepStatusKey = isV2RunSuccess(runResult) ? "PASS" : "FAIL";
  return steps.map((step) => ({ ...step, status: defaultStatus }));
}
