import { useRef, useState } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/bank/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Badge } from "@verifly/ui";
import { Checkbox } from "@verifly/ui";
import { Input } from "@verifly/ui";
import { Label } from "@verifly/ui";
import { Textarea } from "@verifly/ui";
import { Separator } from "@verifly/ui";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@verifly/ui";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@verifly/ui";
import { StatusBadge } from "@verifly/ui";
import { statusBadgeProps } from "@/lib/status-badge";
import { useRequests } from "@/lib/use-requests";
import {
  approveRequest, rejectRequest, markUnderReview, requestMoreInfo, addInternalNote,
  setChecklist, formatCurrency, formatDate, formatDateTime, getRequestById, uploadDocument,
} from "@/lib/api";
import { rejectionReasons, messageTemplates } from "@/lib/mock-data";
import {
  ArrowLeft, CheckCircle2, XCircle, Eye, MessageSquare, FileText, Building2, User, GraduationCap, Wallet, FileCheck, FileX, Clock, Upload,
} from "lucide-react";
import { toast } from "sonner";
import type { ChecklistState } from "@/lib/types";

export const Route = createFileRoute("/verification/$id")({
  loader: ({ params }) => {
    const r = getRequestById(params.id);
    if (!r) throw notFound();
    return { id: r.id };
  },
  notFoundComponent: () => (
    <AppShell>
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Verification not found</h2>
        <Link to="/requests" className="text-sm text-primary underline mt-2 inline-block">Back to requests</Link>
      </div>
    </AppShell>
  ),
  component: VerificationDetail,
});

function VerificationDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const requests = useRequests();
  const r = requests.find((x) => x.id === id);

  if (!r) {
    return (
      <AppShell>
        <div className="text-center py-16">Request not found.</div>
      </AppShell>
    );
  }

  const updateChecklist = (key: keyof ChecklistState, value: boolean) => {
    setChecklist(r.id, { ...r.checklist, [key]: value });
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{r.code}</span>
                <StatusBadge {...statusBadgeProps(r.status)} />
              </div>
              <h1 className="text-2xl font-bold mt-1">{r.student.fullName}</h1>
              <p className="text-sm text-muted-foreground">Guardian: {r.guardian.fullName} · Submitted {formatDate(r.submittedAt)}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Requested</div>
              <div className="text-2xl font-bold">{formatCurrency(r.requestedAmount, r.currency)}</div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Student Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Full Name" value={r.student.fullName} />
                <Field label="Country" value={r.student.country} />
                <Field label="Intended Study" value={r.student.intendedStudy ?? "—"} />
                <Field label="University" value={r.student.university ?? "—"} />
                <Field label="Email" value={r.student.email ?? "—"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Guardian & Account</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Guardian Name" value={r.guardian.fullName} />
                <Field label="Relationship" value={r.guardian.relationship} />
                <Field label="Account Holder" value={r.account.holderName} />
                <Field label="Account Number" value={r.account.accountNumber} mono />
                <Field label="Branch" value={r.account.branch} />
                <Field label="Currency" value={r.account.currency} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" /> Financial Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Requested Amount" value={formatCurrency(r.requestedAmount, r.currency)} />
                <Field label="Currency" value={r.currency} />
                {r.scholarshipAdjustedAmount && (
                  <Field label="Scholarship-Adjusted" value={formatCurrency(r.scholarshipAdjustedAmount, r.currency)} />
                )}
                {r.verifiedAmount && (
                  <Field label="Verified Amount" value={formatCurrency(r.verifiedAmount, r.currency)} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <BankStatementUpload requestId={r.id} document={r.documents.find((d) => d.name.toLowerCase().includes("bank statement"))} />
                {r.documents.filter((d) => !d.name.toLowerCase().includes("bank statement")).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      {d.status === "missing" ? <FileX className="h-4 w-4 text-rose-600" /> : <FileCheck className="h-4 w-4 text-emerald-600" />}
                      <div>
                        <div className="text-sm font-medium">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DocStatus status={d.status} />
                      {d.status !== "missing" && (
                        <Button variant="ghost" size="sm" onClick={() => toast.info(`Opening ${d.name}…`)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Verification Checklist</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "accountExists" as const, label: "Account exists" },
                  { key: "belongsToGuardian" as const, label: "Account belongs to guardian" },
                  { key: "fundsSufficient" as const, label: "Funds available meet required amount" },
                  { key: "documentsVerified" as const, label: "Documents verified" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors">
                    <Checkbox
                      checked={r.checklist[item.key]}
                      onCheckedChange={(v) => updateChecklist(item.key, !!v)}
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Notes & History</CardTitle></CardHeader>
              <CardContent>
                <NoteComposer requestId={r.id} />
                <Separator className="my-4" />
                <div className="space-y-3">
                  {[...r.notes].reverse().map((n) => (
                    <div key={n.id} className="flex gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                        {n.actor.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <span className="font-medium">{n.actor}</span>
                          <span className="text-muted-foreground"> · {n.action}</span>
                        </div>
                        {n.note && <p className="text-sm text-muted-foreground mt-0.5">{n.note}</p>}
                        <div className="text-xs text-muted-foreground mt-0.5">{formatDateTime(n.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="lg:sticky lg:top-20">
              <CardHeader><CardTitle className="text-base">Decision</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <ApproveDialog requestId={r.id} suggestedAmount={r.requestedAmount} currency={r.currency} />
                <RejectDialog requestId={r.id} />
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => { markUnderReview(r.id); toast.success("Marked under review"); }}
                  disabled={r.status === "under_review"}
                >
                  <Clock className="h-4 w-4 mr-2" /> Mark as Under Review
                </Button>
                <RequestInfoDialog requestId={r.id} />

                <Separator className="my-4" />
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge {...statusBadgeProps(r.status)} /></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Assigned</span><span className="font-medium">{r.assignedTo ?? "Unassigned"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span>{formatDate(r.submittedAt)}</span></div>
                  {r.decisionAt && <div className="flex justify-between"><span className="text-muted-foreground">Decision</span><span>{formatDate(r.decisionAt)}</span></div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> University</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{r.student.university ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Will be notified upon decision.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 ${mono ? "font-mono" : "font-medium"}`}>{value}</div>
    </div>
  );
}

function DocStatus({ status }: { status: "uploaded" | "missing" | "reviewed" }) {
  const map = {
    uploaded: { label: "Uploaded", cls: "bg-blue-100 text-blue-800 border-blue-200" },
    reviewed: { label: "Reviewed", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    missing: { label: "Missing", cls: "bg-rose-100 text-rose-800 border-rose-200" },
  };
  const c = map[status];
  return <Badge variant="outline" className={c.cls}>{c.label}</Badge>;
}

function NoteComposer({ requestId }: { requestId: string }) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-2">
      <Textarea placeholder="Add an internal note…" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button
        size="sm"
        onClick={() => {
          if (!note.trim()) return;
          addInternalNote(requestId, note.trim());
          setNote("");
          toast.success("Note added");
        }}
      >
        Add note
      </Button>
    </div>
  );
}

function BankStatementUpload({ requestId, document }: { requestId: string; document?: import("@/lib/types").VerificationDocument }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploaded = document && document.status !== "missing";
  return (
    <div className="rounded-md border border-dashed p-4 bg-muted/30">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
            <Upload className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">Bank Statement</div>
            <div className="text-xs text-muted-foreground">
              {uploaded
                ? `${document!.name} · uploaded ${document!.uploadedAt ? formatDate(document!.uploadedAt) : ""}`
                : "Upload the official 3-month bank statement issued by your branch."}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {uploaded && <DocStatus status={document!.status} />}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              uploadDocument(requestId, file.name, "Bank Statement (3 months)");
              toast.success("Bank statement uploaded");
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
          <Button size="sm" variant={uploaded ? "outline" : "default"} onClick={() => inputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1" /> {uploaded ? "Replace" : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApproveDialog({ requestId, suggestedAmount, currency }: { requestId: string; suggestedAmount: number; currency: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(suggestedAmount));
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white">
          <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Verification
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Verification</DialogTitle>
          <DialogDescription>Confirm the verified amount available in the account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Verified amount ({currency})</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              approveRequest(requestId, Number(amount), note);
              toast.success("Verification approved");
              setOpen(false);
            }}
          >
            Confirm Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800">
          <XCircle className="h-4 w-4 mr-2" /> Reject Verification
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Verification</DialogTitle>
          <DialogDescription>A reason is required for audit purposes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {rejectionReasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!reason}
            onClick={() => {
              rejectRequest(requestId, reason, note);
              toast.success("Verification rejected");
              setOpen(false);
            }}
          >
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestInfoDialog({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [tpl, setTpl] = useState(messageTemplates[0].id);
  const [body, setBody] = useState(messageTemplates[0].body);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <MessageSquare className="h-4 w-4 mr-2" /> Request More Information
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request More Information</DialogTitle>
          <DialogDescription>Send a message to the student.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Template</Label>
            <Select
              value={tpl}
              onValueChange={(v) => {
                setTpl(v);
                const t = messageTemplates.find((x) => x.id === v);
                if (t) setBody(t.body);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {messageTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Message</Label>
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              requestMoreInfo(requestId, body);
              toast.success("Message sent");
              setOpen(false);
            }}
          >
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}