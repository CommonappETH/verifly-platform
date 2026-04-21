import { Badge } from "@verifly/ui";
import type { RequestStatus } from "@/lib/types";
import { cn } from "@verifly/utils";

const labels: Record<RequestStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};

const styles: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
  under_review: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  approved: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200",
};

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", styles[status], className)}>
      {labels[status]}
    </Badge>
  );
}