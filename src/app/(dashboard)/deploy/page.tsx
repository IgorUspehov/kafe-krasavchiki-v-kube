import { LocalizedPageShell } from "@/components/localized-page-shell";
import { DeployPage } from "@/pages/deploy-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="deploy">
      <DeployPage />
    </LocalizedPageShell>
  );
}
