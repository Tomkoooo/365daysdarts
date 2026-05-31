"use client";

import { useEffect, useState } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useCmsEdit } from "@/features/cms-editor/context/CmsEditContext";

export function EditableRichText({
  blockId,
  field,
  value,
  title,
}: {
  blockId: string;
  field: string;
  value: string;
  title?: string;
}) {
  const cms = useCmsEdit();
  const [localValue, setLocalValue] = useState(value || "<p></p>");

  useEffect(() => {
    setLocalValue(value || "<p></p>");
  }, [value]);

  if (!cms.enabled) {
    return (
      <article
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
    );
  }

  return (
    <div className="cms-admin-control space-y-2">
      {title ? <p className="text-xs text-muted-foreground">{title}</p> : null}
      <RichTextEditor
        value={localValue}
        onChange={setLocalValue}
        placeholder="Írj ide..."
      />
      <button
        type="button"
        className="text-xs border rounded px-2 py-1 hover:bg-muted"
        onClick={() => cms.updateField(blockId, field, localValue)}
      >
        Szöveg mentése
      </button>
    </div>
  );
}
