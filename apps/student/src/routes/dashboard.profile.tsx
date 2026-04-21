import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  studentProfile, universities, applications, documents, coreEssays,
  documentStatusLabels, applicationStatusLabels,
} from "@/lib/mock-data";
import {
  User, Mail, Phone, MapPin, GraduationCap, BookOpen,
  Calendar, Globe, Shield, DollarSign, Heart, Edit, Eye,
  Users, FileText, PenLine, Award, Settings2, AlertCircle,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

type EditingSection = null | "personal" | "academic" | "family" | "funding" | "preferences";

function ProfilePage() {
  const [profile, setProfile] = useState(studentProfile);
  const [editing, setEditing] = useState<EditingSection>(null);
  const p = profile;

  const savedUnis = universities.filter((u) => p.savedUniversities.includes(u.id));

  const completion = useMemo(() => computeCompletion(p), [p]);
  const prompts = useMemo(() => buildPrompts(p), [p]);

  const initials = `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">
                  {p.firstName} {p.lastName}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {p.intendedDegreeLevel} · {p.fieldOfStudy} · {p.nationality}
                </p>
                {p.lastUpdated && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated {p.lastUpdated}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" /> Preview Application Profile
              </Button>
              <Button className="gap-2" onClick={() => setEditing("personal")}>
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Profile Completeness</p>
              <span className="text-sm font-semibold text-primary">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              A complete profile lets you apply faster and unlocks financial pre-verification.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Completion prompts */}
      {prompts.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning-foreground mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">Finish setting up your profile</p>
                <ul className="space-y-1">
                  {prompts.map((t, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <EditDialog
        section={editing}
        profile={p}
        onClose={() => setEditing(null)}
        onSave={(updated) => {
          setProfile((prev) => ({ ...prev, ...updated, lastUpdated: new Date().toISOString().slice(0, 10) }));
          setEditing(null);
          toast.success("Profile updated");
        }}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Details */}
        <SectionCard
          title="Personal Details"
          icon={<User className="h-4 w-4 text-primary" />}
          onEdit={() => setEditing("personal")}
        >
          <DetailRow icon={<User className="h-4 w-4" />} label="Full Name" value={joinName(p)} />
          <DetailRow icon={<User className="h-4 w-4" />} label="Preferred Name" value={p.preferredName} />
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={p.dateOfBirth} />
          <DetailRow icon={<User className="h-4 w-4" />} label="Gender" value={p.gender} />
          <DetailRow icon={<Globe className="h-4 w-4" />} label="Nationality" value={p.nationality} />
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Country of Residence" value={p.countryOfResidence} />
          <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={p.phone} />
          <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={p.email} />
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={p.currentAddress} />
          <DetailRow icon={<Shield className="h-4 w-4" />} label="Passport" value={p.passportNumber} />
          <DetailRow icon={<Users className="h-4 w-4" />} label="Emergency Contact" value={
            p.emergencyContactName ? `${p.emergencyContactName} · ${p.emergencyContactPhone ?? ""}` : undefined
          } />
        </SectionCard>

        {/* Academic Background */}
        <SectionCard
          title="Academic Background"
          icon={<GraduationCap className="h-4 w-4 text-primary" />}
          onEdit={() => setEditing("academic")}
        >
          <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Most Recent School" value={p.previousInstitution} />
          <DetailRow icon={<Globe className="h-4 w-4" />} label="School Country" value={p.schoolCountry} />
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="Graduation Year" value={p.graduationYear} />
          <DetailRow icon={<GraduationCap className="h-4 w-4" />} label="GPA" value={p.gpa} />
          <DetailRow icon={<GraduationCap className="h-4 w-4" />} label="Grading Scale" value={p.gradingScale} />
          <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Curriculum" value={p.curriculum} />
          <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Stream" value={p.stream} />
          <DetailRow icon={<GraduationCap className="h-4 w-4" />} label="Intended Degree" value={p.intendedDegreeLevel} />
          <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Intended Major" value={p.fieldOfStudy} />
          <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Academic Interests" value={p.academicInterests} />
          <DetailRow icon={<Globe className="h-4 w-4" />} label="English Proficiency" value={`${p.englishProficiency} — ${p.testScore}`} />
        </SectionCard>

        {/* Family / Sponsorship */}
        <SectionCard
          title="Family & Sponsorship"
          icon={<Users className="h-4 w-4 text-primary" />}
          onEdit={() => setEditing("family")}
        >
          <DetailRow icon={<User className="h-4 w-4" />} label="Sponsor Name" value={p.sponsorName} />
          <DetailRow icon={<Users className="h-4 w-4" />} label="Relationship" value={p.sponsorRelationship} />
          <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Sponsor Occupation" value={p.sponsorOccupation} />
          <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Employer / Business" value={p.sponsorEmployer} />
          <DetailRow icon={<Users className="h-4 w-4" />} label="Household Size" value={p.householdSize} />
          <DetailRow icon={<Users className="h-4 w-4" />} label="Dependents" value={p.dependents} />
          <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Annual Income Range" value={p.annualIncomeRange} />
          <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Primary Funding Source" value={p.fundingSource} />
        </SectionCard>

        {/* Funding Plan */}
        <SectionCard
          title="Funding Plan"
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          onEdit={() => setEditing("funding")}
        >
          <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Estimated Budget" value={fmtMoney(p.estimatedBudget, p.currency)} />
          <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Available Liquid Funds" value={fmtMoney(p.liquidFunds, p.currency)} />
          <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Sponsor Contribution" value={fmtMoney(p.sponsorContribution, p.currency)} />
          <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Scholarship Expectation" value={fmtMoney(p.scholarshipExpectation, p.currency)} />
          <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Funding Gap" value={fmtMoney(computeGap(p), p.currency)} />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusBadge status="under_review" label="Verification: Under Review" variant="info" />
            <StatusBadge
              status={p.preApprovalStatus ?? "not_started"}
              label={p.preApprovalStatus === "approved" ? "Pre-approved" : p.preApprovalStatus === "pending" ? "Pre-approval Pending" : "Pre-approval Not Started"}
              variant={p.preApprovalStatus === "approved" ? "success" : p.preApprovalStatus === "pending" ? "warning" : "muted"}
            />
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Financial details may be shared with universities and partner banks during verification.
          </p>
        </SectionCard>

        {/* Documents Status */}
        <SectionCard
          title="Documents Status"
          icon={<FileText className="h-4 w-4 text-primary" />}
          action={
            <Link to="/dashboard/documents">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          }
        >
          {profileDocs().map((d) => (
            <DocumentStatusRow key={d.label} label={d.label} doc={d.doc} />
          ))}
        </SectionCard>

        {/* Essays Status */}
        <SectionCard
          title="Essays Status"
          icon={<PenLine className="h-4 w-4 text-primary" />}
          action={
            <Link to="/dashboard/essays">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Go to Essays <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          }
        >
          {coreEssays.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-1.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{e.name}</p>
                {e.uploadedDate && (
                  <p className="text-xs text-muted-foreground">Uploaded {e.uploadedDate}</p>
                )}
              </div>
              <StatusBadge
                status={e.status}
                label={e.status === "uploaded" ? "Uploaded" : "Missing"}
                variant={e.status === "uploaded" ? "success" : "destructive"}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
            University-specific essays appear inside each university's application when required.
          </p>
        </SectionCard>

        {/* Activities & Honors */}
        <SectionCard
          title="Activities & Honors"
          icon={<Award className="h-4 w-4 text-primary" />}
          action={
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Manage <ArrowRight className="h-3 w-3" />
            </Button>
          }
        >
          <div className="flex gap-6 pb-2">
            <div>
              <p className="text-2xl font-bold">{p.activities?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Activities</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{p.honors?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Honors</p>
            </div>
          </div>
          <div className="space-y-1.5 border-t pt-3">
            {p.activities?.slice(0, 2).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.role} · {a.years}</span>
              </div>
            ))}
            {p.honors?.slice(0, 1).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{h.name}</span>
                <span className="text-xs text-muted-foreground">{h.year}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Preferences */}
        <SectionCard
          title="Preferences"
          icon={<Settings2 className="h-4 w-4 text-primary" />}
          onEdit={() => setEditing("preferences")}
        >
          <DetailRow icon={<Globe className="h-4 w-4" />} label="Preferred Countries" value={p.preferredCountries?.join(", ")} />
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="Preferred Intake" value={p.preferredIntake} />
          <DetailRow icon={<GraduationCap className="h-4 w-4" />} label="Preferred Degree Level" value={p.preferredDegreeLevel} />
          <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Areas of Interest" value={p.areasOfInterest?.join(", ")} />
          <DetailRow icon={<Mail className="h-4 w-4" />} label="Notifications" value={p.notificationPreferences} />
        </SectionCard>
      </div>

      {/* Saved Universities — full width */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" /> Saved Universities
          </CardTitle>
          <Link to="/dashboard/explore">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {savedUnis.map((u) => {
              const stage = stageForUni(u.id);
              return (
                <Link
                  key={u.id}
                  to="/dashboard/university/$universityId"
                  params={{ universityId: u.id }}
                >
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{u.logo}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.country} · Deadline {u.applicationDeadline}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={stage.label} label={stage.label} variant={stage.variant} />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function joinName(p: typeof studentProfile) {
  return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");
}

function fmtMoney(n: number | undefined, currency: string) {
  if (n == null) return undefined;
  return `$${n.toLocaleString()} ${currency}`;
}

function computeGap(p: typeof studentProfile) {
  const have = (p.liquidFunds ?? 0) + (p.sponsorContribution ?? 0) + (p.scholarshipExpectation ?? 0);
  return Math.max(0, (p.estimatedBudget ?? 0) - have);
}

function computeCompletion(p: typeof studentProfile) {
  const sections = [
    !!(p.firstName && p.lastName && p.dateOfBirth && p.phone && p.email && p.currentAddress && p.passportNumber),
    !!(p.previousInstitution && p.gpa && p.intendedDegreeLevel && p.fieldOfStudy && p.englishProficiency),
    !!(p.sponsorName && p.sponsorRelationship && p.annualIncomeRange && p.fundingSource),
    !!(p.estimatedBudget && p.liquidFunds != null && p.sponsorContribution != null),
    !!(p.preferredCountries?.length && p.preferredIntake),
    coreEssays.some((e) => e.status === "uploaded"),
    documents.some((d) => d.status === "approved" || d.status === "uploaded"),
  ];
  const filled = sections.filter(Boolean).length;
  return Math.round((filled / sections.length) * 100);
}

function buildPrompts(p: typeof studentProfile): string[] {
  const out: string[] = [];
  if (!p.emergencyContactName) out.push("Add an emergency contact for visa and enrollment forms.");
  if (!p.graduationYear || !p.gradingScale) out.push("Complete your academic history to strengthen your applications.");
  const missingDocs = profileDocs().filter((d) => !d.doc || d.doc.status === "missing");
  if (missingDocs.length) out.push("Upload missing documents to continue financial verification.");
  if (coreEssays.some((e) => e.status === "missing")) out.push("Finish your core essays before applying.");
  return out.slice(0, 3);
}

function profileDocs() {
  const map = (name: string) => documents.find((d) => d.name.toLowerCase().includes(name.toLowerCase()));
  return [
    { label: "Passport", doc: map("Passport") },
    { label: "Transcript", doc: map("Transcript") },
    { label: "Recommendation Letters", doc: undefined as ReturnType<typeof map> },
    { label: "English Proficiency Report", doc: map("IELTS") },
    { label: "Financial Statement", doc: map("Bank Statement") },
    { label: "Bank Letter", doc: map("Bank Verification") },
  ];
}

function stageForUni(uniId: string): { label: string; variant: "muted" | "info" | "success" } {
  const app = applications.find((a) => a.universityId === uniId);
  if (!app) return { label: "Saved", variant: "muted" };
  if (app.status === "draft") return { label: "In Progress", variant: "info" };
  return { label: "Applied", variant: "success" };
}

/* ---------------- subcomponents ---------------- */

function SectionCard({
  title, icon, onEdit, action, children,
}: {
  title: string;
  icon: React.ReactNode;
  onEdit?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        {action ?? (onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 w-7 p-0">
            <Edit className="h-3.5 w-3.5" />
          </Button>
        ))}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function DetailRow({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  const empty = !value;
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {empty ? (
          <p className="text-sm font-medium text-warning-foreground/70 italic">Not provided</p>
        ) : (
          <p className="text-sm font-medium break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function DocumentStatusRow({
  label, doc,
}: {
  label: string;
  doc: ReturnType<typeof documents.find>;
}) {
  const status = doc?.status ?? "missing";
  const meta = documentStatusLabels[status] ?? { label: "Missing", color: "destructive" };
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {doc?.uploadedDate && (
          <p className="text-xs text-muted-foreground">Uploaded {doc.uploadedDate}</p>
        )}
      </div>
      <StatusBadge status={status} label={meta.label} variant={meta.color as "muted" | "success" | "warning" | "info" | "destructive"} />
    </div>
  );
}

/* ---------------- edit dialog ---------------- */

function EditDialog({
  section, profile, onClose, onSave,
}: {
  section: EditingSection;
  profile: typeof studentProfile;
  onClose: () => void;
  onSave: (updated: Partial<typeof studentProfile>) => void;
}) {
  const open = section !== null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        {section === "personal" && <PersonalForm profile={profile} onSave={onSave} onClose={onClose} />}
        {section === "academic" && <AcademicForm profile={profile} onSave={onSave} onClose={onClose} />}
        {section === "family" && <FamilyForm profile={profile} onSave={onSave} onClose={onClose} />}
        {section === "funding" && <FundingForm profile={profile} onSave={onSave} onClose={onClose} />}
        {section === "preferences" && <PreferencesForm profile={profile} onSave={onSave} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

type FormProps = {
  profile: typeof studentProfile;
  onSave: (u: Partial<typeof studentProfile>) => void;
  onClose: () => void;
};

function FormShell({
  title, description, onClose, onSubmit, children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
        {children}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </DialogFooter>
      </form>
    </>
  );
}

function Field({ id, label, value, onChange, type = "text" }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PersonalForm({ profile, onSave, onClose }: FormProps) {
  const [f, setF] = useState({
    firstName: profile.firstName, middleName: profile.middleName ?? "", lastName: profile.lastName,
    preferredName: profile.preferredName ?? "", email: profile.email, phone: profile.phone,
    dateOfBirth: profile.dateOfBirth, gender: profile.gender ?? "",
    nationality: profile.nationality, countryOfResidence: profile.countryOfResidence ?? "",
    currentAddress: profile.currentAddress, passportNumber: profile.passportNumber,
    emergencyContactName: profile.emergencyContactName ?? "", emergencyContactPhone: profile.emergencyContactPhone ?? "",
  });
  const u = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <FormShell title="Edit Personal Details" description="Update your personal information." onClose={onClose} onSubmit={() => onSave(f)}>
      <div className="grid grid-cols-2 gap-3">
        <Field id="firstName" label="First Name" value={f.firstName} onChange={u("firstName")} />
        <Field id="middleName" label="Middle Name" value={f.middleName} onChange={u("middleName")} />
        <Field id="lastName" label="Last Name" value={f.lastName} onChange={u("lastName")} />
        <Field id="preferredName" label="Preferred Name" value={f.preferredName} onChange={u("preferredName")} />
        <Field id="dateOfBirth" label="Date of Birth" value={f.dateOfBirth} onChange={u("dateOfBirth")} />
        <Field id="gender" label="Gender" value={f.gender} onChange={u("gender")} />
        <Field id="nationality" label="Nationality" value={f.nationality} onChange={u("nationality")} />
        <Field id="countryOfResidence" label="Country of Residence" value={f.countryOfResidence} onChange={u("countryOfResidence")} />
        <Field id="email" label="Email" type="email" value={f.email} onChange={u("email")} />
        <Field id="phone" label="Phone" value={f.phone} onChange={u("phone")} />
      </div>
      <Field id="currentAddress" label="Address" value={f.currentAddress} onChange={u("currentAddress")} />
      <div className="grid grid-cols-2 gap-3">
        <Field id="passportNumber" label="Passport" value={f.passportNumber} onChange={u("passportNumber")} />
        <Field id="emergencyContactName" label="Emergency Contact" value={f.emergencyContactName} onChange={u("emergencyContactName")} />
      </div>
      <Field id="emergencyContactPhone" label="Emergency Contact Phone" value={f.emergencyContactPhone} onChange={u("emergencyContactPhone")} />
    </FormShell>
  );
}

function AcademicForm({ profile, onSave, onClose }: FormProps) {
  const [f, setF] = useState({
    previousInstitution: profile.previousInstitution, schoolCountry: profile.schoolCountry ?? "",
    graduationYear: profile.graduationYear ?? "", gpa: profile.gpa, gradingScale: profile.gradingScale ?? "",
    intendedDegreeLevel: profile.intendedDegreeLevel, fieldOfStudy: profile.fieldOfStudy,
    academicInterests: profile.academicInterests ?? "", curriculum: profile.curriculum ?? "",
    stream: profile.stream ?? "", englishProficiency: profile.englishProficiency, testScore: profile.testScore,
  });
  const u = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <FormShell title="Edit Academic Background" description="Update your academic history." onClose={onClose} onSubmit={() => onSave(f)}>
      <Field id="previousInstitution" label="Most Recent School" value={f.previousInstitution} onChange={u("previousInstitution")} />
      <div className="grid grid-cols-2 gap-3">
        <Field id="schoolCountry" label="School Country" value={f.schoolCountry} onChange={u("schoolCountry")} />
        <Field id="graduationYear" label="Graduation Year" value={f.graduationYear} onChange={u("graduationYear")} />
        <Field id="gpa" label="GPA" value={f.gpa} onChange={u("gpa")} />
        <Field id="gradingScale" label="Grading Scale" value={f.gradingScale} onChange={u("gradingScale")} />
        <Field id="curriculum" label="Curriculum" value={f.curriculum} onChange={u("curriculum")} />
        <Field id="stream" label="Stream" value={f.stream} onChange={u("stream")} />
        <Field id="intendedDegreeLevel" label="Intended Degree" value={f.intendedDegreeLevel} onChange={u("intendedDegreeLevel")} />
        <Field id="fieldOfStudy" label="Intended Major" value={f.fieldOfStudy} onChange={u("fieldOfStudy")} />
        <Field id="englishProficiency" label="English Test" value={f.englishProficiency} onChange={u("englishProficiency")} />
        <Field id="testScore" label="Test Score" value={f.testScore} onChange={u("testScore")} />
      </div>
      <Field id="academicInterests" label="Academic Interests" value={f.academicInterests} onChange={u("academicInterests")} />
    </FormShell>
  );
}

function FamilyForm({ profile, onSave, onClose }: FormProps) {
  const [f, setF] = useState({
    sponsorName: profile.sponsorName, sponsorRelationship: profile.sponsorRelationship,
    sponsorOccupation: profile.sponsorOccupation, sponsorEmployer: profile.sponsorEmployer ?? "",
    householdSize: profile.householdSize ?? "", dependents: profile.dependents ?? "",
    annualIncomeRange: profile.annualIncomeRange ?? "", fundingSource: profile.fundingSource ?? "",
  });
  const u = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <FormShell title="Edit Family & Sponsorship" description="Update sponsorship and family information." onClose={onClose} onSubmit={() => onSave(f)}>
      <div className="grid grid-cols-2 gap-3">
        <Field id="sponsorName" label="Sponsor Name" value={f.sponsorName} onChange={u("sponsorName")} />
        <Field id="sponsorRelationship" label="Relationship" value={f.sponsorRelationship} onChange={u("sponsorRelationship")} />
        <Field id="sponsorOccupation" label="Occupation" value={f.sponsorOccupation} onChange={u("sponsorOccupation")} />
        <Field id="sponsorEmployer" label="Employer / Business" value={f.sponsorEmployer} onChange={u("sponsorEmployer")} />
        <Field id="householdSize" label="Household Size" value={f.householdSize} onChange={u("householdSize")} />
        <Field id="dependents" label="Dependents" value={f.dependents} onChange={u("dependents")} />
        <Field id="annualIncomeRange" label="Annual Income Range" value={f.annualIncomeRange} onChange={u("annualIncomeRange")} />
        <Field id="fundingSource" label="Primary Funding Source" value={f.fundingSource} onChange={u("fundingSource")} />
      </div>
    </FormShell>
  );
}

function FundingForm({ profile, onSave, onClose }: FormProps) {
  const [f, setF] = useState({
    estimatedBudget: String(profile.estimatedBudget),
    liquidFunds: String(profile.liquidFunds ?? ""),
    sponsorContribution: String(profile.sponsorContribution ?? ""),
    scholarshipExpectation: String(profile.scholarshipExpectation ?? ""),
  });
  const u = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <FormShell title="Edit Funding Plan" description="Update your funding details." onClose={onClose} onSubmit={() => onSave({
      estimatedBudget: Number(f.estimatedBudget) || 0,
      liquidFunds: Number(f.liquidFunds) || 0,
      sponsorContribution: Number(f.sponsorContribution) || 0,
      scholarshipExpectation: Number(f.scholarshipExpectation) || 0,
    })}>
      <div className="grid grid-cols-2 gap-3">
        <Field id="estimatedBudget" label="Estimated Budget" type="number" value={f.estimatedBudget} onChange={u("estimatedBudget")} />
        <Field id="liquidFunds" label="Liquid Funds" type="number" value={f.liquidFunds} onChange={u("liquidFunds")} />
        <Field id="sponsorContribution" label="Sponsor Contribution" type="number" value={f.sponsorContribution} onChange={u("sponsorContribution")} />
        <Field id="scholarshipExpectation" label="Scholarship Expectation" type="number" value={f.scholarshipExpectation} onChange={u("scholarshipExpectation")} />
      </div>
    </FormShell>
  );
}

function PreferencesForm({ profile, onSave, onClose }: FormProps) {
  const [f, setF] = useState({
    preferredCountries: (profile.preferredCountries ?? []).join(", "),
    preferredIntake: profile.preferredIntake ?? "",
    preferredDegreeLevel: profile.preferredDegreeLevel ?? "",
    areasOfInterest: (profile.areasOfInterest ?? []).join(", "),
    notificationPreferences: profile.notificationPreferences ?? "",
  });
  const u = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <FormShell title="Edit Preferences" description="Update your study preferences." onClose={onClose} onSubmit={() => onSave({
      preferredCountries: f.preferredCountries.split(",").map((s) => s.trim()).filter(Boolean),
      preferredIntake: f.preferredIntake,
      preferredDegreeLevel: f.preferredDegreeLevel,
      areasOfInterest: f.areasOfInterest.split(",").map((s) => s.trim()).filter(Boolean),
      notificationPreferences: f.notificationPreferences,
    })}>
      <Field id="preferredCountries" label="Preferred Countries (comma separated)" value={f.preferredCountries} onChange={u("preferredCountries")} />
      <div className="grid grid-cols-2 gap-3">
        <Field id="preferredIntake" label="Preferred Intake" value={f.preferredIntake} onChange={u("preferredIntake")} />
        <Field id="preferredDegreeLevel" label="Preferred Degree Level" value={f.preferredDegreeLevel} onChange={u("preferredDegreeLevel")} />
      </div>
      <Field id="areasOfInterest" label="Areas of Interest (comma separated)" value={f.areasOfInterest} onChange={u("areasOfInterest")} />
      <Field id="notificationPreferences" label="Notification Preferences" value={f.notificationPreferences} onChange={u("notificationPreferences")} />
    </FormShell>
  );
}
