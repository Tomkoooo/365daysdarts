"use client";

import { useCallback, useRef, useState } from "react";
import type { ContentBlockSnapshot } from "@/features/cms-editor/context/CmsEditContext";

function cloneBlocks(blocks: ContentBlockSnapshot[]) {
  return JSON.parse(JSON.stringify(blocks)) as ContentBlockSnapshot[];
}

export function useUndoableBlocks(initialBlocks: ContentBlockSnapshot[]) {
  const [blocks, setBlocksState] = useState<ContentBlockSnapshot[]>(() => cloneBlocks(initialBlocks));
  const pastRef = useRef<ContentBlockSnapshot[][]>([]);
  const futureRef = useRef<ContentBlockSnapshot[][]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  const pushHistory = useCallback((current: ContentBlockSnapshot[]) => {
    pastRef.current = [...pastRef.current.slice(-49), cloneBlocks(current)];
    futureRef.current = [];
    setHistoryVersion((n) => n + 1);
  }, []);

  const setBlocks = useCallback(
    (next: ContentBlockSnapshot[] | ((prev: ContentBlockSnapshot[]) => ContentBlockSnapshot[])) => {
      setBlocksState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        pushHistory(prev);
        return cloneBlocks(resolved);
      });
    },
    [pushHistory]
  );

  const replaceBlocks = useCallback((next: ContentBlockSnapshot[]) => {
    setBlocksState(cloneBlocks(next));
    pastRef.current = [];
    futureRef.current = [];
    setHistoryVersion((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    setBlocksState((current) => {
      const past = pastRef.current;
      if (past.length === 0) return current;
      const previous = past[past.length - 1];
      pastRef.current = past.slice(0, -1);
      futureRef.current = [cloneBlocks(current), ...futureRef.current];
      setHistoryVersion((n) => n + 1);
      return cloneBlocks(previous);
    });
  }, []);

  const redo = useCallback(() => {
    setBlocksState((current) => {
      const future = futureRef.current;
      if (future.length === 0) return current;
      const next = future[0];
      futureRef.current = future.slice(1);
      pastRef.current = [...pastRef.current, cloneBlocks(current)];
      setHistoryVersion((n) => n + 1);
      return cloneBlocks(next);
    });
  }, []);

  const canUndo = historyVersion >= 0 && pastRef.current.length > 0;
  const canRedo = historyVersion >= 0 && futureRef.current.length > 0;

  return {
    blocks,
    setBlocks,
    replaceBlocks,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
