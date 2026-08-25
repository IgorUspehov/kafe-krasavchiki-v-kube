export const WORKING_HOUR_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type WorkingHourDay = (typeof WORKING_HOUR_DAYS)[number];

export type SocialLinks = {
  instagram: string;
  facebook: string;
  tiktok: string;
  website: string;
  linkedin: string;
  other: string;
};

export type WorkingHours = Record<WorkingHourDay, string>;

export type SiteContent = {
  businessName: string;
  description: string;
  subtitle: string;
  logo: string;
  heroPhoto: string;
  galleryPhotos: string[];
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  workingHours: WorkingHours;
  socialLinks: SocialLinks;
};

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: "09:00-18:00",
  tuesday: "09:00-18:00",
  wednesday: "09:00-18:00",
  thursday: "09:00-18:00",
  friday: "09:00-18:00",
  saturday: "10:00-15:00",
  sunday: "closed",
};

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagram: "",
  facebook: "",
  tiktok: "",
  website: "",
  linkedin: "",
  other: "",
};

const PATCH_KEYS = [
  "businessName",
  "description",
  "subtitle",
  "logo",
  "heroPhoto",
  "galleryPhotos",
  "phone",
  "whatsapp",
  "email",
  "address",
  "postalCode",
  "city",
  "workingHours",
  "socialLinks",
] as const;

export type SiteContentPatch = Partial<{
  businessName: string;
  description: string;
  subtitle: string;
  logo: string;
  heroPhoto: string;
  galleryPhotos: string[];
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  workingHours: Partial<WorkingHours>;
  socialLinks: Partial<SocialLinks>;
}>;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickSocialLinks(manifest: Record<string, unknown>): SocialLinks {
  const raw =
    (manifest.socialLinks && typeof manifest.socialLinks === "object"
      ? manifest.socialLinks
      : manifest.social_links && typeof manifest.social_links === "object"
        ? manifest.social_links
        : {}) as Record<string, unknown>;
  return {
    instagram: asString(raw.instagram),
    facebook: asString(raw.facebook),
    tiktok: asString(raw.tiktok),
    website: asString(raw.website),
    linkedin: asString(raw.linkedin),
    other: asString(raw.other),
  };
}

function pickWorkingHours(manifest: Record<string, unknown>): WorkingHours {
  const raw =
    manifest.workingHours && typeof manifest.workingHours === "object"
      ? (manifest.workingHours as Record<string, unknown>)
      : manifest.working_hours && typeof manifest.working_hours === "object"
        ? (manifest.working_hours as Record<string, unknown>)
        : {};
  const next = { ...DEFAULT_WORKING_HOURS };
  for (const day of WORKING_HOUR_DAYS) {
    const value = asString(raw[day]);
    if (value) next[day] = value;
  }
  return next;
}

export function extractOwnerEmail(manifest: Record<string, unknown> | null | undefined): string {
  if (!manifest) return "";
  const top = asString(manifest.email).toLowerCase();
  if (top) return top;
  const contacts =
    manifest.client_contacts && typeof manifest.client_contacts === "object"
      ? (manifest.client_contacts as Record<string, unknown>)
      : null;
  return asString(contacts?.email).toLowerCase();
}

export function readSiteContent(manifest: Record<string, unknown>): SiteContent {
  const gallery = Array.isArray(manifest.galleryPhotos)
    ? manifest.galleryPhotos.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : Array.isArray(manifest.gallery_photos)
      ? manifest.gallery_photos.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];

  return {
    businessName: asString(manifest.businessName || manifest.business_name),
    description: asString(manifest.description),
    subtitle: asString(manifest.subtitle),
    logo: asString(manifest.logo),
    heroPhoto: asString(manifest.heroPhoto || manifest.hero_photo),
    galleryPhotos: gallery,
    phone: asString(manifest.phone),
    whatsapp: asString(manifest.whatsapp),
    email: asString(manifest.email),
    address: asString(manifest.address),
    postalCode: asString(manifest.postalCode || manifest.postal_code),
    city: asString(manifest.city),
    workingHours: pickWorkingHours(manifest),
    socialLinks: pickSocialLinks(manifest),
  };
}

export function parseSiteContentPatch(input: unknown): { ok: true; patch: SiteContentPatch } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "JSON object required" };
  }
  const body = input as Record<string, unknown>;
  const patch: SiteContentPatch = {};

  for (const key of Object.keys(body)) {
    if (!(PATCH_KEYS as readonly string[]).includes(key)) {
      continue;
    }
    const value = body[key];
    if (key === "galleryPhotos") {
      if (!Array.isArray(value)) {
        return { ok: false, error: "galleryPhotos must be an array of strings" };
      }
      patch.galleryPhotos = value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12);
      continue;
    }
    if (key === "workingHours") {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { ok: false, error: "workingHours must be an object" };
      }
      const hours: Partial<WorkingHours> = {};
      for (const day of WORKING_HOUR_DAYS) {
        const raw = (value as Record<string, unknown>)[day];
        if (raw === undefined) continue;
        if (typeof raw !== "string") {
          return { ok: false, error: `workingHours.${day} must be a string` };
        }
        hours[day] = raw.trim();
      }
      patch.workingHours = hours;
      continue;
    }
    if (key === "socialLinks") {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { ok: false, error: "socialLinks must be an object" };
      }
      const links: Partial<SocialLinks> = {};
      for (const field of Object.keys(DEFAULT_SOCIAL_LINKS) as (keyof SocialLinks)[]) {
        const raw = (value as Record<string, unknown>)[field];
        if (raw === undefined) continue;
        if (typeof raw !== "string") {
          return { ok: false, error: `socialLinks.${field} must be a string` };
        }
        links[field] = raw.trim();
      }
      patch.socialLinks = links;
      continue;
    }
    if (typeof value !== "string") {
      return { ok: false, error: `${key} must be a string` };
    }
    (patch as Record<string, string>)[key] = value.trim();
  }

  return { ok: true, patch };
}

export function applySiteContentPatch(
  manifest: Record<string, unknown>,
  patch: SiteContentPatch,
): Record<string, unknown> {
  const current = readSiteContent(manifest);
  const nextContent: SiteContent = {
    ...current,
    ...("businessName" in patch ? { businessName: patch.businessName ?? current.businessName } : {}),
    ...("description" in patch ? { description: patch.description ?? "" } : {}),
    ...("subtitle" in patch ? { subtitle: patch.subtitle ?? "" } : {}),
    ...("logo" in patch ? { logo: patch.logo ?? "" } : {}),
    ...("heroPhoto" in patch ? { heroPhoto: patch.heroPhoto ?? "" } : {}),
    ...("galleryPhotos" in patch ? { galleryPhotos: patch.galleryPhotos ?? [] } : {}),
    ...("phone" in patch ? { phone: patch.phone ?? "" } : {}),
    ...("whatsapp" in patch ? { whatsapp: patch.whatsapp ?? "" } : {}),
    ...("email" in patch ? { email: patch.email ?? "" } : {}),
    ...("address" in patch ? { address: patch.address ?? "" } : {}),
    ...("postalCode" in patch ? { postalCode: patch.postalCode ?? "" } : {}),
    ...("city" in patch ? { city: patch.city ?? "" } : {}),
    workingHours: { ...current.workingHours, ...(patch.workingHours ?? {}) },
    socialLinks: { ...current.socialLinks, ...(patch.socialLinks ?? {}) },
  };

  if (patch.businessName !== undefined && !nextContent.businessName) {
    throw new Error("businessName cannot be empty");
  }

  const businessName = nextContent.businessName || current.businessName;

  return {
    ...manifest,
    businessName,
    business_name: businessName,
    description: nextContent.description,
    subtitle: nextContent.subtitle,
    logo: nextContent.logo,
    heroPhoto: nextContent.heroPhoto,
    hero_photo: nextContent.heroPhoto,
    galleryPhotos: nextContent.galleryPhotos,
    gallery_photos: nextContent.galleryPhotos,
    phone: nextContent.phone,
    whatsapp: nextContent.whatsapp,
    email: nextContent.email,
    address: nextContent.address,
    postalCode: nextContent.postalCode,
    postal_code: nextContent.postalCode,
    city: nextContent.city,
    workingHours: nextContent.workingHours,
    working_hours: nextContent.workingHours,
    socialLinks: nextContent.socialLinks,
    social_links: nextContent.socialLinks,
    adminEditedAt: new Date().toISOString(),
  };
}
