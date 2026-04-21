import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/bank/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useConversations } from "@/lib/use-requests";
import { sendMessage, formatDateTime } from "@/lib/api";
import { messageTemplates } from "@/lib/mock-data";
import { Search, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const conversations = useConversations();
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [filter, setFilter] = useState("");
  const [body, setBody] = useState("");

  const filtered = conversations.filter((c) =>
    !filter ||
    c.requestCode.toLowerCase().includes(filter.toLowerCase()) ||
    c.studentName.toLowerCase().includes(filter.toLowerCase()),
  );
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const handleSend = () => {
    if (!active || !body.trim()) return;
    sendMessage(active.id, body.trim());
    setBody("");
    toast.success("Message sent");
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">Communicate with students about verifications.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-[320px_1fr] h-[calc(100vh-220px)]">
          <Card className="flex flex-col overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by code or name" className="pl-9 h-9" />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full text-left p-3 border-b hover:bg-accent transition-colors",
                    active?.id === c.id && "bg-accent",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{c.requestCode}</span>
                    {c.unread > 0 && <Badge className="h-5 px-1.5 text-[10px]">{c.unread}</Badge>}
                  </div>
                  <div className="text-sm font-medium mt-0.5 truncate">{c.studentName}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.subject}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col overflow-hidden">
            {active ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{active.studentName}</div>
                      <div className="text-xs text-muted-foreground">{active.requestCode} · {active.subject}</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-3 bg-muted/30">
                  {active.messages.map((m) => (
                    <div key={m.id} className={cn("flex", m.from === "bank" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                        m.from === "bank" ? "bg-primary text-primary-foreground" :
                        m.from === "system" ? "bg-muted text-muted-foreground italic" : "bg-card border",
                      )}>
                        <div className="text-[11px] opacity-70 mb-0.5">{m.authorName} · {formatDateTime(m.timestamp)}</div>
                        <div>{m.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t space-y-2">
                  <div className="flex gap-2 items-center">
                    <Select onValueChange={(v) => {
                      const t = messageTemplates.find((x) => x.id === v);
                      if (t) setBody(t.body);
                    }}>
                      <SelectTrigger className="w-[260px] h-8 text-xs">
                        <SelectValue placeholder="Insert template…" />
                      </SelectTrigger>
                      <SelectContent>
                        {messageTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Type your message…"
                      rows={2}
                      className="resize-none"
                    />
                    <Button onClick={handleSend} className="self-end">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">No conversation selected</div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}