import type {
  CommercialApiResponse,
  CommercialFactorySnapshot,
  CommercialReport,
} from "@/lib/commercial-factory/types";

export async function fetchCommercialFactorySnapshot(): Promise<CommercialFactorySnapshot> {
  const res = await fetch("/api/commercial");
  if (!res.ok) {
    return { commercial: null, report: null };
  }

  const commercial = (await res.json()) as CommercialApiResponse;
  const report: CommercialReport = {
    module: "SAAS_COMMERCIAL_FACTORY",
    version: "I7.0",
    ...commercial,
  };

  return { commercial, report };
}
