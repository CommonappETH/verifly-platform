import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { MESSAGE_THREADS } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { cn } from "@verifly/utils";
import { Button } from "@verifly/ui";
import { Textarea } from "@verifly/ui";
import { Mail, AlertCircle, ShieldCheck, BadgeCheck, Inbox } from "lucide-react";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Verifly" }] }),
  component: MessagesPage,
});

const CATEGORIES = [
  { key: "all", label: "All", icon: Inbox },
  { key: "info_request", label: "Info Requests", icon: AlertCircle },
  { key: "verification_reminder", label: "Verification Reminders", icon: ShieldCheck },
  { key: "conditional_followup", label: "Conditional Follow-ups", icon: BadgeCheck },
  { key: "general", label: "General", icon: Mail },
] as const;

function MessagesPage() {
  const [category, setCategory] = useState<string>("all");
  const [activeId, setActiveId] = useState(MESSAGE_THREADS[0].id);
  const filtered = category === "all" ? MESSAGE_THREADS : MESSAGE_THREADS.filter(t => t.category === category);
  const active = MESSAGE_THREADS.find(t => t.id === activeId);

  return (
    <AppShell>
      <div className="p-8 max-w-[1500px] mx-auto">
        <PageHeader title="Messages" description="Direct communication with applicants — info requests, verification reminders, and follow-ups." />

        <div className="grid grid-cols-12 gap-4 bg-card border border-border rounded-xl overflow-hidden h-[700px]">
          {/* Categories */}
          <div className="col-span-2 border-r border-border p-3 space-y-1">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={cn("w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm",
                  category === c.key ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground hover:bg-muted")}
              >
                <c.icon className="h-3.5 w-3.5" />
                <span className="truncate">{c.label}</span>
              </button>
            ))}
          </div>

          {/* Threads */}
          <div className="col-span-4 border-r border-border overflow-y-auto">
            {filtered.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn("w-full text-left px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors",
                  activeId === t.id && "bg-primary-soft/40")}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {t.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    {t.applicantName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{formatDate(t.lastMessageAt)}</div>
                </div>
                <div className="text-sm text-foreground/80 truncate">{t.subject}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{t.messages[t.messages.length - 1].body}</div>
              </button>
            ))}
          </div>

          {/* Active conversation */}
          <div className="col-span-6 flex flex-col">
            {active && (
              <>
                <div className="px-5 py-4 border-b border-border">
                  <div className="font-display text-lg">{active.subject}</div>
                  <Link to="/applicants/$id" params={{ id: active.applicantId }} className="text-xs text-primary hover:underline">
                    View {active.applicantName}'s profile →
                  </Link>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {active.messages.map(m => (
                    <div key={m.id} className={cn("flex", m.from === "university" ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-2xl p-3.5",
                        m.from === "university" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        <div className="text-[11px] opacity-70 mb-1">{m.author} · {formatDate(m.date)}</div>
                        <div className="text-sm leading-relaxed">{m.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-4 space-y-2">
                  <Textarea placeholder="Write a reply…" rows={3} />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">Use Template</Button>
                    <Button size="sm">Send Reply</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
