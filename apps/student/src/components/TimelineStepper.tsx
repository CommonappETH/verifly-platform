import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { TimelineEvent } from "@/lib/types";

interface TimelineStepperProps {
  events: TimelineEvent[];
  className?: string;
}

export function TimelineStepper({ events, className }: TimelineStepperProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4">
          {index < events.length - 1 && (
            <div
              className={cn(
                "absolute left-[15px] top-[32px] h-[calc(100%-16px)] w-0.5",
                event.completed ? "bg-primary" : "bg-border"
              )}
            />
          )}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                event.completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : event.current
                    ? "border-primary bg-background text-primary"
                    : "border-border bg-background text-muted-foreground"
              )}
            >
              {event.completed ? <Check className="h-4 w-4" /> : index + 1}
            </div>
          </div>
          <div className="pb-8">
            <p className={cn("text-sm font-medium", event.current && "text-primary")}>
              {event.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
            {event.date && (
              <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
