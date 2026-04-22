import type { StatusBadgeProps, StatusBadgeTone } from "@verifly/ui";
import type {
  ApplicationStatus,
  DocumentStatus,
  RequestStatus,
} from "./mock/types";

export type AnyStatus =
  | DocumentStatus
  | RequestStatus
  | ApplicationStatus
  | "complete"
  | "incomplete";

const map: Record<AnyStatus, { tone: StatusBadgeTone; label: string }> = {
  missing: { tone: "destructive", label: "Missing" },
  uploaded: { tone: "info", label: "Uploaded" },
  under_review: { tone: "warning", label: "Under Review" },
  completed: { tone: "success", label: "Completed" },
  pending: { tone: "warning", label: "Pending" },
  overdue: { tone: "destructive", label: "Overdue" },
  not_started: { tone: "neutral", label: "Not Started" },
  in_progress: { tone: "info", label: "In Progress" },
  submitted: { tone: "accent", label: "Submitted" },
  complete: { tone: "success", label: "Complete" },
  incomplete: { tone: "destructive", label: "Incomplete" },
};

export function statusBadgeProps(
  status: AnyStatus,
): Pick<StatusBadgeProps, "label" | "tone"> {
  return map[status] ?? { tone: "neutral", label: String(status) };
}
