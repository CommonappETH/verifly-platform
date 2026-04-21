import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@verifly/ui";
import { Input } from "@verifly/ui";
import { Label } from "@verifly/ui";
import { Switch } from "@verifly/ui";
import { Checkbox } from "@verifly/ui";
import { Button } from "@verifly/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@verifly/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@verifly/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Verifly Admin" },
      { name: "description", content: "Platform configuration." },
    ],
  }),
  component: SettingsPage,
});

const ROLES = ["Student", "University", "Bank", "Counselor", "Admin"];
const CAPS = ["View applications", "Manage users", "Approve verifications", "Edit documents", "Configure platform"];
const matrix: Record<string, boolean[]> = {
  Student: [true, false, false, false, false],
  University: [true, false, false, true, false],
  Bank: [false, false, true, true, false],
  Counselor: [true, false, false, true, false],
  Admin: [true, true, true, true, true],
};

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure platform-wide preferences.</p>
      </div>

      <Tabs defaultValue="platform">
        <TabsList>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Platform settings</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="org">Organization name</Label>
                <Input id="org" defaultValue="Verifly Inc." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Support email</Label>
                <Input id="email" type="email" defaultValue="support@verifly.io" />
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">America/New_York</SelectItem>
                    <SelectItem value="cet">Europe/Berlin</SelectItem>
                    <SelectItem value="sgt">Asia/Singapore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Default currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                    <SelectItem value="sgd">SGD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => toast.success("Settings saved")}>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role permissions</CardTitle>
              <p className="text-xs text-muted-foreground">Read-only matrix preview.</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    {CAPS.map((c) => <TableHead key={c}>{c}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROLES.map((r) => (
                    <TableRow key={r}>
                      <TableCell className="font-medium">{r}</TableCell>
                      {matrix[r].map((v, i) => (
                        <TableCell key={i}>
                          <Checkbox checked={v} disabled />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Notification preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "n1", label: "New verification request submitted", desc: "Email when any guardian submits a new verification." },
                { id: "n2", label: "Issue flagged by admin", desc: "Notify the bank and university when an issue is flagged." },
                { id: "n3", label: "Weekly digest", desc: "Summary of platform activity every Monday." },
              ].map((n, i) => (
                <div key={n.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch defaultChecked={i !== 2} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
