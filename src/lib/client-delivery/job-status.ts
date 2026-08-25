import fs from "fs";
import path from "path";

export const JOB_STATUS_PATH = path.join(
  process.cwd(),
  "artifacts/factory_output/job_status.json",
);

export type JobStatusValue = "RUNNING" | "PASS" | "FAIL" | "IDLE";

export type JobStatusRecord = {
  status: JobStatusValue;
  job_id: string;
  started_at: string;
  finished_at?: string;
  error?: string;
};

export function readJobStatus(): JobStatusRecord | null {
  if (!fs.existsSync(JOB_STATUS_PATH)) {
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(JOB_STATUS_PATH, "utf-8")) as JobStatusRecord;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

export function resolveJobStatusForApi(): JobStatusValue {
  const record = readJobStatus();
  if (!record?.status) {
    return "IDLE";
  }
  if (record.status === "RUNNING" || record.status === "PASS" || record.status === "FAIL") {
    return record.status;
  }
  return "IDLE";
}

export function writeJobStatus(record: JobStatusRecord): void {
  fs.mkdirSync(path.dirname(JOB_STATUS_PATH), { recursive: true });
  fs.writeFileSync(JOB_STATUS_PATH, JSON.stringify(record, null, 2));
}
