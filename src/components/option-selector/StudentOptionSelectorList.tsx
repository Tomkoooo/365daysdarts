"use client";

import { useEffect, useState } from "react";
import {
  listPublishedOptionSelectorsForStudent,
  submitStudentResponse,
} from "@/actions/option-selector-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { haveSelectionsChanged } from "@/lib/option-selector-utils";

type StudentOptionSelectorListProps = {
  courseId: string;
};

export function StudentOptionSelectorList({ courseId }: StudentOptionSelectorListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  async function load() {
    try {
      const data = await listPublishedOptionSelectorsForStudent(courseId);
      setItems(data);
      const initial: Record<string, string[]> = {};
      for (const item of data) {
        initial[item._id] = [...(item.myOptionIds || [])];
      }
      setSelections(initial);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [courseId]);

  function toggleSelection(selectorId: string, optionId: string, allowMultiple: boolean) {
    setSelections((prev) => {
      const current = prev[selectorId] || [];
      if (allowMultiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [selectorId]: next };
      }
      if (current.includes(optionId)) {
        return { ...prev, [selectorId]: [] };
      }
      return { ...prev, [selectorId]: [optionId] };
    });
  }

  async function handleSubmit(selectorId: string, hasResponded: boolean) {
    const optionIds = selections[selectorId] || [];
    if (optionIds.length === 0 && !hasResponded) {
      toast.error("Válassz legalább egy opciót");
      return;
    }
    setSubmittingId(selectorId);
    const result = await submitStudentResponse(selectorId, optionIds);
    setSubmittingId(null);
    if (result.success) {
      toast.success(
        optionIds.length === 0 ? "Jelentkezés visszavonva" : "Jelentkezés mentve"
      );
      load();
    } else {
      toast.error(result.error || "Hiba történt");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Opcióválasztók / Jelentkezések</h2>
      {items.map((item) => {
        const selected = selections[item._id] || [];
        const savedSelection = item.myOptionIds || [];
        const needsResponse = !item.hasResponded;
        const canChange = item.canChange !== false;
        const isPastDeadline = item.isPastDeadline === true;
        const canRegister = item.canRegister !== false;
        const canWithdraw = item.canWithdraw === true;
        const unmetMessages: string[] = item.unmetRequirementMessages || [];
        const showPendingBadge = needsResponse && canRegister;
        const selectionChanged = haveSelectionsChanged(savedSelection, selected);
        const isWithdrawalSelection = selected.length === 0 && item.hasResponded;
        const canSubmit =
          (canRegister && (item.hasResponded ? selectionChanged : selected.length > 0)) ||
          (canWithdraw && isWithdrawalSelection && selectionChanged);

        return (
          <Card
            key={item._id}
            className={cn(
              showPendingBadge && "border-amber-500/50 bg-amber-500/5"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {showPendingBadge && (
                    <AlertTriangle
                      className="h-5 w-5 shrink-0 text-amber-500 mt-0.5"
                      aria-hidden
                    />
                  )}
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                    {item.deadlineAt && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Határidő: {new Date(item.deadlineAt).toLocaleString("hu-HU")}
                      </p>
                    )}
                  </div>
                </div>
                {showPendingBadge ? (
                  <Badge variant="outline" className="border-amber-500 text-amber-600 shrink-0">
                    Új jelentkezés szükséges
                  </Badge>
                ) : needsResponse && !canRegister ? (
                  <Badge variant="outline" className="shrink-0">
                    Feltételek nem teljesülnek
                  </Badge>
                ) : isPastDeadline ? (
                  <Badge variant="secondary" className="shrink-0">
                    <Check className="h-3 w-3 mr-1" /> Lezárva
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">
                    <Check className="h-3 w-3 mr-1" /> Jelentkezve
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!canRegister && unmetMessages.length > 0 && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                    <Lock className="h-4 w-4 shrink-0" />
                    Jelentkezéshez teljesítened kell:
                  </div>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
                    {unmetMessages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-2">
                {item.options.map((opt: any) => {
                  const isSelected = selected.includes(opt._id);
                  const canInteract =
                    canChange &&
                    (canRegister || (canWithdraw && isSelected)) &&
                    (isSelected || !opt.isFull);
                  const disabled = !canInteract;

                  return (
                    <div
                      key={opt._id}
                      role={item.allowMultiple ? "checkbox" : "radio"}
                      aria-checked={isSelected}
                      tabIndex={disabled ? -1 : 0}
                      onClick={() => {
                        if (disabled) return;
                        toggleSelection(item._id, opt._id, item.allowMultiple);
                      }}
                      onKeyDown={(e) => {
                        if (disabled) return;
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          toggleSelection(item._id, opt._id, item.allowMultiple);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-md border transition-colors min-h-10",
                        isSelected && "border-primary bg-primary/5",
                        canInteract ? "cursor-pointer" : "cursor-default",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <input
                        type={item.allowMultiple ? "checkbox" : "radio"}
                        name={`selector-${item._id}`}
                        checked={isSelected}
                        readOnly
                        tabIndex={-1}
                        aria-hidden
                        className="shrink-0 pointer-events-none"
                      />
                      <span className="flex-1 text-sm">{opt.text}</span>
                      {opt.limit > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {opt.count}/{opt.limit}
                          {opt.isFull && !isSelected ? " (betelt)" : ""}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {isPastDeadline && !item.hasResponded && (
                <p className="text-sm text-muted-foreground">
                  A határidő lejárt, jelentkezés már nem lehetséges.
                </p>
              )}
              {canChange && (canRegister || (canWithdraw && isWithdrawalSelection)) && (
                <Button
                  size="sm"
                  disabled={submittingId === item._id || !canSubmit}
                  onClick={() => handleSubmit(item._id, item.hasResponded)}
                >
                  {submittingId === item._id && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {selected.length === 0 && item.hasResponded
                    ? "Jelentkezés visszavonása"
                    : item.hasResponded
                      ? "Módosítás mentése"
                      : "Jelentkezés"}
                </Button>
              )}
              {item.hasResponded && canChange && canRegister && (
                <p className="text-xs text-muted-foreground">
                  A határidőig módosíthatod vagy visszavonhatod a választásodat.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
