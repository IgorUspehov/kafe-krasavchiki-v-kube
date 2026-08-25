import type { HandoverReport } from "@/lib/client/types";

export function generateHandoverReport(generatedAt?: string): HandoverReport {
  return {
    status: "READY_FOR_HANDOVER",
    generated_at: generatedAt ?? new Date().toISOString(),
    core_modified: false,
  };
}
