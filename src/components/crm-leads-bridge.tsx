"use client";

import { useEffect } from "react";

type CrmLeadsBridgeProps = {
  clientId: string;
  slug?: string;
  shortId?: string;
  iframeTitle: string;
};

/**
 * Railway parent → session-bound leads + catalog sync into CRM iframe.
 * Catalog mutations from CRM iframe arrive as CRM_CATALOG_PUSH (no baked secret).
 */
export function CrmLeadsBridge({ clientId, slug, shortId, iframeTitle }: CrmLeadsBridgeProps) {
  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;

    const iframe = () =>
      document.querySelector(`iframe[title="${CSS.escape(iframeTitle)}"]`) as
        | HTMLIFrameElement
        | null;

    const ensureSession = async () => {
      await fetch("/api/crm/leads/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, slug, shortId }),
      });
    };

    const pushLeads = async () => {
      try {
        await ensureSession();
        const res = await fetch("/api/crm/leads/session", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const frame = iframe();
        frame?.contentWindow?.postMessage(
          {
            type: "SITE_LEADS_SYNC",
            clientId,
            clients: data.clients || [],
            appointments: data.appointments || [],
            orders: data.orders || [],
            jobApplications: data.jobApplications || [],
          },
          "*",
        );
      } catch {
        /* ignore */
      }
    };

    const replyVacancy = (
      requestId: string,
      payload: { ok: boolean; item?: unknown },
    ) => {
      const frame = iframe();
      frame?.contentWindow?.postMessage(
        { type: "CRM_VACANCY_RESULT", requestId, ...payload },
        "*",
      );
    };

    const onMessage = (event: MessageEvent) => {
      const data = event?.data;
      if (!data || data.clientId !== clientId) return;

      if (data.type === "CRM_CATALOG_PUSH") {
        if (!Array.isArray(data.items)) return;
        void (async () => {
          try {
            await ensureSession();
            await fetch(`/api/crm/catalog/${encodeURIComponent(clientId)}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ items: data.items }),
            });
          } catch {
            /* ignore */
          }
        })();
        return;
      }

      if (data.type === "CRM_VACANCY_CREATE") {
        const requestId = String(data.requestId || "");
        void (async () => {
          try {
            await ensureSession();
            const res = await fetch(
              `/api/crm/vacancies/${encodeURIComponent(clientId)}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({
                  title: data.title,
                  description: data.description,
                  salary: data.salary,
                  requirements: data.requirements,
                }),
              },
            );
            const json = (await res.json().catch(() => ({}))) as {
              ok?: boolean;
              item?: unknown;
            };
            replyVacancy(requestId, {
              ok: res.ok && json.ok === true,
              item: json.item,
            });
          } catch {
            replyVacancy(requestId, { ok: false });
          }
        })();
        return;
      }

      if (data.type === "CRM_VACANCY_DELETE") {
        const requestId = String(data.requestId || "");
        void (async () => {
          try {
            await ensureSession();
            const res = await fetch(
              `/api/crm/vacancies/${encodeURIComponent(clientId)}`,
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ id: data.id }),
              },
            );
            replyVacancy(requestId, { ok: res.ok });
          } catch {
            replyVacancy(requestId, { ok: false });
          }
        })();
      }
    };

    window.addEventListener("message", onMessage);
    void pushLeads();
    const id = window.setInterval(() => {
      void pushLeads();
    }, 8000);
    return () => {
      cancelled = true;
      window.removeEventListener("message", onMessage);
      if (id) window.clearInterval(id);
    };
  }, [clientId, slug, shortId, iframeTitle]);

  return null;
}
