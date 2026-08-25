import type { Archiver } from "archiver";
import { createRequire } from "node:module";
import { PassThrough } from "node:stream";
import { NextResponse } from "next/server";

import { AdminUnauthorizedError, requireAdminSession, unauthorizedResponse } from "@/lib/admin/authorize";
import { requireClientManifest } from "@/lib/admin/persist";
import { readSiteContent } from "@/lib/admin/site-content";
import { resolveDemoAccess } from "@/lib/cloudflare/demo-access";
import { findDemoByClientId } from "@/lib/cloudflare/demo-registry";

export const runtime = "nodejs";

const PUBLIC_ORIGIN = "https://webstudio-muenchen.com";

const require = createRequire(import.meta.url);
const createArchiver = require("archiver") as (
  format: string,
  options?: { zlib?: { level?: number } },
) => Archiver;

function buildReadme(input: {
  businessName: string;
  slug: string;
  clientId: string;
}): string {
  const { businessName, slug, clientId } = input;
  return `# ${businessName}
## Ваш сайт готов!
🌐 Публичный сайт:
${PUBLIC_ORIGIN}/site/${slug}
📋 CRM / Бронирование:
${PUBLIC_ORIGIN}/demo/${slug}?clientId=${clientId}
💼 Вакансии:
${PUBLIC_ORIGIN}/site/${slug}/job
📅 Онлайн-запись:
${PUBLIC_ORIGIN}/site/${slug}/booking
## Управление сайтом
Войти в панель управления:
${PUBLIC_ORIGIN}/admin/login
Используйте email с которым создавали сайт.
Ссылка для входа придёт на email.
## Поддержка
Web Studio IHOR KRIAZHEV München
${PUBLIC_ORIGIN}
`;
}

async function zipBufferFromReadme(readme: string): Promise<Buffer> {
  const archive = createArchiver("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  archive.on("error", (error) => {
    stream.destroy(error);
  });
  archive.pipe(stream);
  archive.append(readme, { name: "README.md" });
  void archive.finalize();

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function GET(request: Request) {
  try {
    const session = requireAdminSession(request);
    const clientId = session.clientId;
    const manifest = await requireClientManifest(clientId);
    const content = readSiteContent(manifest);
    const demo = findDemoByClientId(clientId);
    const access = resolveDemoAccess(clientId);
    const slug = demo?.slug || access.slug;

    if (!slug) {
      return NextResponse.json({ ok: false, error: "Slug not found" }, { status: 404 });
    }

    const businessName = content.businessName?.trim() || "Website";
    const readme = buildReadme({ businessName, slug, clientId });
    const zip = await zipBufferFromReadme(readme);
    const filename = `${slug}.zip`;

    return new NextResponse(new Uint8Array(zip), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to build ZIP" },
      { status: 500 },
    );
  }
}
