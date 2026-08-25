import { LocalizedPageShell } from "@/components/localized-page-shell";
import { BuildsPage } from "@/pages/builds-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="builds">
      <BuildsPage />
    </LocalizedPageShell>
  );
}
