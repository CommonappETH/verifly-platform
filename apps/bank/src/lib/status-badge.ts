import type { StatusBadgeProps, StatusBadgeTone } from "@verifly/ui";
import type { RequestStatus } from "./types";

const map: Record<RequestStatus, { tone: StatusBadgeTone; label: string }> = {
  pending: { tone: "warning", label: "Pending" },
  under_review: { tone: "info", label: "Under Review" },
  approved: { tone: "success", label: "Approved" },
  rejected: { tone: "destructive", label: "Rejected" },
};

export function statusBadgeProps(
  status: RequestStatus,
): Pick<StatusBadgeProps, "label" | "tone"> {
  return map[status];
}
