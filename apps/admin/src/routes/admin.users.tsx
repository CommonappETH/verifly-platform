import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, UserCheck, UserX, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTableToolbar } from "@/components/admin/DataTableToolbar";
import { EmptyState } from "@/components/admin/EmptyState";
import { users as initialUsers } from "@/lib/admin-mock/users";
import type { AdminUser } from "@/lib/admin-mock/types";
import { getOrgById } from "@/lib/admin-mock/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users · Verifly Admin" },
      { name: "description", content: "Manage all users across roles." },
    ],
  }),
  component: UsersPage,
});

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [openUser, setOpenUser] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (status !== "all" && u.status !== status) return false;
      const q = search.toLowerCase();
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, role, status, search]);

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u,
      ),
    );
    const u = users.find((x) => x.id === id);
    toast.success(`${u?.name} ${u?.status === "active" ? "suspended" : "activated"}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          All accounts across students, universities, banks, counselors and admins.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <DataTableToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search name or email…"
            count={filtered.length}
          >
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="university">University</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="counselor">Counselor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Tabs value={status} onValueChange={setStatus}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="suspended">Suspended</TabsTrigger>
              </TabsList>
            </Tabs>
          </DataTableToolbar>

          {filtered.length === 0 ? (
            <EmptyState hint="Try widening your filters." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback style={{ background: u.avatarColor }} className="text-xs text-white">
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={u.role} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {getOrgById(u.organizationId)?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell><StatusBadge status={u.status} /></TableCell>
                      <TableCell className="text-muted-foreground">{relative(u.lastActive)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setOpenUser(u)}>
                              <Eye className="mr-2 h-4 w-4" /> View user
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(u.id)}>
                              {u.status === "active" ? (
                                <><UserX className="mr-2 h-4 w-4" /> Suspend</>
                              ) : (
                                <><UserCheck className="mr-2 h-4 w-4" /> Activate</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!openUser} onOpenChange={(o) => !o && setOpenUser(null)}>
        <SheetContent className="w-[420px] sm:max-w-md p-6">
          {openUser && (
            <>
              <SheetHeader>
                <SheetTitle>{openUser.name}</SheetTitle>
                <SheetDescription>{openUser.email}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <StatusBadge status={openUser.role} />
                  <StatusBadge status={openUser.status} />
                </div>
                <dl className="grid grid-cols-3 gap-2 rounded-md border p-3">
                  <dt className="text-xs text-muted-foreground">Organization</dt>
                  <dd className="col-span-2">{getOrgById(openUser.organizationId)?.name ?? "—"}</dd>
                  <dt className="text-xs text-muted-foreground">Country</dt>
                  <dd className="col-span-2">{openUser.country}</dd>
                  <dt className="text-xs text-muted-foreground">Last active</dt>
                  <dd className="col-span-2">{relative(openUser.lastActive)}</dd>
                  <dt className="text-xs text-muted-foreground">User ID</dt>
                  <dd className="col-span-2 font-mono text-xs">{openUser.id}</dd>
                </dl>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recent activity
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li>• Logged in {relative(openUser.lastActive)}</li>
                    <li>• Updated profile preferences</li>
                    <li>• Submitted document upload</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
