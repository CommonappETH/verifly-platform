import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { APPLICANTS } from "@/lib/mock-data";
import { formatCurrency, TYPE_TONE } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Award, DollarSign, TrendingDown, Users } from "lucide-react";

export const Route = createFileRoute("/scholarships")({
  head: () => ({ meta: [{ title: "Scholarships & Aid — Verifly" }] }),
  component: ScholarshipsPage,
});

function ScholarshipsPage() {
  const aid = APPLICANTS.filter(a => a.scholarship);
  const totalAwarded = aid.reduce((s, a) => s + (a.scholarship?.estimatedAmount || 0), 0);
  const avgAward = aid.length ? Math.round(totalAwarded / aid.length) : 0;
  const tuition = 52000;

  return (
    <AppShell>
      <div className="p-8 max-w-[1500px] mx-auto">
        <PageHeader
          title="Scholarships & Aid"
          description="Manage institutional aid awards and the resulting net financial verification amounts."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Aid Recipients" value={aid.length} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Total Awarded" value={formatCurrency(totalAwarded)} tone="accent" icon={<Award className="h-4 w-4" />} />
          <StatCard label="Average Award" value={formatCurrency(avgAward)} icon={<DollarSign className="h-4 w-4" />} />
          <StatCard label="Pending Review" value={aid.filter(a => a.scholarship?.reviewStatus === "proposed").length} tone="warning" icon={<TrendingDown className="h-4 w-4" />} />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Applicant</th>
                <th className="text-left font-medium px-4 py-3">Type</th>
                <th className="text-right font-medium px-4 py-3">Original Tuition</th>
                <th className="text-right font-medium px-4 py-3">Scholarship</th>
                <th className="text-right font-medium px-4 py-3">Tuition Adj.</th>
                <th className="text-right font-medium px-4 py-3">Net Verification</th>
                <th className="text-left font-medium px-4 py-3">Aid Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {aid.map(a => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to="/applicants/$id" params={{ id: a.id }} className="flex items-center gap-3 hover:text-primary">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: a.avatarColor }}>
                        {a.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.intendedMajor}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md", TYPE_TONE[a.applicantType])}>
                      {a.applicantType === "pre-approved" ? "Pre-Approved" : "Normal"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(tuition)}</td>
                  <td className="px-4 py-3 text-right font-mono text-accent-foreground">{formatCurrency(a.scholarship!.estimatedAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-success">−{formatCurrency(a.scholarship!.tuitionAdjustment)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(a.scholarship!.netVerificationAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md capitalize",
                      a.scholarship!.reviewStatus === "approved" ? "bg-success/15 text-success border border-success/30"
                      : a.scholarship!.reviewStatus === "proposed" ? "bg-warning/15 text-warning-foreground border border-warning/30"
                      : "bg-muted text-muted-foreground")}>
                      {a.scholarship!.reviewStatus}
                    </span>
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
