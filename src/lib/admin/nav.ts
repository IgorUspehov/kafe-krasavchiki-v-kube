import type { AdminCopy } from "@/lib/admin/i18n";

export const ADMIN_SECTION_HREFS = [
  "/admin",
  "/admin/content",
  "/admin/media",
  "/admin/services",
  "/admin/jobs",
  "/admin/contacts",
  "/admin/integrations",
] as const;

export type AdminSectionHref = (typeof ADMIN_SECTION_HREFS)[number];

export function adminNavItems(copy: AdminCopy): { href: AdminSectionHref; label: string }[] {
  return [
    { href: "/admin", label: copy.nav.overview },
    { href: "/admin/content", label: copy.nav.content },
    { href: "/admin/media", label: copy.nav.media },
    { href: "/admin/services", label: copy.nav.services },
    { href: "/admin/jobs", label: copy.nav.jobs },
    { href: "/admin/contacts", label: copy.nav.contacts },
    { href: "/admin/integrations", label: copy.nav.integrations },
  ];
}

export function adjacentAdminSections(pathname: string): {
  index: number;
  prev: AdminSectionHref | null;
  next: AdminSectionHref | null;
} {
  const index = ADMIN_SECTION_HREFS.findIndex((href) => href === pathname);
  if (index < 0) {
    return { index: -1, prev: null, next: null };
  }
  return {
    index,
    prev: index > 0 ? ADMIN_SECTION_HREFS[index - 1]! : null,
    next: index < ADMIN_SECTION_HREFS.length - 1 ? ADMIN_SECTION_HREFS[index + 1]! : null,
  };
}
