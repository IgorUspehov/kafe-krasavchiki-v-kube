"use client";

export function AdminSaveFeedback({
  saved,
  error,
  siteUrl,
  savedLabel,
  viewSiteLabel,
}: {
  saved: boolean;
  error?: string;
  siteUrl?: string | null;
  savedLabel: string;
  viewSiteLabel: string;
}) {
  if (!saved && !error) return null;

  return (
    <div className="admin-save-feedback" role="status">
      {error ? <p className="admin-save-error">{error}</p> : null}
      {saved ? (
        <>
          <p className="admin-save-ok">{savedLabel}</p>
          {siteUrl ? (
            <a
              className="admin-btn-primary admin-btn-inline"
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {viewSiteLabel}
            </a>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
