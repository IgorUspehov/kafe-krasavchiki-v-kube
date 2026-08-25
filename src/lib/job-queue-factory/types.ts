export type JobQueueConfig = {
  queue: {
    enabled: boolean;
    background_processing: boolean;
    retry_enabled: boolean;
    scheduler_enabled: boolean;
  };
  retry?: {
    enabled: boolean;
    max_retries: number;
    dead_letter_queue_ready: boolean;
  };
  scheduler?: {
    enabled: boolean;
    cron_ready: boolean;
  };
  job_types?: string[];
};

export type WorkersConfig = {
  workers: {
    enabled: boolean;
    worker_count: number;
    scaling: boolean;
    status_tracking: boolean;
  };
  worker_records?: Array<{ id: string; name: string; status: string }>;
};

export type QueueReport = {
  module: string;
  version: string;
  status: string;
  queue_enabled: boolean;
  workers_enabled: boolean;
  retry_enabled: boolean;
  scheduler_enabled: boolean;
  readiness_score: number;
};

export type JobQueueFactorySnapshot = {
  jobQueue: JobQueueConfig | null;
  workers: WorkersConfig | null;
  report: QueueReport | null;
};
