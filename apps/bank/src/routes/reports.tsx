import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/bank/AppShell";
import { ComingSoon } from "@verifly/ui";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Verifly Bank Portal" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell>
      <ComingSoon
        feature="Reports & Analytics"
        description="Decision throughput, time-to-decision distributions, and risk dashboards land once Phase 12's request_metrics table exists — see checklistBackend.md §10.6."
      />
    </AppShell>
  );
}
