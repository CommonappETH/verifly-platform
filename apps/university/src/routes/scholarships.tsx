import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ComingSoon } from "@verifly/ui";

export const Route = createFileRoute("/scholarships")({
  head: () => ({ meta: [{ title: "Scholarships — Verifly" }] }),
  component: ScholarshipsPage,
});

function ScholarshipsPage() {
  return (
    <AppShell>
      <ComingSoon
        feature="Scholarships & Aid"
        description="Scholarship review workflows are out of scope until the product spec lands — see checklistBackend.md §10.6."
      />
    </AppShell>
  );
}
