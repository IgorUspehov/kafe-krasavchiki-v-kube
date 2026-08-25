const APPROVAL_PREFIX = "client-preview-approved:";

export function getApprovalStorageKey(previewId: string): string {
  return `${APPROVAL_PREFIX}${previewId}`;
}

export function markPreviewApproved(previewId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(getApprovalStorageKey(previewId), new Date().toISOString());
}

export function isPreviewApproved(previewId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean(sessionStorage.getItem(getApprovalStorageKey(previewId)));
}
