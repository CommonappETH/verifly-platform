import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/bank/AppShell";
import {
  Button, Card, CardContent, CardHeader, CardTitle,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  EmptyState, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Separator, StatusBadge, Textarea,
} from "@verifly/ui";
import { ApiError } from "@verifly/api-client";
import { apiClient } from "@/lib/api-client";
import {
  formatCurrency, formatDateTime,
  isDecided, isPendingForBank,
  mapVerificationDetail,
  verificationStatusBadge,
  type WireVerification,
} from "@/lib/mappers";
import {
  ArrowLeft, CheckCircle2, XCircle, GraduationCap, User, Wallet,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/verification/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} — Verifly Bank Portal` }] }),
  component: VerificationDetail,
});

const REJECTION_REASONS = [
  "Insufficient funds",
  "Account does not belong to the guardian",
  "Documents incomplete or unverified",
  "Mismatched account holder name",
  "Fraud / authenticity concern",
  "Other",
] as const;

function VerificationDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();

  const verificationQuery = useQuery({
    queryKey: ["verification", id],
    queryFn: async () => {
      const res = await apiClient.verifications.get(id);
      return res.data as unknown as WireVerification;
    },
  });

  const studentId = verificationQuery.data?.studentId;
  const studentQuery = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => apiClient.students.get(studentId!).then((r) => r.data),
    enabled: Boolean(studentId),
  });

  const decideMutation = useMutation({
    mutationFn: (input: {
      decision: "verified" | "rejected";
      verifiedAmount?: number;
      rejectionReason?: string;
    }) => apiClient.verifications.decide(id, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["verification", id] });
      void qc.invalidateQueries({ queryKey: ["verifications"] });
      void qc.invalidateQueries({ queryKey: ["portal", "bank", "dashboard"] });
      toast.success(
        variables.decision === "verified"
          ? "Verification approved"
          : "Verification rejected",
      );
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (verificationQuery.isError) {
    const err = verificationQuery.error;
    const notFound = err instanceof ApiError && err.status === 404;
    return (
      <AppShell>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">
            {notFound ? "Verification not found" : "Couldn't load verification"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">{(err as Error).message}</p>
          <Link to="/requests" className="text-sm text-primary underline mt-4 inline-block">
            Back to requests
          </Link>
        </div>
      </AppShell>
    );
  }

  if (verificationQuery.isPending) {
    return (
      <AppShell>
        <EmptyState title="Loading verification…" />
      </AppShell>
    );
  }

  const v = mapVerificationDetail(verificationQuery.data, studentQuery.data ?? undefined);
  const canDecide = isPendingForBank(v.status);

  return (
    <AppShell>
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/requests">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to requests
          </Link>
        </Button>

        {/* Header card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-xl font-mono">{v.code}</CardTitle>
                  <StatusBadge {...verificationStatusBadge(v.status)} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Submitted {formatDateTime(v.submittedAt)}
                  {v.decidedAt && (
                    <>
                      {" "}
                      · Decided {formatDateTime(v.decidedAt)}
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Requested
                </div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(v.requestedAmount, v.currency)}
                </div>
                {v.verifiedAmount != null && (
                  <div className="text-sm text-emerald-700 mt-1">
                    Verified: {formatCurrency(v.verifiedAmount, v.currency)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          {v.rejectionReason && (
            <CardContent>
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
                <span className="font-medium">Rejection reason:</span> {v.rejectionReason}
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Student panel */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Student
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Name" value={v.studentName} />
              <Row label="Email" value={v.studentEmail ?? "—"} />
              <Row label="Country" value={v.studentCountry ?? "—"} />
              <Row label="Nationality" value={v.studentNationality ?? "—"} />
              <Separator />
              <Row
                label="GPA"
                icon={<GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />}
                value={v.studentGpa != null ? v.studentGpa.toFixed(2) : "—"}
              />
              <Row label="Intended Study" value={v.studentIntendedStudy ?? "—"} />
            </CardContent>
          </Card>

          {/* Decision panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Decision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!canDecide && isDecided(v.status) ? (
                <p className="text-sm text-muted-foreground">
                  Decision already issued ({v.status === "verified" ? "approved" : "rejected"}).
                </p>
              ) : !canDecide ? (
                <p className="text-sm text-muted-foreground">
                  Verification is in <strong>{v.status}</strong> — student must submit it
                  before the bank can decide.
                </p>
              ) : (
                <>
                  <ApproveDialog
                    requestedAmount={v.requestedAmount}
                    currency={v.currency}
                    isPending={decideMutation.isPending}
                    onApprove={(verifiedAmount) =>
                      decideMutation.mutate({ decision: "verified", verifiedAmount })
                    }
                  />
                  <RejectDialog
                    isPending={decideMutation.isPending}
                    onReject={(reason) =>
                      decideMutation.mutate({ decision: "rejected", rejectionReason: reason })
                    }
                  />
                  <p className="text-xs text-muted-foreground pt-2">
                    Decisions are final and notify the student + linked university immediately.
                  </p>
                </>
              )}
              {decideMutation.isSuccess && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.invalidate()}
                  className="w-full"
                >
                  Reload
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function ApproveDialog({
  requestedAmount,
  currency,
  isPending,
  onApprove,
}: {
  requestedAmount: number;
  currency: string;
  isPending: boolean;
  onApprove: (verifiedAmount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  // requestedAmount is in minor units. UI shows major; we convert on submit.
  const [amount, setAmount] = useState(String(Math.round(requestedAmount / 100)));

  function handleSubmit() {
    const major = Number(amount);
    if (!Number.isFinite(major) || major < 0) return;
    onApprove(Math.round(major * 100));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default" disabled={isPending}>
          <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve verification</DialogTitle>
          <DialogDescription>
            Confirm the verified amount. Defaults to the requested amount; lower it if the
            available funds are less than requested.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="verifiedAmount">Verified amount ({currency})</Label>
          <Input
            id="verifiedAmount"
            type="number"
            min={0}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Stored in whole units; backend converts to minor units automatically.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Approving…" : "Confirm approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  isPending,
  onReject,
}: {
  isPending: boolean;
  onReject: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REJECTION_REASONS[0]);
  const [note, setNote] = useState("");

  function handleSubmit() {
    const fullReason = note ? `${reason}: ${note}` : reason;
    onReject(fullReason);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="destructive" disabled={isPending}>
          <XCircle className="h-4 w-4 mr-2" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject verification</DialogTitle>
          <DialogDescription>
            Pick a primary reason and optionally add detail. The student and linked university
            will see the reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Additional detail (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Rejecting…" : "Confirm rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
