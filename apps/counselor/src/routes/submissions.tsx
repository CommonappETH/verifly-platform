import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@verifly/ui";
import { Tabs, TabsList, TabsTrigger } from "@verifly/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@verifly/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { submissions } from "@/lib/mock/requests";
import { students } from "@/lib/mock/students";
import { universities } from "@/lib/mock/universities";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/submissions")({
  head: () => ({ meta: [{ title: "Submissions — Verifly" }] }),
  component: SubmissionsPage,
});

type Filter = "all" | "recent" | "under_review" | "completed";

function SubmissionsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const sorted = [...submissions].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    if (filter === "recent") return sorted.slice(0, 10);
    if (filter === "under_review") return sorted.filter((s) => s.status === "under_review");
    if (filter === "completed") return sorted.filter((s) => s.status === "completed");
    return sorted;
  }, [filter]);

  const studentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.firstName} ${s.lastName}` : "—";
  };
  const uniName = (id?: string) => (id ? universities.find((u) => u.id === id)?.shortName ?? "—" : "—");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
        <p className="text-sm text-muted-foreground">All uploaded documents tracked here.</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="recent">Recently Uploaded</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Linked University</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => navigate({ to: "/students/$id", params: { id: s.studentId } })}
                >
                  <TableCell className="font-medium">{studentName(s.studentId)}</TableCell>
                  <TableCell>{s.documentLabel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(s.uploadedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell>{uniName(s.universityId)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
