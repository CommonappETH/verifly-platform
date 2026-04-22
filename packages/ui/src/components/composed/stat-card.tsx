import type { ReactNode } from "react";
import { Card, CardContent } from "../ui/card";
import { cn } from "@verifly/utils";

export type StatCardTone = "default" | "success" | "warning" | "info" | "accent";

export interface StatCardDelta {
  value: string;
  positive?: boolean;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  delta?: StatCardDelta;
  hint?: string;
  tone?: StatCardTone;
  iconClassName?: string;
  className?: string;
}

const toneStyles: Record<StatCardTone, string> = {
  default: "",
  success: "bg-success/5 border-success/20",
  warning: "bg-warning/5 border-warning/30",
  info: "bg-info/5 border-info/20",
  accent: "bg-accent/30 border-accent/40",
};

export function StatCard({
  label,
  value,
  icon,
  delta,
  hint,
  tone = "default",
  iconClassName,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", toneStyles[tone], className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
            {delta && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  delta.positive ? "text-emerald-600" : "text-red-600",
                )}
              >
                {delta.value}
              </p>
            )}
            {hint && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                iconClassName ?? "bg-muted text-foreground",
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
