import { LocalizedPageShell } from "@/components/localized-page-shell";
import { RefundPage } from "@/pages/refund-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="refund">
      <RefundPage />
    </LocalizedPageShell>
  );
}
