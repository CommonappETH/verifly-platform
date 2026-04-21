import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, FileText, GavelIcon, Award, MessageSquare,
  BarChart3, Settings, Search, Bell,
} from "lucide-react";
import { cn } from "@verifly/utils";
import { Input } from "@verifly/ui";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/applicants", label: "Applicants", icon: Users },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/decisions", label: "Decisions", icon: GavelIcon },
  { to: "/scholarships", label: "Scholarships / Aid", icon: Award },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 py-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-display font-bold text-lg">
              V
            </div>
            <div>
              <div className="font-display text-lg leading-tight font-bold">Verifly</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">University Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV.map((item) => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm">
              EP
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">Dr. Eleanor Pierce</div>
              <div className="text-xs text-muted-foreground truncate">Director of Admissions</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
          <div className="h-full px-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search applicants, application IDs, or emails…" className="pl-9 bg-background" />
            </div>
            <div className="flex items-center gap-2">
              <button className="h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
              </button>
              <div className="h-9 px-3 rounded-md bg-primary-soft text-primary text-sm font-medium flex items-center">
                Fall 2025 Cycle
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
