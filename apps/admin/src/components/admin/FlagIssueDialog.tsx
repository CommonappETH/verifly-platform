import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@verifly/ui";
import { Textarea } from "@verifly/ui";
import { Button } from "@verifly/ui";
import { toast } from "sonner";

interface FlagIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
}

export function FlagIssueDialog({ open, onOpenChange, subject }: FlagIssueDialogProps) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flag issue · {subject}</DialogTitle>
          <DialogDescription>
            Describe what looks wrong. Flagged items appear in the operations queue and notify the
            relevant bank or university contact.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Verified amount differs from requested by more than 10%"
          rows={4}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast.success(`Flagged ${subject}`, { description: reason || "No reason provided" });
              setReason("");
              onOpenChange(false);
            }}
          >
            Submit flag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
