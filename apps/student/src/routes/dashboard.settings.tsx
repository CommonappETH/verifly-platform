import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Switch } from "@verifly/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@verifly/ui";
import { Separator } from "@verifly/ui";
import { Settings, Bell, Globe, Shield, LogOut, Trash2, User } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and notification preferences.</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingRow label="Email" desc="abebe.tadesse@example.com">
            <Button variant="outline" size="sm">Change</Button>
          </SettingRow>
          <SettingRow label="Password" desc="Last changed 3 months ago">
            <Button variant="outline" size="sm">Update</Button>
          </SettingRow>
          <SettingRow label="Two-Factor Authentication" desc="Add an extra layer of security">
            <Switch />
          </SettingRow>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingRow label="Application Updates" desc="Get notified when application status changes">
            <Switch defaultChecked />
          </SettingRow>
          <SettingRow label="Verification Alerts" desc="Receive alerts about financial verification">
            <Switch defaultChecked />
          </SettingRow>
          <SettingRow label="Scholarship Opportunities" desc="New scholarship alerts matching your profile">
            <Switch defaultChecked />
          </SettingRow>
          <SettingRow label="Document Reminders" desc="Reminders for missing or expiring documents">
            <Switch defaultChecked />
          </SettingRow>
          <SettingRow label="Email Notifications" desc="Receive notifications via email">
            <Switch defaultChecked />
          </SettingRow>
          <SettingRow label="Marketing Communications" desc="Occasional updates about Verifly features">
            <Switch />
          </SettingRow>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingRow label="Language" desc="Choose your preferred language">
            <Select defaultValue="en">
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="am">Amharic</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Currency" desc="Display currency for tuition and scholarships">
            <Select defaultValue="usd">
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="gbp">GBP</SelectItem>
                <SelectItem value="cad">CAD</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Default Degree Level" desc="Pre-fill applications with this degree level">
            <Select defaultValue="bachelors">
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bachelors">Bachelor's</SelectItem>
                <SelectItem value="masters">Master's</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Privacy & Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingRow label="Profile Visibility" desc="Allow universities to discover your profile">
            <Switch defaultChecked />
          </SettingRow>
          <SettingRow label="Data Sharing" desc="Share application data with partner banks for verification">
            <Switch defaultChecked />
          </SettingRow>
          <SettingRow label="Download My Data" desc="Export all your data as a ZIP file">
            <Button variant="outline" size="sm">Download</Button>
          </SettingRow>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3"><CardTitle className="text-base text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingRow label="Log Out" desc="Sign out of your Verifly account">
            <Button variant="outline" size="sm" className="gap-1"><LogOut className="h-4 w-4" /> Log Out</Button>
          </SettingRow>
          <SettingRow label="Delete Account" desc="Permanently delete your account and all associated data">
            <Button variant="destructive" size="sm" className="gap-1"><Trash2 className="h-4 w-4" /> Delete</Button>
          </SettingRow>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}
