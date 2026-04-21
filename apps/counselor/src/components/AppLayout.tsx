import { Outlet } from "@tanstack/react-router";
import { Search, Bell } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@verifly/ui";
import { AppSidebar } from "./AppSidebar";
import { Input } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Toaster } from "@verifly/ui";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-muted/30">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="hidden text-sm font-medium text-muted-foreground md:block">
              Lincoln High School
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students, requests…" className="h-9 w-72 pl-8" />
              </div>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                MC
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
