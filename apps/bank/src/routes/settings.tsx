import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/bank/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@verifly/ui";
import { Input } from "@verifly/ui";
import { Label } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Switch } from "@verifly/ui";
import { Textarea } from "@verifly/ui";
import { Badge } from "@verifly/ui";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); toast.success("Settings saved"); setTimeout(() => setSaved(false), 1500); };

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your bank profile, policies, and team.</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Bank Profile</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="documents">Required Docs</TabsTrigger>
            <TabsTrigger value="staff">Staff & Roles</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle className="text-base">Bank Profile</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Field label="Bank Name" defaultValue="Verifly Partner Bank Ltd." />
                <Field label="SWIFT / BIC" defaultValue="VRFLBANK001" />
                <Field label="Country" defaultValue="Singapore" />
                <Field label="Verification Desk Email" defaultValue="verify@bank.example" />
                <div className="md:col-span-2"><Button onClick={save}>{saved ? "Saved!" : "Save changes"}</Button></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card>
              <CardHeader><CardTitle className="text-base">Verification Policies</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Minimum verifiable balance (USD)" defaultValue="10000" />
                <Field label="Maximum auto-flag amount (USD)" defaultValue="50000" />
                <div>
                  <Label>Verification SLA</Label>
                  <Input defaultValue="3 business days" />
                </div>
                <Toggle label="Require 2-officer approval for amounts > $100k" defaultChecked />
                <Toggle label="Auto-mark stale requests as Under Review after 24h" />
                <Button onClick={save}>{saved ? "Saved!" : "Save changes"}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader><CardTitle className="text-base">Required Documents</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {["Bank Statement (3 months)", "Account Ownership Letter", "Guardian ID Proof", "Source of Funds Declaration"].map((d) => (
                  <div key={d} className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm">{d}</span>
                    <Badge variant="outline">Required</Badge>
                  </div>
                ))}
                <Button variant="outline">+ Add document type</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader><CardTitle className="text-base">Staff & Roles</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: "Officer Mensah", role: "Senior Verifier" },
                  { name: "A. Tanaka", role: "Verifier" },
                  { name: "R. Kumar", role: "Reviewer" },
                  { name: "S. Adeyemi", role: "Compliance" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.role}</div>
                    </div>
                    <Button variant="ghost" size="sm">Manage</Button>
                  </div>
                ))}
                <Button variant="outline">+ Invite staff</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Toggle label="Email me on new verification requests" defaultChecked />
                <Toggle label="Email me when documents are uploaded" defaultChecked />
                <Toggle label="Daily digest of pending requests" />
                <div>
                  <Label>Auto-reply for received requests</Label>
                  <Textarea defaultValue="Thank you — your verification request is being processed." />
                </div>
                <Button onClick={save}>{saved ? "Saved!" : "Save changes"}</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} />
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  const [v, setV] = useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={v} onCheckedChange={setV} />
    </div>
  );
}