import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Upload, CheckCircle2, Trash2, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { Textarea } from "@verifly/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@verifly/ui";
import { Badge } from "@verifly/ui";
import { StatusBadge } from "@verifly/ui";
import { statusBadgeProps } from "@/lib/status-badge";
import { toast } from "sonner";
import { students, documents } from "@/lib/mock/students";
import { documentRequests, notes as notesStore } from "@/lib/mock/requests";
import { universities } from "@/lib/mock/universities";
import { addNoteMock, deleteNoteMock, setDocumentStatusMock, uploadDocumentMock } from "@/lib/mock/api";
import { formatDate, formatRelative } from "@/lib/format";
import type { DocumentRecord, DocumentRequest, Note } from "@/lib/mock/types";

export const Route = createFileRoute("/students_/$id")({
  loader: ({ params }) => {
    const student = students.find((s) => s.id === params.id);
    if (!student) throw notFound();
    return { student };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.student.firstName} ${loaderData.student.lastName} — Verifly`
          : "Student",
      },
    ],
  }),
  component: StudentDetail,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">Student not found.</p>
      <Link to="/students" className="mt-3 inline-block text-sm text-primary hover:underline">
        Back to students
      </Link>
    </div>
  ),
});

function StudentDetail() {
  const { student } = Route.useLoaderData();
  const [docs, setDocs] = useState<DocumentRecord[]>(() =>
    documents.filter((d) => d.studentId === student.id),
  );
  const [requests, setRequests] = useState<DocumentRequest[]>(() =>
    documentRequests.filter((r) => r.studentId === student.id),
  );
  const [studentNotes, setStudentNotes] = useState<Note[]>(() =>
    notesStore.filter((n) => n.studentId === student.id),
  );
  const [newNote, setNewNote] = useState("");
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const requestInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const studentUnis = student.universityIds
    .map((id) => universities.find((u) => u.id === id))
    .filter(Boolean);

  const handleUpload = (doc: DocumentRecord, file: File) => {
    uploadDocumentMock(doc, file.name);
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d } : d)));
    toast.success(`Uploaded ${file.name}`, { description: doc.label });
  };

  const handleMarkSubmitted = (doc: DocumentRecord) => {
    setDocumentStatusMock(doc, "completed");
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d } : d)));
    toast.success("Marked as submitted", { description: doc.label });
  };

  const handleRequestUpload = (req: DocumentRequest, file: File) => {
    req.status = "completed";
    setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r } : r)));
    toast.success(`Responded to request`, { description: `${file.name} sent to ${universities.find((u) => u.id === req.universityId)?.shortName}` });
  };

  const handleMarkRequestComplete = (req: DocumentRequest) => {
    req.status = "completed";
    setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r } : r)));
    toast.success("Request marked completed");
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = addNoteMock(student.id, newNote.trim());
    setStudentNotes((prev) => [note, ...prev]);
    setNewNote("");
    toast.success("Note added");
  };

  const handleDeleteNote = (id: string) => {
    deleteNoteMock(id);
    setStudentNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-6">
      <Link to="/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {student.firstName} {student.lastName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Grade {student.gradeLevel}</span>
              <span>·</span>
              <span>{student.email}</span>
            </div>
          </div>
          <StatusBadge {...statusBadgeProps(student.applicationStatus)} />
        </CardContent>
      </Card>

      {/* Academic */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Academic Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Field label="GPA" value={student.gpa.toFixed(2)} />
          <Field label="School" value={student.schoolName} />
          <Field label="Graduation Year" value={String(student.graduationYear)} />
          <Field
            label="Universities"
            value={studentUnis.length ? studentUnis.map((u) => u!.shortName).join(", ") : "—"}
          />
          <div className="md:col-span-4">
            <div className="text-xs font-medium text-muted-foreground">Academic Summary</div>
            <p className="mt-1 text-sm leading-relaxed">{student.academicSummary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center"
            >
              <div className="flex flex-1 items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {doc.label}
                    {!doc.required && (
                      <Badge variant="secondary" className="ml-2 font-normal">
                        Optional
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {doc.fileName ? `${doc.fileName} · ` : ""}Updated {formatRelative(doc.updatedAt)}
                  </div>
                </div>
              </div>
              <StatusBadge {...statusBadgeProps(doc.status)} />
              <div className="flex gap-2">
                <input
                  ref={(el) => {
                    fileInputs.current[doc.id] = el;
                  }}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(doc, file);
                    e.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputs.current[doc.id]?.click()}
                  className="gap-1"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {doc.fileName ? "Replace" : "Upload"}
                </Button>
                {doc.status !== "completed" && (
                  <Button size="sm" variant="ghost" onClick={() => handleMarkSubmitted(doc)} className="gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Submitted
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* University Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">University Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-sm text-muted-foreground">
                    No pending requests.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.documentLabel}</TableCell>
                    <TableCell>{universities.find((u) => u.id === r.universityId)?.shortName ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(r.deadline)}</TableCell>
                    <TableCell>
                      <StatusBadge {...statusBadgeProps(r.status)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <input
                        ref={(el) => {
                          requestInputs.current[r.id] = el;
                        }}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleRequestUpload(r, file);
                          e.target.value = "";
                        }}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={r.status === "completed"}
                          onClick={() => requestInputs.current[r.id]?.click()}
                          className="gap-1"
                        >
                          <Upload className="h-3.5 w-3.5" /> Upload & Respond
                        </Button>
                        {r.status !== "completed" && (
                          <Button size="sm" variant="ghost" onClick={() => handleMarkRequestComplete(r)}>
                            Mark Completed
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a private counselor note…"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[60px]"
            />
            <Button onClick={handleAddNote} className="self-end gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {studentNotes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
            {studentNotes.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex-1">
                  <p className="text-sm">{n.body}</p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {n.author} · {formatRelative(n.createdAt)}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteNote(n.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
