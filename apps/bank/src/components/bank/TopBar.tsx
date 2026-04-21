import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@verifly/ui";
import { Input } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { findRequestByCode } from "@/lib/api";
import { toast } from "sonner";

export function TopBar() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = findRequestByCode(q);
    if (found) {
      navigate({ to: "/verification/$id", params: { id: found.id } as never });
      setQ("");
    } else {
      toast.error(`No request found for code "${q}"`);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <form onSubmit={submit} className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search verification code (e.g. VRF-202400)…"
          className="pl-9 h-9"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500" />
        </Button>
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
            OM
          </div>
          <div className="text-xs leading-tight">
            <div className="font-medium">Officer Mensah</div>
            <div className="text-muted-foreground">Verification Desk</div>
          </div>
        </div>
      </div>
    </header>
  );
}