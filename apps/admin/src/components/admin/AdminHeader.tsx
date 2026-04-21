import { Search } from "lucide-react";
import { SidebarTrigger } from "@verifly/ui";
import { Input } from "@verifly/ui";
import { Avatar, AvatarFallback } from "@verifly/ui";
import { Separator } from "@verifly/ui";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="hidden md:block">
        <h1 className="text-sm font-semibold leading-none">Verifly Admin</h1>
        <p className="text-xs text-muted-foreground">Platform operations</p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users, applications, codes…"
            className="h-9 w-[320px] pl-8"
          />
        </div>
        <span className="hidden rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 md:inline">
          Production
        </span>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-zinc-900 text-zinc-50 text-xs">JR</AvatarFallback>
          </Avatar>
          <div className="hidden text-right leading-tight md:block">
            <p className="text-xs font-medium">Jordan Reyes</p>
            <p className="text-[10px] text-muted-foreground">Platform Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
