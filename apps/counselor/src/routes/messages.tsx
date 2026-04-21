import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { conversations, messages as messagesStore, messageTemplates } from "@/lib/mock/requests";
import { universities } from "@/lib/mock/universities";
import { students } from "@/lib/mock/students";
import { formatRelative } from "@/lib/format";
import { Send, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Message } from "@/lib/mock/types";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Verifly" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [localMsgs, setLocalMsgs] = useState<Message[]>(messagesStore);

  const active = conversations.find((c) => c.id === activeId);
  const thread = useMemo(
    () =>
      [...localMsgs].filter((m) => m.conversationId === activeId).sort((a, b) => +new Date(a.sentAt) - +new Date(b.sentAt)),
    [activeId, localMsgs],
  );

  const uniName = (id: string) => universities.find((u) => u.id === id)?.shortName ?? "—";
  const studentName = (id?: string) => {
    if (!id) return null;
    const s = students.find((x) => x.id === id);
    return s ? `${s.firstName} ${s.lastName}` : null;
  };

  const send = () => {
    if (!draft.trim() || !active) return;
    const msg: Message = {
      id: `m-${Date.now()}`,
      conversationId: active.id,
      from: "counselor",
      authorName: "Ms. Carter",
      body: draft.trim(),
      sentAt: new Date().toISOString(),
    };
    setLocalMsgs((prev) => [...prev, msg]);
    setDraft("");
    toast.success("Message sent");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">Conversations with university admissions offices.</p>
      </div>

      <Card className="grid h-[calc(100vh-12rem)] grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <div className="border-r overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`flex w-full flex-col items-start gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                activeId === c.id ? "bg-muted" : ""
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">{uniName(c.universityId)}</span>
                {c.unread > 0 && <Badge className="h-5 min-w-5 px-1.5">{c.unread}</Badge>}
              </div>
              <span className="line-clamp-1 text-xs text-muted-foreground">{c.subject}</span>
              <span className="text-[10px] text-muted-foreground">{formatRelative(c.lastMessageAt)}</span>
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className="flex flex-col">
          {active ? (
            <>
              <div className="border-b px-4 py-3">
                <div className="text-sm font-semibold">{active.subject}</div>
                <div className="text-xs text-muted-foreground">
                  {uniName(active.universityId)}
                  {studentName(active.studentId) && ` · about ${studentName(active.studentId)}`}
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.from === "counselor" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        m.from === "counselor"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {m.body}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {m.authorName} · {formatRelative(m.sentAt)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-3">
                <div className="mb-2 flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <FileText className="h-3.5 w-3.5" /> Templates
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {messageTemplates.map((t) => (
                        <DropdownMenuItem key={t.id} onClick={() => setDraft(t.body)}>
                          {t.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message…"
                    className="min-h-[60px]"
                  />
                  <Button onClick={send} className="self-end gap-1">
                    <Send className="h-4 w-4" /> Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
