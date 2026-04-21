import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { APPLICANTS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Verifly" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const total = APPLICANTS.length;
  const byCountry = group(APPLICANTS, a => a.country);
  const byDegree = group(APPLICANTS, a => a.intendedDegree);
  const preApproved = APPLICANTS.filter(a => a.applicantType === "pre-approved").length;
  const normal = total - preApproved;
  const admittedPre = APPLICANTS.filter(a => a.applicantType === "pre-approved" && (a.applicationStatus === "admitted" || a.applicationStatus === "conditionally-admitted")).length;
  const admittedNorm = APPLICANTS.filter(a => a.applicantType === "normal" && (a.applicationStatus === "admitted" || a.applicationStatus === "conditionally-admitted")).length;
  const condCount = APPLICANTS.filter(a => a.applicationStatus === "conditionally-admitted").length;
  const verifRate = Math.round(APPLICANTS.filter(a => a.verification.status === "verified").length / total * 100);
  const aidAdjusted = APPLICANTS.filter(a => a.scholarship).length;

  return (
    <AppShell>
      <div className="p-8 max-w-[1500px] mx-auto">
        <PageHeader title="Reports & Analytics" description="Cycle-level insights across geography, programs, and verification outcomes." />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Applications by Country">
            <BarList data={byCountry} max={Math.max(...byCountry.map(d => d.value))} />
          </Panel>

          <Panel title="Applications by Degree">
            <BarList data={byDegree} max={Math.max(...byDegree.map(d => d.value))} />
          </Panel>

          <Panel title="Pre-Approved vs Normal">
            <div className="flex items-end gap-6">
              <Big label="Pre-Approved" value={preApproved} pct={Math.round(preApproved/total*100)} color="bg-success" />
              <Big label="Normal" value={normal} pct={Math.round(normal/total*100)} color="bg-primary" />
            </div>
          </Panel>

          <Panel title="Admission Rate by Applicant Type">
            <div className="space-y-4">
              <RateRow label="Pre-Approved Applicants" value={admittedPre} total={preApproved} />
              <RateRow label="Normal Applicants" value={admittedNorm} total={normal} />
            </div>
          </Panel>

          <Panel title="Verification Completion Rate">
            <div className="text-center py-6">
              <div className="font-display text-6xl text-primary">{verifRate}%</div>
              <div className="text-sm text-muted-foreground mt-2">of applicants have verified financial documents</div>
            </div>
          </Panel>

          <Panel title="Conditional Admission & Scholarship Stats">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Conditional Admits Issued" value={condCount} />
              <Stat label="Aid-Adjusted Applicants" value={aidAdjusted} />
              <Stat label="Avg. Verification Amount" value={formatCurrency(Math.round(APPLICANTS.reduce((s,a) => s+a.verification.amountRequested, 0) / total))} />
              <Stat label="Total Aid Awarded" value={formatCurrency(APPLICANTS.reduce((s,a) => s + (a.scholarship?.estimatedAmount || 0), 0))} />
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function group<T>(items: T[], key: (t: T) => string) {
  const map: Record<string, number> = {};
  items.forEach(i => { const k = key(i); map[k] = (map[k] || 0) + 1; });
  return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-display text-lg mb-4">{title}</h3>
      {children}
    </div>
  );
}
function BarList({ data, max }: { data: { label: string; value: number }[]; max: number }) {
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-sm w-32 truncate">{d.label}</span>
          <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${d.value/max*100}%` }} />
          </div>
          <span className="text-sm text-muted-foreground w-8 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
function Big({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-4xl mt-1">{value}</div>
      <div className="text-sm text-muted-foreground">{pct}% of total</div>
      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
function RateRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round(value/total*100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5"><span>{label}</span><span className="text-muted-foreground">{value}/{total} · {pct}%</span></div>
      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-success" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-md p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}
