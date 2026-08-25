import type { MvpPackage, MvpPackageSnapshot } from "@/lib/mvp-package-factory/types";

export const MVP_PACKAGE_BASE = "/artifacts/package";

export async function fetchMvpPackageSnapshot(): Promise<MvpPackageSnapshot> {
  const res = await fetch(`${MVP_PACKAGE_BASE}/mvp_package.json`);
  const pkg = res.ok ? ((await res.json()) as MvpPackage) : null;
  return { package: pkg };
}
