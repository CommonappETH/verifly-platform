import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@verifly/ui";
import { APPLICANTS } from "@/lib/mock-data";
import { STATUS_LABEL, STATUS_TONE, VERIF_TONE, VERIF_LABEL, TYPE_TONE, formatDate } from "@/lib/format";
import { cn } from "@verifly/utils";
import { Users, FileSearch, ShieldCheck, UserPlus, BadgeCheck, GraduationCap, Hourglass, AlertTriangle, Calendar, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Verifly University Portal" }] }),
  component: Dashboard,
});

function Dashboard() {
  const total = APPLICANTS.length;
  const inReview = APPLICANTS.filter(a => ["under_review", "committee_review"].includes(a.applicationStatus)).length;
  const preApproved = APPLICANTS.filter(a => a.applicantType === "pre_approved").length;
  const normal = total - preApproved;
  const condAdmit = APPLICANTS.filter(a => a.applicationStatus === "conditionally_admitted").length;
  const admitted = APPLICANTS.filter(a => a.applicationStatus === "admitted").length;
  const awaitingVerif = APPLICANTS.filter(a => a.verification.status !== "verified").length;

  const recent = [...APPLICANTS].sort((a, b) => +new Date(b.submissionDate) - +new Date(a.submissionDate)).slice(0, 6);
  const needsAttention = APPLICANTS.filter(a => a.applicationStatus === "awaiting_info" || (a.priority && a.decision.status === "none")).slice(0, 5);
  const priority = APPLICANTS.filter(a => a.priority).slice(0, 5);

  const byCountry = Object.entries(APPLICANTS.reduce<Record<string, number>>((acc, a) => {
    acc[a.country] = (acc[a.country] || 0) + 1; return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const byStatus = Object.entries(APPLICANTS.reduce<Record<string, number>>((acc, a) => {
    acc[a.applicationStatus] = (acc[a.applicationStatus] || 0) + 1; return acc;
  }, {}));

  const verifBreakdown = ["verified", "in_review", "pending", "not_started"] as const;
  const verifCounts = verifBreakdown.map(v => ({ v, n: APPLICANTS.filter(a => a.verification.status === v).length }));

  return (
    <AppShell>
      <div className="p-8 max-w-[1600px] mx-auto">
        <PageHeader
          title="Admissions Dashboard"
          description="Real-time view of your applicant pipeline, financial verification readiness, and decision workflows."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard label="Total Applicants" value={total} icon={<Users className="h-4 w-4" />} />
          <StatCard label="In Review" value={inReview} tone="info" icon={<FileSearch className="h-4 w-4" />} />
          <StatCard label="Pre-Approved" value={preApproved} tone="success" hint="Financially verified upfront" icon={<ShieldCheck className="h-4 w-4" />} />
          <StatCard label="Normal Applicants" value={normal} icon={<UserPlus className="h-4 w-4" />} />
          <StatCard label="Conditional Admits" value={condAdmit} tone="accent" icon={<BadgeCheck className="h-4 w-4" />} />
          <StatCard label="Fully Admitted" value={admitted} tone="success" icon={<GraduationCap className="h-4 w-4" />} />
          <StatCard label="Awaiting Verification" value={awaitingVerif} tone="warning" icon={<Hourglass className="h-4 w-4" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-lg">Recent Applications</h3>
              <Link to="/applicants" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <div className="divide-y divide-border">
              {recent.map(a => (
                <Link
                  key={a.id}
                  to="/applicants/$id"
                  params={{ id: a.id }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: a.avatarColor }}>
                    {a.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.countryFlag} {a.country} · {a.intendedDegree} {a.intendedMajor}</div>
                  </div>
                  <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md", TYPE_TONE[a.applicantType])}>
                    {a.applicantType === "pre_approved" ? "Pre-Approved" : "Normal"}
                  </span>
                  <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md", STATUS_TONE[a.applicationStatus])}>
                    {STATUS_LABEL[a.applicationStatus]}
                  </span>
                  <div className="text-xs text-muted-foreground w-20 text-right">{formatDate(a.submissionDate)}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-card rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="font-display text-lg">Needs Attention</h3>
            </div>
            <div className="divide-y divide-border">
              {needsAttention.map(a => (
                <div key={a.id} className="px-5 py-3">
                  <div className="font-medium text-sm">{a.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.applicationId}</div>
                  <div className="mt-1.5">
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md", STATUS_TONE[a.applicationStatus])}>
                      {STATUS_LABEL[a.applicationStatus]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Pre-Approved vs Normal */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-display text-lg">Pre-Approved vs Normal</h3>
            <div className="mt-5">
              <div className="flex items-end gap-2 mb-1.5">
                <div className="text-3xl font-display">{preApproved}</div>
                <div className="text-sm text-muted-foreground mb-1">pre-approved · {Math.round(preApproved / total * 100)}%</div>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                <div className="bg-success h-full" style={{ width: `${preApproved / total * 100}%` }} />
                <div className="bg-primary/40 h-full" style={{ width: `${normal / total * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>● Pre-Approved</span>
                <span>● Normal ({normal})</span>
              </div>
            </div>
          </div>

          {/* By Country */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-display text-lg">Applicants by Country</h3>
            <div className="mt-4 space-y-2.5">
              {byCountry.map(([c, n]) => {
                const country = APPLICANTS.find(a => a.country === c)!;
                return (
                  <div key={c} className="flex items-center gap-3">
                    <span className="text-base">{country.countryFlag}</span>
                    <span className="text-sm flex-1">{c}</span>
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${n / byCountry[0][1] * 100}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-6 text-right">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification breakdown */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-display text-lg">Verification Status</h3>
            <div className="mt-4 space-y-2.5">
              {verifCounts.map(({ v, n }) => (
                <div key={v} className="flex items-center gap-3">
                  <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md w-24", VERIF_TONE[v])}>{VERIF_LABEL[v]}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${n / total * 100}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-6 text-right">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Status distribution */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
            <h3 className="font-display text-lg">Applicants by Status</h3>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {byStatus.map(([s, n]) => (
                <div key={s} className="flex items-center justify-between p-2.5 rounded-md border border-border">
                  <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md", STATUS_TONE[s as keyof typeof STATUS_TONE])}>
                    {STATUS_LABEL[s as keyof typeof STATUS_LABEL]}
                  </span>
                  <span className="font-display text-lg">{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority queue */}
          <div className="bg-card rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-display text-lg">Priority Review Queue</h3>
            </div>
            <div className="divide-y divide-border">
              {priority.map(a => (
                <Link key={a.id} to="/applicants/$id" params={{ id: a.id }} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: a.avatarColor }}>
                    {a.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground">GPA {a.gpa.toFixed(2)} · {a.intendedMajor}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4"><Calendar className="h-4 w-4 text-primary" /><h3 className="font-display text-lg">Upcoming Deadlines</h3></div>
            <div className="space-y-3">
              {[
                { label: "Early Decision Notification", date: "Dec 15, 2024", days: 12 },
                { label: "Regular Decision Deadline", date: "Jan 5, 2025", days: 33 },
                { label: "Financial Verification Cutoff", date: "Feb 1, 2025", days: 60 },
                { label: "Committee Review Closes", date: "Mar 10, 2025", days: 97 },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between border-b border-border last:border-0 pb-2.5 last:pb-0">
                  <div>
                    <div className="text-sm font-medium">{d.label}</div>
                    <div className="text-xs text-muted-foreground">{d.date}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">in {d.days}d</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-display text-lg mb-4">Recent Decision Activity</h3>
            <div className="space-y-3">
              {APPLICANTS.filter(a => a.decision.status !== "none").slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center gap-3 border-b border-border last:border-0 pb-2.5 last:pb-0">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: a.avatarColor }}>
                    {a.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(a.decision.date)}</div>
                  </div>
                  <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md", STATUS_TONE[a.applicationStatus])}>
                    {STATUS_LABEL[a.applicationStatus]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
