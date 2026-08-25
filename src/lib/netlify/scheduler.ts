/**
 * @deprecated Use @/lib/cloudflare/scheduler. Kept as a re-export so leftover
 * imports cannot call Netlify delete APIs.
 */
export {
  cancelDeletion,
  findPendingByClientId,
  findPendingBySiteId,
  findPendingBySiteUrl,
  processExpiredDeletions,
  scheduleDeletion,
  startDeletionScheduler,
  type PendingDeletion,
} from "@/lib/cloudflare/scheduler";
