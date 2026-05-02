import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { apiClient } from "@/lib/api-client";
import {
  DECISION_LABEL,
  DECISION_TONE,
  decisionFromStatus,
  mapApplicationRow,
  type ApplicantRow,
  type DecisionView,
  type WireApplication,
} from "@/lib/mappers";
import { formatDate } from "@/lib/format";
import { cn } from "@verifly/utils";
import { Button, EmptyState } from "@verifly/ui";
import { CheckCircle2, AlertTriangle, Clock, XCircle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/decisions")({
  head: () => ({ meta: [{ title: "Decisions — Verifly" }] }),
  component: DecisionsPage,
});

const TABS: { key: DecisionView | "all"; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All Decisions", icon: CheckCircle2 },
  { key: "admit", label: "Admit", icon: CheckCircle2 },
  { key: "conditional_admit", label: "Conditional Admit", icon: AlertTriangle },
  { key: "waitlist", label: "Waitlist", icon: Clock },
  { key: "reject", label: "Reject", icon: XCircle },
  { key: "pending", label: "Pending", icon: Clock },
];

function DecisionsPage() {
  const [tab, setTab] = useState<DecisionView | "all">("all");

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

  const rows: Array<ApplicantRow & { decision: DecisionView }> = useMemo(() => {
    const apps = applicationsQuery.data ?? [];
    return apps.map((a) => {
      const row = mapApplicationRow(a, studentById.get(a.studentId));
      return { ...row, decision: decisionFromStatus(row.status) };
    });
  }, [applicationsQuery.data, studentById]);

  const list = tab === "all" ? rows : rows.filter((r) => r.decision === tab);

  const counts: Record<string, number> = {};
  rows.forEach((r) => {
    counts[r.decision] = (counts[r.decision] ?? 0) + 1;
  });

  return (
    <AppShell>
      <div className="p-8 max-w-[1500px] mx-auto">
        <PageHeader
          title="Decisions"
          description="Issue and track admission decisions, including conditional admits pending financial verification."
        />

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl p-1.5 inline-flex gap-1 mb-6">
          {TABS.map((t) => {
            const count = t.key === "all" ? rows.length : counts[t.key] ?? 0;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-3 py-2 text-sm rounded-md flex items-center gap-2 transition-colors",
                  tab === t.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    tab === t.key ? "bg-primary-foreground/20" : "bg-muted",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "conditional_admit" && (
          <div className="rounded-xl border border-accent/40 bg-accent/15 p-5 mb-6 flex items-start gap-4">
            <ShieldCheck className="h-5 w-5 text-accent-foreground mt-0.5" />
            <div>
              <div className="font-display text-lg">Conditional Admission Workflow</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                These applicants have been admitted contingent on completing financial
                verification before enrollment. Track follow-up requirements and
                verification status here.
              </p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {applicationsQuery.isError ? (
            <EmptyState
              title="Couldn't load decisions"
              description={(applicationsQuery.error as Error).message}
            />
          ) : applicationsQuery.isPending ? (
            <EmptyState title="Loading decisions…" />
          ) : list.length === 0 ? (
            <EmptyState
              title="No decisions in this view"
              description="Try a different tab — or wait for committee review to wrap up."
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Applicant</th>
                  <th className="text-left font-medium px-4 py-3">Decision</th>
                  <th className="text-left font-medium px-4 py-3">Last Updated</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((a) => (
                  <tr key={a.applicationId} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to="/applicants/$id"
                        params={{ id: a.applicationId }}
                        className="flex items-center gap-3 hover:text-primary"
                      >
                        <div
                          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: a.avatarColor }}
                        >
                          {a.initials}
                        </div>
                        <div>
                          <div className="font-medium">{a.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.program ?? "—"} · {a.country ?? "Unknown"}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-[11px] font-medium px-2 py-1 rounded-md",
                          DECISION_TONE[a.decision],
                        )}
                      >
                        {DECISION_LABEL[a.decision]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(new Date(a.updatedAt).toISOString())}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/applicants/$id" params={{ id: a.applicationId }}>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
