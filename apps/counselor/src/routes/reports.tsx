import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { students, documents } from "@/lib/mock/students";
import { submissions } from "@/lib/mock/requests";
import { getStudentDocStatus } from "@/lib/mock/api";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Verifly" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const completeCount = students.filter((s) => getStudentDocStatus(s.id) === "complete").length;
  const incompleteCount = students.length - completeCount;

  const completionData = [
    { name: "Complete", value: completeCount, color: "#10b981" },
    { name: "Incomplete", value: incompleteCount, color: "#ef4444" },
  ];

  const docTypes = ["transcript", "recommendation_letter", "school_profile"] as const;
  const labels: Record<string, string> = {
    transcript: "Transcript",
    recommendation_letter: "Recommendation",
    school_profile: "School Profile",
  };
  const missingByType = docTypes.map((t) => ({
    type: labels[t],
    missing: documents.filter((d) => d.type === t && d.status === "missing").length,
  }));

  // Submissions over last 14 days
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  const timeline = days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const count = submissions.filter((s) => s.uploadedAt.slice(0, 10) === key).length;
    return { date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count };
  });

  // Docs per student (top 8)
  const perStudent = students
    .map((s) => ({
      name: `${s.firstName} ${s.lastName[0]}.`,
      uploaded: documents.filter((d) => d.studentId === s.id && d.status !== "missing").length,
    }))
    .sort((a, b) => b.uploaded - a.uploaded)
    .slice(0, 8);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Analytics across your school.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <KPI label="Total Students" value={students.length} />
        <KPI label="Complete Apps" value={completeCount} />
        <KPI label="Documents Uploaded" value={documents.filter((d) => d.status !== "missing").length} />
        <KPI label="Pending Submissions" value={submissions.filter((s) => s.status !== "completed").length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Completion</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={completionData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
                  {completionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missing Documents by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="missing" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission Timeline (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents Uploaded per Student</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perStudent} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="uploaded" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
