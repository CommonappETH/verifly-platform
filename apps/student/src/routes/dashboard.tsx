import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Search, FileText, Shield, FolderOpen, GraduationCap,
  Bell, User, Settings, LogOut, PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { notifications } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, exact: true },
  { title: "Explore Universities", url: "/dashboard/explore", icon: Search },
  { title: "My Applications", url: "/dashboard/applications", icon: FileText },
  { title: "Financial Verification", url: "/dashboard/verification", icon: Shield },
  { title: "Documents", url: "/dashboard/documents", icon: FolderOpen },
  { title: "Essays", url: "/dashboard/essays", icon: PenLine },
  { title: "Scholarships", url: "/dashboard/scholarships", icon: GraduationCap },
  { title: "Messages", url: "/dashboard/messages", icon: Bell },
  { title: "Profile", url: "/dashboard/profile", icon: User },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

function DashboardLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.removeItem("verifly:session");
      }
    } catch {}
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  };

  const isActive = (url: string, exact?: boolean) => {
    if (exact) return location.pathname === url;
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/" className="flex items-center gap-2 px-1 py-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">V</span>
          </div>
          {!collapsed && <span className="text-lg font-bold tracking-tight">Verifly</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                    <Link to={item.url as any}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log Out" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardHeader() {
  const unreadCount = notifications.filter((n) => !n.read).length;
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 sm:px-6">
      <SidebarTrigger />
      <div className="flex-1" />
      <Link to="/dashboard/messages">
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </Link>
      <Link to="/dashboard/profile">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          AT
        </div>
      </Link>
    </header>
  );
}
