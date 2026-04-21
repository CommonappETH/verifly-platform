import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@verifly/ui";
import { Input } from "@verifly/ui";
import { Label } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Switch } from "@verifly/ui";
import { Textarea } from "@verifly/ui";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Verifly" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [requirements, setRequirements] = useState([
    "Official Transcript",
    "Recommendation Letter — English Teacher",
    "Recommendation Letter — Math Teacher",
    "School Profile",
  ]);
  const [newReq, setNewReq] = useState("");

  const addReq = () => {
    if (!newReq.trim()) return;
    setRequirements((r) => [...r, newReq.trim()]);
    setNewReq("");
  };
  const removeReq = (i: number) => setRequirements((r) => r.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your school profile and preferences.</p>
      </div>

      <Tabs defaultValue="school">
        <TabsList>
          <TabsTrigger value="school">School Profile</TabsTrigger>
          <TabsTrigger value="counselor">Counselor Info</TabsTrigger>
          <TabsTrigger value="requirements">Document Requirements</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="school">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField label="School Name" defaultValue="Lincoln High School" />
              <FormField label="CEEB Code" defaultValue="123456" />
              <FormField label="Address" defaultValue="100 Main St, Springfield" />
              <FormField label="Phone" defaultValue="(555) 123-4567" />
              <div className="md:col-span-2">
                <Label>School Description</Label>
                <Textarea
                  className="mt-1"
                  defaultValue="Public 4-year high school serving 1,800 students across grades 9-12."
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => toast.success("Saved")}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counselor">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Counselor Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField label="Full Name" defaultValue="Margaret Carter" />
              <FormField label="Title" defaultValue="College Counselor" />
              <FormField label="Email" defaultValue="m.carter@lincolnhs.edu" />
              <FormField label="Phone" defaultValue="(555) 123-4570" />
              <div className="md:col-span-2">
                <Button onClick={() => toast.success("Saved")}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default Document Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requirements.map((r, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border p-3">
                  <span className="flex-1 text-sm">{r}</span>
                  <Button size="icon" variant="ghost" onClick={() => removeReq(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new required document…"
                  value={newReq}
                  onChange={(e) => setNewReq(e.target.value)}
                />
                <Button onClick={addReq} className="gap-1">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow label="Email me when a university sends a new request" defaultChecked />
              <ToggleRow label="Email me when a deadline is within 3 days" defaultChecked />
              <ToggleRow label="Daily digest summary" />
              <ToggleRow label="Notify me when a student updates their profile" defaultChecked />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FormField({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" defaultValue={defaultValue} />
    </div>
  );
}

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
