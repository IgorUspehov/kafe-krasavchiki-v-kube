import { FACTORY_MODULES, type ExecutionReport } from "@/lib/orchestrator/types";

export function generateExecutionReport(
  modulesExecuted: number = FACTORY_MODULES.length,
  generatedAt?: string
): ExecutionReport {
  return {
    generated_at: generatedAt ?? new Date().toISOString(),
    modules_executed: modulesExecuted,
    status: modulesExecuted >= FACTORY_MODULES.length ? "SUCCESS" : "PENDING",
    core_modified: false,
  };
}
