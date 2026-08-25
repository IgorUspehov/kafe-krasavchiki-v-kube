import fs from "fs";
import path from "path";
import zlib from "zlib";

/**
 * Build a traditional ZIP (local headers include CRC + sizes).
 * Archiver's streaming ZIPs set general-purpose bit 3 (data descriptors);
 * many LLM / upload parsers mis-read those as "corrupt".
 */

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;

/** UTF-8 language encoding bit; do NOT set data-descriptor bit 3. */
const FLAG_UTF8 = 0x0800;

export type ZipExtraFile = {
  name: string;
  content: string | Buffer;
};

function toPosix(rel: string): string {
  return rel.replace(/\\/g, "/").replace(/^\/+/, "");
}

function listFilesRecursive(rootDir: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, relBase: string): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, rel);
      } else if (entry.isFile()) {
        out.push(toPosix(rel));
      }
    }
  };
  walk(rootDir, "");
  return out.sort((a, b) => a.localeCompare(b));
}

function dosDateTime(date = new Date()): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const dosTime =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  return { time: dosTime & 0xffff, date: dosDate & 0xffff };
}

function compressEntry(raw: Buffer): { method: number; data: Buffer } {
  const deflated = zlib.deflateRawSync(raw, { level: 9 });
  if (deflated.length < raw.length) {
    return { method: 8, data: deflated };
  }
  return { method: 0, data: raw };
}

/**
 * Pack a directory into a ZIP buffer. Optional extras override same-named paths
 * (e.g. README.md, client-manifest.json).
 */
export function packDirectoryToTraditionalZipBuffer(
  rootDir: string,
  extras: ZipExtraFile[] = [],
): Buffer {
  const { time, date } = dosDateTime();
  const override = new Map<string, Buffer>();
  for (const extra of extras) {
    const name = toPosix(extra.name);
    if (!name || name.includes("..")) continue;
    override.set(
      name,
      Buffer.isBuffer(extra.content) ? extra.content : Buffer.from(extra.content, "utf8"),
    );
  }

  const fromDisk = fs.existsSync(rootDir) ? listFilesRecursive(rootDir) : [];
  const names = [...new Set([...fromDisk, ...override.keys()])].sort((a, b) =>
    a.localeCompare(b),
  );

  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;
  let fileCount = 0;

  for (const name of names) {
    const raw =
      override.get(name) ??
      (fs.existsSync(path.join(rootDir, name))
        ? fs.readFileSync(path.join(rootDir, name))
        : null);
    if (!raw) continue;

    const crc = zlib.crc32(raw) >>> 0;
    const { method, data: compressed } = compressEntry(raw);
    const nameBuf = Buffer.from(name, "utf8");

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(SIG_LOCAL, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(FLAG_UTF8, 6);
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(raw.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const localOffset = offset;
    localChunks.push(localHeader, nameBuf, compressed);
    offset += localHeader.length + nameBuf.length + compressed.length;

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(SIG_CENTRAL, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(FLAG_UTF8, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(raw.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);

    centralChunks.push(centralHeader, nameBuf);
    fileCount += 1;
  }

  if (fileCount > 0xffff) {
    throw new Error("ZIP entry count exceeds ZIP32 limit");
  }
  if (offset > 0xffffffff) {
    throw new Error("ZIP size exceeds ZIP32 limit");
  }

  const centralDirectory = Buffer.concat(centralChunks);
  const centralOffset = offset;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(SIG_EOCD, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(fileCount, 8);
  eocd.writeUInt16LE(fileCount, 10);
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, centralDirectory, eocd]);
}
