"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ContentBlockType } from "@/lib/content/types";

type ContentBlock = {
  blockId: string;
  type: ContentBlockType;
  order: number;
  payload: any;
};

function SortableBlockItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        type="button"
        className="absolute left-2 top-4 z-10 p-1 rounded border bg-background text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="pl-10">{children}</div>
    </div>
  );
}

export function SortableBlockList({
  blocks,
  onReorder,
  renderBlock,
}: {
  blocks: ContentBlock[];
  onReorder: (orderedIds: string[]) => void;
  renderBlock: (block: ContentBlock, index: number) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.blockId === active.id);
    const newIndex = blocks.findIndex((b) => b.blockId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(blocks, oldIndex, newIndex);
    onReorder(reordered.map((b) => b.blockId));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.blockId)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <SortableBlockItem key={block.blockId} id={block.blockId}>
              {renderBlock(block, index)}
            </SortableBlockItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
