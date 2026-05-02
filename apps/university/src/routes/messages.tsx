import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ComingSoon } from "@verifly/ui";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Verifly" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <AppShell>
      <ComingSoon
        feature="Messaging"
        description="Threaded conversations with applicants and counselors are tracked as a Phase 11+ follow-up — see checklistBackend.md §10.6."
      />
    </AppShell>
  );
}
