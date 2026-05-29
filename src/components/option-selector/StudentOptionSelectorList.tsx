"use client";

import { useEffect, useState } from "react";
import {
  listPublishedOptionSelectorsForStudent,
  submitStudentResponse,
} from "@/actions/option-selector-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      return { ...prev, [selectorId]: [optionId] };
    });
  }

  async function handleSubmit(selectorId: string) {
    const optionIds = selections[selectorId] || [];
    if (optionIds.length === 0) {
      toast.error("Válassz legalább egy opciót");
      return;
    }
    setSubmittingId(selectorId);
    const result = await submitStudentResponse(selectorId, optionIds);
    setSubmittingId(null);
    if (result.success) {
      toast.success("Jelentkezés mentve");
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
        const needsResponse = !item.hasResponded;

        return (
          <Card
            key={item._id}
            className={cn(
              needsResponse && "border-amber-500/50 bg-amber-500/5"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {needsResponse && (
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
                  </div>
                </div>
                {needsResponse ? (
                  <Badge variant="outline" className="border-amber-500 text-amber-600 shrink-0">
                    Új jelentkezés szükséges
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">
                    <Check className="h-3 w-3 mr-1" /> Jelentkezve
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                {item.options.map((opt: any) => {
                  const isSelected = selected.includes(opt._id);
                  const disabled = opt.isFull && !isSelected;

                  return (
                    <label
                      key={opt._id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                        isSelected && "border-primary bg-primary/5",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <input
                        type={item.allowMultiple ? "checkbox" : "radio"}
                        name={`selector-${item._id}`}
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() =>
                          toggleSelection(item._id, opt._id, item.allowMultiple)
                        }
                        className="shrink-0"
                      />
                      <span className="flex-1 text-sm">{opt.text}</span>
                      {opt.limit > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {opt.count}/{opt.limit}
                          {opt.isFull && !isSelected ? " (betelt)" : ""}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              <Button
                size="sm"
                disabled={submittingId === item._id || selected.length === 0}
                onClick={() => handleSubmit(item._id)}
              >
                {submittingId === item._id && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {item.hasResponded ? "Módosítás mentése" : "Jelentkezés"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
