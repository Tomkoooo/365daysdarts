"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MediaManager } from "@/components/lecturer/MediaManager";
import { UploadSheet, type UploadSheetHandle } from "@/features/cms-editor/primitives/UploadSheet";
import { cn } from "@/lib/utils";
import { FolderOpen, ImageIcon, Upload } from "lucide-react";

type SettingsImageFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: number;
  recommendedSize?: { width: number; height: number };
  usageLabel?: string;
  flexibleCrop?: boolean;
};

export function SettingsImageField({
  label,
  value,
  onChange,
  aspect = 1,
  recommendedSize,
  usageLabel,
  flexibleCrop = true,
}: SettingsImageFieldProps) {
  const uploadRef = useRef<UploadSheetHandle>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  useEffect(() => {
    if (!overlayOpen) return;
    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelPos({ top: rect.bottom + 8, left: rect.left });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [overlayOpen]);

  const overlay =
    overlayOpen && panelPos
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Bezárás"
              className="fixed inset-0 z-[450] bg-black/20"
              onClick={() => setOverlayOpen(false)}
            />
            <div
              className="fixed z-[460] w-56 rounded-lg border bg-popover p-2 shadow-xl space-y-1"
              style={{ top: panelPos.top, left: panelPos.left }}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted text-left"
                onClick={() => {
                  setOverlayOpen(false);
                  uploadRef.current?.openFilePicker();
                }}
              >
                <Upload className="h-4 w-4" />
                Feltöltés
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted text-left"
                onClick={() => {
                  setOverlayOpen(false);
                  setMediaOpen(true);
                }}
              >
                <FolderOpen className="h-4 w-4" />
                Médiatár
              </button>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <button
        ref={anchorRef}
        type="button"
        className={cn(
          "group relative flex items-center justify-center rounded border bg-muted/30 overflow-hidden",
          value ? "h-20 w-auto max-w-full px-2" : "h-20 w-full border-dashed"
        )}
        onClick={() => setOverlayOpen((prev) => !prev)}
      >
        {value ? (
          <img src={value} alt={label} className="h-16 w-auto max-w-full object-contain" />
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <ImageIcon className="h-5 w-5" />
            Kattints a kép kiválasztásához
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
      </button>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/api/media/..." />
      {overlay}
      <UploadSheet
        ref={uploadRef}
        headless
        onUploaded={onChange}
        usageLabel={usageLabel || label}
        recommendedSize={recommendedSize}
        aspect={aspect}
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
    </div>
  );
}
