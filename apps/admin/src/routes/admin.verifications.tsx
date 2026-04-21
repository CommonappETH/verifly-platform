import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Clock,
  Eye,
  Flag,
  MoreHorizontal,
  Timer,
  TrendingUp,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@verifly/ui";
import { Tabs, TabsList, TabsTrigger } from "@verifly/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@verifly/ui";
import { Switch } from "@verifly/ui";
import { Label } from "@verifly/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@verifly/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@verifly/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTableToolbar } from "@/components/admin/DataTableToolbar";
import { EmptyState } from "@/components/admin/EmptyState";
import { KpiCard } from "@/components/admin/KpiCard";
import { FlagIssueDialog } from "@/components/admin/FlagIssueDialog";
import { verifications } from "@/lib/admin-mock/verifications";
import type { Verification } from "@/lib/admin-mock/types";
import { getOrgById, getUserById } from "@/lib/admin-mock/api";

export const Route = createFileRoute("/admin/verifications")({
  head: () => ({
    meta: [
      { title: "Financial Verifications · Verifly Admin" },
      { name: "description", content: "Monitor financial verification activity across banks." },
    ],
  }),
  component: VerificationsPage,
});

const fmt = (n: number) => `$${n.toLocaleString()}`;
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

function VerificationsPage() {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [highValueOnly, setHighValueOnly] = useState(false);
  const [open, setOpen] = useState<Verification | null>(null);
  const [flagFor, setFlagFor] = useState<Verification | null>(null);

  const pendingCount = verifications.filter((v) => v.status === "pending" || v.status === "under_review").length;
  const approvedCount = verifications.filter((v) => v.status === "approved").length;
  const totalDecided = verifications.filter((v) => v.decidedAt).length;
  const approvalRate = Math.round((approvedCount / Math.max(1, totalDecided)) * 100);
  const avgTime = (() => {
    const decided = verifications.filter((v) => v.decidedAt);
    const days = decided.map((v) => (new Date(v.decidedAt!).getTime() - new Date(v.submittedAt).getTime()) / 86400000);
    return (days.reduce((a, b) => a + b, 0) / Math.max(1, days.length)).toFixed(1);
  })();
  const highValueCount = verifications.filter((v) => v.requestedAmount > 100000).length;

  const filtered = useMemo(() => {
    return verifications.filter((v) => {
      if (tab !== "all" && v.status !== tab) return false;
      if (highValueOnly && v.requestedAmount <= 100000) return false;
      const q = search.toLowerCase();
      if (q) {
        const sn = getUserById(v.studentId)?.name?.toLowerCase() ?? "";
        if (!v.code.toLowerCase().includes(q) && !sn.includes(q)) return false;
      }
      return true;
    });
  }, [tab, search, highValueOnly]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financial Verifications</h1>
        <p className="text-sm text-muted-foreground">
          Monitor delays, mismatches and bank performance across all verification requests.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Pending" value={pendingCount} icon={Clock} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Avg. processing" value={`${avgTime}d`} icon={Timer} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Approval rate" value={`${approvalRate}%`} icon={TrendingUp} accent="bg-emerald-100 text-emerald-700" />
        <KpiCard label="High-value (>$100k)" value={highValueCount} icon={DollarSign} accent="bg-violet-100 text-violet-700" />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="under_review">Under Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="flagged">Flagged</TabsTrigger>
            </TabsList>
          </Tabs>
          <DataTableToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search code or student…"
            count={filtered.length}
          >
            <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
              <Switch id="hv" checked={highValueOnly} onCheckedChange={setHighValueOnly} />
              <Label htmlFor="hv" className="text-xs">High-value only</Label>
            </div>
          </DataTableToolbar>

          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead className="text-right">Requested</TableHead>
                    <TableHead className="text-right">Verified</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Decided</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => {
                    const mismatch = v.verifiedAmount !== null && v.verifiedAmount !== v.requestedAmount;
                    const stalled = !v.decidedAt && daysSince(v.submittedAt) > 7;
                    const deltaPct = mismatch
                      ? Math.round((Math.abs(v.requestedAmount - (v.verifiedAmount ?? 0)) / v.requestedAmount) * 100)
                      : 0;
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-xs">{v.code}</TableCell>
                        <TableCell className="font-medium">{getUserById(v.studentId)?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{v.guardianName}</TableCell>
                        <TableCell className="text-muted-foreground">{getOrgById(v.bankId)?.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(v.requestedAmount)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <div className="inline-flex items-center gap-1">
                            {v.verifiedAmount === null ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span>{fmt(v.verifiedAmount)}</span>
                            )}
                            {mismatch && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Verified differs from requested by {deltaPct}%
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={v.status} />
                            {stalled && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Clock className="h-3.5 w-3.5 text-red-600" />
                                </TooltipTrigger>
                                <TooltipContent>Pending {daysSince(v.submittedAt)} days</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(v.submittedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {v.decidedAt ? new Date(v.decidedAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setOpen(v)}>
                                <Eye className="mr-2 h-4 w-4" /> View verification
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setFlagFor(v)}>
                                <Flag className="mr-2 h-4 w-4" /> Flag issue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-[480px] sm:max-w-lg p-6 overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-mono text-base">{open.code}</span>
                </SheetTitle>
                <SheetDescription>
                  {getUserById(open.studentId)?.name} · Guardian {open.guardianName}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <StatusBadge status={open.status} />
                <dl className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  <dt className="text-xs text-muted-foreground">Bank</dt>
                  <dd>{getOrgById(open.bankId)?.name}</dd>
                  <dt className="text-xs text-muted-foreground">Requested</dt>
                  <dd className="tabular-nums">{fmt(open.requestedAmount)}</dd>
                  <dt className="text-xs text-muted-foreground">Verified</dt>
                  <dd className="tabular-nums">{open.verifiedAmount === null ? "—" : fmt(open.verifiedAmount)}</dd>
                  <dt className="text-xs text-muted-foreground">Submitted</dt>
                  <dd>{new Date(open.submittedAt).toLocaleString()}</dd>
                  <dt className="text-xs text-muted-foreground">Decided</dt>
                  <dd>{open.decidedAt ? new Date(open.decidedAt).toLocaleString() : "—"}</dd>
                </dl>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Audit trail</p>
                  <ol className="space-y-2 border-l pl-4 text-xs">
                    <li className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-zinc-400" />
                      Submitted by guardian — {new Date(open.submittedAt).toLocaleDateString()}
                    </li>
                    <li className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-blue-500" />
                      Picked up by {getOrgById(open.bankId)?.name}
                    </li>
                    {open.decidedAt && (
                      <li className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                        Decision recorded — {new Date(open.decidedAt).toLocaleDateString()}
                      </li>
                    )}
                  </ol>
                </div>

                <Button variant="outline" onClick={() => { setFlagFor(open); }}>
                  <Flag className="mr-2 h-4 w-4" /> Flag issue
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <FlagIssueDialog
        open={!!flagFor}
        onOpenChange={(o) => !o && setFlagFor(null)}
        subject={flagFor?.code ?? ""}
      />
    </div>
  );
}
