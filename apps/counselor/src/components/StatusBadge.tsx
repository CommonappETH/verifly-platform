import { Badge } from "@verifly/ui";
import { cn } from "@verifly/utils";
import type { DocumentStatus, RequestStatus, ApplicationStatus } from "@/lib/mock/types";

type AnyStatus = DocumentStatus | RequestStatus | ApplicationStatus | "complete" | "incomplete";

const styles: Record<string, string> = {
  missing: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  uploaded: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  under_review: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  pending: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  overdue: "bg-red-100 text-red-700 border-red-300 hover:bg-red-100",
  not_started: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  submitted: "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100",
  complete: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  incomplete: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
};

const labels: Record<string, string> = {
  missing: "Missing",
  uploaded: "Uploaded",
  under_review: "Under Review",
  completed: "Completed",
  pending: "Pending",
  overdue: "Overdue",
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  complete: "Complete",
  incomplete: "Incomplete",
};

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", styles[status], className)}>
      {labels[status] ?? status}
    </Badge>
  );
}
