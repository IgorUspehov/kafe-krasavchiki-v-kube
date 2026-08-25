import { redirect } from "next/navigation";

import { AdminI18nProvider } from "@/components/admin/admin-i18n";
import { readAdminSessionFromCookies } from "@/lib/admin/authorize";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readAdminSessionFromCookies();
  if (!session) {
    redirect("/admin/login");
  }
  return <AdminI18nProvider>{children}</AdminI18nProvider>;
}
