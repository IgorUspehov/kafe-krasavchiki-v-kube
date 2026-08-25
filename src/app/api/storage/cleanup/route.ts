import { NextResponse } from "next/server";

import {
  findLargestFiles,
  getDiskSpaceStats,
  getFolderSizes,
  runStorageCleanup,
} from "@/lib/manifest/storage-manager";
import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.STORAGE_CLEANUP_SECRET?.trim();
  if (!secret) {
    return true;
  }

  const header = request.headers.get("x-storage-cleanup-secret");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  return header === secret || querySecret === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const disk = getDiskSpaceStats();

  return NextResponse.json({
    ok: true,
    dataRoot: resolvePersistentDataDir(),
    folderSizes: getFolderSizes(),
    largestFiles: findLargestFiles(20),
    freeSpaceMb: Number((disk.freeBytes / (1024 * 1024)).toFixed(2)),
    totalSpaceMb: Number((disk.totalBytes / (1024 * 1024)).toFixed(2)),
    usedPercent: disk.usedPercent,
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const aggressive = url.searchParams.get("aggressive") === "1";
  const result = runStorageCleanup({ aggressive });

  const freedMb = Number((result.freeSpaceAfterMb - result.freeSpaceBeforeMb).toFixed(2));

  return NextResponse.json({
    ok: true,
    freedMb,
    ...result,
  });
}
