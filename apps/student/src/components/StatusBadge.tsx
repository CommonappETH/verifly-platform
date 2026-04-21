import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label: string;
  variant?: "muted" | "success" | "warning" | "info" | "destructive";
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<string, string> = {
  muted: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning-foreground",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ label, variant = "muted", size = "sm", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        variantStyles[variant] || variantStyles.muted,
        className
      )}
    >
      {label}
    </span>
  );
}
