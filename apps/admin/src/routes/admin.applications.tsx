import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@verifly/ui";
import { Tabs, TabsList, TabsTrigger } from "@verifly/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@verifly/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@verifly/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTableToolbar } from "@/components/admin/DataTableToolbar";
import { EmptyState } from "@/components/admin/EmptyState";
import { applications } from "@/lib/admin-mock/applications";
import type { Application, ApplicationStatus } from "@/lib/admin-mock/types";
import { getOrgById, getUserById } from "@/lib/admin-mock/api";
import { verifications } from "@/lib/admin-mock/verifications";
import { adminDocuments } from "@/lib/admin-mock/documents";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({
    meta: [
      { title: "Applications · Verifly Admin" },
      { name: "description", content: "System-wide university applications." },
    ],
  }),
  component: ApplicationsPage,
});

const STATUS_TABS: { value: "all" | ApplicationStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "awaiting_verification", label: "Awaiting Verif." },
  { value: "conditionally_admitted", label: "Conditional" },
  { value: "admitted", label: "Admitted" },
  { value: "rejected", label: "Rejected" },
  { value: "missing_documents", label: "Missing Docs" },
];

function ApplicationsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [open, setOpen] = useState<Application | null>(null);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (tab !== "all" && a.status !== tab) return false;
      const q = search.toLowerCase();
      if (q) {
        const studentName = getUserById(a.studentId)?.name?.toLowerCase() ?? "";
        const uniName = getOrgById(a.universityId)?.name?.toLowerCase() ?? "";
        if (!studentName.includes(q) && !uniName.includes(q)) return false;
      }
      return true;
    });
  }, [tab, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="text-sm text-muted-foreground">
          Every university application across the platform.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap">
              {STATUS_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <DataTableToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search by student or university…"
            count={filtered.length}
          />
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>App Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => setOpen(a)}>
                      <TableCell className="font-medium">{getUserById(a.studentId)?.name}</TableCell>
                      <TableCell className="text-muted-foreground">{getOrgById(a.universityId)?.name}</TableCell>
                      <TableCell>{a.program}</TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell><StatusBadge status={a.applicantType} /></TableCell>
                      <TableCell><StatusBadge status={a.verificationStatus} /></TableCell>
                      <TableCell><StatusBadge status={a.documentStatus} /></TableCell>
                      <TableCell><StatusBadge status={a.decisionStatus} /></TableCell>
                    </TableRow>
                  ))}
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
                <SheetTitle>{getUserById(open.studentId)?.name} → {getOrgById(open.universityId)?.name}</SheetTitle>
                <SheetDescription>{open.program}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={open.status} />
                  <StatusBadge status={open.applicantType} />
                  <StatusBadge status={open.decisionStatus} />
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</p>
                  <ol className="space-y-2 border-l pl-4">
                    <li className="relative">
                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-sm">Submitted</p>
                      <p className="text-xs text-muted-foreground">{new Date(open.submittedAt).toLocaleDateString()}</p>
                    </li>
                    <li className="relative">
                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-blue-500" />
                      <p className="text-sm">Updated</p>
                      <p className="text-xs text-muted-foreground">{new Date(open.updatedAt).toLocaleDateString()}</p>
                    </li>
                  </ol>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Linked verification</p>
                  {(() => {
                    const v = verifications.find((x) => x.studentId === open.studentId);
                    return v ? (
                      <div className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs">{v.code}</span>
                          <StatusBadge status={v.status} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          ${v.requestedAmount.toLocaleString()} requested via {getOrgById(v.bankId)?.name}
                        </p>
                      </div>
                    ) : <p className="text-xs text-muted-foreground">No verification linked.</p>;
                  })()}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Documents</p>
                  <ul className="space-y-1 text-xs">
                    {adminDocuments.filter((d) => d.studentId === open.studentId).slice(0, 6).map((d) => (
                      <li key={d.id} className="flex items-center justify-between rounded border px-2 py-1.5">
                        <span>{d.type}</span>
                        <StatusBadge status={d.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
