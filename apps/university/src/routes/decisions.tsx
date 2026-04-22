import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { APPLICANTS } from "@/lib/mock-data";
import { DECISION_LABEL, DECISION_TONE, formatDate, TYPE_TONE, VERIF_TONE, VERIF_LABEL } from "@/lib/format";
import { cn } from "@verifly/utils";
import { Button } from "@verifly/ui";
import type { DecisionStatus } from "@/lib/types";
import { CheckCircle2, AlertTriangle, Clock, XCircle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/decisions")({
  head: () => ({ meta: [{ title: "Decisions — Verifly" }] }),
  component: DecisionsPage,
});

const TABS: { key: DecisionStatus | "all"; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All Decisions", icon: CheckCircle2 },
  { key: "admit", label: "Admit", icon: CheckCircle2 },
  { key: "conditional_admit", label: "Conditional Admit", icon: AlertTriangle },
  { key: "waitlist", label: "Waitlist", icon: Clock },
  { key: "reject", label: "Reject", icon: XCircle },
  { key: "none", label: "Pending", icon: Clock },
];

function DecisionsPage() {
  const [tab, setTab] = useState<DecisionStatus | "all">("all");
  const list = tab === "all" ? APPLICANTS : APPLICANTS.filter(a => a.decision.status === tab);

  const counts: Record<string, number> = {};
  APPLICANTS.forEach(a => { counts[a.decision.status] = (counts[a.decision.status] || 0) + 1; });

  return (
    <AppShell>
      <div className="p-8 max-w-[1500px] mx-auto">
        <PageHeader
          title="Decisions"
          description="Issue and track admission decisions, including conditional admits pending financial verification."
        />

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl p-1.5 inline-flex gap-1 mb-6">
          {TABS.map(t => {
            const count = t.key === "all" ? APPLICANTS.length : counts[t.key] || 0;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-3 py-2 text-sm rounded-md flex items-center gap-2 transition-colors",
                  tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded", tab === t.key ? "bg-primary-foreground/20" : "bg-muted")}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Conditional admit highlight banner when on that tab */}
        {tab === "conditional_admit" && (
          <div className="rounded-xl border border-accent/40 bg-accent/15 p-5 mb-6 flex items-start gap-4">
            <ShieldCheck className="h-5 w-5 text-accent-foreground mt-0.5" />
            <div>
              <div className="font-display text-lg">Conditional Admission Workflow</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                These applicants have been admitted contingent on completing financial verification before enrollment.
                Track follow-up requirements and verification status here.
              </p>
            </div>
          </div>
        )}

        {/* List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Applicant</th>
                <th className="text-left font-medium px-4 py-3">Decision</th>
                <th className="text-left font-medium px-4 py-3">Date</th>
                <th className="text-left font-medium px-4 py-3">Type</th>
                <th className="text-left font-medium px-4 py-3">Verification</th>
                <th className="text-left font-medium px-4 py-3">Follow-Up</th>
                <th className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map(a => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to="/applicants/$id" params={{ id: a.id }} className="flex items-center gap-3 hover:text-primary">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: a.avatarColor }}>
                        {a.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.intendedMajor} · {a.countryFlag} {a.country}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md", DECISION_TONE[a.decision.status])}>
                      {DECISION_LABEL[a.decision.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.decision.date)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md", TYPE_TONE[a.applicantType])}>
                      {a.applicantType === "pre_approved" ? "Pre-Approved" : "Normal"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md", VERIF_TONE[a.verification.status])}>
                      {VERIF_LABEL[a.verification.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                    {a.decision.followUpRequirements && a.decision.followUpRequirements.length > 0
                      ? a.decision.followUpRequirements.join(" · ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline">Review</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
