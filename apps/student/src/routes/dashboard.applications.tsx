import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Input } from "@verifly/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@verifly/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { applications, universities, applicationStatusLabels } from "@/lib/mock-data";
import { Search, Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/applications")({
  component: MyApplications,
});

function MyApplications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = applications.filter((a) => {
    if (search && !a.universityName.toLowerCase().includes(search.toLowerCase()) && !a.program.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage your university applications.</p>
        </div>
        <Link to="/dashboard/explore">
          <Button className="gap-2">Apply to More <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search applications…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(applicationStatusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} application{filtered.length !== 1 ? "s" : ""}</p>

      <div className="space-y-3">
        {filtered.map((app) => {
          const uni = universities.find((u) => u.id === app.universityId);
          const s = applicationStatusLabels[app.status];
          const vs = { not_started: { l: "Not Started", v: "muted" }, pending_submission: { l: "Pending", v: "warning" }, under_review: { l: "Under Review", v: "info" }, more_info_needed: { l: "More Info", v: "warning" }, pre_verified: { l: "Pre-Verified", v: "success" }, verified: { l: "Verified", v: "success" }, rejected: { l: "Rejected", v: "destructive" } }[app.verificationStatus] || { l: app.verificationStatus, v: "muted" };
          const ss = { not_applied: { l: "Not Applied", v: "muted" }, applied: { l: "Applied", v: "info" }, awarded: { l: "Awarded", v: "success" } }[app.scholarshipStatus] || { l: app.scholarshipStatus, v: "muted" };

          return (
            <Link key={app.id} to="/dashboard/applications/$applicationId" params={{ applicationId: app.id }}>
              <Card className="hover:shadow-md transition-all cursor-pointer border-border/60">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                        {uni?.logo || "🏛️"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{app.universityName}</p>
                        <p className="text-xs text-muted-foreground">{app.program}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={app.status} label={s.label} variant={s.color as any} />
                      <StatusBadge status={app.verificationStatus} label={vs.l} variant={vs.v as any} />
                      {app.scholarshipStatus !== "not_applied" && (
                        <StatusBadge status={app.scholarshipStatus} label={ss.l} variant={ss.v as any} />
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(app.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
