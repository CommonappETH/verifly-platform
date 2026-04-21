import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { TimelineStepper } from "@/components/TimelineStepper";
import { FundingBreakdown } from "@/components/FundingBreakdown";
import { applications, universities, applicationStatusLabels, verificationStatusLabels, coreEssays, universitySupplementalEssays } from "@/lib/mock-data";
import { ArrowLeft, Shield, GraduationCap, FileText, AlertCircle, CheckCircle2, Info, PenLine } from "lucide-react";

export const Route = createFileRoute("/dashboard/applications_/$applicationId")({
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { applicationId } = Route.useParams();
  const app = applications.find((a) => a.id === applicationId);

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold mb-2">Application Not Found</h2>
        <Link to="/dashboard/applications"><Button variant="outline">Back to Applications</Button></Link>
      </div>
    );
  }

  const uni = universities.find((u) => u.id === app.universityId);
  const s = applicationStatusLabels[app.status];
  const vs = verificationStatusLabels[app.verificationStatus];
  const showVerNote = app.verificationStatus !== "verified" && app.verificationStatus !== "pre_verified";

  return (
    <div className="space-y-6">
      <Link to="/dashboard/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Applications
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border p-5 bg-card">
        <div className="text-4xl">{uni?.logo || "🏛️"}</div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{app.universityName}</h1>
          <p className="text-sm text-muted-foreground">{app.program}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={app.status} label={s.label} variant={s.color as any} size="md" />
            {app.submittedDate && <span className="text-xs text-muted-foreground">Submitted {new Date(app.submittedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>}
          </div>
        </div>
      </div>

      {/* Conditional acceptance note */}
      {app.status === "conditionally_accepted" && (
        <div className="rounded-lg border border-success/20 bg-success/5 p-4 flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Conditional Acceptance</p>
            <p className="text-xs text-muted-foreground">You've been conditionally accepted! Complete your financial verification to receive a full offer.</p>
          </div>
        </div>
      )}

      {showVerNote && (
        <div className="rounded-lg border border-info/20 bg-info/5 p-4 flex gap-3">
          <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">You can still proceed without full verification</p>
            <p className="text-xs text-muted-foreground">Pre-verification strengthens your profile but is not always required to submit your application.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Application Timeline</CardTitle></CardHeader>
            <CardContent>
              <TimelineStepper events={app.timeline} />
            </CardContent>
          </Card>

          {/* Notes */}
          {app.notes.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Updates & Notes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {app.notes.map((note, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Essays — Common App style */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PenLine className="h-4 w-4 text-primary" /> Essays
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Attach core essays
                </p>
                <div className="space-y-2">
                  {coreEssays.map((essay) => {
                    const uploaded = essay.status === "uploaded";
                    return (
                      <div key={essay.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{essay.name}</p>
                            {uploaded && essay.fileName && (
                              <p className="text-xs text-muted-foreground truncate">{essay.fileName}</p>
                            )}
                          </div>
                        </div>
                        {uploaded ? (
                          <Button variant="outline" size="sm" className="text-xs h-7">Attach</Button>
                        ) : (
                          <Link to="/dashboard/essays">
                            <Button variant="outline" size="sm" className="text-xs h-7">Upload</Button>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {(universitySupplementalEssays[app.universityId] ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {app.universityName} supplemental prompts
                  </p>
                  <div className="space-y-2">
                    {universitySupplementalEssays[app.universityId].map((p) => (
                      <div key={p.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-sm font-medium">{p.prompt}</p>
                          <StatusBadge
                            status={p.required ? "required" : "optional"}
                            label={p.required ? "Required" : "Optional"}
                            variant={p.required ? "warning" : "muted"}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">Word limit: {p.wordLimit}</p>
                        <Button variant="outline" size="sm" className="text-xs h-7">Write response</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Next Steps</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {getNextSteps(app.status, app.verificationStatus).map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
                  <span>{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Verification Status */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Verification Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <StatusBadge status={app.verificationStatus} label={vs.label} variant={vs.color as any} size="md" />
              <p className="text-xs text-muted-foreground">{vs.description}</p>
              <Link to="/dashboard/verification">
                <Button variant="outline" size="sm" className="w-full text-xs">View Verification</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Funding */}
          <FundingBreakdown
            totalTuition={app.tuitionAmount}
            estimatedScholarships={app.estimatedScholarship}
            remainingAmount={app.tuitionAmount - app.estimatedScholarship}
          />

          {/* Documents */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Documents</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Ensure all required documents are uploaded and approved.</p>
              <Link to="/dashboard/documents">
                <Button variant="outline" size="sm" className="w-full text-xs">Manage Documents</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getNextSteps(status: string, verStatus: string): string[] {
  const steps: string[] = [];
  if (verStatus !== "verified" && verStatus !== "pre_verified") steps.push("Complete financial verification to strengthen your application");
  if (status === "draft") steps.push("Finish and submit your application");
  if (status === "awaiting_verification") steps.push("Upload remaining verification documents");
  if (status === "conditionally_accepted") steps.push("Finalize enrollment by completing verification", "Accept the conditional offer within the deadline");
  if (status === "under_review") steps.push("Wait for the admissions team to review your application", "Check back for updates or new document requests");
  if (status === "accepted") steps.push("Accept the offer and begin enrollment process", "Arrange housing and travel");
  return steps.length > 0 ? steps : ["No additional steps needed at this time"];
}
