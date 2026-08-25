import type { DeliveryChecklist } from "@/lib/client/types";

export interface ChecklistAvailability {
  readme: boolean;
  demo_video: boolean;
  screenshots: boolean;
  release_bundle: boolean;
  github_package: boolean;
  deploy_package: boolean;
}

export function generateDeliveryChecklist(
  availability: ChecklistAvailability
): DeliveryChecklist {
  const delivery_ready =
    availability.readme &&
    availability.demo_video &&
    availability.screenshots &&
    availability.release_bundle &&
    availability.github_package &&
    availability.deploy_package;

  return {
    readme: availability.readme,
    demo_video: availability.demo_video,
    screenshots: availability.screenshots,
    release_bundle: availability.release_bundle,
    github_package: availability.github_package,
    deploy_package: availability.deploy_package,
    delivery_ready,
  };
}
