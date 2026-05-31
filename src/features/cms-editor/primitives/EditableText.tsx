"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useCmsEdit } from "@/features/cms-editor/context/CmsEditContext";

const editableFieldClass =
  "w-full border border-dashed border-primary/40 bg-primary/5 px-2 py-1 text-inherit rounded-sm";

export function EditableText({
  blockId,
  field,
  value,
  className,
  multiline = false,
  placeholder = "Szöveg",
  as: Tag = "span",
  onCommit,
}: {
  blockId: string;
  field: string;
  value: string;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  onCommit?: (value: string) => void;
}) {
  const cms = useCmsEdit();
  const [localValue, setLocalValue] = useState(value || "");

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const commit = () => {
    if (onCommit) onCommit(localValue);
    else cms.updateField(blockId, field, localValue);
  };

  if (!cms.enabled) {
    if (!value && !placeholder) return null;
    return <Tag className={className}>{value || placeholder}</Tag>;
  }

  if (multiline) {
    return (
      <textarea
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        onBlur={commit}
        placeholder={placeholder}
        rows={4}
        className={cn(editableFieldClass, "min-h-24 resize-y", className)}
      />
    );
  }

  return (
    <input
      value={localValue}
      onChange={(event) => setLocalValue(event.target.value)}
      onBlur={commit}
      placeholder={placeholder}
      className={cn(editableFieldClass, className)}
    />
  );
}
