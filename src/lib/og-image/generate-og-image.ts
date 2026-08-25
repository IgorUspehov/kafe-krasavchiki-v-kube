import sharp from "sharp";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export const FALLBACK_ACCENT_COLOR = "#0E7C6B";

export type GenerateOgImageInput = {
  businessName: string;
  accentColor?: string | null;
  photoBuffer?: Buffer | null;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeAccentColor(color?: string | null): string {
  const raw = String(color ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
    return raw;
  }
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    const [, r, g, b] = raw.match(/^#(.)(.)(.)$/) ?? [];
    if (r && g && b) {
      return `#${r}${r}${g}${g}${b}${b}`;
    }
  }
  return FALLBACK_ACCENT_COLOR;
}

function splitBusinessName(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) {
    return ["MVP Factory"];
  }
  const words = trimmed.split(/\s+/);
  if (words.length <= 3) {
    return [trimmed];
  }
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function buildOverlaySvg(businessName: string, accentColor: string, hasPhoto: boolean): Buffer {
  const lines = splitBusinessName(businessName);
  const line1 = escapeXml(lines[0] ?? "MVP Factory");
  const line2 = lines[1] ? escapeXml(lines[1]) : "";
  const subtitleY = line2 ? 430 : 360;
  const taglineY = line2 ? 475 : 405;

  const cameraPlaceholder = hasPhoto
    ? ""
    : `
    <g transform="translate(900, 205)" opacity="0.35">
      <rect x="0" y="0" width="180" height="130" rx="16" fill="none" stroke="#ffffff" stroke-width="6"/>
      <circle cx="90" cy="65" r="28" fill="none" stroke="#ffffff" stroke-width="6"/>
      <circle cx="140" cy="35" r="10" fill="#ffffff"/>
    </g>`;

  const svg = `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0f172a" stop-opacity="0.82"/>
        <stop offset="55%" stop-color="#0f172a" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.2"/>
      </linearGradient>
    </defs>
    ${hasPhoto ? "" : `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>`}
    <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#shade)"/>
    ${cameraPlaceholder}
    <text x="72" y="290" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="#ffffff">${line1}</text>
    ${
      line2
        ? `<text x="72" y="360" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="#ffffff">${line2}</text>`
        : ""
    }
    <text x="72" y="${subtitleY}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="600" fill="${accentColor}">MVP Factory</text>
    <text x="72" y="${taglineY}" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#cbd5e1">Ваш персональный MVP</text>
  </svg>`;

  return Buffer.from(svg);
}

export async function generateOgImage(input: GenerateOgImageInput): Promise<Buffer> {
  const businessName = String(input.businessName ?? "MVP Factory").trim() || "MVP Factory";
  const accentColor = normalizeAccentColor(input.accentColor);
  const photoBuffer = input.photoBuffer ?? null;
  const hasPhoto = Boolean(photoBuffer && photoBuffer.length > 0);
  const overlay = buildOverlaySvg(businessName, accentColor, hasPhoto);

  if (hasPhoto && photoBuffer) {
    const background = await sharp(photoBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "centre" })
      .jpeg({ quality: 90 })
      .toBuffer();

    return sharp(background)
      .composite([{ input: overlay, top: 0, left: 0 }])
      .png()
      .toBuffer();
  }

  return sharp(overlay).png().toBuffer();
}
