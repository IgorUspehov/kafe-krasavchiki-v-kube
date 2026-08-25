import { LocalizedPageShell } from "@/components/localized-page-shell";
import { PricingPage } from "@/pages/pricing-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="pricing">
      <PricingPage />
    </LocalizedPageShell>
  );
}
