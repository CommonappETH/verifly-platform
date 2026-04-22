import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/bank/AppShell";
import { Card } from "@verifly/ui";
import { Input } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Badge } from "@verifly/ui";
import { StatusBadge } from "@verifly/ui";
import { statusBadgeProps } from "@/lib/status-badge";
import { useRequests } from "@/lib/use-requests";
import { formatCurrency, formatDate, maskAccount, markUnderReview } from "@/lib/api";
import { Search, Eye, PlayCircle, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@verifly/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/requests")({
  component: RequestsPage,
});

type Filter = "all" | "pending" | "under_review" | "approved" | "rejected" | "high" | "recent";
type SortKey = "date" | "amount";

function RequestsPage() {
  const requests = useRequests();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let list = requests;
    if (filter === "pending" || filter === "under_review" || filter === "approved" || filter === "rejected") {
      list = list.filter((r) => r.status === filter);
    } else if (filter === "high") {
      list = list.filter((r) => r.requestedAmount >= 50000);
    } else if (filter === "recent") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((r) => +new Date(r.submittedAt) >= cutoff);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) =>
        r.code.toLowerCase().includes(q) ||
        r.student.fullName.toLowerCase().includes(q) ||
        r.guardian.fullName.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      const v = sortKey === "date"
        ? +new Date(a.submittedAt) - +new Date(b.submittedAt)
        : a.requestedAmount - b.requestedAmount;
      return sortDir === "asc" ? v : -v;
    });
    return list;
  }, [requests, query, filter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "under_review", label: "Under Review" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "high", label: "High Amount" },
    { id: "recent", label: "Recently Submitted" },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verification Requests</h1>
          <p className="text-sm text-muted-foreground">Review and process all incoming verification requests.</p>
        </div>

        <Card className="p-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by verification code, student, or guardian…"
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("amount")}>
                    Amount <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("date")}>
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
                  <TableCell>
                    <div className="font-medium">{r.student.fullName}</div>
                    <div className="text-xs text-muted-foreground">{r.student.country}</div>
                  </TableCell>
                  <TableCell>{r.guardian.fullName}</TableCell>
                  <TableCell className="font-mono text-xs">{maskAccount(r.account.accountNumber)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(r.requestedAmount)}</TableCell>
                  <TableCell><StatusBadge {...statusBadgeProps(r.status)} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(r.submittedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/verification/$id" params={{ id: r.id } as never}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Link>
                      </Button>
                      {r.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { markUnderReview(r.id); toast.success(`${r.code} marked under review`); }}
                        >
                          <PlayCircle className="h-3.5 w-3.5 mr-1" /> Start Review
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    No requests match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}