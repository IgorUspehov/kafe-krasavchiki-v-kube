import type { MvpStructure, MvpStructureSnapshot } from "@/lib/mvp-structure-factory/types";

export const MVP_STRUCTURE_BASE = "/artifacts/mvp_structure";

export async function fetchMvpStructureSnapshot(): Promise<MvpStructureSnapshot> {
  const res = await fetch(`${MVP_STRUCTURE_BASE}/mvp_structure.json`);
  const structure = res.ok ? ((await res.json()) as MvpStructure) : null;
  return { structure };
}

export function getDeployTargets(structure: MvpStructure | null): string[] {
  if (!structure?.deploy) return [];
  return Object.entries(structure.deploy)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name.toUpperCase());
}
