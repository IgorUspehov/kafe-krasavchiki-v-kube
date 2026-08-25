export function translateLabel(
  t: (key: string) => string,
  prefix: string,
  value: string | null | undefined
): string {
  if (!value || value === "—") return "—";

  const normalized = value.toLowerCase().replace(/\s+/g, "_");
  const key = `${prefix}.${normalized}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

export function translatePlanName(t: (key: string) => string, name: string): string {
  const planId = name.replace(/\s+Plan$/i, "").trim();
  const keys = [
    `dashboard.plans.${planId.toLowerCase()}`,
    `dashboard.plans.${planId.toUpperCase()}`,
    `dashboard.plans.${planId.replace(/\s+/g, "_").toLowerCase()}`,
  ];

  for (const key of keys) {
    const translated = t(key);
    if (translated !== key) return translated;
  }

  return name;
}

export function translateFactoryStatus(
  t: (key: string) => string,
  status: string | null | undefined
): string {
  if (!status || status === "—") return "—";

  const key = `status.${status.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

export function translateLicenseType(
  t: (key: string) => string,
  licenseType: string | null | undefined
): string {
  return translateLabel(t, "dashboard.licenseTypes", licenseType);
}

export function translateRuntimeModule(
  t: (key: string) => string,
  module: string
): string {
  return translateLabel(t, "dashboard.runtimeModules", module);
}
