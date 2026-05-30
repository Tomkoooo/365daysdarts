"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { deleteSubmission } from "@/actions/dolgozat-actions";

const UNDO_MS = 10_000;

type ScheduledDeleteCallbacks = {
  onDeleted?: () => void;
  onAfterPermanentDelete?: () => void;
};

export function useScheduledSubmissionDelete(callbacks?: ScheduledDeleteCallbacks) {
  const [hiddenSubmissionIds, setHiddenSubmissionIds] = useState<string[]>([]);
  const deletionTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const cancelScheduledDelete = useCallback((submissionId: string) => {
    if (deletionTimeouts.current[submissionId]) {
      clearTimeout(deletionTimeouts.current[submissionId]);
      delete deletionTimeouts.current[submissionId];
    }
    setHiddenSubmissionIds((prev) => prev.filter((id) => id !== submissionId));
  }, []);

  const scheduleSubmissionDelete = useCallback(
    (submissionId: string, studentName: string, deleteOpts?: { hasGrade?: boolean }) => {
      const gradeWarning = deleteOpts?.hasGrade
        ? " Az értékelés is törlődik."
        : "";
      const confirmMsg = `Biztosan törölni szeretné ${studentName} beadását?${gradeWarning} A törlés 10 másodpercig visszavonható.`;
      if (!confirm(confirmMsg)) return;

      setHiddenSubmissionIds((prev) =>
        prev.includes(submissionId) ? prev : [...prev, submissionId]
      );

      toast.info(`${studentName} beadása törölve`, {
        description: "Visszavonás 10 másodpercig lehetséges.",
        duration: UNDO_MS,
        action: {
          label: "Visszavonás",
          onClick: () => {
            cancelScheduledDelete(submissionId);
            toast.success("Törlés visszavonva");
          },
        },
      });

      if (deletionTimeouts.current[submissionId]) {
        clearTimeout(deletionTimeouts.current[submissionId]);
      }

      deletionTimeouts.current[submissionId] = setTimeout(async () => {
        try {
          const result = await deleteSubmission(submissionId);
          if (!result.success) {
            toast.error(result.error || "Törlési hiba");
            cancelScheduledDelete(submissionId);
            return;
          }
          delete deletionTimeouts.current[submissionId];
          setHiddenSubmissionIds((prev) => prev.filter((id) => id !== submissionId));
          toast.success("Beadás véglegesen törölve");
          callbacksRef.current?.onDeleted?.();
          callbacksRef.current?.onAfterPermanentDelete?.();
        } catch {
          toast.error("Hiba történt a törlés során");
          cancelScheduledDelete(submissionId);
        }
      }, UNDO_MS);
    },
    [cancelScheduledDelete]
  );

  return {
    hiddenSubmissionIds,
    scheduleSubmissionDelete,
    cancelScheduledDelete,
  };
}
