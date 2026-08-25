import { LocalizedPageShell } from "@/components/localized-page-shell";
import { ProjectsPage } from "@/pages/projects-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="projects">
      <ProjectsPage />
    </LocalizedPageShell>
  );
}
