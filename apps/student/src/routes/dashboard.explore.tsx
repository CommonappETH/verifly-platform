import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@verifly/ui";
import { Input } from "@verifly/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@verifly/ui";
import { UniversityCard } from "@/components/UniversityCard";
import { universities } from "@/lib/mock-data";
import { studentProfile } from "@/lib/mock-data";
import { Search, LayoutGrid, List, Filter } from "lucide-react";

export const Route = createFileRoute("/dashboard/explore")({
  component: ExploreUniversities,
});

function ExploreUniversities() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [verification, setVerification] = useState("all");
  const [scholarship, setScholarship] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [saved, setSaved] = useState<Set<string>>(new Set(studentProfile.savedUniversities));

  const filtered = universities.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.country.toLowerCase().includes(search.toLowerCase())) return false;
    if (country !== "all" && u.country !== country) return false;
    if (verification !== "all" && u.verificationPreference !== verification) return false;
    if (scholarship === "yes" && !u.scholarshipAvailable) return false;
    if (scholarship === "no" && u.scholarshipAvailable) return false;
    return true;
  });

  const countries = [...new Set(universities.map((u) => u.country))].sort();

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Explore Universities</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse and compare universities that match your goals.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search universities by name or country…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={verification} onValueChange={setVerification}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Verification" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verification</SelectItem>
              <SelectItem value="required">Required</SelectItem>
              <SelectItem value="preferred">Preferred</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scholarship} onValueChange={setScholarship}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Scholarships" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">Has Scholarships</SelectItem>
              <SelectItem value="no">No Scholarships</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} universit{filtered.length === 1 ? "y" : "ies"} found</p>

      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
        {filtered.map((u) => (
          <UniversityCard key={u.id} university={u} saved={saved.has(u.id)} onSave={toggleSave} />
        ))}
      </div>
    </div>
  );
}
