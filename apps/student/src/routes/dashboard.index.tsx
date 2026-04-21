import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  FileText, Shield, GraduationCap, FolderOpen, ArrowRight,
  Clock, TrendingUp, CheckCircle2, AlertCircle,
} from "lucide-react";
import {
  studentProfile, applications, financialSummary, notifications,
  universities, verificationStatusLabels, documents,
} from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const profile = studentProfile;
  const unread = notifications.filter((n) => !n.read);
  const activeApps = applications.filter((a) => a.status !== "rejected" && a.status !== "draft");
  const docsMissing = documents.filter((d) => d.status === "missing" || d.status === "needs_replacement");
  const verStatus = verificationStatusLabels[financialSummary.verificationStatus];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {profile.firstName}!</h1>
          <p className="text-sm text-muted-foreground">Here's an overview of your application journey.</p>
        </div>
        <Link to="/dashboard/explore">
          <Button className="gap-2">
            Explore Universities <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Alert banner */}
      {unread.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">You have {unread.length} unread notifications</p>
            <p className="text-xs text-muted-foreground">{unread[0].message.slice(0, 80)}…</p>
          </div>
          <Link to="/dashboard/messages">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<FileText className="h-5 w-5 text-primary" />} label="Active Applications" value={activeApps.length.toString()} sub={`${applications.length} total`} />
        <StatCard icon={<Shield className="h-5 w-5 text-success" />} label="Verification" value={verStatus.label} sub="" badge={verStatus.color as any} />
        <StatCard icon={<GraduationCap className="h-5 w-5 text-info" />} label="Scholarships" value={`$${financialSummary.estimatedScholarships.toLocaleString()}`} sub="estimated" />
        <StatCard icon={<FolderOpen className="h-5 w-5 text-warning" />} label="Documents" value={`${docsMissing.length} missing`} sub={`${documents.length} total`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Verification status card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Financial Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <StatusBadge status={financialSummary.verificationStatus} label={verStatus.label} variant={verStatus.color as any} size="md" />
              <p className="text-sm text-muted-foreground">{verStatus.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Needed</p>
                <p className="text-lg font-semibold">${financialSummary.totalTuitionNeeded.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scholarships</p>
                <p className="text-lg font-semibold text-success">−${financialSummary.estimatedScholarships.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-lg font-semibold text-primary">${financialSummary.remainingAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link to="/dashboard/verification">
                <Button size="sm" className="gap-1">
                  <Shield className="h-3.5 w-3.5" /> View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/dashboard/explore" className="block">
              <QuickAction icon={<TrendingUp className="h-4 w-4" />} label="Browse Universities" />
            </Link>
            <Link to="/dashboard/documents" className="block">
              <QuickAction icon={<FolderOpen className="h-4 w-4" />} label="Upload Documents" />
            </Link>
            <Link to="/dashboard/scholarships" className="block">
              <QuickAction icon={<GraduationCap className="h-4 w-4" />} label="View Scholarships" />
            </Link>
            <Link to="/dashboard/profile" className="block">
              <QuickAction icon={<CheckCircle2 className="h-4 w-4" />} label="Complete Profile" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent applications */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
          <Link to="/dashboard/applications">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">View All <ArrowRight className="h-3 w-3" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {applications.slice(0, 4).map((app) => {
              const statusInfo = { draft: { l: "Draft", v: "muted" as const }, submitted: { l: "Submitted", v: "info" as const }, under_review: { l: "Under Review", v: "info" as const }, awaiting_verification: { l: "Awaiting Verification", v: "warning" as const }, conditionally_accepted: { l: "Conditionally Accepted", v: "success" as const }, accepted: { l: "Accepted", v: "success" as const }, rejected: { l: "Rejected", v: "destructive" as const } }[app.status];
              return (
                <Link key={app.id} to="/dashboard/applications/$applicationId" params={{ applicationId: app.id }} className="block">
                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-lg">
                        {universities.find((u) => u.id === app.universityId)?.logo || "🏛️"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{app.universityName}</p>
                        <p className="text-xs text-muted-foreground">{app.program}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={app.status} label={statusInfo?.l || app.status} variant={statusInfo?.v || "muted"} />
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {app.lastUpdated}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommended universities */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recommended Universities</CardTitle>
          <Link to="/dashboard/explore">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">Explore More <ArrowRight className="h-3 w-3" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {universities.slice(0, 3).map((u) => (
              <Link key={u.id} to="/dashboard/university/$universityId" params={{ universityId: u.id }}>
                <div className="rounded-lg border p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{u.logo}</span>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.country}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">From ${u.tuitionMin.toLocaleString()}/yr • {u.ranking}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, sub, badge }: { icon: React.ReactNode; label: string; value: string; sub: string; badge?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
    </div>
  );
}
