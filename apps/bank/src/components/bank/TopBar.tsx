import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger, Input, Button } from "@verifly/ui";
import { ApiError } from "@verifly/api-client";

import { useAuth } from "@/auth/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export function TopBar() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const lookup = useMutation({
    mutationFn: (code: string) =>
      apiClient.verifications.lookupByCode(code).then((r) => r.data),
    onSuccess: (v) => {
      navigate({ to: "/verification/$id", params: { id: v.id } });
      setQ("");
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 404) {
        toast.error(`No verification found for code "${q}"`);
      } else {
        toast.error(err.message);
      }
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) lookup.mutate(q.trim());
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <form onSubmit={submit} className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by verification code (e.g. VF-SEED1)…"
          className="pl-9 h-9"
          disabled={lookup.isPending}
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500" />
        </Button>
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
            {(user?.name ?? user?.email ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="text-xs leading-tight">
            <div className="font-medium truncate max-w-[160px]">
              {user?.name ?? user?.email ?? "—"}
            </div>
            <div className="text-muted-foreground">Verification Desk</div>
          </div>
        </div>
      </div>
    </header>
  );
}
