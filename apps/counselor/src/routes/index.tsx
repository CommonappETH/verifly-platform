import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, FileClock, FileCheck2, Inbox, AlertTriangle, Upload, ArrowRight } from "lucide-react";
import { students, documents } from "@/lib/mock/students";
import { documentRequests, submissions } from "@/lib/mock/requests";
import { universities } from "@/lib/mock/universities";
import { formatDate, formatRelative, daysUntil } from "@/lib/format";
import { getStudentDocStatus, getStudentLabel } from "@/lib/mock/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Verifly Counselor Portal" },
      { name: "description", content: "Counselor overview of students, documents, and university requests." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const totalStudents = students.length;
  const docsPending = documents.filter((d) => d.status === "missing" || d.status === "uploaded").length;
  const docsSubmitted = documents.filter((d) => d.status === "completed" || d.status === "under_review").length;
  const universityRequests = documentRequests.filter((r) => r.status !== "completed").length;
  const incompleteApps = students.filter((s) => getStudentDocStatus(s.id) === "incomplete").length;

  const recentActivity = [...submissions].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(0, 5);
  const pendingRequests = documentRequests.filter((r) => r.status !== "completed").slice(0, 5);
  const recentSubmissions = [...submissions].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(0, 5);
  const urgent = [...documentRequests]
    .filter((r) => r.status !== "completed")
    .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))
    .slice(0, 5);

  const studentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? getStudentLabel(s) : "—";
  };
  const uniName = (id: string) => universities.find((u) => u.id === id)?.shortName ?? "—";

  const stats = [
    { label: "Total Students", value: totalStudents, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Documents Pending", value: docsPending, icon: FileClock, color: "text-amber-600 bg-amber-50" },
    { label: "Documents Submitted", value: docsSubmitted, icon: FileCheck2, color: "text-emerald-600 bg-emerald-50" },
    { label: "University Requests", value: universityRequests, icon: Inbox, color: "text-violet-600 bg-violet-50" },
    { label: "Incomplete Applications", value: incompleteApps, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, Ms. Carter. Here's your school at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold leading-none">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Student Activity</CardTitle>
            <Link to="/submissions" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((s) => (
              <div key={s.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{studentName(s.studentId)}</span>{" "}
                    <span className="text-muted-foreground">uploaded</span>{" "}
                    <span className="font-medium">{s.documentLabel}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatRelative(s.uploadedAt)}</div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending Document Requests</CardTitle>
            <Link to="/document-requests" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((r) => (
              <div key={r.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.documentLabel}</div>
                  <div className="text-xs text-muted-foreground">
                    {studentName(r.studentId)} · {uniName(r.universityId)} · due {formatDate(r.deadline)}
                  </div>
                </div>
                <StatusBadge status={r.status} />
                <Button size="sm" variant="outline" className="h-8 gap-1">
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently Submitted Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSubmissions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex-1">
                  <div className="text-sm font-medium">{s.documentLabel}</div>
                  <div className="text-xs text-muted-foreground">
                    {studentName(s.studentId)} · {s.universityId ? uniName(s.universityId) : "Internal"} ·{" "}
                    {formatRelative(s.uploadedAt)}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deadlines & Urgent Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgent.map((r) => {
              const days = daysUntil(r.deadline);
              const overdue = days < 0;
              return (
                <div key={r.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <AlertTriangle className={`h-4 w-4 ${overdue ? "text-red-600" : "text-amber-600"}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{r.documentLabel}</div>
                    <div className="text-xs text-muted-foreground">
                      {studentName(r.studentId)} · {uniName(r.universityId)}
                    </div>
                  </div>
                  <div className={`text-xs font-medium ${overdue ? "text-red-600" : "text-foreground"}`}>
                    {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                  </div>
                  <Link
                    to="/students/$id"
                    params={{ id: r.studentId }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
