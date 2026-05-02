import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/bank/AppShell";
import { ComingSoon } from "@verifly/ui";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Verifly Bank Portal" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <AppShell>
      <ComingSoon
        feature="Messaging"
        description="Conversations with students and verification reminders are tracked as a Phase 11+ follow-up — see checklistBackend.md §10.6."
      />
    </AppShell>
  );
}
