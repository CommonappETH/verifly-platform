import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { notifications } from "@/lib/mock-data";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@verifly/ui";

export const Route = createFileRoute("/dashboard/messages")({
  component: MessagesPage,
});

const categoryLabels: Record<string, string> = {
  application_update: "Application Update",
  verification_request: "Verification Request",
  missing_document: "Missing Document",
  scholarship_update: "Scholarship Update",
  general: "General",
};

const categoryColors: Record<string, "info" | "warning" | "destructive" | "success" | "muted"> = {
  application_update: "info",
  verification_request: "warning",
  missing_document: "destructive",
  scholarship_update: "success",
  general: "muted",
};

function MessagesPage() {
  const [filter, setFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");

  const filtered = notifications.filter((n) => {
    if (filter !== "all" && n.category !== filter) return false;
    if (readFilter === "unread" && n.read) return false;
    if (readFilter === "read" && !n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages & Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1"><CheckCheck className="h-4 w-4" /> Mark All Read</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((n) => (
          <Card key={n.id} className={`border-border/60 transition-all ${!n.read ? "bg-primary/[0.02] border-primary/20" : ""}`}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">From {n.source}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={n.category} label={categoryLabels[n.category] || n.category} variant={categoryColors[n.category] || "muted"} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(n.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{n.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
