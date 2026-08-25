import { LocalizedPageShell } from "@/components/localized-page-shell";
import { PackagingPage } from "@/pages/packaging-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="packaging">
      <PackagingPage />
    </LocalizedPageShell>
  );
}
