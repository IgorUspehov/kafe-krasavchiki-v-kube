import type {
  LicenseApiResponse,
  LicenseFactorySnapshot,
  LicenseReport,
} from "@/lib/license-factory/types";

export async function fetchLicenseFactorySnapshot(): Promise<LicenseFactorySnapshot> {
  const res = await fetch("/api/license");
  if (!res.ok) {
    return { license: null, report: null };
  }

  const apiLicense = (await res.json()) as LicenseApiResponse;
  const active = apiLicense.status === "ACTIVE";
  const license: LicenseApiResponse = {
    ...apiLicense,
    api_access: active && apiLicense.commercial_use,
    deployment: active && apiLicense.commercial_use,
    export_allowed: active && apiLicense.commercial_use,
  };
  const report: LicenseReport = {
    module: "LICENSE_FACTORY",
    version: "I4.0",
    status: active ? "LICENSE_READY" : "LICENSE_PENDING",
    commercial_readiness_score: active ? 100 : 0,
  };

  return { license, report };
}
