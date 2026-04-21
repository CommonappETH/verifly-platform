import { cn } from "@/lib/utils";

export function StatCard({
  label, value, hint, tone = "default", icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "info" | "accent";
  icon?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    default: "bg-card",
    success: "bg-success/5 border-success/20",
    warning: "bg-warning/5 border-warning/30",
    info: "bg-info/5 border-info/20",
    accent: "bg-accent/30 border-accent/40",
  };
  return (
    <div className={cn("rounded-xl border border-border p-5", tones[tone])}>
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 font-display text-3xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
