import { readSiteContent, WORKING_HOUR_DAYS, type SiteContent } from "@/lib/admin/site-content";

const DAY_LABELS = {
  en: {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  },
  de: {
    monday: "Montag",
    tuesday: "Dienstag",
    wednesday: "Mittwoch",
    thursday: "Donnerstag",
    friday: "Freitag",
    saturday: "Samstag",
    sunday: "Sonntag",
  },
  ru: {
    monday: "Понедельник",
    tuesday: "Вторник",
    wednesday: "Среда",
    thursday: "Четверг",
    friday: "Пятница",
    saturday: "Суббота",
    sunday: "Воскресенье",
  },
} as const;

export function publicSiteContent(manifest: Record<string, unknown>): SiteContent {
  return readSiteContent(manifest);
}

export function formatWorkingHours(
  hours: SiteContent["workingHours"],
  lang: "en" | "de" | "ru",
): { day: string; value: string }[] {
  const labels = DAY_LABELS[lang] || DAY_LABELS.de;
  return WORKING_HOUR_DAYS.map((day) => ({
    day: labels[day],
    value: hours[day] || "",
  })).filter((item) => item.value);
}

export function socialEntries(links: SiteContent["socialLinks"]): { label: string; href: string }[] {
  const rows: { label: string; href: string }[] = [];
  const add = (label: string, href: string) => {
    if (href) rows.push({ label, href });
  };
  add("Instagram", links.instagram);
  add("Facebook", links.facebook);
  add("TikTok", links.tiktok);
  add("LinkedIn", links.linkedin);
  add("Website", links.website);
  add("Social", links.other);
  return rows;
}

export function whatsappHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}
