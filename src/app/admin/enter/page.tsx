"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { enterZipAdminSession } from "@/lib/admin/zip-client-session";

function EnterZipAdmin() {
  const search = useSearchParams();
  const clientId = search?.get("clientId")?.trim() || "";
  const email = search?.get("email")?.trim() || undefined;

  useEffect(() => {
    if (!clientId) {
      window.location.replace("/admin/login");
      return;
    }
    enterZipAdminSession(clientId, email);
  }, [clientId, email]);

  return (
    <main className="admin-login-wrap">
      <p className="admin-muted" style={{ textAlign: "center" }}>
        Admin…
      </p>
    </main>
  );
}

/**
 * Client-only ZIP admin entry — sets session cookie/localStorage and redirects to /admin.
 * Replaces /api/admin/bypass so Deployable ZIP never depends on that server route.
 */
export default function AdminEnterPage() {
  return (
    <Suspense
      fallback={
        <main className="admin-login-wrap">
          <p className="admin-muted" style={{ textAlign: "center" }}>
            Admin…
          </p>
        </main>
      }
    >
      <EnterZipAdmin />
    </Suspense>
  );
}
