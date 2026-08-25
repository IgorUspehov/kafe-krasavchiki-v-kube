/**
 * Deployable ZIP client-side admin entry.
 * Sets a non-httpOnly cookie the server accepts only when IS_DEPLOYABLE_ZIP=true,
 * plus a localStorage flag for the buyer UI.
 *
 * Keep this file free of Node crypto — it is imported from client components.
 */

/** Must match `@/lib/admin/session` ADMIN_SESSION_COOKIE. */
export const ADMIN_SESSION_COOKIE = "site_admin_client";
/** Must match `@/lib/admin/session` ADMIN_SESSION_MAX_AGE_SEC. */
export const ADMIN_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;
/** Must match `@/lib/admin/session` ZIP_LOCAL_SESSION_MAC. */
export const ZIP_LOCAL_SESSION_MAC = "zip-local";

export const ADMIN_ZIP_AUTH_STORAGE_KEY = "site_admin_zip_auth";

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Build cookie value accepted by parseAdminSessionValue in ZIP runtime. */
export function buildZipLocalAdminSessionValue(clientId: string, email = "owner@local.zip"): string {
  const id = clientId.trim();
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000;
  const payload = toBase64Url(
    JSON.stringify({
      c: id,
      e: email.trim().toLowerCase() || "owner@local.zip",
      x: expiresAt,
    }),
  );
  return `${payload}.${ZIP_LOCAL_SESSION_MAC}`;
}

export function buildZipAdminEnterPath(clientId: string): string {
  const id = clientId.trim();
  if (!id) return "/admin";
  return `/admin/enter?clientId=${encodeURIComponent(id)}`;
}

/**
 * Write ZIP admin session cookie + localStorage, then navigate to /admin.
 * Does not call any server login/bypass endpoint.
 */
export function enterZipAdminSession(clientId: string, email?: string): void {
  if (typeof window === "undefined") return;
  const id = clientId.trim();
  if (!id) {
    window.location.assign("/admin/login");
    return;
  }

  const value = buildZipLocalAdminSessionValue(id, email);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${ADMIN_SESSION_MAX_AGE_SEC}; SameSite=Lax${secure}`;

  try {
    localStorage.setItem(
      ADMIN_ZIP_AUTH_STORAGE_KEY,
      JSON.stringify({
        auth: true,
        clientId: id,
        email: (email || "owner@local.zip").trim().toLowerCase(),
        at: Date.now(),
      }),
    );
  } catch {
    /* private mode / quota — cookie alone is enough */
  }

  window.location.assign("/admin");
}
