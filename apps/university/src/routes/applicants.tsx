import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { apiClient } from "@/lib/api-client";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  mapApplicationRow,
  type ApplicantRow,
  type WireApplication,
} from "@/lib/mappers";
import { formatDate } from "@/lib/format";
import { cn } from "@verifly/utils";
import { Input, Button, EmptyState } from "@verifly/ui";
import { Search, FileText, Filter, ArrowUpDown } from "lucide-react";

export const Route = createFileRoute("/applicants")({
  head: () => ({ meta: [{ title: "Applicants — Verifly University Portal" }] }),
  component: ApplicantsPage,
});

type SortKey = "gpa" | "submission" | "name";

function ApplicantsPage() {
  const [search, setSearch] = useState("");
  const [appStatus, setAppStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("submission");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const applicationsQuery = useQuery({
    queryKey: ["applications", { universityScope: true }],
    queryFn: async () => {
      const res = await apiClient.applications.list({ limit: 100 });
      // Backend `Application` typing in @verifly/types is loose; the wire is
      // tighter. Narrow at the boundary so mappers stay typed correctly.
      return res.data as unknown as WireApplication[];
    },
  });

  const studentIds = useMemo(
    () => Array.from(new Set((applicationsQuery.data ?? []).map((a) => a.studentId))),
    [applicationsQuery.data],
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

  const rows: ApplicantRow[] = useMemo(() => {
    const apps = applicationsQuery.data ?? [];
    return apps.map((a) => mapApplicationRow(a, studentById.get(a.studentId)));
  }, [applicationsQuery.data, studentById]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.applicationId.toLowerCase().includes(q) ||
          (r.program ?? "").toLowerCase().includes(q),
      );
    }
    if (appStatus !== "all") list = list.filter((r) => r.status === appStatus);

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "gpa":
          return ((a.gpa ?? 0) - (b.gpa ?? 0)) * dir;
        case "submission":
          return ((a.submittedAt ?? 0) - (b.submittedAt ?? 0)) * dir;
        case "name":
          return a.name.localeCompare(b.name) * dir;
      }
    });
    return list;
  }, [rows, search, appStatus, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  }

  return (
    <AppShell>
      <div className="p-8 max-w-[1600px] mx-auto">
        <PageHeader
          title="Applicants"
          description={
            applicationsQuery.isPending
              ? "Loading applicants…"
              : `${filtered.length} of ${rows.length} applicants matching current filters.`
          }
          actions={<Button variant="default">Export CSV</Button>}
        />

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, application ID, or program…"
                className="pl-9"
              />
            </div>
            <FilterPill
              label="Status"
              value={appStatus}
              onChange={setAppStatus}
              options={[
                ["all", "All Statuses"],
                ...Object.entries(APPLICATION_STATUS_LABEL),
              ]}
            />
            {(appStatus !== "all" || search) && (
              <button
                onClick={() => {
                  setSearch("");
                  setAppStatus("all");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {applicationsQuery.isError ? (
            <EmptyState
              title="Couldn't load applicants"
              description={(applicationsQuery.error as Error).message}
            />
          ) : applicationsQuery.isPending ? (
            <EmptyState title="Loading applicants…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No applicants yet"
              description="When students submit applications to your university, they'll appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <SortHeader label="Applicant" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                    <th className="text-left font-medium px-4 py-3">Country</th>
                    <th className="text-left font-medium px-4 py-3">Program</th>
                    <SortHeader label="GPA" active={sortKey === "gpa"} dir={sortDir} onClick={() => toggleSort("gpa")} />
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <SortHeader label="Submitted" active={sortKey === "submission"} dir={sortDir} onClick={() => toggleSort("submission")} />
                    <th className="text-right font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((a) => (
                    <tr key={a.applicationId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          to="/applicants/$id"
                          params={{ id: a.applicationId }}
                          className="flex items-center gap-3 group"
                        >
                          <div
                            className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                            style={{ backgroundColor: a.avatarColor }}
                          >
                            {a.initials}
                          </div>
                          <div>
                            <div className="font-medium group-hover:text-primary">{a.name}</div>
                            <div className="text-xs text-muted-foreground">{a.applicationId}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">{a.country ?? "—"}</td>
                      <td className="px-4 py-3">{a.program ?? "—"}</td>
                      <td className="px-4 py-3 font-mono">{a.gpa != null ? a.gpa.toFixed(2) : "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap",
                            APPLICATION_STATUS_TONE[a.status],
                          )}
                        >
                          {APPLICATION_STATUS_LABEL[a.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {a.submittedAt ? formatDate(new Date(a.submittedAt).toISOString()) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to="/applicants/$id"
                            params={{ id: a.applicationId }}
                            title="View Profile"
                            className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function FilterPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Filter className="h-3 w-3 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={label}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="text-left font-medium px-4 py-3">
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          active && "text-foreground",
        )}
      >
        {label} <ArrowUpDown className={cn("h-3 w-3", active && "text-primary")} />
        {active && <span className="text-[10px]">{dir}</span>}
      </button>
    </th>
  );
}

