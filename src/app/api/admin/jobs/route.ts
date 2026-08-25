import { NextResponse } from "next/server";

import { AdminUnauthorizedError, requireAdminSession, unauthorizedResponse } from "@/lib/admin/authorize";
import { markClientAdminEdited } from "@/lib/site-delivery/dist-protection";
import {
  createVacancy,
  deleteVacancy,
  listVacancies,
  updateVacancy,
} from "@/lib/vacancies/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = requireAdminSession(request);
    const items = await listVacancies(session.clientId);
    return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load jobs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = requireAdminSession(request);
    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      salary?: unknown;
      requirements?: unknown;
    };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
    }
    const item = await createVacancy(session.clientId, {
      title,
      description: typeof body.description === "string" ? body.description : "",
      salary: typeof body.salary === "string" ? body.salary : "",
      requirements: typeof body.requirements === "string" ? body.requirements : "",
    });
    markClientAdminEdited(session.clientId);
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create job" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireAdminSession(request);
    const body = (await request.json()) as {
      id?: unknown;
      title?: unknown;
      description?: unknown;
      salary?: unknown;
      requirements?: unknown;
    };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }
    const item = await updateVacancy(session.clientId, id, {
      title: typeof body.title === "string" ? body.title : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      salary: typeof body.salary === "string" ? body.salary : undefined,
      requirements: typeof body.requirements === "string" ? body.requirements : undefined,
    });
    if (!item) {
      return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
    }
    markClientAdminEdited(session.clientId);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update job" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = requireAdminSession(request);
    const url = new URL(request.url);
    let id = url.searchParams.get("id") || "";
    if (!id) {
      try {
        const body = (await request.json()) as { id?: unknown };
        id = typeof body.id === "string" ? body.id.trim() : "";
      } catch {
        id = "";
      }
    }
    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }
    await deleteVacancy(session.clientId, id);
    markClientAdminEdited(session.clientId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to delete job" },
      { status: 500 },
    );
  }
}
