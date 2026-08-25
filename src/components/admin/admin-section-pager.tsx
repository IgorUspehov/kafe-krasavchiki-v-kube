"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAdminI18n } from "@/components/admin/admin-i18n";
import { adjacentAdminSections, adminNavItems } from "@/lib/admin/nav";

export function AdminSectionPager() {
  const pathname = usePathname() || "/admin";
  const { copy } = useAdminI18n();
  const { prev, next } = adjacentAdminSections(pathname);
  const items = adminNavItems(copy);

  if (!prev && !next) return null;

  const prevLabel = prev ? items.find((item) => item.href === prev)?.label : null;
  const nextLabel = next ? items.find((item) => item.href === next)?.label : null;

  return (
    <nav className="admin-section-pager" aria-label="Section navigation">
      {prev ? (
        <Link href={prev} className="admin-btn-outline admin-section-pager-link">
          <span aria-hidden>←</span>
          <span>
            <span className="admin-section-pager-hint">{copy.prevSection}</span>
            {prevLabel ? <span className="admin-section-pager-name">{prevLabel}</span> : null}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next} className="admin-btn-outline admin-section-pager-link admin-section-pager-next">
          <span>
            <span className="admin-section-pager-hint">{copy.nextSection}</span>
            {nextLabel ? <span className="admin-section-pager-name">{nextLabel}</span> : null}
          </span>
          <span aria-hidden>→</span>
        </Link>
      ) : null}
    </nav>
  );
}
