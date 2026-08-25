import type { PricingConfig, PricingFactorySnapshot, PricingReport } from "@/lib/pricing-factory/types";

export const PRICING_FACTORY_BASE = "/artifacts/factory_output/pricing";

export async function fetchPricingFactorySnapshot(): Promise<PricingFactorySnapshot> {
  const [pricingRes, reportRes] = await Promise.all([
    fetch(`${PRICING_FACTORY_BASE}/pricing.json`),
    fetch(`${PRICING_FACTORY_BASE}/pricing_report.json`),
  ]);

  const pricing = pricingRes.ok ? ((await pricingRes.json()) as PricingConfig) : null;
  const report = reportRes.ok ? ((await reportRes.json()) as PricingReport) : null;

  return { pricing, report };
}
