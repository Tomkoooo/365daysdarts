"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { OptionSelectorInput, OptionSelectorOptionInput } from "@/actions/option-selector-actions";

type OptionSelectorFormProps = {
  initial?: Partial<OptionSelectorInput & { _id?: string }>;
  onSubmit: (input: OptionSelectorInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
};

export function OptionSelectorForm({ initial, onSubmit, onCancel }: OptionSelectorFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [allowMultiple, setAllowMultiple] = useState(initial?.allowMultiple ?? false);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [options, setOptions] = useState<OptionSelectorOptionInput[]>(
    initial?.options?.length
      ? initial.options.map((o) => ({
          _id: o._id,
          text: o.text,
          limit: o.limit ?? 0,
        }))
      : [{ text: "", limit: 0 }]
  );
  const [saving, setSaving] = useState(false);

  function addOption() {
    setOptions([...options, { text: "", limit: 0 }]);
  }

  function removeOption(index: number) {
    if (options.length <= 1) {
      toast.error("Legalább egy opció szükséges");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, field: "text" | "limit", value: string | number) {
    const next = [...options];
    next[index] = { ...next[index], [field]: value };
    setOptions(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("A cím kötelező");
      return;
    }
    const validOptions = options.filter((o) => o.text.trim());
    if (validOptions.length === 0) {
      toast.error("Legalább egy opció szükséges");
      return;
    }
    setSaving(true);
    const result = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      allowMultiple,
      isPublished,
      options: validOptions.map((o) => ({
        _id: o._id,
        text: o.text.trim(),
        limit: Number(o.limit) || 0,
      })),
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
        <Label htmlFor="description">Leírás</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allowMultiple"
          checked={allowMultiple}
          onChange={(e) => setAllowMultiple(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="allowMultiple" className="font-normal cursor-pointer">
          Több opció választható (jelölőnégyzetek)
        </Label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Opciók *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-1" /> Opció hozzáadása
          </Button>
        </div>
        {options.map((opt, i) => (
          <div key={opt._id || i} className="flex gap-2 items-start">
            <Input
              placeholder="Pl. 2026.06.15. 10:00"
              value={opt.text}
              onChange={(e) => updateOption(i, "text", e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              placeholder="Limit"
              title="0 = korlátlan"
              value={opt.limit ?? 0}
              onChange={(e) => updateOption(i, "limit", parseInt(e.target.value, 10) || 0)}
              className="w-24"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeOption(i)}
              aria-label="Opció törlése"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Limit: 0 = korlátlan fő. Pl. időponthoz 1 = egy diák jelentkezhet.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublished"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="isPublished" className="font-normal cursor-pointer">
          Közzététel (diákok láthatják)
        </Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Mentés
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Mégse
        </Button>
      </div>
    </form>
  );
}
