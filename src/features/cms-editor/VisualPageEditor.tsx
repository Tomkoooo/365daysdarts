"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Redo2, Save, Smartphone, Tablet, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  addContentBlock,
  deleteContentBlock,
  saveContentPageDraftBlocks,
} from "@/actions/content-actions";
import { MarketingBlockRenderer } from "@/components/content/MarketingBlockRenderer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BLOCK_TYPE_LABELS,
  CONTENT_BLOCK_TYPES,
  ContentBlockType,
} from "@/lib/content/types";
import {
  CmsEditProvider,
  type ContentBlockSnapshot,
} from "@/features/cms-editor/context/CmsEditContext";
import { DevicePreview } from "@/features/cms-editor/DevicePreview";
import { useUndoableBlocks } from "@/features/cms-editor/hooks/use-undoable-blocks";

type VisualPageEditorProps = {
  slug: string;
  initialBlocks: ContentBlockSnapshot[];
  onBlocksSaved?: () => void;
};

export function VisualPageEditor({ slug, initialBlocks, onBlocksSaved }: VisualPageEditorProps) {
  const { blocks, setBlocks, replaceBlocks, undo, redo, canUndo, canRedo } =
    useUndoableBlocks(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [newBlockType, setNewBlockType] = useState<ContentBlockType>("hero");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    replaceBlocks(initialBlocks);
    setSelectedBlockId(null);
    setDirty(false);
  }, [slug, initialBlocks, replaceBlocks]);

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.order - b.order),
    [blocks]
  );

  const updateField = useCallback(
    (blockId: string, field: string, value: unknown) => {
      setBlocks((prev) =>
        prev.map((block) =>
          block.blockId === blockId
            ? { ...block, payload: { ...block.payload, [field]: value } }
            : block
        )
      );
      setDirty(true);
    },
    [setBlocks]
  );

  const patchBlock = useCallback(
    (blockId: string, patch: Record<string, unknown>) => {
      setBlocks((prev) =>
        prev.map((block) =>
          block.blockId === blockId
            ? { ...block, payload: { ...block.payload, ...patch } }
            : block
        )
      );
      setDirty(true);
    },
    [setBlocks]
  );

  const persistDraft = useCallback(async () => {
    setSaving(true);
    try {
      await saveContentPageDraftBlocks(slug, sortedBlocks);
      setDirty(false);
      onBlocksSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mentés sikertelen");
    } finally {
      setSaving(false);
    }
  }, [slug, sortedBlocks, onBlocksSaved]);

  useEffect(() => {
    if (!dirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void persistDraft();
    }, 1500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [dirty, persistDraft, sortedBlocks]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void persistDraft();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [persistDraft, redo, undo]);

  async function handleAddBlock() {
    try {
      await addContentBlock(slug, newBlockType);
      onBlocksSaved?.();
      toast.success("Blokk hozzáadva");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Blokk hozzáadása sikertelen");
    }
  }

  async function handleDeleteBlock(blockId: string) {
    try {
      await deleteContentBlock(slug, blockId);
      setSelectedBlockId(null);
      onBlocksSaved?.();
      toast.success("Blokk törölve");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Törlés sikertelen");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border rounded-lg p-3 bg-muted/30">
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={device === "desktop" ? "default" : "outline"}
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={device === "tablet" ? "default" : "outline"}
            onClick={() => setDevice("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={device === "mobile" ? "default" : "outline"}
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={!canUndo} onClick={undo}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!canRedo} onClick={redo}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" onClick={() => void persistDraft()} disabled={saving || !dirty}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? "Mentés..." : dirty ? "Mentés" : "Mentve"}
        </Button>
        <div className="flex gap-2 ml-auto flex-wrap">
          <Select value={newBlockType} onValueChange={(v: ContentBlockType) => setNewBlockType(v)}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Blokk típus" />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_BLOCK_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {BLOCK_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={() => void handleAddBlock()}>
            Blokk hozzáadása
          </Button>
        </div>
      </div>

      <div className="relative border rounded-lg overflow-hidden bg-background">
        <CmsEditProvider
          enabled
          selectedBlockId={selectedBlockId}
          blocks={sortedBlocks}
          updateField={updateField}
          patchBlock={patchBlock}
          selectBlock={setSelectedBlockId}
        >
          <DevicePreview device={device}>
            <div
              className="relative"
              onClick={() => setSelectedBlockId(null)}
            >
              {sortedBlocks.length === 0 ? (
                <p className="text-sm text-muted-foreground p-8 text-center">
                  Ez az oldal még üres. Adj hozzá blokkot a szerkesztéshez.
                </p>
              ) : (
                <MarketingBlockRenderer blocks={sortedBlocks} compact editMode />
              )}
            </div>
          </DevicePreview>
        </CmsEditProvider>
      </div>

      {selectedBlockId ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Kiválasztott blokk: {selectedBlockId.slice(0, 8)}...</span>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => void handleDeleteBlock(selectedBlockId)}
          >
            Blokk törlése
          </Button>
        </div>
      ) : null}
    </div>
  );
}
