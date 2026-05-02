import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@verifly/utils";

// Phase 10: route-level placeholder for portal features that don't have a
// backend yet. Used during the per-app migration loop to swap mock-driven
// routes that we're not wiring to the real API in this phase. Each
// occurrence has a corresponding follow-up entry in `checklistBackend.md`
// §10.6 so the deferred work doesn't get lost.
export interface ComingSoonProps {
  feature: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ComingSoon({
  feature,
  description,
  icon,
  action,
  className,
}: ComingSoonProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-24 text-center",
        className,
      )}
    >
      <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        {icon ?? <Sparkles className="h-7 w-7 text-primary" />}
      </div>
      <p className="text-base font-semibold">{feature}</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {description ?? "This feature is on its way. We're tracking it as a Phase 11+ follow-up; check back after the next release."}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
