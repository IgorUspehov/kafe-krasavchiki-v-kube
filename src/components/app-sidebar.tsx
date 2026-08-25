"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Archive,
  Bell,
  Boxes,
  ClipboardList,
  ClipboardCheck,
  CreditCard,
  History,
  CloudUpload,
  Factory,
  FileText,
  Handshake,
  FlaskConical,
  Github,
  FolderKanban,
  GitBranch,
  Hammer,
  LayoutDashboard,
  ListChecks,
  Package,
  Presentation,
  Rocket,
  Settings,
  Shield,
  Store,
  Trash2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { LOCALE_BUNDLES } from "@/lib/i18n/bundles";
import { useTranslation } from "@/lib/i18n/context";
import { getNestedValue } from "@/lib/i18n/utils";

const NAV_ITEMS = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/projects", key: "projects", icon: FolderKanban },
  { href: "/pipeline", key: "pipeline", icon: GitBranch },
  { href: "/research", key: "research", icon: FlaskConical },
  { href: "/options", key: "options", icon: ListChecks },
  { href: "/builds", key: "builds", icon: Hammer },
  { href: "/artifacts", key: "artifacts", icon: Archive },
  { href: "/presentation", key: "presentation", icon: Presentation },
  { href: "/packaging", key: "packaging", icon: Package },
  { href: "/release", key: "release", icon: Rocket },
  { href: "/github", key: "github", icon: Github },
  { href: "/deploy", key: "deploy", icon: CloudUpload },
  { href: "/client", key: "client", icon: Handshake },
  { href: "/v9-showcase", key: "showcase", icon: Store },
  { href: "/client-questionnaire", key: "clientQuestionnaire", icon: ClipboardList },
  { href: "/client-delivery-status", key: "clientDeliveryStatus", icon: ClipboardCheck },
  { href: "/client-orders", key: "clientOrders", icon: History },
  { href: "/client-notifications", key: "clientNotifications", icon: Bell },
  { href: "/pricing", key: "pricing", icon: CreditCard },
  { href: "/terms", key: "terms", icon: FileText },
  { href: "/privacy", key: "privacy", icon: Shield },
  { href: "/refund", key: "refund", icon: FileText },
  { href: "/client-cleanup", key: "clientCleanup", icon: Trash2 },
  { href: "/factory", key: "factory", icon: Factory },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname() ?? "/";
  const { t, ready } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const label = (key: string) => {
    if (!mounted || !ready) {
      return getNestedValue(LOCALE_BUNDLES["ru"], key);
    }
    return t(key);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Factory className="size-5 text-primary" />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">{label("sidebar.title")}</span>
            <span className="text-xs text-muted-foreground">{label("sidebar.version")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{label("sidebar.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                const itemLabel = label(`nav.${item.key}`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={itemLabel}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{itemLabel}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Boxes className="size-4 text-muted-foreground" />
          <Badge variant="secondary" className="group-data-[collapsible=icon]:hidden">
            {label("sidebar.stack")}
          </Badge>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
