import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  icon: LucideIcon;
  accent?: string;
}

export function KpiCard({ label, value, delta, icon: Icon, accent }: KpiCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
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
                {delta.value} vs last week
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              accent ?? "bg-muted text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
