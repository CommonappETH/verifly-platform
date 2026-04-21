import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/bank/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { StatusBadge } from "@/components/bank/StatusBadge";
import { useRequests } from "@/lib/use-requests";
import { formatCurrency, formatDate, maskAccount } from "@/lib/api";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { FileSearch, Clock, CheckCircle2, XCircle, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@verifly/ui";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const STATUS_COLORS = {
  pending: "oklch(0.78 0.15 80)",
  under_review: "oklch(0.6 0.15 240)",
  approved: "oklch(0.62 0.16 150)",
  rejected: "oklch(0.6 0.2 25)",
};

function Dashboard() {
  const requests = useRequests();
  const total = requests.length;
  const pending = requests.filter((r) => r.status === "pending").length;
  const review = requests.filter((r) => r.status === "under_review").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;
  const approvalRate = approved + rejected > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0;

  const recent = [...requests].sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt)).slice(0, 5);
  const needsAttention = requests.filter((r) => r.status === "pending" || r.documents.some((d) => d.status === "missing")).slice(0, 5);
  const recentApproved = requests.filter((r) => r.status === "approved").sort((a, b) => +new Date(b.decisionAt!) - +new Date(a.decisionAt!)).slice(0, 4);
  const recentRejected = requests.filter((r) => r.status === "rejected").sort((a, b) => +new Date(b.decisionAt!) - +new Date(a.decisionAt!)).slice(0, 4);

  const statusData = [
    { name: "Pending", value: pending, color: STATUS_COLORS.pending },
    { name: "Under Review", value: review, color: STATUS_COLORS.under_review },
    { name: "Approved", value: approved, color: STATUS_COLORS.approved },
    { name: "Rejected", value: rejected, color: STATUS_COLORS.rejected },
  ];

  const byCountry = Object.entries(
    requests.reduce<Record<string, number>>((acc, r) => {
      acc[r.student.country] = (acc[r.student.country] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Bank verification operations overview.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard label="Total Requests" value={total} icon={<FileSearch className="h-4 w-4" />} />
          <KpiCard label="Pending" value={pending} icon={<Clock className="h-4 w-4 text-amber-600" />} />
          <KpiCard label="Under Review" value={review} icon={<Eye className="h-4 w-4 text-blue-600" />} />
          <KpiCard label="Approved" value={approved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
          <KpiCard label="Rejected" value={rejected} icon={<XCircle className="h-4 w-4 text-rose-600" />} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Requests</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/requests">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recent.map((r) => (
                  <Link
                    key={r.id}
                    to="/verification/$id"
                    params={{ id: r.id } as never}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="text-sm font-medium truncate mt-0.5">{r.student.fullName}</div>
                      <div className="text-xs text-muted-foreground">Guardian: {r.guardian.fullName} · {maskAccount(r.account.accountNumber)}</div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-sm font-semibold">{formatCurrency(r.requestedAmount)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(r.submittedAt)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {needsAttention.length === 0 && (
                <p className="text-sm text-muted-foreground">All clear.</p>
              )}
              {needsAttention.map((r) => (
                <Link
                  key={r.id}
                  to="/verification/$id"
                  params={{ id: r.id } as never}
                  className="block rounded-md border p-2.5 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs">{r.code}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="text-sm mt-0.5 truncate">{r.student.fullName}</div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DecisionList title="Recently Approved" items={recentApproved} accent="emerald" />
          <DecisionList title="Recently Rejected" items={recentRejected} accent="rose" />
        </div>
      </div>
    </AppShell>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}

function DecisionList({ title, items, accent }: { title: string; items: ReturnType<typeof useRequests>; accent: "emerald" | "rose" }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No items.</p>}
        {items.map((r) => (
          <Link
            key={r.id}
            to="/verification/$id"
            params={{ id: r.id } as never}
            className="flex items-center justify-between rounded-md border p-2.5 hover:bg-accent transition-colors"
          >
            <div className="min-w-0">
              <div className="font-mono text-xs text-muted-foreground">{r.code}</div>
              <div className="text-sm font-medium truncate">{r.student.fullName}</div>
            </div>
            <div className="text-right ml-3">
              <div className={`text-sm font-semibold ${accent === "emerald" ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(r.verifiedAmount ?? r.requestedAmount)}
              </div>
              <div className="text-xs text-muted-foreground">{r.decisionAt ? formatDate(r.decisionAt) : "—"}</div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
