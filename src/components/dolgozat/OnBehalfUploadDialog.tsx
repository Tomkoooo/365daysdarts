"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmissionFileUploader, type LocalFile } from "@/components/dolgozat/SubmissionFileUploader";
import { uploadSubmissionOnBehalf } from "@/actions/dolgozat-actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function OnBehalfUploadDialog({
  open,
  onOpenChange,
  dolgozatId,
  studentId,
  studentName,
  hasExistingSubmission,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dolgozatId: string;
  studentId: string;
  studentName: string;
  hasExistingSubmission: boolean;
  onSuccess: () => void;
}) {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [markSubmitted, setMarkSubmitted] = useState(true);
  const [force, setForce] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit() {
    if (!files.length) {
      toast.error("Legalább egy fájl szükséges");
      return;
    }
    setUploading(true);
    const result = await uploadSubmissionOnBehalf(
      dolgozatId,
      studentId,
      files.map(({ localId, ...f }) => f),
      { markSubmitted, force: hasExistingSubmission ? force : false }
    );
    setUploading(false);
    if (result.success) {
      toast.success("Beadás feltöltve");
      setFiles([]);
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.error || "Feltöltési hiba");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Beadás feltöltése</DialogTitle>
          <DialogDescription>
            Tanuló: <strong>{studentName}</strong>. Töltsd fel az e-mailben kapott
            megoldást (fotó, PDF vagy Word), hogy ugyanott jelenjen meg, mint a többi
            beadás.
          </DialogDescription>
        </DialogHeader>

        <SubmissionFileUploader files={files} onChange={setFiles} disabled={uploading} />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={markSubmitted}
            onChange={(e) => setMarkSubmitted(e.target.checked)}
          />
          Beadásként rögzítés (ajánlott)
        </label>

        {hasExistingSubmission && (
          <label className="flex items-center gap-2 text-sm cursor-pointer text-destructive">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
            />
            Meglévő beadás felülírása
          </label>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Mégse
          </Button>
          <Button onClick={handleSubmit} disabled={uploading || !files.length}>
            {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Feltöltés
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
