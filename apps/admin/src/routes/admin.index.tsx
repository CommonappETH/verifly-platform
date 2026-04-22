import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Building2,
  Landmark,
  FileStack,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  FileUp,
  UserMinus,
  UserPlus,
  Flag,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { StatCard, StatusBadge } from "@verifly/ui";
import { statusBadgeProps } from "@/lib/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@verifly/ui";
import { users } from "@/lib/admin-mock/users";
import { applications } from "@/lib/admin-mock/applications";
import { verifications } from "@/lib/admin-mock/verifications";
import { adminDocuments } from "@/lib/admin-mock/documents";
import { activity } from "@/lib/admin-mock/activity";
import {
  applicationsByStatus,
  studentsByCountry,
  verificationApprovalRate,
} from "@/lib/admin-mock/analytics";
import { getOrgById, getUserById } from "@/lib/admin-mock/api";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Verifly Admin" },
      { name: "description", content: "Global system overview for the Verifly platform." },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = [
  "oklch(0.55 0.18 250)",
  "oklch(0.65 0.15 200)",
  "oklch(0.7 0.18 90)",
  "oklch(0.7 0.18 30)",
  "oklch(0.55 0.2 300)",
  "oklch(0.6 0.2 350)",
  "oklch(0.7 0.15 150)",
];

const activityIcon = {
  application_submitted: FileStack,
  verification_approved: CheckCircle2,
  verification_rejected: XCircle,
  document_uploaded: FileUp,
  user_suspended: UserMinus,
  user_activated: UserPlus,
  issue_flagged: Flag,
};

function DashboardPage() {
  const totalStudents = users.filter((u) => u.role === "student").length;
  const totalUniversities = users.filter((u) => u.role === "university").length;
  const totalBanks = users.filter((u) => u.role === "bank").length;
  const totalApplications = applications.length;
  const pendingVerifications = verifications.filter(
    (v) => v.status === "pending" || v.status === "under_review",
  ).length;
  const incompleteApplications = applications.filter(
    (a) => a.status === "missing_documents" || a.documentStatus === "missing" || a.documentStatus === "overdue",
  ).length;

  const needsAttentionApps = applications
    .filter((a) => a.status === "missing_documents" || a.documentStatus === "overdue")
    .slice(0, 5);

  const needsAttentionVerifs = verifications
    .filter(
      (v) =>
        v.status === "flagged" ||
        v.requestedAmount > 100000 ||
        (v.status === "pending" &&
          (Date.now() - new Date(v.submittedAt).getTime()) / 86400000 > 7),
    )
    .slice(0, 5);

  const missingDocs = adminDocuments.filter((d) => d.status === "missing" || d.status === "overdue");
  const missingByUni = missingDocs.reduce<Record<string, number>>((acc, d) => {
    if (!d.universityId) return acc;
    acc[d.universityId] = (acc[d.universityId] ?? 0) + 1;
    return acc;
  }, {});

  const approvalTotal = verificationApprovalRate.reduce((s, x) => s + x.value, 0);
  const approved = verificationApprovalRate.find((x) => x.name === "Approved")?.value ?? 0;
  const approvalPct = Math.round((approved / approvalTotal) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real-time view of activity across students, universities and banks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Students" value={totalStudents} icon={<GraduationCap className="h-5 w-5" />}
          delta={{ value: "+8 vs last week", positive: true }} iconClassName="bg-sky-100 text-sky-700" />
        <StatCard label="Universities" value={totalUniversities} icon={<Building2 className="h-5 w-5" />}
          delta={{ value: "+1 vs last week", positive: true }} iconClassName="bg-indigo-100 text-indigo-700" />
        <StatCard label="Banks" value={totalBanks} icon={<Landmark className="h-5 w-5" />}
          delta={{ value: "0 vs last week", positive: true }} iconClassName="bg-amber-100 text-amber-700" />
        <StatCard label="Applications" value={totalApplications} icon={<FileStack className="h-5 w-5" />}
          delta={{ value: "+12 vs last week", positive: true }} iconClassName="bg-violet-100 text-violet-700" />
        <StatCard label="Pending Verifications" value={pendingVerifications} icon={<ShieldAlert className="h-5 w-5" />}
          delta={{ value: "+3 vs last week", positive: false }} iconClassName="bg-orange-100 text-orange-700" />
        <StatCard label="Incomplete Applications" value={incompleteApplications} icon={<AlertTriangle className="h-5 w-5" />}
          delta={{ value: "-2 vs last week", positive: true }} iconClassName="bg-red-100 text-red-700" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={applicationsByStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {applicationsByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {applicationsByStatus.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ name: "Approved", value: approvalPct, fill: "oklch(0.65 0.18 150)" }]} startAngle={90} endAngle={-270}>
                  <RadialBar background dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold tabular-nums">{approvalPct}%</span>
                <span className="text-xs text-muted-foreground">Approved</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {verificationApprovalRate.map((x) => (
                <div key={x.name} className="flex justify-between">
                  <span className="text-muted-foreground">{x.name}</span>
                  <span className="tabular-nums">{x.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Students by Country</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={studentsByCountry.slice(0, 6)} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="country" width={80} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="oklch(0.55 0.18 250)" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Applications Needing Attention</CardTitle>
            <Link to="/admin/applications" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needsAttentionApps.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{getUserById(a.studentId)?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{getOrgById(a.universityId)?.name}</TableCell>
                    <TableCell><StatusBadge {...statusBadgeProps(a.status)} /></TableCell>
                    <TableCell><StatusBadge {...statusBadgeProps(a.documentStatus)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.slice(0, 8).map((ev) => {
              const Icon = activityIcon[ev.kind];
              return (
                <div key={ev.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight">{ev.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ev.actor} · {new Date(ev.at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Verifications Needing Attention</CardTitle>
            <Link to="/admin/verifications" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Requested</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needsAttentionVerifs.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.code}</TableCell>
                    <TableCell>{getUserById(v.studentId)?.name}</TableCell>
                    <TableCell className="text-right tabular-nums">${v.requestedAmount.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge {...statusBadgeProps(v.status)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missing Documents Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(missingByUni).map(([uniId, n]) => (
              <div key={uniId} className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{getOrgById(uniId)?.name}</p>
                  <p className="text-xs text-muted-foreground">{n} document{n === 1 ? "" : "s"} missing or overdue</p>
                </div>
                <StatusBadge {...statusBadgeProps("missing")} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
