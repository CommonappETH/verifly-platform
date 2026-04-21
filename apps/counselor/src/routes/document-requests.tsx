import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@verifly/ui";
import { Tabs, TabsList, TabsTrigger } from "@verifly/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { Upload } from "lucide-react";
import { documentRequests } from "@/lib/mock/requests";
import { students } from "@/lib/mock/students";
import { universities } from "@/lib/mock/universities";
import { formatDate, daysUntil } from "@/lib/format";
import { toast } from "sonner";
import type { DocumentRequest } from "@/lib/mock/types";

export const Route = createFileRoute("/document-requests")({
  head: () => ({ meta: [{ title: "Document Requests — Verifly" }] }),
  component: RequestsPage,
});

type Filter = "all" | "pending" | "completed" | "overdue";

function RequestsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [, force] = useState(0);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const rows = useMemo(
    () =>
      documentRequests.filter((r) => filter === "all" || r.status === filter),
    [filter, /* re-eval */ force],
  );

  const studentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.firstName} ${s.lastName}` : "—";
  };
  const uniName = (id: string) => universities.find((u) => u.id === id)?.shortName ?? "—";

  const handleUpload = (req: DocumentRequest, file: File) => {
    req.status = "completed";
    force((n) => n + 1);
    toast.success(`Uploaded ${file.name}`, { description: `${req.documentLabel} → ${uniName(req.universityId)}` });
  };

  const handleComplete = (req: DocumentRequest) => {
    req.status = "completed";
    force((n) => n + 1);
    toast.success("Marked completed");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Document Requests</h1>
        <p className="text-sm text-muted-foreground">Incoming document requests from universities.</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Requested Document</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    No requests in this view.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const days = daysUntil(r.deadline);
                  const isOverdue = r.status === "overdue" || (r.status === "pending" && days < 0);
                  return (
                    <TableRow key={r.id} className={isOverdue ? "bg-red-50/50" : ""}>
                      <TableCell>
                        <Link to="/students/$id" params={{ id: r.studentId }} className="font-medium hover:underline">
                          {studentName(r.studentId)}
                        </Link>
                      </TableCell>
                      <TableCell>{uniName(r.universityId)}</TableCell>
                      <TableCell>{r.documentLabel}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(r.deadline)}
                        {r.status !== "completed" && (
                          <div className={`text-xs ${days < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <input
                          ref={(el) => {
                            inputs.current[r.id] = el;
                          }}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(r, file);
                            e.target.value = "";
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={r.status === "completed"}
                            onClick={() => inputs.current[r.id]?.click()}
                            className="gap-1"
                          >
                            <Upload className="h-3.5 w-3.5" /> Upload
                          </Button>
                          {r.status !== "completed" && (
                            <Button size="sm" variant="ghost" onClick={() => handleComplete(r)}>
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
