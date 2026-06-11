"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UploadSheet, type UploadSheetHandle } from "@/features/cms-editor/primitives/UploadSheet";
import { MediaManager } from "@/components/lecturer/MediaManager";
import { cn } from "@/lib/utils";
import { FolderOpen, ImageIcon, Link2, Trash2, Upload } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  editMode: boolean;
  onChange: (nextSrc: string) => void;
  className?: string;
  width?: number;
  height?: number;
  usageLabel?: string;
  flexibleCrop?: boolean;
  /** Fill the parent container (use inside `relative` + fixed-height wrappers) */
  fillContainer?: boolean;
};

export function EditableImage({
  src,
  alt,
  editMode,
  onChange,
  className,
  width = 1200,
  height = 800,
  usageLabel,
  flexibleCrop = false,
  fillContainer = false,
}: Props) {
  const uploadRef = useRef<UploadSheetHandle>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(src || "");
  const [showUrlField, setShowUrlField] = useState(false);

  useEffect(() => {
    setUrlDraft(src || "");
  }, [src]);

  useEffect(() => {
    if (!overlayOpen) return;
    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = 240;
      const left = Math.min(
        Math.max(8, rect.left + rect.width / 2 - panelWidth / 2),
        window.innerWidth - panelWidth - 8
      );
      const top = Math.min(rect.bottom + 8, window.innerHeight - 220);
      setPanelPos({ top, left });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [overlayOpen]);

  const closeOverlay = () => {
    setOverlayOpen(false);
    setShowUrlField(false);
  };

  if (!editMode) {
    if (!src) return null;
    return <img src={src} alt={alt} className={className} />;
  }

  const overlay =
    overlayOpen && panelPos
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Bezárás"
              className="fixed inset-0 z-[450] bg-black/20"
              onClick={closeOverlay}
            />
            <div
              className="cms-admin-control fixed z-[460] w-60 rounded-lg border bg-popover p-2 shadow-xl space-y-1"
              style={{ top: panelPos.top, left: panelPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 pt-1">
                Kép műveletek
              </p>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted text-left"
                onClick={() => {
                  closeOverlay();
                  uploadRef.current?.openFilePicker();
                }}
              >
                <Upload className="h-4 w-4 shrink-0" />
                Kép feltöltése
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted text-left"
                onClick={() => {
                  closeOverlay();
                  setMediaOpen(true);
                }}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                Médiatár
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted text-left"
                onClick={() => setShowUrlField((prev) => !prev)}
              >
                <Link2 className="h-4 w-4 shrink-0" />
                URL megadása
              </button>
              {showUrlField ? (
                <div className="px-2 pb-1 space-y-1">
                  <input
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    placeholder="/api/media/..."
                    className="w-full h-8 px-2 border rounded text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onChange(urlDraft);
                        closeOverlay();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="w-full h-7 rounded border text-xs hover:bg-muted"
                    onClick={() => {
                      onChange(urlDraft);
                      closeOverlay();
                    }}
                  >
                    Alkalmaz
                  </button>
                </div>
              ) : null}
              {src ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive hover:bg-destructive/10 text-left"
                  onClick={() => {
                    onChange("");
                    closeOverlay();
                  }}
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  Kép eltávolítása
                </button>
              ) : null}
              {recommendedSizeHint(width, height) ? (
                <p className="text-[10px] text-muted-foreground px-2 pb-1">
                  {recommendedSizeHint(width, height)}
                </p>
              ) : null}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={cn(
          "group/cms-image block text-left overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          fillContainer ? "absolute inset-0 w-full h-full" : "relative w-full",
          !src && "border border-dashed border-primary/40 bg-muted/20 rounded-lg min-h-[120px]"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setOverlayOpen((prev) => !prev);
        }}
        aria-label={src ? "Kép szerkesztése" : "Kép hozzáadása"}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className={cn(className, fillContainer && "w-full h-full")}
          />
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 text-muted-foreground",
              fillContainer ? "w-full h-full min-h-[120px]" : "min-h-[120px] w-full"
            )}
          >
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">Kattints a kép hozzáadásához</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/cms-image:bg-black/35 group-focus-visible/cms-image:bg-black/35 transition-colors pointer-events-none">
          <span className="opacity-0 group-hover/cms-image:opacity-100 group-focus-visible/cms-image:opacity-100 transition-opacity rounded-md bg-black/70 px-3 py-1.5 text-xs text-white">
            {src ? "Kép szerkesztése" : "Kép hozzáadása"}
          </span>
        </div>
      </button>

      {overlay}

      <UploadSheet
        ref={uploadRef}
        headless
        onUploaded={(url) => {
          onChange(url);
          closeOverlay();
        }}
        usageLabel={usageLabel}
        recommendedSize={{ width, height }}
        aspect={width / height}
        allowRectangleCrop={flexibleCrop}
        allowSkipCrop={flexibleCrop}
      />

      <MediaManager
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setMediaOpen(false);
        }}
      />
    </>
  );
}

function recommendedSizeHint(width: number, height: number) {
  if (!width || !height) return null;
  return `Javasolt: ${width}×${height}px`;
}
