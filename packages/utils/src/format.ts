import type {
  ApplicantType,
  ApplicationStatus,
  DecisionStatus,
  VerificationStatus,
} from "@verifly/types";

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatRelative(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  const days = Math.round(diff / day);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 0 && days < 30) return `${days}d ago`;
  if (days < 0 && days > -30) return `in ${Math.abs(days)}d`;
  return formatDate(iso);
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// University-portal mappings from canonical enums to display label + Tailwind tone classes.
// Keyed by unified snake_case enum values. Other apps can safely tree-shake.

export const STATUS_LABEL: Partial<Record<ApplicationStatus, string>> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  awaiting_info: "Awaiting Info",
  awaiting_verification: "Awaiting Verification",
  committee_review: "Committee Review",
  conditionally_admitted: "Conditional Admit",
  admitted: "Admitted",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
};

export const STATUS_TONE: Partial<Record<ApplicationStatus, string>> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-info/10 text-info border border-info/20",
  under_review: "bg-info/10 text-info border border-info/20",
  awaiting_info: "bg-warning/15 text-warning-foreground border border-warning/30",
  awaiting_verification: "bg-warning/15 text-warning-foreground border border-warning/30",
  committee_review: "bg-primary/10 text-primary border border-primary/20",
  conditionally_admitted: "bg-accent text-accent-foreground border border-accent/40",
  admitted: "bg-success/15 text-success border border-success/30",
  rejected: "bg-destructive/10 text-destructive border border-destructive/20",
  waitlisted: "bg-muted text-muted-foreground border border-border",
};

export const VERIF_LABEL: Partial<Record<VerificationStatus, string>> = {
  verified: "Verified",
  pending: "Pending",
  in_review: "In Review",
  not_started: "Not Started",
  failed: "Failed",
};

export const VERIF_TONE: Partial<Record<VerificationStatus, string>> = {
  verified: "bg-success/15 text-success border border-success/30",
  pending: "bg-warning/15 text-warning-foreground border border-warning/30",
  in_review: "bg-info/10 text-info border border-info/20",
  not_started: "bg-muted text-muted-foreground border border-border",
  failed: "bg-destructive/10 text-destructive border border-destructive/20",
};

export const TYPE_TONE: Record<ApplicantType, string> = {
  pre_approved: "bg-success/15 text-success border border-success/30",
  normal: "bg-muted text-muted-foreground border border-border",
};

export const DECISION_LABEL: Partial<Record<DecisionStatus, string>> = {
  none: "Pending",
  admit: "Admit",
  conditional_admit: "Conditional Admit",
  waitlist: "Waitlist",
  reject: "Reject",
};

export const DECISION_TONE: Partial<Record<DecisionStatus, string>> = {
  none: "bg-muted text-muted-foreground border border-border",
  admit: "bg-success/15 text-success border border-success/30",
  conditional_admit: "bg-accent text-accent-foreground border border-accent/40",
  waitlist: "bg-info/10 text-info border border-info/20",
  reject: "bg-destructive/10 text-destructive border border-destructive/20",
};
