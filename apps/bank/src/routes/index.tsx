import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/bank/AppShell";
import { Card, CardContent, CardHeader, CardTitle, StatCard, StatusBadge, Button, EmptyState } from "@verifly/ui";
import { apiClient } from "@/lib/api-client";
import {
  VERIFICATION_STATUS_LABEL,
  VERIFICATION_STATUS_TONE,
  formatCurrency,
  formatDate,
  verificationStatusBadge,
  type VerificationStatus,
} from "@/lib/mappers";
import { FileSearch, Clock, CheckCircle2, XCircle, Eye, Hourglass } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Verifly Bank Portal" }] }),
  component: Dashboard,
});

function Dashboard() {
  const dashboardQuery = useQuery({
    queryKey: ["portal", "bank", "dashboard"],
    queryFn: () => apiClient.portal.bankDashboard().then((r) => r.data),
  });

  if (dashboardQuery.isError) {
    return (
      <AppShell>
        <EmptyState
          title="Couldn't load dashboard"
          description={(dashboardQuery.error as Error).message}
        />
      </AppShell>
    );
  }

  if (dashboardQuery.isPending) {
    return (
      <AppShell>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </AppShell>
    );
  }

  const d = dashboardQuery.data;
  const decided = d.recentDecisions;
  const recentApproved = decided.filter((r) => r.status === "verified").slice(0, 4);
  const recentRejected = decided.filter((r) => r.status === "rejected").slice(0, 4);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Bank verification operations overview.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Pending"
            value={d.counts.pending}
            icon={<Clock className="h-4 w-4 text-amber-600" />}
          />
          <StatCard
            label="Under Review"
            value={d.counts.underReview}
            icon={<Eye className="h-4 w-4 text-blue-600" />}
          />
          <StatCard
            label="Median Time-to-Decision"
            value={
              d.medianTimeToDecisionMs == null
                ? "—"
                : `${(d.medianTimeToDecisionMs / (1000 * 60 * 60)).toFixed(1)}h`
            }
            icon={<Hourglass className="h-4 w-4" />}
          />
          <StatCard
            label="Recent Decisions"
            value={d.recentDecisions.length}
            icon={<FileSearch className="h-4 w-4" />}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recently Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              {recentApproved.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approvals yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentApproved.map((r) => (
                    <Link
                      key={r.id}
                      to="/verification/$id"
                      params={{ id: r.id }}
                      className="flex items-center justify-between rounded-md border p-2.5 hover:bg-accent transition-colors"
                    >
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">{r.code}</div>
                        <StatusBadge {...verificationStatusBadge(r.status as VerificationStatus)} />
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{formatDate(r.decidedAt)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recently Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              {recentRejected.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rejections yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentRejected.map((r) => (
                    <Link
                      key={r.id}
                      to="/verification/$id"
                      params={{ id: r.id }}
                      className="flex items-center justify-between rounded-md border p-2.5 hover:bg-accent transition-colors"
                    >
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">{r.code}</div>
                        <StatusBadge {...verificationStatusBadge(r.status as VerificationStatus)} />
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{formatDate(r.decidedAt)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Recent Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            {d.recentDecisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No decisions yet — start by reviewing pending verification requests.
              </p>
            ) : (
              <div className="space-y-2">
                {d.recentDecisions.map((r) => (
                  <Link
                    key={r.id}
                    to="/verification/$id"
                    params={{ id: r.id }}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
                      <StatusBadge {...verificationStatusBadge(r.status as VerificationStatus)} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {VERIFICATION_STATUS_LABEL[r.status as VerificationStatus]}
                      {r.decidedAt && <> · {formatDate(r.decidedAt)}</>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link to="/requests">View all requests</Link>
          </Button>
        </div>
        {/* Suppress unused warning for the tone record — it's referenced via verificationStatusBadge */}
        <span className="hidden">{Object.keys(VERIFICATION_STATUS_TONE).length}</span>
      </div>
    </AppShell>
  );
}
