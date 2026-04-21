import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { APPLICANTS } from "@/lib/mock-data";
import { STATUS_LABEL, STATUS_TONE, VERIF_LABEL, VERIF_TONE, TYPE_TONE, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Star, FileText, MessageSquarePlus, StickyNote, Filter, ArrowUpDown, Award } from "lucide-react";

export const Route = createFileRoute("/applicants")({
  head: () => ({ meta: [{ title: "Applicants — Verifly University Portal" }] }),
  component: ApplicantsPage,
});

type SortKey = "gpa" | "submission" | "completeness" | "verification";

function ApplicantsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "pre-approved" | "normal">("all");
  const [appStatus, setAppStatus] = useState<string>("all");
  const [verifStatus, setVerifStatus] = useState<string>("all");
  const [degree, setDegree] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [scholarship, setScholarship] = useState<"all" | "with" | "without">("all");
  const [sortKey, setSortKey] = useState<SortKey>("submission");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let list = [...APPLICANTS];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.applicationId.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
    }
    if (type !== "all") list = list.filter(a => a.applicantType === type);
    if (appStatus !== "all") list = list.filter(a => a.applicationStatus === appStatus);
    if (verifStatus !== "all") list = list.filter(a => a.verification.status === verifStatus);
    if (degree !== "all") list = list.filter(a => a.intendedDegree === degree);
    if (country !== "all") list = list.filter(a => a.country === country);
    if (scholarship === "with") list = list.filter(a => !!a.scholarship);
    if (scholarship === "without") list = list.filter(a => !a.scholarship);

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "gpa": return (a.gpa - b.gpa) * dir;
        case "submission": return (+new Date(a.submissionDate) - +new Date(b.submissionDate)) * dir;
        case "completeness": return (a.completeness - b.completeness) * dir;
        case "verification": {
          const order = { "verified": 4, "in-review": 3, "pending": 2, "not-started": 1, "failed": 0 };
          return (order[a.verification.status] - order[b.verification.status]) * dir;
        }
      }
    });
    return list;
  }, [search, type, appStatus, verifStatus, degree, country, scholarship, sortKey, sortDir]);

  const countries = Array.from(new Set(APPLICANTS.map(a => a.country))).sort();

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  }

  return (
    <AppShell>
      <div className="p-8 max-w-[1600px] mx-auto">
        <PageHeader
          title="Applicants"
          description={`${filtered.length} of ${APPLICANTS.length} applicants matching current filters.`}
          actions={<Button variant="default">Export CSV</Button>}
        />

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, application ID, or email…" className="pl-9" />
            </div>

            <FilterPill label="Type" value={type} onChange={v => setType(v as never)}
              options={[["all", "All Applicants"], ["pre-approved", "✓ Pre-Approved"], ["normal", "Normal"]]} />
            <FilterPill label="Status" value={appStatus} onChange={setAppStatus}
              options={[["all", "All Statuses"], ...Object.entries(STATUS_LABEL)]} />
            <FilterPill label="Verification" value={verifStatus} onChange={setVerifStatus}
              options={[["all", "All Verification"], ...Object.entries(VERIF_LABEL)]} />
            <FilterPill label="Degree" value={degree} onChange={setDegree}
              options={[["all", "All Degrees"], ["Bachelor's", "Bachelor's"], ["Master's", "Master's"], ["PhD", "PhD"], ["Certificate", "Certificate"]]} />
            <FilterPill label="Country" value={country} onChange={setCountry}
              options={[["all", "All Countries"], ...countries.map(c => [c, c] as [string, string])]} />
            <FilterPill label="Scholarship" value={scholarship} onChange={v => setScholarship(v as never)}
              options={[["all", "All Aid"], ["with", "With Scholarship"], ["without", "Without"]]} />

            {(type !== "all" || appStatus !== "all" || verifStatus !== "all" || degree !== "all" || country !== "all" || scholarship !== "all" || search) && (
              <button onClick={() => { setSearch(""); setType("all"); setAppStatus("all"); setVerifStatus("all"); setDegree("all"); setCountry("all"); setScholarship("all"); }}
                className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3 w-8"></th>
                  <th className="text-left font-medium px-4 py-3">Applicant</th>
                  <th className="text-left font-medium px-4 py-3">Country</th>
                  <th className="text-left font-medium px-4 py-3">Program</th>
                  <SortHeader label="GPA" active={sortKey === "gpa"} dir={sortDir} onClick={() => toggleSort("gpa")} />
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Verification</th>
                  <th className="text-left font-medium px-4 py-3">Type</th>
                  <th className="text-center font-medium px-4 py-3">Aid</th>
                  <SortHeader label="Submitted" active={sortKey === "submission"} dir={sortDir} onClick={() => toggleSort("submission")} />
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      {a.priority && <Star className="h-4 w-4 fill-warning text-warning" />}
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/applicants/$id" params={{ id: a.id }} className="flex items-center gap-3 group">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-xs" style={{ backgroundColor: a.avatarColor }}>
                          {a.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="font-medium group-hover:text-primary">{a.name}</div>
                          <div className="text-xs text-muted-foreground">{a.applicationId}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><span className="mr-1.5">{a.countryFlag}</span>{a.country}</td>
                    <td className="px-4 py-3">
                      <div>{a.intendedMajor}</div>
                      <div className="text-xs text-muted-foreground">{a.intendedDegree}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">{a.gpa.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap", STATUS_TONE[a.applicationStatus])}>
                        {STATUS_LABEL[a.applicationStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap", VERIF_TONE[a.verification.status])}>
                        {VERIF_LABEL[a.verification.status]}
                      </span>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{a.verification.timing.replace("-", " ")}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap", TYPE_TONE[a.applicantType])}>
                        {a.applicantType === "pre-approved" ? "Pre-Approved" : "Normal"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {a.scholarship && <Award className="h-4 w-4 text-accent-foreground inline" />}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(a.submissionDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to="/applicants/$id" params={{ id: a.id }} title="View Profile" className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><FileText className="h-3.5 w-3.5" /></Link>
                        <IconAction title="Mark Priority"><Star className="h-3.5 w-3.5" /></IconAction>
                        <IconAction title="Request Info"><MessageSquarePlus className="h-3.5 w-3.5" /></IconAction>
                        <IconAction title="Add Note"><StickyNote className="h-3.5 w-3.5" /></IconAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FilterPill({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex items-center gap-1.5">
      <Filter className="h-3 w-3 text-muted-foreground" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={label}
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function SortHeader({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <th className="text-left font-medium px-4 py-3">
      <button onClick={onClick} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
        {label} <ArrowUpDown className={cn("h-3 w-3", active && "text-primary")} />
        {active && <span className="text-[10px]">{dir}</span>}
      </button>
    </th>
  );
}

function IconAction({ children, title, link }: { children: React.ReactNode; title: string; link?: string }) {
  const cls = "h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground";
  if (link) return <a href={link} title={title} className={cls}>{children}</a>;
  return <button title={title} className={cls}>{children}</button>;
}
