import { LocalizedPageShell } from "@/components/localized-page-shell";
import { DeploymentFactoryPage } from "@/views/deployment-factory-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="deployment">
      <DeploymentFactoryPage />
    </LocalizedPageShell>
  );
}
