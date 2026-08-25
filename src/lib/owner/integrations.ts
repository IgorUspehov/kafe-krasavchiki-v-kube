/**
 * Owner Integrations catalog — clickable platform links (Factory DeliveryCenter style).
 */

export type OwnerIntegrationId =
  | "zip"
  | "github"
  | "railway"
  | "netlify"
  | "cloudflare"
  | "soundfire"
  | "firebase";

export type OwnerPlatformLink = {
  id: Exclude<OwnerIntegrationId, "zip">;
  /** Brand label — same in EN/DE/RU */
  label: string;
  icon: string;
  href: string;
};

/** Full-width platform rows (open site / login in new tab). */
export const OWNER_PLATFORM_LINKS: OwnerPlatformLink[] = [
  { id: "github", label: "GitHub", icon: "🐙", href: "https://github.com/login" },
  { id: "railway", label: "Railway", icon: "🚂", href: "https://railway.app/login" },
  { id: "netlify", label: "Netlify", icon: "🌐", href: "https://app.netlify.com/login" },
  { id: "cloudflare", label: "Cloudflare", icon: "☁️", href: "https://dash.cloudflare.com/" },
  { id: "soundfire", label: "SoundFire", icon: "⚡", href: "https://soundfire.com/" },
  { id: "firebase", label: "Firebase", icon: "🔥", href: "https://console.firebase.google.com/" },
];

/** @deprecated Kept for API shape compatibility with older clients. */
export type OwnerIntegrationStatus =
  | "ready"
  | "coming_soon"
  | "not_configured"
  | "platform";

/** @deprecated Prefer OWNER_PLATFORM_LINKS in UI. */
export type OwnerIntegrationInfo = {
  id: OwnerIntegrationId;
  status: OwnerIntegrationStatus;
  actionable: boolean;
  siteUrl?: string;
  note?: string;
};

export function resolveOwnerIntegrations(): OwnerIntegrationInfo[] {
  return [
    {
      id: "zip",
      status: "ready",
      actionable: true,
      note: "Deployable ZIP",
    },
    ...OWNER_PLATFORM_LINKS.map((p) => ({
      id: p.id as OwnerIntegrationId,
      status: "platform" as const,
      actionable: false,
      siteUrl: p.href,
    })),
  ];
}
