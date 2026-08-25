import type { ClientResultPayload } from "@/lib/client-preview/types";

export function isResultApiReady(payload: ClientResultPayload): boolean {
  return (
    payload.ok &&
    payload.artifacts_in_sync !== false &&
    payload.delivery_options.some((option) => option.available)
  );
}
