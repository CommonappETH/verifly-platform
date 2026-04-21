import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileStack,
  ShieldCheck,
  FileCheck2,
  BarChart3,
  Settings,
  ShieldAlert,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@verifly/ui";
import { cn } from "@verifly/utils";

const groups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Applications", url: "/admin/applications", icon: FileStack },
      { title: "Financial Verifications", url: "/admin/verifications", icon: ShieldCheck },
      { title: "Documents", url: "/admin/documents", icon: FileCheck2 },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", url: "/admin/reports", icon: BarChart3 },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
] as const;

export function AdminSidebar() {
  const { pathname } = useLocation();
  const isActive = (url: string) => (url === "/admin" ? pathname === "/admin" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/admin" className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-zinc-50">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Verifly Admin</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Control Center
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.url} className={cn(active && "font-medium")}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
