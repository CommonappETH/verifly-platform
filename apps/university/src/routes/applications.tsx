import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { APPLICANTS } from "@/lib/mock-data";
import { STATUS_LABEL, STATUS_TONE, formatDate, TYPE_TONE } from "@/lib/format";
import { cn } from "@verifly/utils";
import type { ApplicationStatus } from "@/lib/types";

export const Route = createFileRoute("/applications")({
  head: () => ({ meta: [{ title: "Applications Pipeline — Verifly" }] }),
  component: ApplicationsPage,
});

const PIPELINE: ApplicationStatus[] = [
  "draft", "submitted", "under_review", "awaiting_info",
  "awaiting_verification", "committee_review", "conditionally_admitted", "admitted", "rejected",
];

function ApplicationsPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-[1700px] mx-auto">
        <PageHeader
          title="Applications Pipeline"
          description="Drag-style Kanban view of every application across the admissions cycle."
        />

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE.map(stage => {
              const apps = APPLICANTS.filter(a => a.applicationStatus === stage);
              return (
                <div key={stage} className="w-72 shrink-0">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md", STATUS_TONE[stage])}>
                      {STATUS_LABEL[stage]}
                    </span>
                    <span className="text-xs text-muted-foreground">{apps.length}</span>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-2 min-h-[400px] space-y-2">
                    {apps.map(a => (
                      <Link
                        key={a.id}
                        to="/applicants/$id"
                        params={{ id: a.id }}
                        className="block bg-card border border-border rounded-lg p-3 hover:shadow-md hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs" style={{ backgroundColor: a.avatarColor }}>
                            {a.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{a.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{a.intendedMajor}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", TYPE_TONE[a.applicantType])}>
                            {a.applicantType === "pre_approved" ? "Pre-Approved" : "Normal"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(a.submissionDate)}</span>
                        </div>
                      </Link>
                    ))}
                    {apps.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">No applicants</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
