"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { gradeSubmission, clearGrade } from "@/actions/dolgozat-actions";

export function GradePanel({
  submissionId,
  maxPoints,
  initialPoints,
  initialFeedback,
  isGraded,
  onSaved,
}: {
  submissionId: string;
  maxPoints: number;
  initialPoints?: number;
  initialFeedback?: string;
  isGraded: boolean;
  onSaved: () => void;
}) {
  const [points, setPoints] = useState(initialPoints ?? "");
  const [feedback, setFeedback] = useState(initialFeedback || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const num = Number(points);
    if (Number.isNaN(num)) {
      toast.error("Érvénytelen pontszám");
      return;
    }
    setSaving(true);
    const result = await gradeSubmission(submissionId, num, feedback);
    setSaving(false);
    if (result.success) {
      toast.success("Értékelés mentve");
      onSaved();
    } else {
      toast.error(result.error || "Hiba");
    }
  }

  async function handleClear() {
    setSaving(true);
    const result = await clearGrade(submissionId);
    setSaving(false);
    if (result.success) {
      toast.success("Értékelés törölve");
      onSaved();
    } else {
      toast.error(result.error || "Hiba");
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="font-semibold">Értékelés</h3>
      <div className="space-y-2">
        <Label htmlFor="points">Pontszám (max {maxPoints})</Label>
        <Input
          id="points"
          type="number"
          min={0}
          max={maxPoints}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback">Visszajelzés</Label>
        <Textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="Opcionális írásbeli visszajelzés..."
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Mentés
        </Button>
        {isGraded && (
          <Button variant="outline" onClick={handleClear} disabled={saving}>
            Értékelés visszavonása
          </Button>
        )}
      </div>
    </div>
  );
}
