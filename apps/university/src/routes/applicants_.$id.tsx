import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { apiClient } from "@/lib/api-client";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  DECISION_LABEL,
  DECISION_TONE,
  decisionFromStatus,
  mapApplicantDetail,
  type WireApplication,
} from "@/lib/mappers";
import { formatDate } from "@/lib/format";
import { cn } from "@verifly/utils";
import type { ApplicationStatus } from "@/lib/mappers";
import { ApiError } from "@verifly/api-client";
import { Button, EmptyState } from "@verifly/ui";
import { ArrowLeft, GraduationCap, MapPin } from "lucide-react";

export const Route = createFileRoute("/applicants_/$id")({
  head: ({ params }) => ({ meta: [{ title: `Application ${params.id} — Verifly` }] }),
  component: ApplicantDetail,
});

// Allowed transitions surfaced as buttons. Backend enforces the full state
// machine in apps/api/src/services/application-state.ts; we only show what's
// next-relevant for the university role.
const NEXT_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: [],
  submitted: ["under_review"],
  under_review: ["awaiting_info", "awaiting_verification", "committee_review"],
  awaiting_info: ["under_review", "committee_review"],
  awaiting_verification: ["under_review", "committee_review"],
  committee_review: ["admitted", "rejected", "waitlisted", "conditionally_admitted"],
  conditionally_admitted: [],
  admitted: [],
  rejected: [],
  waitlisted: [],
};

function ApplicantDetail() {
  const { id } = useParams({ from: "/applicants_/$id" });
  const qc = useQueryClient();

  const applicationQuery = useQuery({
    queryKey: ["application", id],
    queryFn: async () => {
      const res = await apiClient.applications.get(id);
      return res.data as unknown as WireApplication;
    },
  });

  const studentId = applicationQuery.data?.studentId;
  const studentQuery = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => apiClient.students.get(studentId!).then((r) => r.data),
    enabled: Boolean(studentId),
  });

  const transitionMutation = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      apiClient.applications.update(id, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["application", id] });
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  if (applicationQuery.isError) {
    const err = applicationQuery.error;
    const notFound = err instanceof ApiError && err.status === 404;
    return (
      <AppShell>
        <div className="p-8 max-w-3xl mx-auto">
          <Link to="/applicants" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Applicants
          </Link>
          <EmptyState
            title={notFound ? "Application not found" : "Couldn't load application"}
            description={(err as Error).message}
          />
        </div>
      </AppShell>
    );
  }

  if (applicationQuery.isPending) {
    return (
      <AppShell>
        <div className="p-8 max-w-3xl mx-auto">
          <EmptyState title="Loading application…" />
        </div>
      </AppShell>
    );
  }

  const detail = mapApplicantDetail(applicationQuery.data, studentQuery.data ?? undefined);
  const decision = decisionFromStatus(detail.status);
  const nextStatuses = NEXT_STATUSES[detail.status];

  return (
    <AppShell>
      <div className="p-8 max-w-[1400px] mx-auto">
        <Link
          to="/applicants"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Applicants
        </Link>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold text-xl shrink-0"
              style={{ backgroundColor: detail.avatarColor }}
            >
              {detail.initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl">{detail.name}</h1>
              <div className="text-sm text-muted-foreground mt-1">
                {detail.applicationId}
                {detail.email && <> · {detail.email}</>}
                {detail.country && <> · {detail.country}</>}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge tone={APPLICATION_STATUS_TONE[detail.status]}>
                  {APPLICATION_STATUS_LABEL[detail.status]}
                </Badge>
                <Badge tone={DECISION_TONE[decision]}>Decision: {DECISION_LABEL[decision]}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Section title="Academic Profile" icon={<GraduationCap className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="GPA">
                  {detail.gpa != null ? detail.gpa.toFixed(2) : "—"}
                </Field>
                <Field label="Intended Program">{detail.program ?? "—"}</Field>
                <Field label="Intended Study">{detail.intendedStudy ?? "—"}</Field>
                <Field label="Submitted">
                  {detail.submittedAt
                    ? formatDate(new Date(detail.submittedAt).toISOString())
                    : "—"}
                </Field>
              </div>
            </Section>

            <Section title="Personal Profile" icon={<MapPin className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Country">{detail.country ?? "—"}</Field>
                <Field label="Nationality">{detail.nationality ?? "—"}</Field>
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Decision" icon={<GraduationCap className="h-4 w-4" />}>
              {nextStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No further transitions available from{" "}
                  <strong>{APPLICATION_STATUS_LABEL[detail.status]}</strong>.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Next status
                  </p>
                  {nextStatuses.map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      className="w-full justify-start"
                      disabled={transitionMutation.isPending}
                      onClick={() => transitionMutation.mutate(s)}
                    >
                      → {APPLICATION_STATUS_LABEL[s]}
                    </Button>
                  ))}
                  {transitionMutation.isError && (
                    <p className="text-xs text-destructive">
                      {(transitionMutation.error as Error).message}
                    </p>
                  )}
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md", tone)}>
      {children}
    </span>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        {icon}
        <h3 className="font-display text-lg">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string | undefined; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
