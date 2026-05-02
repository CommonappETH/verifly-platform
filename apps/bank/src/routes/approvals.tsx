import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/bank/AppShell";
import {
  Badge, Button, Card, EmptyState, StatusBadge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@verifly/ui";
import { apiClient } from "@/lib/api-client";
import {
  formatCurrency, formatDate,
  mapVerificationRow,
  verificationStatusBadge,
  type VerificationRow,
  type WireVerification,
} from "@/lib/mappers";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/approvals")({
  head: () => ({ meta: [{ title: "Approvals & Decisions — Verifly Bank Portal" }] }),
  component: ApprovalsPage,
});

type Filter = "all" | "verified" | "rejected" | "pending";

function ApprovalsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const verificationsQuery = useQuery({
    queryKey: ["verifications", { bankScope: true }],
    queryFn: async () => {
      const res = await apiClient.verifications.list({ limit: 100 });
      return res.data as unknown as WireVerification[];
    },
  });

  const studentIds = useMemo(
    () => Array.from(new Set((verificationsQuery.data ?? []).map((v) => v.studentId))),
    [verificationsQuery.data],
  );

  const studentQueries = useQueries({
    queries: studentIds.map((id) => ({
      queryKey: ["student", id],
      queryFn: () => apiClient.students.get(id).then((r) => r.data),
      staleTime: 60_000,
    })),
  });

  const studentById = useMemo(() => {
    const m = new Map<string, Awaited<ReturnType<typeof apiClient.students.get>>["data"]>();
    studentIds.forEach((id, i) => {
      const q = studentQueries[i];
      if (q?.data) m.set(id, q.data);
    });
    return m;
  }, [studentIds, studentQueries]);

  const rows: VerificationRow[] = useMemo(() => {
    const list = verificationsQuery.data ?? [];
    return list.map((v) => mapVerificationRow(v, studentById.get(v.studentId)));
  }, [verificationsQuery.data, studentById]);

  const list = useMemo(() => {
    const decided = rows.filter(
      (r) => r.status === "verified" || r.status === "rejected" || r.status === "pending",
    );
    const f = filter === "all" ? decided : decided.filter((r) => r.status === filter);
    return [...f].sort(
      (a, b) => (b.decidedAt ?? b.submittedAt ?? 0) - (a.decidedAt ?? a.submittedAt ?? 0),
    );
  }, [rows, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "verified", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "pending", label: "Pending" },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approvals & Decisions</h1>
          <p className="text-sm text-muted-foreground">Track all processed verifications.</p>
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
          {verificationsQuery.isError ? (
            <EmptyState
              title="Couldn't load decisions"
              description={(verificationsQuery.error as Error).message}
            />
          ) : verificationsQuery.isPending ? (
            <EmptyState title="Loading decisions…" />
          ) : list.length === 0 ? (
            <EmptyState
              title="No records"
              description="When you decide on verifications, they'll appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified Amount</TableHead>
                  <TableHead>Decision Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell className="font-medium">{r.studentName}</TableCell>
                    <TableCell>
                      <StatusBadge {...verificationStatusBadge(r.status)} />
                    </TableCell>
                    <TableCell className="font-semibold">
                      {r.verifiedAmount != null ? formatCurrency(r.verifiedAmount, r.currency) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(r.decidedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {r.rejectionReason ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/verification/$id" params={{ id: r.id }}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
