import fs from "fs";
import path from "path";

export const V2_OUTPUT_REL = "artifacts/factory_output/client_delivery_v2";
export const V2_MANIFEST_REL = `${V2_OUTPUT_REL}/manifest.json`;
export const V2_DELIVERY_REPORT_REL = `${V2_OUTPUT_REL}/delivery_report.json`;
export const V2_VALIDATION_REL = `${V2_OUTPUT_REL}/validation_report.json`;
export const V2_FINAL_PACKAGE_REL = `${V2_OUTPUT_REL}/final_package.zip`;
export const V2_PASS_FILE_REL = "output/CLIENT_DELIVERY_V2_PHASE2_VISUAL_DIFFERENTIATION_PASS.txt";

export const V2_PIPELINE_STEPS = [
  "client_onboarding",
  "mvp_assembly",
  "template_selection",
  "build_orchestrator",
  "react_mvp_build",
  "v2_finalize",
] as const;

export type V2Manifest = {
  version?: string;
  phase?: string;
  status?: string;
  llm_used?: boolean;
  generated_at?: string;
  business_type?: string;
  template_id?: string;
  modules?: string[];
  language?: string;
  client_contacts?: {
    business_name?: string;
    phone?: string;
    whatsapp?: string;
    telegram?: string;
    email?: string;
  };
};

export type V2DeliveryReport = {
  status?: string;
  phase?: string;
  business_type?: string;
  template_id?: string;
  modules?: string[];
  fallback_used?: boolean;
  final_package?: string;
};

export type V2ValidationReport = {
  status?: string;
  checks_passed?: number;
  checks_total?: number;
};

export function resolveRepoPath(rel: string) {
  return path.join(process.cwd(), rel);
}

export function safeExists(rel: string) {
  try {
    return fs.existsSync(resolveRepoPath(rel));
  } catch {
    return false;
  }
}

export function safeReadJson<T extends Record<string, unknown>>(rel: string): T | null {
  if (!safeExists(rel)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(resolveRepoPath(rel), "utf8")) as T;
  } catch {
    return null;
  }
}

export function readV2Manifest(): V2Manifest | null {
  return safeReadJson<V2Manifest>(V2_MANIFEST_REL);
}

export function readV2DeliveryReport(): V2DeliveryReport | null {
  return safeReadJson<V2DeliveryReport>(V2_DELIVERY_REPORT_REL);
}

export function readV2ValidationReport(): V2ValidationReport | null {
  return safeReadJson<V2ValidationReport>(V2_VALIDATION_REL);
}

export function isV2PackageAvailable() {
  const fullPath = resolveRepoPath(V2_FINAL_PACKAGE_REL);
  try {
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile() && fs.statSync(fullPath).size > 0;
  } catch {
    return false;
  }
}

export function isV2PassFilePresent() {
  const fullPath = resolveRepoPath(V2_PASS_FILE_REL);
  try {
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile() && fs.statSync(fullPath).size > 0;
  } catch {
    return false;
  }
}

export function buildV2StatusPayload() {
  const manifest = readV2Manifest();
  const deliveryReport = readV2DeliveryReport();
  const validation = readV2ValidationReport();
  const packageReady = isV2PackageAvailable();
  const passFile = isV2PassFilePresent();

  const businessName =
    manifest?.client_contacts?.business_name ??
    deliveryReport?.business_type ??
    "MISSING";
  const businessType = manifest?.business_type ?? deliveryReport?.business_type ?? "MISSING";
  const templateId = manifest?.template_id ?? deliveryReport?.template_id ?? "MISSING";
  const modules = manifest?.modules ?? deliveryReport?.modules ?? [];

  const orchestratorPass = deliveryReport?.status === "PASS" && passFile;
  const overallStatus = orchestratorPass && packageReady ? "PASS" : manifest ? "FAIL" : "MISSING";

  return {
    status: overallStatus,
    llm_used: false as const,
    phase: manifest?.phase ?? deliveryReport?.phase ?? "CLIENT_DELIVERY_V2",
    business_name: String(businessName),
    business_type: String(businessType),
    template_id: String(templateId),
    modules: Array.isArray(modules) ? modules.map(String) : [],
    language: String(manifest?.language ?? "MISSING"),
    final_package: packageReady ? V2_FINAL_PACKAGE_REL : "MISSING",
    package_ready: packageReady,
    quality_gate: validation?.status ?? (passFile ? "PASS" : "MISSING"),
    validation_checks: validation
      ? `${validation.checks_passed ?? 0}/${validation.checks_total ?? 0}`
      : "MISSING",
    updated_at: manifest?.generated_at ?? new Date().toISOString(),
    fallback_used: deliveryReport?.fallback_used ?? false,
  };
}

export function buildV2RunSteps(success: boolean) {
  return V2_PIPELINE_STEPS.map((name) => ({
    name,
    status: success ? "PASS" : "FAIL",
  }));
}
