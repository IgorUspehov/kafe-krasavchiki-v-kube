import type { FactoryReport, ModuleAvailability } from "@/lib/orchestrator/types";

function moduleStatus(ready: boolean) {
  return ready ? "READY" : "PENDING";
}

export function generateFactoryReport(availability: ModuleAvailability): FactoryReport {
  const factory_ready =
    availability.presentation &&
    availability.package &&
    availability.release &&
    availability.github &&
    availability.deploy &&
    availability.client &&
    availability.runtime &&
    availability.app &&
    availability.scaffold &&
    availability.assembly &&
    availability.data &&
    availability.backend &&
    availability.binding &&
    availability.execution &&
    availability.database &&
    availability.validation;

  return {
    status: factory_ready ? "FACTORY_READY" : "PENDING",
    presentation: moduleStatus(availability.presentation),
    package: moduleStatus(availability.package),
    release: moduleStatus(availability.release),
    github: moduleStatus(availability.github),
    deploy: moduleStatus(availability.deploy),
    client: moduleStatus(availability.client),
    runtime: moduleStatus(availability.runtime),
    app: moduleStatus(availability.app),
    scaffold: moduleStatus(availability.scaffold),
    assembly: moduleStatus(availability.assembly),
    data: moduleStatus(availability.data),
    backend: moduleStatus(availability.backend),
    binding: moduleStatus(availability.binding),
    execution: moduleStatus(availability.execution),
    database: moduleStatus(availability.database),
    validation: moduleStatus(availability.validation),
  };
}
