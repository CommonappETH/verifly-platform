import type { StatusBadgeProps, StatusBadgeTone } from "@verifly/ui";

type ToneAndLabel = { tone: StatusBadgeTone; label: string };

const map: Record<string, ToneAndLabel> = {
  pending: { tone: "warning", label: "Pending" },
  under_review: { tone: "info", label: "Under Review" },
  awaiting_verification: { tone: "info", label: "Awaiting Verification" },
  approved: { tone: "success", label: "Approved" },
  completed: { tone: "success", label: "Completed" },
  admitted: { tone: "success", label: "Admitted" },
  conditional: { tone: "accent", label: "Conditional" },
  conditionally_admitted: { tone: "accent", label: "Conditionally Admitted" },
  rejected: { tone: "destructive", label: "Rejected" },
  missing: { tone: "destructive", label: "Missing" },
  missing_documents: { tone: "destructive", label: "Missing Documents" },
  overdue: { tone: "destructive", label: "Overdue" },
  suspended: { tone: "neutral", label: "Suspended" },
  active: { tone: "success", label: "Active" },
  flagged: { tone: "warning", label: "Flagged" },
  submitted: { tone: "info", label: "Submitted" },
  none: { tone: "neutral", label: "—" },
  pre_approved: { tone: "info", label: "Pre-Approved" },
  normal: { tone: "neutral", label: "Normal" },
  student: { tone: "info", label: "Student" },
  counselor: { tone: "accent", label: "Counselor" },
  university: { tone: "info", label: "University" },
  bank: { tone: "warning", label: "Bank" },
  admin: { tone: "neutral", label: "Admin" },
};

export function statusBadgeProps(status: string): Pick<StatusBadgeProps, "label" | "tone"> {
  const key = status?.toLowerCase?.() ?? "";
  const entry = map[key];
  if (entry) return entry;
  return {
    tone: "neutral",
    label: key ? key.charAt(0).toUpperCase() + key.slice(1) : "—",
  };
}
