import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Input } from "@verifly/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@verifly/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { documents, documentCategoryLabels, documentStatusLabels } from "@/lib/mock-data";
import { Search, Upload, FileText, FolderOpen } from "lucide-react";
import type { DocumentCategory } from "@/lib/types";

export const Route = createFileRoute("/dashboard/documents")({
  component: DocumentsPage,
});

function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = documents.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  });

  const categories = Object.keys(documentCategoryLabels) as DocumentCategory[];
  const grouped = categories.map((cat) => ({
    category: cat,
    label: documentCategoryLabels[cat],
    docs: filtered.filter((d) => d.category === cat),
  })).filter((g) => g.docs.length > 0);

  const stats = {
    total: documents.length,
    approved: documents.filter((d) => d.status === "approved").length,
    missing: documents.filter((d) => d.status === "missing").length,
    needsAction: documents.filter((d) => d.status === "needs_replacement" || d.status === "missing").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and manage your application documents.</p>
        </div>
        <Button className="gap-2"><Upload className="h-4 w-4" /> Upload Document</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Approved" value={stats.approved} color="text-success" />
        <MiniStat label="Missing" value={stats.missing} color="text-destructive" />
        <MiniStat label="Needs Action" value={stats.needsAction} color="text-warning-foreground" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{documentCategoryLabels[c]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(documentStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Upload zone */}
      <div className="rounded-xl border-2 border-dashed border-border/70 p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
      </div>

      {/* Documents by category */}
      {grouped.map((group) => (
        <Card key={group.category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" /> {group.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.docs.map((doc) => {
                const ds = documentStatusLabels[doc.status];
                return (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {doc.uploadedDate && <span>Uploaded {doc.uploadedDate}</span>}
                          {doc.fileSize && <span>• {doc.fileSize}</span>}
                        </div>
                        {doc.notes && <p className="text-xs text-muted-foreground mt-0.5">{doc.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <StatusBadge status={doc.status} label={ds.label} variant={ds.color as any} />
                      {(doc.status === "missing" || doc.status === "needs_replacement") && (
                        <Button variant="outline" size="sm" className="text-xs h-7">Upload</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold ${color || ""}`}>{value}</p>
    </div>
  );
}
