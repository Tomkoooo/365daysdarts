"use client";

import { BLOCK_TYPE_LABELS } from "@/lib/content/types";
import type { ContentBlockSnapshot } from "@/features/cms-editor/context/CmsEditContext";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function BlockOverlay({
  blocks,
  selectedBlockId,
  onSelect,
  onDelete,
}: {
  blocks: ContentBlockSnapshot[];
  selectedBlockId: string | null;
  onSelect: (blockId: string) => void;
  onDelete: (blockId: string) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {blocks.map((block, index) => {
        const isSelected = block.blockId === selectedBlockId;
        return (
          <div
            key={block.blockId}
            className="pointer-events-auto relative group"
            data-block-overlay={block.blockId}
          >
            <button
              type="button"
              className={`absolute top-2 right-2 z-20 flex items-center gap-1 rounded-md border px-2 py-1 text-xs shadow-sm transition ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background/90 opacity-0 group-hover:opacity-100"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(block.blockId);
              }}
            >
              {index + 1}. {BLOCK_TYPE_LABELS[block.type]}
            </button>
            {isSelected ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 left-2 z-20 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(block.blockId);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
