import { LocalizedPageShell } from "@/components/localized-page-shell";
import { SettingsPage } from "@/pages/settings-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="settings">
      <SettingsPage />
    </LocalizedPageShell>
  );
}
