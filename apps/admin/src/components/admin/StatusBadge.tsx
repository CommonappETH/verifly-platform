import { cn } from "@verifly/utils";

type Status = string;

const styles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  awaiting_verification: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  admitted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  conditional: "bg-violet-100 text-violet-800 border-violet-200",
  conditionally_admitted: "bg-violet-100 text-violet-800 border-violet-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  missing: "bg-red-100 text-red-800 border-red-200",
  missing_documents: "bg-red-100 text-red-800 border-red-200",
  overdue: "bg-transparent text-red-700 border-red-400",
  suspended: "bg-zinc-200 text-zinc-700 border-zinc-300",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  flagged: "bg-orange-100 text-orange-800 border-orange-200",
  submitted: "bg-sky-100 text-sky-800 border-sky-200",
  none: "bg-muted text-muted-foreground border-border",
  pre_approved: "bg-indigo-100 text-indigo-800 border-indigo-200",
  normal: "bg-muted text-muted-foreground border-border",
  student: "bg-sky-100 text-sky-800 border-sky-200",
  counselor: "bg-violet-100 text-violet-800 border-violet-200",
  university: "bg-indigo-100 text-indigo-800 border-indigo-200",
  bank: "bg-amber-100 text-amber-800 border-amber-200",
  admin: "bg-zinc-900 text-zinc-50 border-zinc-900",
};

const labels: Record<string, string> = {
  under_review: "Under Review",
  awaiting_verification: "Awaiting Verification",
  conditionally_admitted: "Conditionally Admitted",
  missing_documents: "Missing Documents",
  pre_approved: "Pre-Approved",
  none: "—",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const key = status?.toLowerCase?.() ?? "";
  const cls = styles[key] ?? "bg-muted text-muted-foreground border-border";
  const label = labels[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        cls,
        className,
      )}
    >
      {label}
    </span>
  );
}
