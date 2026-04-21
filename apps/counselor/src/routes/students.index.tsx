import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, MoreHorizontal, Eye, Upload, Inbox } from "lucide-react";
import { students } from "@/lib/mock/students";
import { universities } from "@/lib/mock/universities";
import { documentRequests } from "@/lib/mock/requests";
import { getStudentDocStatus } from "@/lib/mock/api";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Students — Verifly Counselor Portal" },
      { name: "description", content: "All students assigned to your school." },
    ],
  }),
  component: StudentsPage,
});

type Filter = "all" | "missing" | "complete" | "active";

function StudentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    return students
      .map((s) => ({
        ...s,
        docStatus: getStudentDocStatus(s.id),
        requestCount: documentRequests.filter((r) => r.studentId === s.id && r.status !== "completed").length,
      }))
      .filter((s) => {
        const q = search.toLowerCase().trim();
        const matchesSearch =
          !q ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q);
        const matchesFilter =
          filter === "all" ||
          (filter === "missing" && s.docStatus === "incomplete") ||
          (filter === "complete" && s.docStatus === "complete") ||
          (filter === "active" && (s.applicationStatus === "in_progress" || s.applicationStatus === "submitted"));
        return matchesSearch && matchesFilter;
      });
  }, [search, filter]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} of {students.length} students
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="missing">Missing Documents</TabsTrigger>
                <TabsTrigger value="complete">Complete Profiles</TabsTrigger>
                <TabsTrigger value="active">Active Applications</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                className="h-9 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Universities</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                    No students match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((s) => {
                  const unis = s.universityIds
                    .map((id) => universities.find((u) => u.id === id)?.shortName)
                    .filter(Boolean) as string[];
                  return (
                    <TableRow key={s.id} className="hover:bg-muted/40">
                      <TableCell>
                        <Link
                          to="/students/$id"
                          params={{ id: s.id }}
                          className="font-medium hover:underline"
                        >
                          {s.firstName} {s.lastName}
                        </Link>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                      </TableCell>
                      <TableCell>{s.gradeLevel}</TableCell>
                      <TableCell>{s.gpa.toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={s.applicationStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.docStatus} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {unis.slice(0, 2).map((u) => (
                            <Badge key={u} variant="secondary" className="font-normal">
                              {u}
                            </Badge>
                          ))}
                          {unis.length > 2 && (
                            <Badge variant="secondary" className="font-normal">
                              +{unis.length - 2}
                            </Badge>
                          )}
                          {unis.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelative(s.lastUpdated)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to="/students/$id" params={{ id: s.id }}>
                                <Eye className="mr-2 h-4 w-4" /> View Student
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/students/$id" params={{ id: s.id }}>
                                <Upload className="mr-2 h-4 w-4" /> Upload Documents
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/students/$id" params={{ id: s.id }}>
                                <Inbox className="mr-2 h-4 w-4" /> View Requests
                                {s.requestCount > 0 && (
                                  <Badge variant="secondary" className="ml-auto">
                                    {s.requestCount}
                                  </Badge>
                                )}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
