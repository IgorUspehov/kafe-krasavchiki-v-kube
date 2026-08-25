import {
  FACTORY_ORCHESTRATOR_VERSION,
  type FactoryManifest,
  type ModuleAvailability,
} from "@/lib/orchestrator/types";

export function generateFactoryManifest(availability: ModuleAvailability): FactoryManifest {
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
    version: FACTORY_ORCHESTRATOR_VERSION,
    presentation: availability.presentation,
    package: availability.package,
    release: availability.release,
    github: availability.github,
    deploy: availability.deploy,
    client: availability.client,
    runtime: availability.runtime,
    app: availability.app,
    scaffold: availability.scaffold,
    assembly: availability.assembly,
    data: availability.data,
    backend: availability.backend,
    binding: availability.binding,
    execution: availability.execution,
    database: availability.database,
    validation: availability.validation,
    factory_ready,
  };
}
