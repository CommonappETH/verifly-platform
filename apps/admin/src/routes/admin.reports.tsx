import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applicationsOverTime,
  avgVerificationTime,
  documentCompletionByType,
  studentsByCountry,
  verificationApprovalRate,
} from "@/lib/admin-mock/analytics";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports · Verifly Admin" },
      { name: "description", content: "Platform analytics and reports." },
    ],
  }),
  component: ReportsPage,
});

const PIE = ["oklch(0.65 0.18 150)", "oklch(0.6 0.22 25)", "oklch(0.7 0.18 80)", "oklch(0.6 0.2 35)"];
const approvedTotal = verificationApprovalRate.reduce((s, x) => s + x.value, 0);
const approved = verificationApprovalRate.find((x) => x.name === "Approved")?.value ?? 0;
const approvedPct = Math.round((approved / approvedTotal) * 100);

function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Platform analytics across applications, verifications and documents.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications over time</CardTitle>
            <p className="text-xs text-muted-foreground">Last 90 days · daily count</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={applicationsOverTime}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.18 250)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.55 0.18 250)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={14} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area dataKey="applications" stroke="oklch(0.55 0.18 250)" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification approval rate</CardTitle>
            <p className="text-xs text-muted-foreground">Across all decided requests</p>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={verificationApprovalRate} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={2}>
                    {verificationApprovalRate.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-x-0 top-[40%] flex flex-col items-center">
                <span className="text-3xl font-semibold tabular-nums">{approvedPct}%</span>
                <span className="text-xs text-muted-foreground">Approved</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average verification time</CardTitle>
            <p className="text-xs text-muted-foreground">Days to decision · weekly</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={avgVerificationTime}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line dataKey="days" stroke="oklch(0.6 0.22 25)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Students by country</CardTitle>
            <p className="text-xs text-muted-foreground">Active students by origin</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={studentsByCountry} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="oklch(0.55 0.18 250)" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Document completion rate</CardTitle>
            <p className="text-xs text-muted-foreground">By document type</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={documentCompletionByType}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="completed" stackId="a" fill="oklch(0.65 0.18 150)" />
                <Bar dataKey="review" stackId="a" fill="oklch(0.7 0.18 250)" />
                <Bar dataKey="missing" stackId="a" fill="oklch(0.6 0.22 25)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
