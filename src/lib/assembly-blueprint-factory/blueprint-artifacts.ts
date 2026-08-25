import type {
  AssemblyBlueprint,
  AssemblyBlueprintSnapshot,
} from "@/lib/assembly-blueprint-factory/types";

export const ASSEMBLY_BLUEPRINT_BASE = "/artifacts/assembly";

export async function fetchAssemblyBlueprintSnapshot(): Promise<AssemblyBlueprintSnapshot> {
  const res = await fetch(`${ASSEMBLY_BLUEPRINT_BASE}/assembly_blueprint.json`);
  const blueprint = res.ok ? ((await res.json()) as AssemblyBlueprint) : null;
  return { blueprint };
}
