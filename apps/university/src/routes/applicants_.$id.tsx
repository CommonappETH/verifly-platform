import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getApplicant } from "@/lib/mock-data";
import type { Student } from "@/lib/types";
import { STATUS_LABEL, STATUS_TONE, VERIF_LABEL, VERIF_TONE, TYPE_TONE, DECISION_LABEL, DECISION_TONE, formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@verifly/utils";
import { Button } from "@verifly/ui";
import { Textarea } from "@verifly/ui";
import { ArrowLeft, Star, AlertCircle, MessageSquarePlus, FileCheck2, FileX2, ShieldCheck, Building2, Calendar, GraduationCap, MapPin, Languages, Award, BookOpen, Trophy } from "lucide-react";

export const Route = createFileRoute("/applicants_/$id")({
  head: ({ params }) => ({ meta: [{ title: `Applicant ${params.id} — Verifly` }] }),
  loader: ({ params }) => {
    const found = getApplicant(params.id);
    if (!found) throw notFound();
    return found;
  },
  component: ApplicantDetail,
  notFoundComponent: () => (
    <AppShell><div className="p-8"><p>Applicant not found.</p><Link to="/applicants" className="text-primary underline">Back</Link></div></AppShell>
  ),
});

function ApplicantDetail() {
  const { id } = useParams({ from: "/applicants_/$id" });
  const a = getApplicant(id) as Student;

  return (
    <AppShell>
      <div className="p-8 max-w-[1400px] mx-auto">
        <Link to="/applicants" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Applicants
        </Link>

        {/* Header card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold text-xl shrink-0" style={{ backgroundColor: a.avatarColor }}>
              {a.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl">{a.name}</h1>
                {a.priority && <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-warning/15 text-warning-foreground border border-warning/30 px-2 py-0.5 rounded-md"><Star className="h-3 w-3 fill-warning" /> Priority</span>}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {a.applicationId} · {a.email} · {a.countryFlag} {a.country}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge tone={STATUS_TONE[a.applicationStatus]}>{STATUS_LABEL[a.applicationStatus]}</Badge>
                <Badge tone={TYPE_TONE[a.applicantType]}>{a.applicantType === "pre_approved" ? "✓ Pre-Approved" : "Normal Applicant"}</Badge>
                <Badge tone={VERIF_TONE[a.verification.status]}>Verification: {VERIF_LABEL[a.verification.status]}</Badge>
                <Badge tone={DECISION_TONE[a.decision.status]}>Decision: {DECISION_LABEL[a.decision.status]}</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button variant="default"><MessageSquarePlus className="h-4 w-4" /> Request Info</Button>
              <Button variant="outline"><Star className="h-4 w-4" /> Mark Priority</Button>
              <Button variant="outline"><AlertCircle className="h-4 w-4" /> Mark Incomplete</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Academic */}
            <Section title="Academic Profile" icon={<GraduationCap className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="School">{a.academic.school}</Field>
                <Field label="Graduation Year">{a.academic.graduationYear}</Field>
                <Field label="GPA">{a.gpa.toFixed(2)}</Field>
                <Field label="Class Rank">{a.academic.classRank}</Field>
                <Field label={a.testScore?.name}>{a.testScore?.value}</Field>
                <Field label="Intended Program">{a.intendedDegree} · {a.intendedMajor}</Field>
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Coursework</div>
                <div className="flex flex-wrap gap-1.5">
                  {a.academic.coursework.map(c => (
                    <span key={c} className="text-xs bg-muted px-2 py-1 rounded">{c}</span>
                  ))}
                </div>
              </div>
            </Section>

            {/* Personal */}
            <Section title="Personal Profile" icon={<MapPin className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Date of Birth">{a.personal.dateOfBirth}</Field>
                <Field label="Citizenship">{a.personal.citizenship}</Field>
                <Field label="Address">{a.personal.address}</Field>
                <Field label="Languages"><span className="inline-flex items-center gap-1.5"><Languages className="h-3.5 w-3.5" />{a.personal.languages.join(", ")}</span></Field>
              </div>
            </Section>

            {/* Activities & Honors */}
            <Section title="Activities & Honors" icon={<Trophy className="h-4 w-4" />}>
              <div className="space-y-3 mb-5">
                {a.activities.map(act => (
                  <div key={act.name} className="border-l-2 border-primary/30 pl-3">
                    <div className="font-medium text-sm">{act.name}</div>
                    <div className="text-xs text-muted-foreground">{act.role} · {act.years}</div>
                    {act.description && <div className="text-sm mt-1">{act.description}</div>}
                  </div>
                ))}
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Honors</div>
              <ul className="space-y-1 text-sm">
                {a.honors.map(h => <li key={h} className="flex items-start gap-2"><Award className="h-3.5 w-3.5 mt-0.5 text-accent-foreground shrink-0" />{h}</li>)}
              </ul>
            </Section>

            {/* Essays */}
            <Section title="Essays" icon={<BookOpen className="h-4 w-4" />}>
              <div className="space-y-5">
                {a.essays.map(e => (
                  <div key={e.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{e.prompt}</div>
                      <span className="text-xs text-muted-foreground">{e.wordCount} words</span>
                    </div>
                    <div className="bg-muted/40 border border-border rounded-md p-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {e.content}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Reviewer Notes */}
            <Section title="Reviewer Notes">
              <div className="space-y-3 mb-4">
                {a.notes.length === 0 && <div className="text-sm text-muted-foreground">No notes yet.</div>}
                {a.notes.map(n => (
                  <div key={n.id} className="bg-muted/40 rounded-md p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium">{n.author}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(n.date)}</div>
                    </div>
                    <div className="text-sm">{n.content}</div>
                  </div>
                ))}
              </div>
              <Textarea placeholder="Add an internal note…" rows={3} />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm">Add Tag</Button>
                <Button size="sm">Save Note</Button>
              </div>
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Financial */}
            <div className={cn("rounded-xl border p-5", a.verification.status === "verified" ? "bg-success/5 border-success/30" : "bg-warning/5 border-warning/30")}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className={cn("h-4 w-4", a.verification.status === "verified" ? "text-success" : "text-warning-foreground")} />
                <h3 className="font-display text-lg">Financial Verification</h3>
              </div>
              <div className="space-y-2.5 text-sm">
                <KV k="Status"><Badge tone={VERIF_TONE[a.verification.status]}>{VERIF_LABEL[a.verification.status]}</Badge></KV>
                <KV k="Pre-Approved Before Applying">
                  {a.verification.preApprovedBeforeApplying ? <span className="text-success font-medium">Yes</span> : <span className="text-muted-foreground">No</span>}
                </KV>
                <KV k="Amount Requested">{formatCurrency(a.verification.amountRequested)}</KV>
                <KV k="Verification Timing">{a.verification.timing.replace("-", " ")}</KV>
                <KV k="Verification ID"><code className="text-xs">{a.verification.verificationId}</code></KV>
                <KV k="Partner Bank"><span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{a.verification.partnerBank}</span></KV>
                <KV k="Bank Status"><span className={cn("text-xs px-1.5 py-0.5 rounded", a.verification.partnerBankStatus === "connected" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground")}>{a.verification.partnerBankStatus}</span></KV>
                {a.verification.verifiedAt && <KV k="Verified On"><span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(a.verification.verifiedAt)}</span></KV>}
              </div>
            </div>

            {/* Scholarship */}
            {a.scholarship && (
              <div className="rounded-xl border border-accent/40 bg-accent/15 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-accent-foreground" />
                  <h3 className="font-display text-lg">Scholarship / Aid</h3>
                </div>
                <div className="space-y-2.5 text-sm">
                  <KV k="Estimated Amount">{formatCurrency(a.scholarship.estimatedAmount)}</KV>
                  <KV k="Tuition Adjustment">−{formatCurrency(a.scholarship.tuitionAdjustment)}</KV>
                  <KV k="Net Verification Amount"><strong>{formatCurrency(a.scholarship.netVerificationAmount)}</strong></KV>
                  <KV k="Review Status"><span className="text-xs px-1.5 py-0.5 rounded bg-card border border-border">{a.scholarship.reviewStatus}</span></KV>
                </div>
                {a.scholarship.notes && <p className="text-xs text-muted-foreground mt-3">{a.scholarship.notes}</p>}
              </div>
            )}

            {/* Decision */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-lg mb-3">Internal Decision</h3>
              <div className="space-y-2 text-sm">
                <KV k="Status"><Badge tone={DECISION_TONE[a.decision.status]}>{DECISION_LABEL[a.decision.status]}</Badge></KV>
                {a.decision.date && <KV k="Decision Date">{formatDate(a.decision.date)}</KV>}
                {a.decision.reviewer && <KV k="Reviewer">{a.decision.reviewer}</KV>}
                {a.decision.financialVerificationRequiredForEnrollment && (
                  <KV k="Verification Required"><span className="text-warning-foreground font-medium">Yes — for enrollment</span></KV>
                )}
              </div>
              {a.decision.rationale && (
                <div className="mt-3 text-xs bg-muted/40 rounded-md p-2.5">{a.decision.rationale}</div>
              )}
              {a.decision.followUpRequirements && a.decision.followUpRequirements.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Follow-up</div>
                  <ul className="text-xs space-y-1">
                    {a.decision.followUpRequirements.map(f => <li key={f}>• {f}</li>)}
                  </ul>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">Admit</Button>
                <Button size="sm" variant="outline">Conditional</Button>
                <Button size="sm" variant="outline">Waitlist</Button>
                <Button size="sm" variant="outline" className="text-destructive">Reject</Button>
              </div>
            </div>

            {/* Documents */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-lg mb-3">Required Materials</h3>
              <div className="space-y-2">
                {a.documents.map(d => (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {d.uploaded
                        ? <FileCheck2 className="h-4 w-4 text-success" />
                        : <FileX2 className="h-4 w-4 text-destructive" />}
                      <span>{d.name}</span>
                    </div>
                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded", d.uploaded ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
                      {d.uploaded ? "Received" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Application completeness */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-lg">Completeness</h3>
                <span className="font-display text-2xl">{a.completeness}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${a.completeness}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-display text-lg mb-4 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{children}</div>
    </div>
  );
}
function KV({ k, children }: { k: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground text-xs">{k}</span><span className="text-right">{children}</span></div>;
}
function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap", tone)}>{children}</span>;
}
