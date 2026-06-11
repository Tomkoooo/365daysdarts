"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export const SCHEDULED_DELETE_MS = 10_000;

export type ScheduleDeleteOptions = {
  confirmMessage: string;
  toastTitle: string;
  toastDescription?: string;
  undoLabel?: string;
  onExecute: () => Promise<void | { success?: boolean; error?: string }>;
  onAfterExecute?: () => void;
};

export function useScheduledDelete() {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const deletionTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const cancelScheduledDelete = useCallback((id: string) => {
    if (deletionTimeouts.current[id]) {
      clearTimeout(deletionTimeouts.current[id]);
      delete deletionTimeouts.current[id];
    }
    setHiddenIds((prev) => prev.filter((hid) => hid !== id));
  }, []);

  const scheduleDelete = useCallback(
    (id: string, options: ScheduleDeleteOptions) => {
      if (!confirm(options.confirmMessage)) return;

      setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

      toast.info(options.toastTitle, {
        description:
          options.toastDescription ?? "Visszavonás 10 másodpercig lehetséges.",
        duration: SCHEDULED_DELETE_MS,
        action: {
          label: options.undoLabel ?? "Visszavonás",
          onClick: () => {
            cancelScheduledDelete(id);
            toast.success("Művelet visszavonva");
          },
        },
      });

      if (deletionTimeouts.current[id]) {
        clearTimeout(deletionTimeouts.current[id]);
      }

      deletionTimeouts.current[id] = setTimeout(async () => {
        try {
          const result = await options.onExecute();
          if (
            result &&
            typeof result === "object" &&
            "success" in result &&
            result.success === false
          ) {
            toast.error(result.error || "Törlési hiba");
            cancelScheduledDelete(id);
            return;
          }
          delete deletionTimeouts.current[id];
          setHiddenIds((prev) => prev.filter((hid) => hid !== id));
          options.onAfterExecute?.();
        } catch {
          toast.error("Hiba történt a törlés során");
          cancelScheduledDelete(id);
        }
      }, SCHEDULED_DELETE_MS);
    },
    [cancelScheduledDelete]
  );

  return { hiddenIds, scheduleDelete, cancelScheduledDelete };
}
