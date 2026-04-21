import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { FundingBreakdown } from "@/components/FundingBreakdown";
import { scholarships, financialSummary } from "@/lib/mock-data";
import { GraduationCap, Calendar, DollarSign, Info, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/dashboard/scholarships")({
  component: ScholarshipsPage,
});

function ScholarshipsPage() {
  const totalScholarships = scholarships.filter((s) => s.status === "awarded").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scholarships</h1>
        <p className="text-sm text-muted-foreground mt-1">Explore scholarship opportunities and see how they affect your funding requirements.</p>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-info/20 bg-info/5 p-4 flex gap-3">
        <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Students may only need to verify the remaining tuition amount after estimated scholarship support, where applicable. Scholarships can significantly reduce your verification requirement.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {scholarships.map((sch) => {
            const sv = { not_applied: { l: "Not Applied", v: "muted" as const }, applied: { l: "Applied", v: "info" as const }, awarded: { l: "Awarded", v: "success" as const } }[sch.status];
            return (
              <Card key={sch.id} className="border-border/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold">{sch.name}</h3>
                          <p className="text-xs text-muted-foreground">{sch.provider}</p>
                        </div>
                        <StatusBadge status={sch.status} label={sv.l} variant={sv.v} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{sch.description}</p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> ${sch.amount.toLocaleString()} — {sch.coverageType}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Deadline: {new Date(sch.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <div className="mt-3 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-medium mb-1">Eligibility</p>
                        <p className="text-xs text-muted-foreground">{sch.eligibility}</p>
                      </div>
                      {sch.status === "not_applied" && (
                        <Button size="sm" className="mt-3 text-xs">Apply Now</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <FundingBreakdown
            totalTuition={financialSummary.totalTuitionNeeded}
            estimatedScholarships={financialSummary.estimatedScholarships}
            remainingAmount={financialSummary.remainingAmount}
            currency={financialSummary.currency}
          />

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Scholarship Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Awarded</span>
                <span className="font-semibold text-success">${totalScholarships.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Applications Pending</span>
                <span className="font-medium">{scholarships.filter((s) => s.status === "applied").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Not Yet Applied</span>
                <span className="font-medium">{scholarships.filter((s) => s.status === "not_applied").length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
