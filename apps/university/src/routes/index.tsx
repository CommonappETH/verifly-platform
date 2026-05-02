import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard, EmptyState } from "@verifly/ui";
import { apiClient } from "@/lib/api-client";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from "@/lib/mappers";
import { formatDate } from "@/lib/format";
import { cn } from "@verifly/utils";
import type { ApplicationStatus } from "@/lib/mappers";
import {
  Users,
  FileSearch,
  ShieldCheck,
  BadgeCheck,
  GraduationCap,
  Hourglass,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Verifly University Portal" }] }),
  component: Dashboard,
});

const ACTIVE_STATUSES: ApplicationStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "awaiting_info",
  "awaiting_verification",
  "committee_review",
  "conditionally_admitted",
];

function Dashboard() {
  const dashboardQuery = useQuery({
    queryKey: ["portal", "university", "dashboard"],
    queryFn: () => apiClient.portal.universityDashboard().then((r) => r.data),
  });

  if (dashboardQuery.isError) {
    return (
      <AppShell>
        <div className="p-8 max-w-3xl mx-auto">
          <EmptyState
            title="Couldn't load dashboard"
            description={(dashboardQuery.error as Error).message}
          />
        </div>
      </AppShell>
    );
  }

  if (dashboardQuery.isPending) {
    return (
      <AppShell>
        <div className="p-8">
          <PageHeader title="Admissions Dashboard" description="Loading…" />
        </div>
      </AppShell>
    );
  }

  const d = dashboardQuery.data;
  const total = Object.values(d.applicationsByStatus).reduce((a, b) => a + b, 0);
  const inReview =
    (d.applicationsByStatus.under_review ?? 0) + (d.applicationsByStatus.committee_review ?? 0);
  const condAdmit = d.applicationsByStatus.conditionally_admitted ?? 0;
  const admitted = d.applicationsByStatus.admitted ?? 0;
  const active = ACTIVE_STATUSES.reduce((sum, s) => sum + (d.applicationsByStatus[s] ?? 0), 0);

  return (
    <AppShell>
      <div className="p-8 max-w-[1600px] mx-auto">
        <PageHeader
          title="Admissions Dashboard"
          description="Real-time view of your applicant pipeline and verification readiness."
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Applications" value={total} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Active Pipeline" value={active} icon={<FileSearch className="h-4 w-4" />} />
          <StatCard label="In Review" value={inReview} tone="info" icon={<FileSearch className="h-4 w-4" />} />
          <StatCard
            label="Verifications Pending"
            value={d.verificationsPendingReview}
            tone="warning"
            icon={<Hourglass className="h-4 w-4" />}
          />
          <StatCard
            label="Conditional Admits"
            value={condAdmit}
            tone="accent"
            icon={<BadgeCheck className="h-4 w-4" />}
          />
          <StatCard
            label="Fully Admitted"
            value={admitted}
            tone="success"
            icon={<GraduationCap className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Recent Submissions */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-lg">Recent Submissions</h3>
              <Link
                to="/applicants"
                className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {d.recentSubmissions.length === 0 ? (
              <EmptyState
                title="No recent submissions"
                description="Submitted applications will appear here as they arrive."
              />
            ) : (
              <div className="divide-y divide-border">
                {d.recentSubmissions.map((s) => (
                  <Link
                    key={s.id}
                    to="/applicants/$id"
                    params={{ id: s.id }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{s.program ?? "Untitled program"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Application {s.id}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-medium px-2 py-1 rounded-md",
                        APPLICATION_STATUS_TONE[s.status as ApplicationStatus],
                      )}
                    >
                      {APPLICATION_STATUS_LABEL[s.status as ApplicationStatus]}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {s.submittedAt
                        ? formatDate(new Date(s.submittedAt).toISOString())
                        : "—"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Status breakdown */}
          <div className="bg-card rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-display text-lg">By Status</h3>
            </div>
            <div className="p-5 space-y-2">
              {(Object.keys(d.applicationsByStatus) as ApplicationStatus[])
                .filter((s) => (d.applicationsByStatus[s] ?? 0) > 0)
                .sort(
                  (a, b) => (d.applicationsByStatus[b] ?? 0) - (d.applicationsByStatus[a] ?? 0),
                )
                .map((s) => (
                  <div key={s} className="flex items-center justify-between text-sm">
                    <span
                      className={cn(
                        "text-[11px] font-medium px-2 py-1 rounded-md",
                        APPLICATION_STATUS_TONE[s],
                      )}
                    >
                      {APPLICATION_STATUS_LABEL[s]}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {d.applicationsByStatus[s]}
                    </span>
                  </div>
                ))}
              {Object.values(d.applicationsByStatus).every((v) => v === 0) && (
                <p className="text-xs text-muted-foreground">No applications yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Verification call-out */}
        {d.verificationsPendingReview > 0 && (
          <div className="mt-8 rounded-xl border border-accent/40 bg-accent/15 p-5 flex items-start gap-4">
            <ShieldCheck className="h-5 w-5 text-accent-foreground mt-0.5" />
            <div>
              <div className="font-display text-lg">
                {d.verificationsPendingReview} verification
                {d.verificationsPendingReview === 1 ? "" : "s"} pending bank review
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Verifications attached to your applications are still in flight with the partner
                banks. Decision-ready applicants will surface in the Decisions page once the bank
                completes its review.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
