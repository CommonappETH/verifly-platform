import { SidebarProvider, SidebarInset } from "@verifly/ui";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { Toaster } from "@verifly/ui";

export function AppShell({ children }: { children: React.ReactNode }) {
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