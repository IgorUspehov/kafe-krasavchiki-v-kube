"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { AdminLangSwitcher } from "@/components/admin/admin-lang-switcher";
import { useAdminI18n } from "@/components/admin/admin-i18n";
import { adminNavItems } from "@/lib/admin/nav";

export function AdminNav({ businessName }: { businessName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { copy } = useAdminI18n();
  const nav = adminNavItems(copy);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="admin-header">
      <div className="admin-header-top">
        <div className="admin-brand-block">
          <p className="admin-brand-eyebrow">⚡ {copy.brand}</p>
          <p className="admin-brand-name">{businessName || "Website"}</p>
        </div>
        <div className="admin-header-actions">
          <AdminLangSwitcher />
          <button type="button" className="admin-btn-outline" onClick={() => void logout()}>
            {copy.logout}
          </button>
        </div>
      </div>
      <nav className="admin-nav" aria-label="Admin">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${active ? "active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
