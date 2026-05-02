import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset, Toaster } from "@verifly/ui";

import { useAuth } from "@/auth/AuthProvider";
import { EXPECTED_ROLE } from "@/auth/role";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Bounce un-authed visitors to /login (catches the page-load case before
  // any API call fires; the api-client's 401 interceptor handles mid-session
  // expiry).
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== EXPECTED_ROLE) {
      void navigate({ to: "/login" });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user || user.role !== EXPECTED_ROLE) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <SidebarInset className="bg-muted/30">
          <TopBar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
