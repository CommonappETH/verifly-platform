import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/bank/AppShell";
import {
  Badge, Button, Card, EmptyState, Input, StatusBadge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@verifly/ui";
import { apiClient } from "@/lib/api-client";
import {
  formatCurrency, formatDate,
  isDecided, isPendingForBank,
  mapVerificationRow,
  verificationStatusBadge,
  type VerificationRow,
  type VerificationStatus,
  type WireVerification,
} from "@/lib/mappers";
import { Search, Eye, ArrowUpDown } from "lucide-react";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [{ title: "Verification Requests — Verifly Bank Portal" }] }),
  component: RequestsPage,
});

type Filter = "all" | VerificationStatus | "high" | "recent";
type SortKey = "date" | "amount";

function RequestsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === "high") {
      list = list.filter((r) => r.requestedAmount >= 5_000_000); // 50k in minor units
    } else if (filter === "recent") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((r) => (r.submittedAt ?? 0) >= cutoff);
    } else if (filter !== "all") {
      list = list.filter((r) => r.status === filter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.studentName.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      const v =
        sortKey === "date"
          ? (a.submittedAt ?? 0) - (b.submittedAt ?? 0)
          : a.requestedAmount - b.requestedAmount;
      return sortDir === "asc" ? v : -v;
    });
    return list;
  }, [rows, query, filter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending_submission", label: "Pending Submission" },
    { id: "pending", label: "Pending" },
    { id: "under_review", label: "Under Review" },
    { id: "more_info_needed", label: "More Info Needed" },
    { id: "verified", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "high", label: "High Amount" },
    { id: "recent", label: "Recently Submitted" },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verification Requests</h1>
          <p className="text-sm text-muted-foreground">
            Review and process all incoming verification requests for your bank.
          </p>
        </div>

        <Card className="p-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code or student name…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
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
              title="Couldn't load requests"
              description={(verificationsQuery.error as Error).message}
            />
          ) : verificationsQuery.isPending ? (
            <EmptyState title="Loading verification requests…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={rows.length === 0 ? "No verification requests yet" : "No requests match your filters"}
              description={
                rows.length === 0
                  ? "Verifications submitted to your bank will appear here."
                  : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort("amount")}
                    >
                      Amount <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort("date")}
                    >
                      Submitted <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="hover:bg-accent/50">
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell className="font-medium">{r.studentName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.studentCountry ?? "—"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(r.requestedAmount, r.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge {...verificationStatusBadge(r.status)} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(r.submittedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/verification/$id" params={{ id: r.id }}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            {isPendingForBank(r.status) ? "Review" : isDecided(r.status) ? "View" : "View"}
                          </Link>
                        </Button>
                      </div>
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
