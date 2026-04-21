import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { universities } from "@/lib/mock-data";
import {
  MapPin, Globe, GraduationCap, Calendar, Shield, DollarSign,
  Bookmark, ArrowLeft, CheckCircle2, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/university/$universityId")({
  component: UniversityDetail,
});

function UniversityDetail() {
  const { universityId } = Route.useParams();
  const uni = universities.find((u) => u.id === universityId);

  if (!uni) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold mb-2">University Not Found</h2>
        <Link to="/dashboard/explore"><Button variant="outline">Browse Universities</Button></Link>
      </div>
    );
  }

  const prefMap = {
    required: { label: "Verification Required", variant: "warning" as const, desc: "This university requires financial verification before your application can be reviewed." },
    preferred: { label: "Verification Preferred", variant: "info" as const, desc: "Pre-verified students may receive priority review, but you can still apply without verification." },
    optional: { label: "Verification Optional", variant: "success" as const, desc: "Financial verification is not required for this university. You can complete it at any time." },
  };
  const pref = prefMap[uni.verificationPreference];

  return (
    <div className="space-y-6">
      <Link to="/dashboard/explore" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Universities
      </Link>

      {/* Header */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-accent/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-5xl">{uni.logo}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{uni.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {uni.city}, {uni.country}</span>
              <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {uni.ranking}</span>
              <span className="flex items-center gap-1">Acceptance: {uni.acceptanceRate}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1"><Bookmark className="h-4 w-4" /> Save</Button>
            <Button size="sm" className="gap-1">Start Application</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Overview</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{uni.description}</p></CardContent>
          </Card>

          {/* Programs */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Programs Offered</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {uni.programs.map((p) => (
                  <span key={p} className="rounded-full border px-3 py-1 text-xs font-medium">{p}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Verification */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Financial Verification</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={uni.verificationPreference} label={pref.label} variant={pref.variant} size="md" />
              </div>
              <p className="text-sm text-muted-foreground">{pref.desc}</p>
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">Estimated Verification Amount</p>
                <p className="text-2xl font-bold text-primary">${uni.tuitionMin.toLocaleString()} – ${uni.tuitionMax.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">This amount may be lower if you have scholarship support.</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Shield className="h-3.5 w-3.5" /> Check Financial Eligibility
              </Button>
            </CardContent>
          </Card>

          {/* Admissions Notes */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Admissions Notes</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{uni.admissionsNotes}</p></CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Key Details */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Key Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Tuition Range" value={`$${uni.tuitionMin.toLocaleString()} – $${uni.tuitionMax.toLocaleString()}/yr`} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Deadline" value={new Date(uni.applicationDeadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
              <DetailRow icon={<Globe className="h-4 w-4" />} label="Location" value={`${uni.city}, ${uni.country}`} />
              <DetailRow icon={<GraduationCap className="h-4 w-4" />} label="Ranking" value={uni.ranking} />
            </CardContent>
          </Card>

          {/* Scholarships */}
          {uni.scholarshipAvailable && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Scholarship Opportunities</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{uni.scholarshipNote}</p>
                <Link to="/dashboard/scholarships" className="mt-3 block">
                  <Button variant="outline" size="sm" className="w-full text-xs">View Scholarships</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Readiness Checklist */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Application Readiness</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Student profile complete", done: true },
                { label: "Academic documents uploaded", done: true },
                { label: "English proficiency verified", done: true },
                { label: "Financial verification started", done: false },
                { label: "Application form filled", done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className={`h-4 w-4 ${item.done ? "text-success" : "text-muted-foreground/40"}`} />
                  <span className={item.done ? "" : "text-muted-foreground"}>{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
