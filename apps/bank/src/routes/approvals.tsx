import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/bank/AppShell";
import { Card } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Badge } from "@verifly/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@verifly/ui";
import { StatusBadge } from "@verifly/ui";
import { statusBadgeProps } from "@/lib/status-badge";
import { useRequests } from "@/lib/use-requests";
import { formatCurrency, formatDate } from "@/lib/api";
import { Download, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/approvals")({
  component: ApprovalsPage,
});

type F = "all" | "approved" | "rejected" | "pending";

function ApprovalsPage() {
  const requests = useRequests();
  const [filter, setFilter] = useState<F>("all");

  const list = useMemo(() => {
    const decided = requests.filter((r) => r.status === "approved" || r.status === "rejected" || r.status === "pending");
    const f = filter === "all" ? decided : decided.filter((r) => r.status === filter);
    return [...f].sort((a, b) => +new Date(b.decisionAt ?? b.submittedAt) - +new Date(a.decisionAt ?? a.submittedAt));
  }, [requests, filter]);

  const filters: { id: F; label: string }[] = [
    { id: "all", label: "All" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "pending", label: "Pending" },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Approvals & Decisions</h1>
            <p className="text-sm text-muted-foreground">Track all processed verifications.</p>
          </div>
          <Button variant="outline" onClick={() => toast.info("Export started (mock)")}> 
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        <Card className="p-3">
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <Badge
                key={f.id}
                variant={filter === f.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified Amount</TableHead>
                <TableHead>Decision Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => {
                const lastNote = r.notes[r.notes.length - 1];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell className="font-medium">{r.student.fullName}</TableCell>
                    <TableCell><StatusBadge {...statusBadgeProps(r.status)} /></TableCell>
                    <TableCell className="font-semibold">
                      {r.verifiedAmount ? formatCurrency(r.verifiedAmount, r.currency) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.decisionAt ? formatDate(r.decisionAt) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {lastNote?.note ?? lastNote?.action ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/verification/$id" params={{ id: r.id } as never}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {list.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No records.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}