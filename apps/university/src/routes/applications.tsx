import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
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
import type { ApplicationStatus } from "@/lib/mappers";
import { EmptyState } from "@verifly/ui";

export const Route = createFileRoute("/applications")({
  head: () => ({ meta: [{ title: "Applications Pipeline — Verifly" }] }),
  component: ApplicationsPage,
});

const PIPELINE: ApplicationStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "awaiting_info",
  "awaiting_verification",
  "committee_review",
  "conditionally_admitted",
  "admitted",
  "rejected",
];

function ApplicationsPage() {
  const applicationsQuery = useQuery({
    queryKey: ["applications", { universityScope: true }],
    queryFn: async () => {
      const res = await apiClient.applications.list({ limit: 100 });
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

  return (
    <AppShell>
      <div className="p-8 max-w-[1700px] mx-auto">
        <PageHeader
          title="Applications Pipeline"
          description="Kanban view of every application across the admissions cycle."
        />

        {applicationsQuery.isError ? (
          <EmptyState
            title="Couldn't load applications"
            description={(applicationsQuery.error as Error).message}
          />
        ) : applicationsQuery.isPending ? (
          <EmptyState title="Loading applications…" />
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {PIPELINE.map((stage) => {
                const apps = rows.filter((r) => r.status === stage);
                return (
                  <div key={stage} className="w-72 shrink-0">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span
                        className={cn(
                          "text-[11px] font-medium px-2 py-1 rounded-md",
                          APPLICATION_STATUS_TONE[stage],
                        )}
                      >
                        {APPLICATION_STATUS_LABEL[stage]}
                      </span>
                      <span className="text-xs text-muted-foreground">{apps.length}</span>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-2 min-h-[400px] space-y-2">
                      {apps.map((a) => (
                        <Link
                          key={a.applicationId}
                          to="/applicants/$id"
                          params={{ id: a.applicationId }}
                          className="block bg-card border border-border rounded-lg p-3 hover:shadow-md hover:border-primary/30 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                              style={{ backgroundColor: a.avatarColor }}
                            >
                              {a.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{a.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {a.program ?? "—"}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              {a.submittedAt
                                ? formatDate(new Date(a.submittedAt).toISOString())
                                : "Draft"}
                            </span>
                          </div>
                        </Link>
                      ))}
                      {apps.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-8">
                          No applications
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
