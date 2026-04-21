import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@verifly/ui";
import { Textarea } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Switch } from "@verifly/ui";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Verifly" }] }),
  component: SettingsPage,
});

const SECTIONS = [
  "University Profile",
  "Admissions Cycle",
  "Required Components",
  "Scholarship Policy",
  "Verification Preferences",
  "Reviewer Roles",
  "Messaging Templates",
];

function SettingsPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-[1300px] mx-auto">
        <PageHeader title="Settings" description="Manage your university's admissions configuration and team." />

        <div className="grid grid-cols-12 gap-6">
          <nav className="col-span-3 space-y-1 sticky top-20 self-start">
            {SECTIONS.map((s, i) => (
              <a key={s} href={`#${s}`}
                className={`block px-3 py-2 rounded-md text-sm ${i === 0 ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                {s}
              </a>
            ))}
          </nav>

          <div className="col-span-9 space-y-6">
            <Card title="University Profile">
              <Field label="University Name"><Input defaultValue="Hartwell University" /></Field>
              <Field label="Admissions Email"><Input defaultValue="admissions@hartwell.edu" /></Field>
              <Field label="Public Description"><Textarea rows={3} defaultValue="A leading liberal arts and research university committed to global excellence." /></Field>
              <SaveBar />
            </Card>

            <Card title="Admissions Cycle">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Cycle Name"><Input defaultValue="Fall 2025" /></Field>
                <Field label="Application Open Date"><Input defaultValue="2024-08-01" /></Field>
                <Field label="Early Decision Deadline"><Input defaultValue="2024-11-01" /></Field>
                <Field label="Regular Decision Deadline"><Input defaultValue="2025-01-05" /></Field>
              </div>
              <SaveBar />
            </Card>

            <Card title="Required Application Components">
              {["Official Transcript", "Passport Copy", "TOEFL/IELTS", "2× Recommendations", "Personal Statement", "Financial Verification"].map(c => (
                <Toggle key={c} label={c} defaultOn />
              ))}
            </Card>

            <Card title="Scholarship Policy">
              <Toggle label="Auto-suggest merit awards based on GPA" defaultOn />
              <Toggle label="Allow conditional aid pending verification" defaultOn />
              <Field label="Maximum Award Amount"><Input defaultValue="$30,000" /></Field>
              <SaveBar />
            </Card>

            <Card title="Financial Verification Preferences">
              <Toggle label="Require pre-approval for international applicants" />
              <Toggle label="Allow conditional admission with pending verification" defaultOn />
              <Field label="Minimum Required Verification Amount"><Input defaultValue="$45,000" /></Field>
              <SaveBar />
            </Card>

            <Card title="Reviewer Roles & Permissions">
              <div className="space-y-2">
                {[
                  { name: "Dr. Eleanor Pierce", role: "Director" },
                  { name: "James Okafor", role: "Senior Reviewer" },
                  { name: "Anya Volkov", role: "Reviewer" },
                  { name: "Marcus Chen", role: "Financial Coordinator" },
                ].map(r => (
                  <div key={r.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.role}</div>
                    </div>
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Messaging Templates">
              {["Missing Document Request", "Verification Reminder", "Conditional Admission Notice", "Decision Notification"].map(t => (
                <div key={t} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm">{t}</span>
                  <Button size="sm" variant="outline">Edit Template</Button>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section id={title} className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-display text-lg mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>{children}</div>;
}
function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultOn} />
    </div>
  );
}
function SaveBar() {
  return <div className="flex justify-end gap-2 pt-2"><Button variant="outline" size="sm">Cancel</Button><Button size="sm">Save Changes</Button></div>;
}
