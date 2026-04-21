import { Card, CardContent } from "@verifly/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@verifly/ui";
import { MapPin, Calendar, GraduationCap, Bookmark } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { University } from "@/lib/types";

interface UniversityCardProps {
  university: University;
  saved?: boolean;
  onSave?: (id: string) => void;
}

const prefLabel: Record<string, { label: string; variant: "success" | "warning" | "info" }> = {
  required: { label: "Verification Required", variant: "warning" },
  preferred: { label: "Verification Preferred", variant: "info" },
  optional: { label: "Verification Optional", variant: "success" },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function UniversityCard({ university, saved, onSave }: UniversityCardProps) {
  const pref = prefLabel[university.verificationPreference];

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{university.logo}</div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{university.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                {university.city}, {university.country}
              </div>
            </div>
          </div>
          <button
            onClick={() => onSave?.(university.id)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {university.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <StatusBadge status={university.verificationPreference} label={pref.label} variant={pref.variant} />
          {university.scholarshipAvailable && (
            <StatusBadge status="scholarship" label="Scholarships Available" variant="success" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>{formatCurrency(university.tuitionMin)} – {formatCurrency(university.tuitionMax)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Deadline: {new Date(university.applicationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>

        {university.scholarshipNote && (
          <p className="text-xs text-muted-foreground italic mb-3">{university.scholarshipNote}</p>
        )}

        <Link to="/dashboard/university/$universityId" params={{ universityId: university.id }}>
          <Button variant="outline" size="sm" className="w-full text-xs">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
