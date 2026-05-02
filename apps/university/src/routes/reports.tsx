import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ComingSoon } from "@verifly/ui";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Verifly" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell>
      <ComingSoon
        feature="Reports & Analytics"
        description="Cohort and pipeline analytics will land once Phase 12's request_metrics table exists — see checklistBackend.md §10.6."
      />
    </AppShell>
  );
}
