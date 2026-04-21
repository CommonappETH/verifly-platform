import type { ApplicationStatus, ApplicantType, VerificationStatus, DecisionStatus } from "./types";

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  "draft": "Draft",
  "submitted": "Submitted",
  "under-review": "Under Review",
  "awaiting-info": "Awaiting Info",
  "awaiting-verification": "Awaiting Verification",
  "committee-review": "Committee Review",
  "conditionally-admitted": "Conditional Admit",
  "admitted": "Admitted",
  "rejected": "Rejected",
  "waitlisted": "Waitlisted",
};

export const STATUS_TONE: Record<ApplicationStatus, string> = {
  "draft": "bg-muted text-muted-foreground",
  "submitted": "bg-info/10 text-info border border-info/20",
  "under-review": "bg-info/10 text-info border border-info/20",
  "awaiting-info": "bg-warning/15 text-warning-foreground border border-warning/30",
  "awaiting-verification": "bg-warning/15 text-warning-foreground border border-warning/30",
  "committee-review": "bg-primary/10 text-primary border border-primary/20",
  "conditionally-admitted": "bg-accent text-accent-foreground border border-accent/40",
  "admitted": "bg-success/15 text-success border border-success/30",
  "rejected": "bg-destructive/10 text-destructive border border-destructive/20",
  "waitlisted": "bg-muted text-muted-foreground border border-border",
};

export const VERIF_LABEL: Record<VerificationStatus, string> = {
  "verified": "Verified",
  "pending": "Pending",
  "in-review": "In Review",
  "not-started": "Not Started",
  "failed": "Failed",
};

export const VERIF_TONE: Record<VerificationStatus, string> = {
  "verified": "bg-success/15 text-success border border-success/30",
  "pending": "bg-warning/15 text-warning-foreground border border-warning/30",
  "in-review": "bg-info/10 text-info border border-info/20",
  "not-started": "bg-muted text-muted-foreground border border-border",
  "failed": "bg-destructive/10 text-destructive border border-destructive/20",
};

export const TYPE_TONE: Record<ApplicantType, string> = {
  "pre-approved": "bg-success/15 text-success border border-success/30",
  "normal": "bg-muted text-muted-foreground border border-border",
};

export const DECISION_LABEL: Record<DecisionStatus, string> = {
  "none": "Pending",
  "admit": "Admit",
  "conditional-admit": "Conditional Admit",
  "waitlist": "Waitlist",
  "reject": "Reject",
};

export const DECISION_TONE: Record<DecisionStatus, string> = {
  "none": "bg-muted text-muted-foreground border border-border",
  "admit": "bg-success/15 text-success border border-success/30",
  "conditional-admit": "bg-accent text-accent-foreground border border-accent/40",
  "waitlist": "bg-info/10 text-info border border-info/20",
  "reject": "bg-destructive/10 text-destructive border border-destructive/20",
};

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
