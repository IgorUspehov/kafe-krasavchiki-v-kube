import type {
  JobQueueConfig,
  JobQueueFactorySnapshot,
  QueueReport,
  WorkersConfig,
} from "@/lib/job-queue-factory/types";

export const JOB_QUEUE_FACTORY_BASE = "/artifacts/factory_output/runtime/job_queue";

export async function fetchJobQueueFactorySnapshot(): Promise<JobQueueFactorySnapshot> {
  const [queueRes, workersRes, reportRes] = await Promise.all([
    fetch(`${JOB_QUEUE_FACTORY_BASE}/job_queue.json`),
    fetch(`${JOB_QUEUE_FACTORY_BASE}/workers.json`),
    fetch(`${JOB_QUEUE_FACTORY_BASE}/queue_report.json`),
  ]);

  const jobQueue = queueRes.ok ? ((await queueRes.json()) as JobQueueConfig) : null;
  const workers = workersRes.ok ? ((await workersRes.json()) as WorkersConfig) : null;
  const report = reportRes.ok ? ((await reportRes.json()) as QueueReport) : null;

  return { jobQueue, workers, report };
}
