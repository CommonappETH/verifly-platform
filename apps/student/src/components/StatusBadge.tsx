import {
  StatusBadge as SharedStatusBadge,
  type StatusBadgeTone,
} from "@verifly/ui";

type StudentVariant = "muted" | "success" | "warning" | "info" | "destructive";

const toneFromVariant: Record<StudentVariant, StatusBadgeTone> = {
  muted: "neutral",
  success: "success",
  warning: "warning",
  info: "info",
  destructive: "destructive",
};

interface StudentStatusBadgeProps {
  status?: string;
  label: string;
  variant?: StudentVariant;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  label,
  variant = "muted",
  size = "sm",
  className,
}: StudentStatusBadgeProps) {
  return (
    <SharedStatusBadge
      label={label}
      tone={toneFromVariant[variant] ?? "neutral"}
      size={size}
      className={className}
    />
  );
}
