import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { coreEssays as initialEssays, type CoreEssay } from "@/lib/mock-data";
import { FileText, Upload, Info, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/essays")({
  component: EssaysPage,
});

function EssaysPage() {
  const [essays, setEssays] = useState<CoreEssay[]>(initialEssays);

  const handleUpload = (id: string) => {
    setEssays((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "uploaded",
              fileName: `${e.name.toLowerCase().replace(/\s+/g, "_")}.pdf`,
              uploadedDate: new Date().toISOString().slice(0, 10),
              wordCount: 500,
            }
          : e
      )
    );
  };

  const uploadedCount = essays.filter((e) => e.status === "uploaded").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Essays</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your core essays. Reuse them across applications, just like Common App.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {uploadedCount} of {essays.length} uploaded
        </div>
      </div>

      <div className="rounded-lg border border-info/20 bg-info/5 p-4 flex gap-3">
        <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">How essays work</p>
          <p className="text-xs text-muted-foreground">
            Core essays here become available to attach to any university application. If a school requires
            additional supplemental prompts, you'll see them inside that university's application page.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {essays.map((essay) => (
          <EssayRow key={essay.id} essay={essay} onUpload={() => handleUpload(essay.id)} />
        ))}
      </div>
    </div>
  );
}

function EssayRow({ essay, onUpload }: { essay: CoreEssay; onUpload: () => void }) {
  const isUploaded = essay.status === "uploaded";
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {essay.name}
          </CardTitle>
          <StatusBadge
            status={essay.status}
            label={isUploaded ? "Uploaded" : "Missing"}
            variant={isUploaded ? "success" : "destructive"}
          />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{essay.description}</p>

        {isUploaded ? (
          <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{essay.fileName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {essay.uploadedDate && <span>Uploaded {essay.uploadedDate}</span>}
                  {essay.wordCount && <span>• {essay.wordCount} words</span>}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={onUpload}>
              Replace
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border/70 p-6 text-center hover:border-primary/40 transition-colors">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No essay uploaded yet</p>
            <p className="text-xs text-muted-foreground mb-3">PDF or DOCX up to 10MB</p>
            <Button size="sm" className="gap-2" onClick={onUpload}>
              <Upload className="h-4 w-4" /> Upload {essay.name}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
