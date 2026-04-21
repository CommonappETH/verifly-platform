import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { TimelineStepper } from "@/components/TimelineStepper";
import { FundingBreakdown } from "@/components/FundingBreakdown";
import {
  financialSummary, verificationStatusLabels, bankPartners,
  applications, universities,
} from "@/lib/mock-data";
import {
  Shield, Info, Clock, Copy, CheckCircle2, Sparkles, ClipboardList, Building2,
} from "lucide-react";
import type { TimelineEvent } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/verification")({
  component: FinancialVerification,
});

type VTiming = "preApproval" | "postApplication" | null;
type VStatus = "not_started" | "request_generated" | "pending_bank" | "verified";

const statusMeta: Record<VStatus, { label: string; variant: "muted" | "success" | "warning" | "info" }> = {
  not_started: { label: "Not Started", variant: "muted" },
  request_generated: { label: "Request Generated", variant: "info" },
  pending_bank: { label: "Pending Bank Verification", variant: "warning" },
  verified: { label: "Verified", variant: "success" },
};

const timingLabel: Record<Exclude<VTiming, null>, string> = {
  preApproval: "Pre-Approval",
  postApplication: "Post-Application",
};

function generateId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `VER-${s}X`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function FinancialVerification() {
  const [timing, setTiming] = useState<VTiming>(null);
  const [amount, setAmount] = useState<string>("");
  const [sponsor, setSponsor] = useState<string>("");
  const [bankId, setBankId] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [status, setStatus] = useState<VStatus>("not_started");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const linkedUnis = applications.filter((a) => a.status !== "draft" && a.status !== "rejected");
  const numericAmount = Number(amount.replace(/,/g, "")) || 0;

  const handleGenerate = () => {
    if (!timing) return toast.error("Select a verification timing first");
    if (!numericAmount || numericAmount <= 0) return toast.error("Enter a valid amount to verify");
    if (!bankId) return toast.error("Select a partner bank");
    if (!bankAccount.trim()) return toast.error("Enter your bank account number");
    const id = generateId();
    setVerificationId(id);
    setStatus("pending_bank");
    setLastUpdated(new Date().toISOString());
    toast.success(`Verification request ${id} generated`);
  };

  const handleCopy = async () => {
    if (!verificationId) return;
    try {
      await navigator.clipboard.writeText(verificationId);
      toast.success("Verification ID copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleSimulate = () => {
    setStatus("verified");
    setLastUpdated(new Date().toISOString());
    toast.success("Bank approval simulated — you are verified");
  };

  const timeline: TimelineEvent[] = useMemo(() => {
    const hasTiming = !!timing;
    const hasAmount = numericAmount > 0;
    const hasRequest = !!verificationId;
    const isPending = status === "pending_bank";
    const isVerified = status === "verified";

    const steps = [
      { key: "timing", title: "Select Verification Timing", description: "Choose pre-approval or post-application", done: hasTiming },
      { key: "amount", title: "Enter Amount", description: "Specify the amount to be verified", done: hasAmount && hasTiming },
      { key: "generate", title: "Generate Verification Request", description: "Receive a unique verification ID", done: hasRequest },
      { key: "bank", title: "Bank Verification", description: "Partner bank reviews and confirms your funds", done: isVerified },
      { key: "complete", title: "Verification Complete", description: "Status shared with selected universities", done: isVerified },
    ];

    const firstIncomplete = steps.findIndex((s) => !s.done);
    return steps.map((s, i) => ({
      id: s.key,
      title: s.title,
      description: s.description,
      date: "",
      completed: s.done,
      current: i === firstIncomplete && !(isVerified && i === steps.length - 1),
    })) as TimelineEvent[];
  }, [timing, numericAmount, verificationId, status]);

  const sm = statusMeta[status];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate a verification request and complete the process at a partner bank — no document uploads required.
        </p>
      </div>

      {/* Header Summary */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
              <Shield className="h-7 w-7" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Timing</p>
                <p className="text-sm font-semibold mt-0.5">
                  {timing ? timingLabel[timing] : <span className="text-muted-foreground font-normal">Not selected</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Amount</p>
                <p className="text-sm font-semibold mt-0.5">
                  {numericAmount > 0 ? formatCurrency(numericAmount) : <span className="text-muted-foreground font-normal">—</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Verification ID</p>
                <p className="text-sm font-semibold font-mono mt-0.5">
                  {verificationId ?? <span className="text-muted-foreground font-normal font-sans">—</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={status} label={sm.label} variant={sm.variant} />
                </div>
              </div>
            </div>
            {lastUpdated && (
              <div className="text-xs text-muted-foreground shrink-0 lg:text-right">
                Last updated<br />
                <span className="font-medium text-foreground">{new Date(lastUpdated).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="rounded-lg border border-info/20 bg-info/5 p-4 flex gap-3">
        <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Verification happens at the bank — no uploads needed</p>
          <p className="text-xs text-muted-foreground">
            You only enter the amount you want verified. We generate a unique request code that you take to a partner bank, which confirms your financial capacity directly.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Timing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 1 · When do you want to complete financial verification?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { key: "preApproval" as const, icon: Sparkles, title: "Pre-Approval", desc: "Complete verification before applying to universities" },
                  { key: "postApplication" as const, icon: ClipboardList, title: "Post-Application Approval", desc: "Complete verification after starting or submitting applications" },
                ]).map(({ key, icon: Icon, title, desc }) => {
                  const selected = timing === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTiming(key)}
                      className={cn(
                        "text-left rounded-xl border p-4 transition-colors",
                        selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold">{title}</p>
                        {selected && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Amount */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 2 · Verification Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount to verify (USD)</Label>
                  <Input
                    id="amount"
                    inputMode="numeric"
                    placeholder="e.g. 45000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sponsor">Sponsor name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="sponsor"
                    placeholder="e.g. Parent / Guardian name"
                    value={sponsor}
                    onChange={(e) => setSponsor(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bank">Partner bank</Label>
                  <Select value={bankId} onValueChange={setBankId}>
                    <SelectTrigger id="bank">
                      <SelectValue placeholder="Select a partner bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankPartners.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          <span className="mr-2">{b.logo}</span>{b.name} · {b.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bankAccount">Bank account number</Label>
                  <Input
                    id="bankAccount"
                    placeholder="e.g. 0123 4567 8901"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleGenerate} className="gap-1">
                  <Sparkles className="h-4 w-4" /> Generate Verification Request
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Generated Request */}
          {verificationId && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Step 3 · Your Verification Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-primary/30 bg-background p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Verification ID</p>
                      <p className="text-3xl font-bold font-mono tracking-tight text-primary mt-1">{verificationId}</p>
                    </div>
                    <Button variant="outline" onClick={handleCopy} className="gap-1 shrink-0">
                      <Copy className="h-4 w-4" /> Copy ID
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-sm font-semibold mt-0.5">{formatCurrency(numericAmount)}</p>
                    </div>
                    {sponsor && (
                      <div>
                        <p className="text-xs text-muted-foreground">Sponsor</p>
                        <p className="text-sm font-semibold mt-0.5">{sponsor}</p>
                      </div>
                    )}
                    {bankId && (
                      <div>
                        <p className="text-xs text-muted-foreground">Partner bank</p>
                        <p className="text-sm font-semibold mt-0.5">
                          {bankPartners.find((b) => b.id === bankId)?.name}
                        </p>
                      </div>
                    )}
                    {bankAccount && (
                      <div>
                        <p className="text-xs text-muted-foreground">Bank account</p>
                        <p className="text-sm font-semibold font-mono mt-0.5">
                          ••••{bankAccount.replace(/\s/g, "").slice(-4)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="mt-0.5"><StatusBadge status={status} label={sm.label} variant={sm.variant} /></div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Next steps
                  </p>
                  <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-5">
                    <li>Take this verification ID to a partner bank listed on this page.</li>
                    <li>Provide the code to the bank to initiate verification.</li>
                    <li>The bank will access your request and verify your financial capacity.</li>
                  </ol>
                </div>

                {status !== "verified" && (
                  <div className="flex justify-end">
                    <Button variant="secondary" onClick={handleSimulate} className="gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Mark as Verified (Simulate Bank Approval)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status Guide */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Verification Status Guide</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(verificationStatusLabels).map(([key, val]) => (
                  <div key={key} className="flex items-start gap-3 rounded-lg border p-3">
                    <StatusBadge status={key} label={val.label} variant={val.color as any} />
                    <p className="text-xs text-muted-foreground flex-1">{val.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Verification Process</CardTitle></CardHeader>
            <CardContent>
              <TimelineStepper events={timeline} />
            </CardContent>
          </Card>

          {/* Funding */}
          <FundingBreakdown
            totalTuition={financialSummary.totalTuitionNeeded}
            estimatedScholarships={financialSummary.estimatedScholarships}
            remainingAmount={financialSummary.remainingAmount}
            verifiedAmount={status === "verified" ? numericAmount : financialSummary.verifiedAmount}
            currency={financialSummary.currency}
          />

          {/* Linked Universities */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Linked Applications</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {linkedUnis.length === 0 && (
                <p className="text-xs text-muted-foreground">No linked applications yet.</p>
              )}
              {linkedUnis.map((a) => {
                const u = universities.find((x) => x.id === a.universityId);
                return (
                  <Link key={a.id} to="/dashboard/applications/$applicationId" params={{ applicationId: a.id }}>
                    <div className="flex items-center gap-2 rounded-lg border p-2 hover:bg-muted/50 transition-colors text-sm">
                      <span className="text-lg">{u?.logo || "🏛️"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{a.universityName}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Bank Partners */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Partner Banks</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Provide your verification ID to one of these partner banks to complete verification.
              </p>
              {bankPartners.map((b) => (
                <div key={b.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{b.logo}</span>
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    Processing: {b.processingTime}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
