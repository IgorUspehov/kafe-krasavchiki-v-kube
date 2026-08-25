import { generateExecutionReport } from "@/lib/orchestrator/execution-generator";
import { generateFactoryManifest } from "@/lib/orchestrator/factory-manifest-generator";
import { generateFactoryReport } from "@/lib/orchestrator/factory-report-generator";
import { FACTORY_OUTPUT_PATHS } from "@/lib/orchestrator/output-assembler";
import {
  FACTORY_MODULES,
  FACTORY_OUTPUT_ROOT,
  type FactoryOutputBundle,
  type ModuleAvailability,
} from "@/lib/orchestrator/types";

export const ORCHESTRATOR_PATHS = FACTORY_OUTPUT_PATHS;

export const FACTORY_GENERATE_COMMAND = "npm run factory:generate";

export function generateFactoryOutputBundle(
  availability: ModuleAvailability,
  modulesExecuted: number = FACTORY_MODULES.length,
  generatedAt?: string
): FactoryOutputBundle {
  return {
    factoryManifest: generateFactoryManifest(availability),
    factoryReport: generateFactoryReport(availability),
    executionReport: generateExecutionReport(modulesExecuted, generatedAt),
  };
}

export { FACTORY_OUTPUT_ROOT, FACTORY_MODULES };
