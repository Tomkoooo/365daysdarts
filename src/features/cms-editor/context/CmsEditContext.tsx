"use client";

import { createContext, useContext } from "react";
import type { ContentBlockType } from "@/lib/content/types";

export type ContentBlockSnapshot = {
  blockId: string;
  type: ContentBlockType;
  order: number;
  payload: Record<string, unknown>;
};

export type CmsEditContextValue = {
  enabled: boolean;
  selectedBlockId: string | null;
  blocks: ContentBlockSnapshot[];
  updateField: (
    blockId: string,
    field: string,
    value: unknown
  ) => void;
  patchBlock: (
    blockId: string,
    patch: Record<string, unknown>
  ) => void;
  selectBlock: (blockId: string | null) => void;
};

const CmsEditContext = createContext<CmsEditContextValue>({
  enabled: false,
  selectedBlockId: null,
  blocks: [],
  updateField: () => undefined,
  patchBlock: () => undefined,
  selectBlock: () => undefined,
});

export function CmsEditProvider({
  enabled,
  selectedBlockId,
  blocks,
  updateField,
  patchBlock,
  selectBlock,
  children,
}: {
  enabled: boolean;
  selectedBlockId: string | null;
  blocks: ContentBlockSnapshot[];
  updateField: CmsEditContextValue["updateField"];
  patchBlock: CmsEditContextValue["patchBlock"];
  selectBlock: CmsEditContextValue["selectBlock"];
  children: React.ReactNode;
}) {
  return (
    <CmsEditContext.Provider
      value={{ enabled, selectedBlockId, blocks, updateField, patchBlock, selectBlock }}
    >
      <div data-cms-editing={enabled ? "true" : undefined}>{children}</div>
    </CmsEditContext.Provider>
  );
}

export function useCmsEdit() {
  return useContext(CmsEditContext);
}
