import { cn } from "@verifly/utils";

export type StatusBadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "accent";

export type StatusBadgeSize = "sm" | "md";

export interface StatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
  size?: StatusBadgeSize;
  className?: string;
}

const toneStyles: Record<StatusBadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-emerald-100 text-emerald-800 border-emerald-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  destructive: "bg-red-100 text-red-800 border-red-200",
  accent: "bg-violet-100 text-violet-800 border-violet-200",
};

const sizeStyles: Record<StatusBadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function StatusBadge({
  label,
  tone = "neutral",
  size = "sm",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium whitespace-nowrap",
        sizeStyles[size],
        toneStyles[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
