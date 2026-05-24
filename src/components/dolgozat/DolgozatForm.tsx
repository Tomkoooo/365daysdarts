"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { DolgozatInput } from "@/actions/dolgozat-actions";
import { ALLOWED_QUESTION_FILE_TYPES } from "@/lib/dolgozat-utils";

const LABEL_PRESETS = ["Hazifeladat", "Beadandó", "Zárthelyi", "Gyakorló feladat", "Egyéb"];

type DolgozatFormProps = {
  courseId: string;
  initial?: Partial<DolgozatInput & { _id?: string }>;
  onSubmit: (input: DolgozatInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
};

export function DolgozatForm({ courseId, initial, onSubmit, onCancel }: DolgozatFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [label, setLabel] = useState(initial?.label || "Hazifeladat");
  const [customLabel, setCustomLabel] = useState("");
  const [maxPoints, setMaxPoints] = useState(initial?.maxPoints ?? 100);
  const [deadlineAt, setDeadlineAt] = useState(() => {
    if (!initial?.deadlineAt) return "";
    const d = new Date(initial.deadlineAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [allowResubmit, setAllowResubmit] = useState(initial?.allowResubmitUntilDeadline ?? true);
  const [questionFile, setQuestionFile] = useState(initial?.questionFile || null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleQuestionFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_QUESTION_FILE_TYPES.includes(file.type as any)) {
      toast.error("Csak PDF vagy Word fájl engedélyezett");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Maximum 15 MB");
      return;
    }
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const mediaId = data.url.split("/").pop()!;
      setQuestionFile({
        mediaId,
        url: data.url,
        originalName: file.name,
        contentType: file.type,
      });
      toast.success("Fájl feltöltve");
    } catch (err: any) {
      toast.error(err.message || "Feltöltési hiba");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("A cím kötelező");
      return;
    }
    setSaving(true);
    const finalLabel = label === "Egyéb" ? customLabel.trim() || "Egyéb" : label;
    const result = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      label: finalLabel,
      maxPoints,
      deadlineAt: deadlineAt || null,
      isPublished,
      allowResubmitUntilDeadline: allowResubmit,
      questionFile,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || "Hiba történt");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Cím *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Leírás / utasítások</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Címke</Label>
          <Select value={label} onValueChange={setLabel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LABEL_PRESETS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {label === "Egyéb" && (
            <Input
              placeholder="Egyéni címke"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPoints">Max pont</Label>
          <Input
            id="maxPoints"
            type="number"
            min={1}
            value={maxPoints}
            onChange={(e) => setMaxPoints(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Határidő</Label>
        <Input
          id="deadline"
          type="datetime-local"
          value={deadlineAt}
          onChange={(e) => setDeadlineAt(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Kérdőív fájl (PDF / Word)</Label>
        {questionFile ? (
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <span className="text-sm flex-1 truncate">{questionFile.originalName}</span>
            <Button type="button" variant="ghost" size="icon" onClick={() => setQuestionFile(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              id="question-file"
              onChange={handleQuestionFileUpload}
              disabled={uploadingFile}
            />
            <Button type="button" variant="outline" asChild disabled={uploadingFile}>
              <label htmlFor="question-file" className="cursor-pointer gap-2">
                {uploadingFile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Fájl feltöltése
              </label>
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <span className="text-sm">Közzététel (tanulók láthatják)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allowResubmit}
            onChange={(e) => setAllowResubmit(e.target.checked)}
          />
          <span className="text-sm">Újrabeadás engedélyezése határidőig</span>
        </label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Mentés
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Mégse
        </Button>
      </div>
    </form>
  );
}
