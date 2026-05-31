"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { updateQuestion } from "@/actions/question-actions";
import { toast } from "sonner";

type QuestionEditDialogProps = {
  question: {
    _id: string;
    text: string;
    options: string[];
    correctOptions?: number[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function QuestionEditDialog({
  question,
  open,
  onOpenChange,
  onSaved,
}: QuestionEditDialogProps) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!question || !open) return;
    setText(question.text);
    const opts = [...question.options];
    while (opts.length < 4) opts.push("");
    setOptions(opts.slice(0, 4));
    setCorrectOption(question.correctOptions?.[0] ?? 0);
  }, [question, open]);

  async function handleSave() {
    if (!question) return;
    if (!text.trim() || options.some((o) => !o.trim())) {
      toast.error("Kérjük, töltsön ki minden mezőt!");
      return;
    }

    setSubmitting(true);
    try {
      await updateQuestion(question._id, {
        text: text.trim(),
        options: options.map((o) => o.trim()),
        correctOptions: [correctOption],
      });
      toast.success("Kérdés mentve");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("A mentés sikertelen");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kérdés szerkesztése</DialogTitle>
          <DialogDescription>
            Módosítsa a kérdés szövegét és a válaszlehetőségeket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Kérdés szövege</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Írja be a kérdés szövegét..."
            />
          </div>

          <div className="space-y-2">
            <Label>Opciók</Label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <button
                  type="button"
                  className={`w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center shrink-0 ${
                    correctOption === idx
                      ? "bg-green-500 border-green-500"
                      : "border-gray-400"
                  }`}
                  onClick={() => setCorrectOption(idx)}
                  aria-label={`Helyes válasz: ${String.fromCharCode(65 + idx)}`}
                >
                  {correctOption === idx && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </button>
                <Input
                  placeholder={`${String.fromCharCode(65 + idx)}. opció`}
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[idx] = e.target.value;
                    setOptions(newOpts);
                  }}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              A zöld jelölés mutatja a helyes választ.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Mégse
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mentés
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
