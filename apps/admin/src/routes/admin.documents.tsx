import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@verifly/ui";
import { Tabs, TabsList, TabsTrigger } from "@verifly/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@verifly/ui";
import { EmptyState, StatusBadge } from "@verifly/ui";
import { DataTableToolbar } from "@/components/admin/DataTableToolbar";
import { statusBadgeProps } from "@/lib/status-badge";
import { adminDocuments } from "@/lib/admin-mock/documents";
import { getOrgById, getUserById } from "@/lib/admin-mock/api";
import { cn } from "@verifly/utils";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({
    meta: [
      { title: "Documents · Verifly Admin" },
      { name: "description", content: "Track document completion across the platform." },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return adminDocuments.filter((d) => {
      if (tab !== "all" && d.status !== tab) return false;
      const q = search.toLowerCase();
      if (q) {
        const sn = getUserById(d.studentId)?.name?.toLowerCase() ?? "";
        if (!sn.includes(q) && !d.type.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tab, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Document completion across all students and universities.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="missing">Missing</TabsTrigger>
              <TabsTrigger value="under_review">Under Review</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
          <DataTableToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search by student or document type…"
            count={filtered.length}
          />
          {filtered.length === 0 ? (
            <EmptyState title="No results" />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Linked University</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id} className={cn(d.status === "overdue" && "bg-red-50/50")}>
                      <TableCell className="font-medium">{getUserById(d.studentId)?.name}</TableCell>
                      <TableCell>{d.type}</TableCell>
                      <TableCell><StatusBadge {...statusBadgeProps(d.uploadedBy)} /></TableCell>
                      <TableCell className="text-muted-foreground">{getOrgById(d.universityId)?.name ?? "—"}</TableCell>
                      <TableCell><StatusBadge {...statusBadgeProps(d.status)} /></TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(d.updatedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
