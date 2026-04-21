import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/bank/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { useRequests } from "@/lib/use-requests";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const requests = useRequests();

  const overTime = useMemo(() => {
    const buckets: Record<string, number> = {};
    requests.forEach((r) => {
      const d = new Date(r.submittedAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[k] = (buckets[k] ?? 0) + 1;
    });
    return Object.entries(buckets).sort().map(([month, count]) => ({ month, count }));
  }, [requests]);

  const stacked = useMemo(() => {
    const map: Record<string, { month: string; approved: number; rejected: number }> = {};
    requests.forEach((r) => {
      const d = new Date(r.submittedAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[k] ??= { month: k, approved: 0, rejected: 0 };
      if (r.status === "approved") map[k].approved++;
      if (r.status === "rejected") map[k].rejected++;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [requests]);

  const decided = requests.filter((r) => r.decisionAt);
  const avgDays = decided.length > 0
    ? Math.round(decided.reduce((s, r) => s + (+new Date(r.decisionAt!) - +new Date(r.submittedAt)) / 86400000, 0) / decided.length)
    : 0;

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Verification analytics and trends.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase">Total Requests</div><div className="text-3xl font-bold mt-1">{requests.length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase">Avg. Verification Time</div><div className="text-3xl font-bold mt-1">{avgDays}<span className="text-base text-muted-foreground"> days</span></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase">High-Value Requests</div><div className="text-3xl font-bold mt-1">{requests.filter((r) => r.requestedAmount >= 50000).length}</div></CardContent></Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Requests Over Time</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="oklch(0.5 0.15 250)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Approval vs Rejection</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stacked}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" stackId="a" fill="oklch(0.62 0.16 150)" />
                  <Bar dataKey="rejected" stackId="a" fill="oklch(0.6 0.2 25)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppShell>
  );
}