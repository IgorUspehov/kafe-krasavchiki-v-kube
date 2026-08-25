import type {
  ExecutionArtifactsSnapshot,
  ExecutionModuleManifest,
  ExecutionModuleReport,
} from "@/lib/execution-factory/types";

export const EXECUTION_ARTIFACT_BASE = "/artifacts/factory_output/execution";
export const EXECUTION_MODULE_BASE = "/artifacts/execution";

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  return res.ok ? ((await res.json()) as T) : null;
}

async function fetchText(url: string): Promise<string | null> {
  const res = await fetch(url);
  return res.ok ? res.text() : null;
}

export async function fetchExecutionArtifactsSnapshot(): Promise<ExecutionArtifactsSnapshot> {
  const base = EXECUTION_ARTIFACT_BASE;
  const [
    executionManifest,
    executionReport,
    runReport,
    healthReport,
    startupSequence,
    shutdownSequence,
    executionMatrix,
    installManifest,
    environment,
    ports,
    startScript,
    stopScript,
    statusScript,
    healthcheckScript,
  ] = await Promise.all([
    fetchJson<ExecutionModuleManifest>(`${base}/execution_manifest.json`),
    fetchJson<ExecutionModuleReport>(`${base}/execution_report.json`),
    fetchJson<Record<string, unknown>>(`${base}/run_report.json`),
    fetchJson<Record<string, unknown>>(`${base}/health_report.json`),
    fetchJson<Record<string, unknown>>(`${base}/startup_sequence.json`),
    fetchJson<Record<string, unknown>>(`${base}/shutdown_sequence.json`),
    fetchJson<Record<string, unknown>>(`${base}/execution_matrix.json`),
    fetchJson<Record<string, unknown>>(`${base}/install_manifest.json`),
    fetchJson<Record<string, unknown>>(`${base}/environment.json`),
    fetchJson<Record<string, unknown>>(`${base}/ports.json`),
    fetchText(`${base}/run/start.sh`),
    fetchText(`${base}/run/stop.sh`),
    fetchText(`${base}/run/status.sh`),
    fetchText(`${base}/run/healthcheck.sh`),
  ]);

  if (executionManifest && executionReport) {
    return {
      executionManifest,
      executionReport,
      runReport,
      healthReport,
      startupSequence,
      shutdownSequence,
      executionMatrix,
      installManifest,
      environment,
      ports,
      runScripts: { start: startScript, stop: stopScript, status: statusScript, healthcheck: healthcheckScript },
    };
  }

  const mod = EXECUTION_MODULE_BASE;
  const [m, r, rr, hr, ss, sd, em, im, env, pt, st, sp, sts, hc] = await Promise.all([
    fetchJson<ExecutionModuleManifest>(`${mod}/execution_manifest.json`),
    fetchJson<ExecutionModuleReport>(`${mod}/execution_report.json`),
    fetchJson<Record<string, unknown>>(`${mod}/run_report.json`),
    fetchJson<Record<string, unknown>>(`${mod}/health_report.json`),
    fetchJson<Record<string, unknown>>(`${mod}/startup_sequence.json`),
    fetchJson<Record<string, unknown>>(`${mod}/shutdown_sequence.json`),
    fetchJson<Record<string, unknown>>(`${mod}/execution_matrix.json`),
    fetchJson<Record<string, unknown>>(`${mod}/install_manifest.json`),
    fetchJson<Record<string, unknown>>(`${mod}/environment.json`),
    fetchJson<Record<string, unknown>>(`${mod}/ports.json`),
    fetchText(`${mod}/run/start.sh`),
    fetchText(`${mod}/run/stop.sh`),
    fetchText(`${mod}/run/status.sh`),
    fetchText(`${mod}/run/healthcheck.sh`),
  ]);

  return {
    executionManifest: m,
    executionReport: r,
    runReport: rr,
    healthReport: hr,
    startupSequence: ss,
    shutdownSequence: sd,
    executionMatrix: em,
    installManifest: im,
    environment: env,
    ports: pt,
    runScripts: { start: st, stop: sp, status: sts, healthcheck: hc },
  };
}
